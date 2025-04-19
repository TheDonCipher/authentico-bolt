'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Check, X, Bell, Grid, List } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { ContextSwitcher } from '../../../components/dashboard/ContextSwitcher';
import { NotificationBell } from '../../../components/dashboard/NotificationBell';
import { ProfileCard } from '../../../components/dashboard/ProfileCard';
import { Stats } from '../../../components/dashboard/Stats';
import { EnhancedDocumentCard } from '../../../components/dashboard/EnhancedDocumentCard';
import { DocumentTable } from '../../../individual-dashboard/components/DocumentTable';
import { DocumentUploadDialog } from '../../../individual-dashboard/components/DocumentUploadDialog';
import { DocumentShareDialog } from '../../../components/document/DocumentShareDialog';
import { Toast } from '../../../components/ui/Toast';
import { Loader } from '../../../components/ui/Loader';
import { getDocumentTypeName } from '../../../constants/documentTypes';
import {
  getDocumentTypes,
  getVerifiedOrganizations,
} from '../../../../lib/api-client';

interface Document {
  documentId: string;
  documentName: string;
  documentType: string;
  documentHash: string;
  ipfsHash: string;
  ownerUid: string;
  verifier: string;
  verifyingOrgId: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  transactionHash?: string;
  blockNumber?: number;
  tokenId?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ToastMessage {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export default function IndividualDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { user, loading: authLoading } = useAuth();
  const { userOrganizations, isLoadingOrgs } = useOrganization();
  const [activeTab, setActiveTab] = useState('documents');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [sharingDocument, setSharingDocument] = useState<{
    id: string | number;
    name: string;
  } | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [orgNames, setOrgNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [showActivityPane, setShowActivityPane] = useState(false);
  const activityPaneRef = useRef<HTMLDivElement>(null);
  const thirdwebAccount = useActiveAccount();

  // Check if user has access to this dashboard
  useEffect(() => {
    if (!authLoading && user) {
      if (user.uid !== userId) {
        router.push('/unauthorized');
      }
    }
  }, [authLoading, user, userId, router]);

  // Fetch documents
  useEffect(() => {
    if (!user || user.uid !== userId) return;

    setIsLoading(true);
    
    try {
      // Set up real-time listener for documents
      const documentsRef = collection(db, 'documents');
      const q = query(
        documentsRef,
        where('ownerUid', '==', userId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedDocuments: Document[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedDocuments.push({
            documentId: doc.id,
            documentName: data.name || 'Unnamed Document',
            documentType: data.documentType || 'Unknown',
            documentHash: data.documentHash || '',
            ipfsHash: data.ipfsHash || '',
            ownerUid: data.ownerUid,
            verifier: data.verifier || '',
            verifyingOrgId: data.verifyingOrgId || '',
            status: data.status || 'Pending',
            transactionHash: data.transactionHash,
            blockNumber: data.blockNumber,
            tokenId: data.tokenId,
            createdAt: data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(),
            updatedAt: data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate()
              : new Date(),
          });
        });

        setDocuments(fetchedDocuments);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching documents:', error);
      setIsLoading(false);
    }
  }, [user, userId]);

  // Fetch organization names
  useEffect(() => {
    const fetchOrgNames = async () => {
      try {
        const orgs = await getVerifiedOrganizations();
        const namesMap: Record<string, string> = {};
        orgs.forEach((org) => {
          namesMap[org.id] = org.name;
        });
        setOrgNames(namesMap);
      } catch (error) {
        console.error('Error fetching organization names:', error);
      }
    };

    fetchOrgNames();
  }, []);

  // Fetch notifications/activities
  useEffect(() => {
    if (!user || user.uid !== userId) return;

    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotifications: any[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedNotifications.push({
            id: doc.id,
            ...data,
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(),
          });
        });

        // Update activities based on notifications
        const notificationActivities = fetchedNotifications.map(
          (notification) => ({
            id: notification.id,
            text: notification.message,
            date: notification.createdAt.toLocaleDateString(),
            icon:
              notification.data?.status === 'Verified' ? (
                <Check size={14} />
              ) : notification.data?.status === 'Rejected' ? (
                <X size={14} />
              ) : (
                <Bell size={14} />
              ),
            notification: notification,
          })
        );

        setActivities(notificationActivities.slice(0, 5));
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user, userId]);

  // Handle document upload success
  const handleUploadSuccess = () => {
    setIsUploadDialogOpen(false);
    setToastMessage({
      type: 'success',
      message: 'Document uploaded successfully!',
    });
  };

  // Toggle activity pane
  const gotoActivityPane = () => {
    setShowActivityPane(true);
  };

  // Close activity pane when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activityPaneRef.current &&
        !activityPaneRef.current.contains(event.target as Node)
      ) {
        setShowActivityPane(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Loading state
  if (authLoading || isLoadingOrgs || (isLoading && !documents.length)) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Loader
          fullScreen
          text="Loading individual dashboard..."
          size="large"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory text-deep-moss flex flex-col md:flex-row font-archivo">
      {/* Sidebar - now becomes a bottom nav on mobile */}
      <aside className="fixed bottom-0 left-0 right-0 md:static w-full md:w-80 bg-soft-sage p-3 md:p-6 border-t-4 md:border-r-4 md:border-t-0 border-deep-moss flex md:flex-col h-auto md:h-screen md:sticky md:top-0 z-30">
        <h1 className="hidden md:block text-2xl font-black mb-8 text-deep-moss bg-soft-sage p-2 border-4 border-deep-moss inline-block">
          AUTHENTICO
        </h1>
        
        {/* Navigation */}
        <nav className="flex-1 flex justify-around md:block">
          <ul className="flex md:flex-col w-full gap-2 md:gap-4">
            <li className="w-full">
              <button
                onClick={() => setActiveTab('documents')}
                className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base ${
                  activeTab === 'documents'
                    ? 'bg-forest-green text-ivory'
                    : 'hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                <span className="hidden md:inline">My Documents</span>
                <span className="md:hidden">Docs</span>
              </button>
            </li>
            <li className="w-full">
              <button
                onClick={() => setActiveTab('activity')}
                className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base ${
                  activeTab === 'activity'
                    ? 'bg-forest-green text-ivory'
                    : 'hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                <span className="hidden md:inline">Activity</span>
                <span className="md:hidden">Activity</span>
              </button>
            </li>
            <li className="w-full">
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base ${
                  activeTab === 'settings'
                    ? 'bg-forest-green text-ivory'
                    : 'hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                <span className="hidden md:inline">Settings</span>
                <span className="md:hidden">Settings</span>
              </button>
            </li>
            
            {/* Admin Dashboard Link - Only visible to admin wallet */}
            {thirdwebAccount &&
              thirdwebAccount.address.toLowerCase() ===
                '0x4ca717eaac6ec3917cb6e23557e1cea7267e2a1c'.toLowerCase() && (
                <li className="w-full">
                  <Link
                    href="/admin-dashboard"
                    className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base bg-sunflower-yellow bg-opacity-20 hover:bg-sunflower-yellow hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] block`}
                  >
                    <span className="hidden md:inline">Admin Dashboard</span>
                    <span className="md:hidden">Admin</span>
                  </Link>
                </li>
              )}
          </ul>
        </nav>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
        {/* Header */}
        <header className="bg-soft-sage border-b-4 border-deep-moss sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:h-20 flex flex-col md:flex-row gap-4 md:gap-0 md:items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-deep-moss mr-4">
                Individual Dashboard
              </h2>
              {userOrganizations.length > 0 && <ContextSwitcher />}
            </div>
            <div className="flex items-center gap-4 md:gap-6">
              <NotificationBell
                count={activities.length}
                onClick={() => {
                  // Show activity pane
                  gotoActivityPane();
                }}
              />
              <ProfileCard />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          {activeTab === 'documents' && (
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
              <Stats documents={documents} />

              {/* Admin Dashboard Link - Only visible to admin wallet */}
              {thirdwebAccount &&
                thirdwebAccount.address.toLowerCase() ===
                  '0x4ca717eaac6ec3917cb6e23557e1cea7267e2a1c'.toLowerCase() && (
                  <div className="mb-6 p-4 bg-sunflower bg-opacity-20 border-2 border-deep-moss rounded-md">
                    <h3 className="text-lg font-bold mb-2">Admin Access</h3>
                    <p className="mb-3">
                      You have admin privileges. Access the admin dashboard to
                      manage the platform.
                    </p>
                    <Link
                      href="/admin-dashboard"
                      className="inline-block bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                    >
                      Admin Dashboard
                    </Link>
                  </div>
                )}

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-2xl font-bold text-deep-moss">
                  My Documents
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex border-2 border-deep-moss">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${
                        viewMode === 'grid'
                          ? 'bg-forest-green text-ivory'
                          : 'bg-soft-sage'
                      }`}
                      aria-label="Grid view"
                    >
                      <Grid size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2 ${
                        viewMode === 'table'
                          ? 'bg-forest-green text-ivory'
                          : 'bg-soft-sage'
                      }`}
                      aria-label="Table view"
                    >
                      <List size={20} />
                    </button>
                  </div>
                  <button
                    onClick={() => setIsUploadDialogOpen(true)}
                    className="bg-forest-green text-ivory p-2 md:px-4 md:py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center gap-2"
                  >
                    <Plus size={20} />
                    <span className="hidden md:inline">Upload Document</span>
                  </button>
                </div>
              </div>

              <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader text="Loading documents..." />
                  </div>
                ) : (
                  <>
                    {documents.length === 0 ? (
                      <div className="bg-ivory p-6 border-2 border-deep-moss text-center">
                        <p className="text-lg font-bold text-deep-moss">
                          No documents found
                        </p>
                        <p className="text-deep-moss">
                          Upload your first document using the + button above
                        </p>
                      </div>
                    ) : viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {documents.map((doc) => (
                          <EnhancedDocumentCard
                            key={doc.documentId}
                            doc={doc}
                            documentName={doc.documentName}
                            verifyingOrgName={orgNames[doc.verifyingOrgId]}
                            transactionHash={doc.transactionHash}
                            blockNumber={doc.blockNumber}
                            tokenId={doc.tokenId}
                            createdAt={doc.createdAt}
                            updatedAt={doc.updatedAt}
                            onShare={(document) => {
                              setSharingDocument({
                                id: document.documentId,
                                name: document.documentName,
                              });
                              setIsShareDialogOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <DocumentTable
                        documents={documents}
                        onShare={(document) => {
                          setSharingDocument({
                            id: document.documentId,
                            name: document.documentName,
                          });
                          setIsShareDialogOpen(true);
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
                <h3 className="text-2xl font-bold mb-6 text-deep-moss">
                  Recent Activity
                </h3>
                {activities.length === 0 ? (
                  <div className="bg-ivory p-6 border-2 border-deep-moss text-center">
                    <p className="text-deep-moss">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="bg-ivory p-4 border-2 border-deep-moss flex items-start gap-3"
                      >
                        <div className="bg-soft-sage p-2 border-2 border-deep-moss">
                          {activity.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-deep-moss">{activity.text}</p>
                          <p className="text-sm text-gray-500">
                            {activity.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
                <h3 className="text-2xl font-bold mb-6 text-deep-moss">
                  Account Settings
                </h3>
                <div className="bg-ivory p-6 border-2 border-deep-moss">
                  <p className="text-deep-moss">
                    Settings functionality coming soon.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Activity Pane */}
      {showActivityPane && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-end">
          <div
            ref={activityPaneRef}
            className="bg-ivory w-full max-w-md h-full overflow-y-auto p-4 md:p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-deep-moss">
                Recent Activity
              </h3>
              <button
                onClick={() => setShowActivityPane(false)}
                className="p-2 hover:bg-soft-sage rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            {activities.length === 0 ? (
              <div className="bg-soft-sage p-6 border-2 border-deep-moss text-center">
                <p className="text-deep-moss">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-soft-sage p-4 border-2 border-deep-moss flex items-start gap-3"
                  >
                    <div className="bg-ivory p-2 border-2 border-deep-moss">
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-deep-moss">{activity.text}</p>
                      <p className="text-sm text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Upload Dialog */}
      {isUploadDialogOpen && (
        <DocumentUploadDialog
          isOpen={isUploadDialogOpen}
          onClose={() => setIsUploadDialogOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Document Share Dialog */}
      {isShareDialogOpen && sharingDocument && (
        <DocumentShareDialog
          isOpen={isShareDialogOpen}
          documentId={sharingDocument.id.toString()}
          documentName={sharingDocument.name}
          onClose={() => {
            setIsShareDialogOpen(false);
            setSharingDocument(null);
          }}
        />
      )}

      {/* Toast Notifications */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
