'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarNavigation from './components/SidebarNavigation';
import DocumentTable from './components/DocumentTable';
import VerificationQueue from './components/VerificationQueue';
import OrganizationStatus from './components/OrganizationStatus';
// No longer need contract imports
import { AuthGuard } from '../components/auth/AuthGuard';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { ContextSwitcher } from '../components/dashboard/ContextSwitcher';
// No longer need SignOutButton
import { ProfileCard } from '../components/dashboard/ProfileCard';
import { NotificationBell } from '../components/dashboard/NotificationBell';
import { Toast } from '../components/ui/Toast';
import { Loader } from '../components/ui/Loader';
import { db } from '../../lib/firebase';
import { Document } from '../models/Document';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  getDocs,
  limit,
} from 'firebase/firestore';

// Thirdweb imports
import { useActiveAccount } from 'thirdweb/react';

interface ToastMessage {
  type: 'success' | 'error' | 'warning';
  message: string;
}

const OrganizationDashboard = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, activeContext, setActiveContext } = useAuth();
  const { userOrganizations } = useOrganization();

  // Keep track of wallet connection
  const wallet = useActiveAccount();
  const router = useRouter();

  // Redirect to home page when wallet is disconnected
  useEffect(() => {
    if (!wallet && user) {
      router.push('/');
    }
  }, [wallet, user, router]);

  // Set active context to organization when viewing this dashboard
  useEffect(() => {
    if (user && activeContext !== 'organization') {
      setActiveContext('organization', user.uid);
    }
  }, [user, activeContext, setActiveContext]);

  // Fetch documents from Firestore
  useEffect(() => {
    const fetchDocuments = async () => {
      // Only proceed if we have a user
      if (!user) return;

      setIsLoading(true);
      try {
        console.log('Fetching documents for organization:', user.uid);

        // Set up real-time listener for documents
        const documentsRef = collection(db, 'documents');
        console.log('Setting up Firestore query for documents collection');

        // Debug: Check if the documents collection exists
        try {
          const testSnapshot = await getDocs(query(documentsRef, limit(1)));
          console.log(`Documents collection exists: ${!testSnapshot.empty}`);
        } catch (err) {
          console.error('Error checking documents collection:', err);
        }

        // Query documents where this organization is the verifier
        const q = query(
          documentsRef,
          where('verifyingOrgId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        console.log('Setting up real-time listener for documents');
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            console.log(
              `Document snapshot received: ${snapshot.size} documents`
            );
            const fetchedDocs = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              console.log(`Document data for ${doc.id}:`, data);

              // Add document to the list using Document model
              fetchedDocs.push(
                new Document(
                  doc.id,
                  data.encryptedIpfsCid || '',
                  data.userWalletAddress || '',
                  data.originalDocHash || '',
                  data.status || 'Pending Verification',
                  data.documentType || 'Document',
                  data.verifyingOrgId || '',
                  data.documentName || '',
                  data.transactionHash || undefined,
                  data.blockNumber || undefined,
                  data.tokenId || undefined,
                  data.createdAt instanceof Timestamp
                    ? data.createdAt.toDate().toISOString()
                    : undefined,
                  data.updatedAt instanceof Timestamp
                    ? data.updatedAt.toDate().toISOString()
                    : undefined
                )
              );
            });

            setDocuments(fetchedDocs);
            console.log(
              'Fetched documents from Firestore:',
              fetchedDocs.length
            );

            // If no documents found, check if there are any documents in the collection
            if (fetchedDocs.length === 0) {
              console.log(
                'No documents found for this organization. Checking collection...'
              );
              getDocs(documentsRef)
                .then((allDocs) => {
                  console.log(`Total documents in collection: ${allDocs.size}`);
                  if (allDocs.size > 0) {
                    console.log(
                      'Sample document data:',
                      allDocs.docs[0].data()
                    );
                  }
                })
                .catch((err) => {
                  console.error('Error checking all documents:', err);
                });
            }
          },
          (error) => {
            console.error('Error in document listener:', error);
            showToast('error', 'Failed to listen for document updates.');
          }
        );

        // Clean up listener on unmount
        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching documents:', error);
        showToast('error', 'Failed to load documents. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();

    // Return cleanup function
    return () => {
      // Cleanup will be handled by the unsubscribe function returned in fetchDocuments
    };
  }, [user]);

  const showToast = (
    type: 'success' | 'error' | 'warning',
    message: string
  ) => {
    setToastMessage({ type, message });
    // Toast will auto-dismiss with the onClose handler in the component
  };

  // Set up notifications listener
  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for notifications
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedNotifications = [];
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

        setNotifications(fetchedNotifications);
      },
      (error) => {
        console.error('Error in notifications listener:', error);
      }
    );

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [user]);

  return (
    <AuthGuard allowedUserTypes={['organization']}>
      {isLoading && !user ? (
        <Loader
          fullScreen
          text="Loading organization dashboard..."
          size="large"
        />
      ) : (
        <div className="relative flex flex-col md:flex-row min-h-screen bg-ivory">
          <SidebarNavigation />
          <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-deep-moss pb-4 mb-6 md:mb-8 gap-4">
                <div className="flex items-center">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-deep-moss mr-4">
                    Organization Dashboard
                  </h1>
                  <ContextSwitcher />
                </div>
                <div className="flex items-center gap-4">
                  <NotificationBell
                    count={notifications.length}
                    onClick={() => {
                      // Mark all notifications as read
                      notifications.forEach(async (notification) => {
                        try {
                          const notificationRef = doc(
                            db,
                            'notifications',
                            notification.id
                          );
                          await updateDoc(notificationRef, { read: true });
                        } catch (error) {
                          console.error(
                            'Error marking notification as read:',
                            error
                          );
                        }
                      });

                      // Switch to verification queue tab
                      setActiveTab('verification');
                    }}
                  />
                  <ProfileCard />
                </div>
              </div>

              {/* Organization Verification Status */}
              <section className="mb-8 md:mb-12">
                <OrganizationStatus userId={user?.uid || ''} />
              </section>

              {/* Stats Section */}
              <section className="mb-8 md:mb-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="bg-soft-sage p-4 md:p-6 border-2 md:border-4 border-deep-moss shadow-brutal">
                    <h3 className="font-bold text-lg md:text-xl mb-2 text-deep-moss">
                      Total Documents
                    </h3>
                    <p className="text-3xl md:text-4xl font-black text-deep-moss">
                      {documents.length}
                    </p>
                  </div>
                  <div className="bg-soft-sage p-4 md:p-6 border-2 md:border-4 border-deep-moss shadow-brutal">
                    <h3 className="font-bold text-lg md:text-xl mb-2 text-deep-moss">
                      Verified
                    </h3>
                    <p className="text-3xl md:text-4xl font-black text-sap-green">
                      {
                        documents.filter((doc) => doc.status === 'Verified')
                          .length
                      }
                    </p>
                  </div>
                  <div className="bg-soft-sage p-4 md:p-6 border-2 md:border-4 border-deep-moss shadow-brutal sm:col-span-2 md:col-span-1">
                    <h3 className="font-bold text-lg md:text-xl mb-2 text-deep-moss">
                      Pending
                    </h3>
                    <p className="text-3xl md:text-4xl font-black text-sunflower">
                      {
                        documents.filter(
                          (doc) =>
                            doc.status === 'Pending Verification' ||
                            doc.status === 'Pending Blockchain Submission' ||
                            doc.status === 'Submitting to Blockchain'
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </section>

              <div className="flex flex-wrap mb-6 border-b-4 border-deep-moss pb-4 gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`mr-2 md:mr-4 px-3 md:px-4 py-2 font-bold text-sm md:text-base ${
                    activeTab === 'dashboard'
                      ? 'bg-soft-sage border-2 border-deep-moss shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                      : 'hover:bg-soft-sage hover:border-2 hover:border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('verification')}
                  className={`px-3 md:px-4 py-2 font-bold text-sm md:text-base ${
                    activeTab === 'verification'
                      ? 'bg-soft-sage border-2 border-deep-moss shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                      : 'hover:bg-soft-sage hover:border-2 hover:border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                  }`}
                >
                  Verification Queue
                </button>
              </div>

              {isLoading ? (
                <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-8 shadow-brutal flex justify-center items-center min-h-[300px]">
                  <Loader text="Loading documents..." />
                </div>
              ) : activeTab === 'dashboard' ? (
                <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal overflow-x-auto">
                  <h2 className="text-2xl md:text-3xl font-black mb-4 md:mb-6 text-deep-moss">
                    Recent Documents
                  </h2>
                  <div className="overflow-x-auto -mx-4 px-4">
                    <DocumentTable documents={documents} />
                  </div>
                </section>
              ) : (
                <VerificationQueue />
              )}
            </div>
          </main>
        </div>
      )}

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-4 right-4 z-50">
          <Toast
            type={toastMessage.type}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
            duration={5000}
          />
        </div>
      )}
    </AuthGuard>
  );
};

export default OrganizationDashboard;
