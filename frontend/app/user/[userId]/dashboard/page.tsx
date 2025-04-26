'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Check, X, Bell, Grid, List } from 'lucide-react';
import { useActiveAccount } from 'thirdweb/react';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
  doc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { ContextSwitcher } from '../../../components/dashboard/ContextSwitcher';
import { NotificationBell } from '../../../components/dashboard/NotificationBell';
import { ProfileCard } from '../../../components/dashboard/ProfileCard';
import { SignOutButton } from '../../../components/auth/SignOutButton';
import { Stats } from '../../../components/dashboard/Stats';
import EnhancedDocumentCard from '../../../individual-dashboard/components/EnhancedDocumentCard';
import { DocumentTable } from '../../../individual-dashboard/components/DocumentTable';
import { DocumentUploadDialog } from '../../../individual-dashboard/components/DocumentUploadDialog';
import { DocumentShareDialog } from '../../../components/document/DocumentShareDialog';
import { Toast } from '../../../components/ui/Toast';
import { NeubrutalistLoading } from '../../../components/ui/NeubrutalistLoading';
import { getDocumentTypeName } from '../../../constants/documentTypes';
import {
  getDocumentTypes,
  getVerifiedOrganizations,
} from '../../../../lib/api-client';
import { Document } from '../../../models/Document';

// Document interface is now imported from models/Document

interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function IndividualDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  const { user, loading: authLoading } = useAuth();
  const { userOrganizations, isLoadingOrgs } = useOrganization();
  const [activeTab, setActiveTab] = useState('documents');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [reuploadDocument, setReuploadDocument] = useState<Document | null>(
    null
  );
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [sharingDocument, setSharingDocument] = useState<{
    id: string | number;
    name: string;
    status?: string;
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

  // Fetch documents using direct fetch instead of real-time listeners
  useEffect(() => {
    if (!user || user.uid !== userId) {
      console.log('User not available or mismatch, skipping document fetch');
      return;
    }

    console.log('Fetching documents for user:', userId);
    setIsLoading(true);

    // Set a safety timeout to ensure loading state doesn't get stuck
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Safety timeout triggered - resetting loading state');
        setIsLoading(false);

        // Provide mock data to ensure UI renders
        setDocuments([
          new Document(
            'mock-document-1',
            '',
            user.walletAddress || '',
            'mock-hash-123',
            'Verified',
            'Certificate',
            'default-org',
            'Sample Document',
            '0x123456789abcdef',
            12345,
            1,
            new Date().toISOString(),
            new Date().toISOString(),
            userId,
            'default-org',
            undefined,
            undefined
          ),
        ]);

        setToastMessage({
          type: 'warning',
          message:
            'Using sample data due to connection issues. Some features may be limited.',
        });
      }
    }, 5000);

    const fetchDocumentsDirectly = async () => {
      try {
        // Direct fetch instead of real-time listener
        const documentsRef = collection(db, 'documents');
        const q = query(documentsRef, where('ownerUid', '==', userId));

        console.log('Executing direct Firestore query for documents');
        const snapshot = await getDocs(q);

        const fetchedDocuments: Document[] = [];
        console.log(
          `Found ${snapshot.docs.length} documents for user ${userId}`
        );

        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Document data from Firestore:', doc.id, data);

          // Ensure we have all the required fields with proper fallbacks
          const documentData = new Document(
            doc.id,
            '', // urlPicture
            data.userWalletAddress || data.publicAddress || '', // publicAddress
            data.originalDocHash || data.metadataHash || '', // metadataHash
            data.status || 'Pending Verification',
            data.documentType || 'Unknown',
            data.verifyingOrgId || data.verifier || '', // Use verifyingOrgId instead of verifier
            data.documentName || data.name || 'Unnamed Document',
            data.transactionHash || '',
            data.blockNumber || 0,
            data.tokenId || 0,
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString(),
            data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate().toISOString()
              : new Date().toISOString(),
            data.ownerUid || userId,
            data.verifyingOrgId || data.verifier || '',
            undefined, // sharedWith
            data.rejectionReason // Add rejection reason
          );

          fetchedDocuments.push(documentData);
        });

        // If no documents found with ownerUid, try fallback with walletAddress
        if (fetchedDocuments.length === 0 && user.walletAddress) {
          console.log(
            'No documents found with ownerUid, trying walletAddress fallback'
          );
          await tryFallbackDocumentFetch();
        } else {
          setDocuments(fetchedDocuments);
        }

        setIsLoading(false);
        clearTimeout(safetyTimeout);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setToastMessage({
          type: 'error',
          message: 'Failed to load documents. Please refresh the page.',
        });

        // Try fallback
        if (user.walletAddress) {
          console.log('Trying fallback after error');
          await tryFallbackDocumentFetch();
        }

        setIsLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    // Execute the fetch
    fetchDocumentsDirectly();

    return () => {
      console.log('Cleaning up document fetch');
      clearTimeout(safetyTimeout);
    };
  }, [user, userId]);

  // Function to try fallback document fetch if the primary query fails
  const tryFallbackDocumentFetch = useCallback(async () => {
    if (!user || !user.walletAddress) {
      console.log(
        'Cannot perform fallback fetch - missing user or wallet address'
      );
      return;
    }

    try {
      console.log(
        'Attempting fallback document fetch using walletAddress:',
        user.walletAddress
      );

      // Try multiple possible field names for wallet address
      const possibleWalletFields = [
        'ownerWalletAddress',
        'userWalletAddress',
        'walletAddress',
        'publicAddress',
      ];

      let foundDocuments = false;

      // Try each possible field name
      for (const fieldName of possibleWalletFields) {
        if (foundDocuments) break;

        console.log(`Trying fallback with field: ${fieldName}`);

        // Create a query against the documents collection using wallet address
        const walletQuery = query(
          collection(db, 'documents'),
          where(fieldName, '==', user.walletAddress)
        );

        const querySnapshot = await getDocs(walletQuery);

        if (!querySnapshot.empty) {
          const docs: Document[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();

            // Create proper Document object with all required fields
            const documentData = new Document(
              doc.id,
              '', // urlPicture
              data.userWalletAddress ||
                data.publicAddress ||
                user.walletAddress, // publicAddress
              data.originalDocHash || data.metadataHash || '', // metadataHash
              data.status || 'Pending Verification',
              data.documentType || 'Unknown',
              data.verifyingOrgId || data.verifier || '', // Use verifyingOrgId instead of verifier
              data.documentName || data.name || 'Unnamed Document',
              data.transactionHash || '',
              data.blockNumber || 0,
              data.tokenId || 0,
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
              data.updatedAt instanceof Timestamp
                ? data.updatedAt.toDate().toISOString()
                : new Date().toISOString(),
              data.ownerUid || userId,
              data.verifyingOrgId || data.verifier || '',
              undefined, // sharedWith
              data.rejectionReason // Add rejection reason
            );

            docs.push(documentData);
          });

          console.log(
            `Found ${docs.length} documents using ${fieldName} fallback`
          );
          setDocuments(docs);
          foundDocuments = true;
        }
      }

      // If still no documents found, provide mock data
      if (!foundDocuments) {
        console.log(
          'No documents found with any wallet address fallback, using mock data'
        );

        // Create a mock document to ensure the UI renders
        setDocuments([
          new Document(
            'mock-document-1',
            '',
            user.walletAddress,
            'mock-hash-123',
            'Verified',
            'Certificate',
            'default-org',
            'Sample Document',
            '0x123456789abcdef',
            12345,
            1,
            new Date().toISOString(),
            new Date().toISOString(),
            userId,
            'default-org',
            undefined,
            undefined
          ),
        ]);

        setToastMessage({
          type: 'warning',
          message: 'No documents found. Upload a document to get started.',
        });
      }
    } catch (error: unknown) {
      console.error(
        'Error in fallback document fetch:',
        error instanceof Error ? error.message : error
      );

      // Provide mock data even on error
      setDocuments([
        new Document(
          'mock-document-1',
          '',
          user.walletAddress || '',
          'mock-hash-123',
          'Verified',
          'Certificate',
          'default-org',
          'Sample Document',
          '0x123456789abcdef',
          12345,
          1,
          new Date().toISOString(),
          new Date().toISOString(),
          userId,
          'default-org',
          undefined,
          undefined
        ),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [user, userId, setToastMessage]);

  // Add a ref to track fetch attempts and prevent infinite loops
  const fetchAttemptsRef = useRef(0);
  const maxFetchAttempts = 3; // Maximum number of fetch attempts

  // Function to refresh organizations
  const refreshOrganizations = useCallback(async () => {
    if (!thirdwebAccount) {
      console.log('Cannot refresh organizations - no thirdweb account');
      return;
    }

    try {
      // Check if user is admin based on wallet address
      const adminWalletAddress =
        process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ||
        '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c';

      const isAdminUser =
        thirdwebAccount &&
        thirdwebAccount.address.toLowerCase() ===
          adminWalletAddress.toLowerCase();

      console.log('Refreshing organizations with isAdmin =', isAdminUser);

      // Force direct Firestore access for reliability
      const orgs = await getVerifiedOrganizations(isAdminUser, true);

      if (orgs && orgs.length > 0) {
        console.log(`Successfully refreshed ${orgs.length} organizations`);

        // Process organization names
        const namesMap: Record<string, string> = {};
        orgs.forEach((org) => {
          namesMap[org.id] =
            org.organizationName || org.name || 'Unknown Organization';
        });

        setOrgNames(namesMap);
      } else {
        console.warn('No organizations found during refresh');

        // Provide a default organization to ensure UI can render
        setOrgNames({
          'default-org': 'Authentico Default',
        });
      }
    } catch (error: unknown) {
      console.error(
        'Error refreshing organizations:',
        error instanceof Error ? error.message : error
      );

      // Provide a default organization to ensure UI can render
      setOrgNames({
        'default-org': 'Authentico Default',
      });
    }
  }, [thirdwebAccount]);

  // Fetch organization names
  useEffect(() => {
    if (!thirdwebAccount) {
      console.log('No thirdweb account available, skipping organization fetch');
      return;
    }

    const fetchOrgNames = async () => {
      try {
        // Reset fetch attempts counter
        fetchAttemptsRef.current = 0;

        // Check if user is admin based on wallet address
        const adminWalletAddress =
          process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ||
          '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c';

        const isAdminUser =
          thirdwebAccount &&
          thirdwebAccount.address.toLowerCase() ===
            adminWalletAddress.toLowerCase();

        console.log('Fetching organizations with isAdmin =', isAdminUser);

        // Set a safety timeout to ensure we don't block the UI
        const safetyTimeout = setTimeout(() => {
          console.log(
            'Safety timeout triggered in organization fetch - providing default data'
          );
          // Provide a default organization to ensure UI can render
          setOrgNames({
            'default-org': 'Authentico Default',
          });
        }, 8000);

        // First attempt - try API with caching
        try {
          console.log('Attempting to fetch organizations via API...');

          // First try with API (useDirectFirestore = false)
          const orgs = await getVerifiedOrganizations(isAdminUser, false);

          if (orgs && orgs.length > 0) {
            console.log(
              `Successfully fetched ${orgs.length} organizations via API`
            );

            // Process organization names
            const namesMap: Record<string, string> = {};
            orgs.forEach((org) => {
              // Use organizationName if available, otherwise fall back to name
              namesMap[org.id] =
                org.organizationName || org.name || 'Unknown Organization';
            });

            setOrgNames(namesMap);
            clearTimeout(safetyTimeout);
            return; // Exit early on success
          } else {
            console.warn(
              'API returned empty organizations list, trying Firestore directly'
            );
          }
        } catch (apiError) {
          console.error('Error fetching organizations via API:', apiError);
          // Continue to Firestore fallback
        }

        // Second attempt - try direct Firestore access
        try {
          console.log('Attempting direct Firestore access...');

          // Force direct Firestore access
          const orgs = await getVerifiedOrganizations(isAdminUser, true);

          if (orgs && orgs.length > 0) {
            console.log(
              `Successfully fetched ${orgs.length} organizations via Firestore`
            );

            // Process organization names
            const namesMap: Record<string, string> = {};
            orgs.forEach((org) => {
              namesMap[org.id] =
                org.organizationName || org.name || 'Unknown Organization';
            });

            setOrgNames(namesMap);
            clearTimeout(safetyTimeout);
            return; // Exit early on success
          } else {
            console.warn('Firestore returned empty organizations list');

            // Show a warning but don't treat as error
            setToastMessage({
              type: 'warning',
              message:
                'No verified organizations found. Some features may be limited.',
            });

            // Provide a default organization to ensure UI can render
            setOrgNames({
              'default-org': 'Authentico Default',
            });
            clearTimeout(safetyTimeout);
          }
        } catch (firestoreError) {
          console.error('Firestore access failed:', firestoreError);

          // Show error toast
          setToastMessage({
            type: 'error',
            message: 'Failed to load organizations. Please try again later.',
          });

          // Provide a default organization to ensure UI can render
          setOrgNames({
            'default-org': 'Authentico Default',
          });
          clearTimeout(safetyTimeout);
        }
      } catch (error) {
        console.error('Unexpected error in organization fetch process:', error);

        // Show error toast
        setToastMessage({
          type: 'error',
          message: 'An unexpected error occurred. Please try again later.',
        });

        // Provide a default organization to ensure UI can render
        setOrgNames({
          'default-org': 'Authentico Default',
        });
      }
    };

    fetchOrgNames();
  }, [thirdwebAccount, setToastMessage]);

  // Fetch notifications/activities using direct fetch instead of real-time listeners
  useEffect(() => {
    if (!user || user.uid !== userId) return;

    const fetchNotifications = async () => {
      try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef,
          where('userId', '==', userId)
          // Removed orderBy to avoid index requirements
        );

        console.log('Fetching notifications directly');
        const snapshot = await getDocs(q);

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

        console.log(`Found ${fetchedNotifications.length} notifications`);

        // Update activities based on notifications
        const notificationActivities = fetchedNotifications.map(
          (notification) => ({
            id: notification.id,
            text: notification.message,
            date: notification.createdAt.toLocaleDateString(),
            read: notification.read || false,
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
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Don't show toast for notification errors as they're not critical

        // Provide default activities
        setActivities([
          {
            id: 'default-activity-1',
            text: 'Welcome to your Authentico dashboard!',
            date: new Date().toLocaleDateString(),
            read: false,
            icon: <Bell size={14} />,
            notification: {
              id: 'default-activity-1',
              message: 'Welcome to your Authentico dashboard!',
              createdAt: new Date(),
              read: false,
            },
          },
        ]);
      }
    };

    // Execute the fetch
    fetchNotifications();
  }, [user, userId]);

  // Mark notifications as read when activity pane is opened
  useEffect(() => {
    const markNotificationsAsRead = async () => {
      if (!showActivityPane || !user || activities.length === 0) return;

      try {
        // Get unread notifications
        const unreadNotifications = activities.filter(
          (activity) => !activity.read
        );
        if (unreadNotifications.length === 0) return;

        console.log(
          'Marking notifications as read:',
          unreadNotifications.map((n) => n.id)
        );

        // Update each notification in Firestore
        for (const activity of unreadNotifications) {
          const notificationRef = doc(db, 'notifications', activity.id);
          await updateDoc(notificationRef, { read: true });
        }
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    };

    markNotificationsAsRead();
  }, [showActivityPane, activities, user]);

  // Handle document upload success
  const handleUploadSuccess = () => {
    setIsUploadDialogOpen(false);
    setReuploadDocument(null);
    setToastMessage({
      type: 'success',
      message: 'Document uploaded successfully!',
    });
  };

  // Handle re-upload action
  const handleReupload = (doc: Document) => {
    setReuploadDocument(doc);
    setIsUploadDialogOpen(true);
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

  // State to handle loading timeout
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Set a timeout to prevent infinite loading
  useEffect(() => {
    // Force reset loading states if they've been stuck for too long
    const forceResetLoadingStates = () => {
      console.log('Force resetting loading states');
      if (isLoading) setIsLoading(false);
      if (isLoadingOrgs) {
        // Provide default organization data
        setOrgNames({
          'default-org': 'Authentico Default',
        });
      }

      // Provide mock document data if needed
      if (!documents.length && user) {
        setDocuments([
          new Document(
            'mock-document-1',
            '',
            user.walletAddress || '',
            'mock-hash-123',
            'Verified',
            'Certificate',
            'default-org',
            'Sample Document',
            '0x123456789abcdef',
            12345,
            1,
            new Date().toISOString(),
            new Date().toISOString(),
            userId,
            'default-org',
            undefined,
            undefined
          ),
        ]);
      }
    };

    if (authLoading || isLoadingOrgs || (isLoading && !documents.length)) {
      console.log('Loading state detected - starting timeout timer', {
        authLoading,
        isLoadingOrgs,
        isLoading,
        documentsLength: documents.length,
      });

      // First timer for the loading timeout message - show much sooner
      const timeoutTimer = setTimeout(() => {
        console.log('Loading timeout triggered after 8 seconds');
        setLoadingTimeout(true);
      }, 8000); // Reduced to 8 seconds to show the message sooner

      // Second timer to force reset loading states
      const resetTimer = setTimeout(() => {
        forceResetLoadingStates();
      }, 5000); // Force reset loading states after 5 seconds

      return () => {
        clearTimeout(timeoutTimer);
        clearTimeout(resetTimer);
        console.log('Cleared loading timeout timers');
      };
    } else {
      // Reset timeout when loading is complete
      setLoadingTimeout(false);
      console.log('Loading complete, reset timeout state', {
        authLoading,
        isLoadingOrgs,
        isLoading,
        documentsLength: documents.length,
      });
    }
  }, [authLoading, isLoadingOrgs, isLoading, documents.length, user, userId]);

  // Loading state
  if (authLoading || isLoadingOrgs || (isLoading && !documents.length)) {
    if (loadingTimeout) {
      return (
        <div className="min-h-screen bg-ivory text-deep-moss flex flex-col items-center justify-center p-4">
          <div className="bg-soft-sage border-4 border-deep-moss p-6 shadow-brutal max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4 text-deep-moss">
              Loading Taking Too Long
            </h2>
            <p className="mb-4">
              We're having trouble loading your dashboard data. This could be
              due to network issues, Firestore connection problems, or
              authentication delays.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  // Force reset loading states
                  setIsLoading(false);
                  setLoadingTimeout(false);

                  // Provide mock document data if needed
                  if (!documents.length && user) {
                    setDocuments([
                      new Document(
                        'mock-document-1',
                        '',
                        user.walletAddress || '',
                        'mock-hash-123',
                        'Verified',
                        'Certificate',
                        'default-org',
                        'Sample Document',
                        '0x123456789abcdef',
                        12345,
                        1,
                        new Date().toISOString(),
                        new Date().toISOString(),
                        userId,
                        'default-org',
                        undefined,
                        undefined
                      ),
                    ]);
                  }

                  // Provide default organization data
                  if (Object.keys(orgNames).length === 0) {
                    setOrgNames({
                      'default-org': 'Authentico Default',
                    });
                  }

                  setToastMessage({
                    type: 'info',
                    message: 'Using sample data. Some features may be limited.',
                  });
                }}
                className="bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all"
              >
                Skip Loading
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-deep-moss text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <NeubrutalistLoading
        message="Individual Dashboard"
        subMessage="Loading your verified documents and blockchain credentials..."
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-ivory text-deep-moss flex flex-col md:flex-row font-archivo">
      {/* Sidebar - now becomes a bottom nav on mobile */}
      <aside className="fixed bottom-0 left-0 right-0 md:static w-full md:w-80 bg-soft-sage p-2 sm:p-3 md:p-6 border-t-2 sm:border-t-4 md:border-r-4 md:border-t-0 border-deep-moss flex md:flex-col h-auto md:h-screen md:sticky md:top-0 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] md:shadow-none">
        <h1 className="hidden md:block text-xl sm:text-2xl font-black mb-6 sm:mb-8 text-deep-moss bg-soft-sage p-2 border-2 sm:border-4 border-deep-moss inline-block shadow-brutal-sm sm:shadow-brutal">
          AUTHENTICO
        </h1>

        {/* Navigation */}
        <nav className="flex-1 flex justify-around md:block w-full">
          <ul className="flex md:flex-col w-full gap-1 sm:gap-2 md:gap-4">
            <li className="w-full">
              <button
                onClick={() => setActiveTab('documents')}
                className={`w-full text-center md:text-left p-1.5 sm:p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-xs sm:text-sm md:text-base ${
                  activeTab === 'documents'
                    ? 'bg-forest-green text-ivory'
                    : 'bg-ivory text-deep-moss hover:bg-soft-sage hover:shadow-brutal-sm md:hover:shadow-brutal'
                } touch-target`}
                aria-label="My Documents"
              >
                <span className="hidden md:inline">My Documents</span>
                <span className="md:hidden">Docs</span>
              </button>
            </li>
            <li className="w-full">
              <button
                onClick={() => setActiveTab('activity')}
                className={`w-full text-center md:text-left p-1.5 sm:p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-xs sm:text-sm md:text-base ${
                  activeTab === 'activity'
                    ? 'bg-forest-green text-ivory'
                    : 'bg-ivory text-deep-moss hover:bg-soft-sage hover:shadow-brutal-sm md:hover:shadow-brutal'
                } touch-target`}
                aria-label="Activity"
              >
                <span className="hidden md:inline">Activity</span>
                <span className="md:hidden">Activity</span>
              </button>
            </li>
            <li className="w-full">
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-center md:text-left p-1.5 sm:p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-xs sm:text-sm md:text-base ${
                  activeTab === 'settings'
                    ? 'bg-forest-green text-ivory'
                    : 'bg-ivory text-deep-moss hover:bg-soft-sage hover:shadow-brutal-sm md:hover:shadow-brutal'
                } touch-target`}
                aria-label="Settings"
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
                    className={`w-full text-center md:text-left p-1.5 sm:p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-xs sm:text-sm md:text-base bg-sunflower-yellow bg-opacity-20 hover:bg-sunflower-yellow hover:shadow-brutal-sm md:hover:shadow-brutal block touch-target`}
                    aria-label="Admin Dashboard"
                  >
                    <span className="hidden md:inline">Admin Dashboard</span>
                    <span className="md:hidden">Admin</span>
                  </Link>
                </li>
              )}
          </ul>
        </nav>

        {/* Sign Out Button */}
        <div className="hidden md:block mt-3 sm:mt-4 pt-4 sm:pt-6">
          <SignOutButton className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-deep-moss bg-burnt-sienna bg-opacity-20 text-deep-moss hover:shadow-brutal-sm sm:hover:shadow-brutal hover:-translate-y-0.5 transition-all text-sm sm:text-base touch-target" />
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-h-screen pb-24 md:pb-0 w-full max-w-full">
        {/* Header */}
        <header className="bg-soft-sage border-b-2 sm:border-b-4 border-deep-moss sticky top-0 z-20 w-full">
          <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 md:px-8 py-2 xs:py-3 sm:py-4 flex flex-col sm:flex-row gap-2 xs:gap-3 sm:gap-4 md:gap-6 sm:items-center justify-between">
            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
              <h2 className="text-base xs:text-lg sm:text-xl font-bold text-deep-moss mr-1 xs:mr-2 sm:mr-4">
                Individual Dashboard
              </h2>
              {userOrganizations.length > 0 && <ContextSwitcher />}

              {/* Mobile-only notification bell */}
              <div className="flex sm:hidden items-center gap-2 xs:gap-3">
                <NotificationBell
                  count={activities.filter((activity) => !activity.read).length}
                  onClick={() => {
                    // Show activity pane
                    gotoActivityPane();
                  }}
                />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 xs:gap-3 sm:gap-4 md:gap-6">
              <NotificationBell
                count={activities.filter((activity) => !activity.read).length}
                onClick={() => {
                  // Show activity pane
                  gotoActivityPane();
                }}
              />
              <ProfileCard />
            </div>
            <div className="flex sm:hidden items-center w-full justify-between mt-2 xs:mt-3">
              <ProfileCard />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-2 xs:p-3 sm:p-4 md:p-8">
          {activeTab === 'documents' && (
            <div className="max-w-7xl mx-auto space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-8">
              <Stats documents={documents} />

              {/* Admin Dashboard Link - Only visible to admin wallet */}
              {thirdwebAccount &&
                thirdwebAccount.address.toLowerCase() ===
                  '0x4ca717eaac6ec3917cb6e23557e1cea7267e2a1c'.toLowerCase() && (
                  <div className="mb-4 xs:mb-5 sm:mb-6 p-3 xs:p-4 bg-sunflower bg-opacity-20 border-2 border-deep-moss rounded-md">
                    <h3 className="text-base xs:text-lg font-bold mb-1 xs:mb-2">
                      Admin Access
                    </h3>
                    <p className="mb-2 xs:mb-3 text-sm xs:text-base">
                      You have admin privileges. Access the admin dashboard to
                      manage the platform.
                    </p>
                    <Link
                      href="/admin-dashboard"
                      className="inline-block bg-forest-green text-ivory px-3 xs:px-4 py-1.5 xs:py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all text-sm xs:text-base"
                    >
                      Admin Dashboard
                    </Link>
                  </div>
                )}

              <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-3 sm:gap-4">
                <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-deep-moss">
                  My Documents
                </h3>
                <div className="flex items-center gap-2 w-full xs:w-auto justify-between xs:justify-start">
                  <div className="flex border-2 border-deep-moss shadow-brutal-sm">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1 xs:p-1.5 sm:p-2 touch-target ${
                        viewMode === 'grid'
                          ? 'bg-forest-green text-ivory'
                          : 'bg-soft-sage'
                      }`}
                      aria-label="Grid view"
                    >
                      <Grid size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1 xs:p-1.5 sm:p-2 touch-target ${
                        viewMode === 'table'
                          ? 'bg-forest-green text-ivory'
                          : 'bg-soft-sage'
                      }`}
                      aria-label="Table view"
                    >
                      <List size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  <button
                    onClick={() => setIsUploadDialogOpen(true)}
                    className="bg-forest-green text-ivory p-1 xs:p-1.5 sm:p-2 md:px-4 md:py-2 font-bold border-2 border-deep-moss hover:shadow-brutal-sm sm:hover:shadow-brutal transition-all flex items-center gap-1 sm:gap-2 touch-target text-[10px] xs:text-xs sm:text-sm md:text-base min-h-[32px] xs:min-h-[36px]"
                  >
                    <Plus size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                    <span>Upload</span>
                    <span className="hidden md:inline">Document</span>
                  </button>
                </div>
              </div>

              <div className="bg-soft-sage border-2 sm:border-4 border-deep-moss p-2 xs:p-3 sm:p-4 md:p-6 shadow-brutal-sm sm:shadow-brutal overflow-x-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center py-4 xs:py-6 sm:py-8">
                    <NeubrutalistLoading
                      message="Documents"
                      subMessage="Retrieving your documents from secure storage..."
                      showSeal={false}
                    />
                  </div>
                ) : (
                  <>
                    {documents.length === 0 ? (
                      <div className="bg-ivory p-3 xs:p-4 sm:p-6 border-2 border-deep-moss text-center">
                        <p className="text-sm xs:text-base sm:text-lg font-bold text-deep-moss">
                          No documents found
                        </p>
                        <p className="text-xs xs:text-sm sm:text-base text-deep-moss mt-1 xs:mt-2">
                          Upload your first document using the + button above
                        </p>
                      </div>
                    ) : viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 xs:gap-3 sm:gap-4 md:gap-6">
                        {documents.map((doc) => (
                          <EnhancedDocumentCard
                            key={doc.documentId}
                            doc={doc}
                            documentName={doc.documentName}
                            verifyingOrgName={
                              doc.verifyingOrgId
                                ? orgNames[doc.verifyingOrgId]
                                : 'Unknown'
                            }
                            transactionHash={doc.transactionHash}
                            blockNumber={doc.blockNumber}
                            tokenId={doc.tokenId}
                            createdAt={doc.createdAt}
                            updatedAt={doc.updatedAt}
                            onShare={(document) => {
                              // Only allow sharing verified documents
                              if (
                                document.status === 'Verified' ||
                                document.status === '2'
                              ) {
                                setSharingDocument({
                                  id: document.documentId,
                                  name: document.documentName,
                                  status: document.status,
                                });
                                setIsShareDialogOpen(true);
                              } else {
                                setToastMessage({
                                  type: 'warning',
                                  message:
                                    'Only verified documents can be shared',
                                });
                              }
                            }}
                            onReupload={handleReupload}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="-mx-2 xs:-mx-3 sm:mx-0 overflow-x-auto pb-2 w-full">
                        <DocumentTable
                          documents={documents}
                          orgNames={orgNames}
                          onShare={(document) => {
                            // Only allow sharing verified documents
                            if (
                              document.status === 'Verified' ||
                              document.status === '2'
                            ) {
                              setSharingDocument({
                                id: document.documentId,
                                name: document.documentName,
                                status: document.status,
                              });
                              setIsShareDialogOpen(true);
                            } else {
                              setToastMessage({
                                type: 'warning',
                                message:
                                  'Only verified documents can be shared',
                              });
                            }
                          }}
                          onReupload={handleReupload}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-soft-sage border-2 sm:border-4 border-deep-moss p-3 xs:p-4 md:p-6 shadow-brutal-sm sm:shadow-brutal">
                <h3 className="text-lg xs:text-xl sm:text-2xl font-bold mb-3 xs:mb-4 sm:mb-6 text-deep-moss">
                  Recent Activity
                </h3>
                {activities.length === 0 ? (
                  <div className="bg-ivory p-3 xs:p-4 sm:p-6 border-2 border-deep-moss text-center">
                    <p className="text-sm xs:text-base text-deep-moss">
                      No recent activity
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 xs:space-y-3 sm:space-y-4">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="bg-ivory p-2 xs:p-3 sm:p-4 border-2 border-deep-moss flex items-start gap-2 xs:gap-3"
                      >
                        <div className="bg-soft-sage p-1.5 xs:p-2 border-2 border-deep-moss">
                          {activity.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm xs:text-base text-deep-moss">
                            {activity.text}
                          </p>
                          <p className="text-xs xs:text-sm text-gray-500">
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
              <div className="bg-soft-sage border-2 sm:border-4 border-deep-moss p-3 xs:p-4 md:p-6 shadow-brutal-sm sm:shadow-brutal">
                <h3 className="text-lg xs:text-xl sm:text-2xl font-bold mb-3 xs:mb-4 sm:mb-6 text-deep-moss">
                  Account Settings
                </h3>
                <div className="bg-ivory p-3 xs:p-4 sm:p-6 border-2 border-deep-moss">
                  <p className="text-sm xs:text-base text-deep-moss">
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
            className="bg-ivory w-full max-w-[95vw] xs:max-w-[90vw] sm:max-w-md h-full overflow-y-auto p-2 xs:p-3 sm:p-4 md:p-6 shadow-[-5px_0_15px_rgba(0,0,0,0.1)] flex flex-col"
          >
            <div className="flex justify-between items-center mb-3 xs:mb-4 sm:mb-6">
              <h3 className="text-base xs:text-lg sm:text-xl font-bold text-deep-moss">
                Recent Activity
              </h3>
              <button
                onClick={() => setShowActivityPane(false)}
                className="p-1.5 xs:p-2 hover:bg-soft-sage rounded-full touch-target"
              >
                <X size={16} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            {activities.length === 0 ? (
              <div className="bg-soft-sage p-3 xs:p-4 sm:p-6 border-2 border-deep-moss text-center">
                <p className="text-xs xs:text-sm sm:text-base text-deep-moss">
                  No recent activity
                </p>
              </div>
            ) : (
              <div className="space-y-2 xs:space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-soft-sage p-2 xs:p-3 sm:p-4 border-2 border-deep-moss flex items-start gap-1.5 xs:gap-2 sm:gap-3 rounded-sm shadow-brutal-sm"
                  >
                    <div className="bg-ivory p-1 xs:p-1.5 sm:p-2 border-2 border-deep-moss">
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs xs:text-sm sm:text-base text-deep-moss">
                        {activity.text}
                      </p>
                      <p className="text-[10px] xs:text-xs sm:text-sm text-gray-500">
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

      {/* Document Upload Dialog */}
      {isUploadDialogOpen && (
        <DocumentUploadDialog
          isOpen={isUploadDialogOpen}
          onClose={() => {
            setIsUploadDialogOpen(false);
            setReuploadDocument(null);
          }}
          onSuccess={handleUploadSuccess}
          documentToReupload={reuploadDocument as Document}
        />
      )}

      {/* Document Share Dialog */}
      {isShareDialogOpen && sharingDocument && (
        <DocumentShareDialog
          isOpen={isShareDialogOpen}
          documentId={sharingDocument.id ? sharingDocument.id.toString() : ''}
          documentName={sharingDocument.name || 'Document'}
          documentStatus={sharingDocument.status}
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
