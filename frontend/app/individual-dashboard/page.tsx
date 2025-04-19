'use client';

declare global {
  interface Window {
    ethereum: any;
  }
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Check, X, Bell } from 'lucide-react';
import { useActiveAccount, useActiveWallet } from 'thirdweb/react';
// No longer need ethers
import { AuthGuard } from '../components/auth/AuthGuard';
import { useOrganization } from '../contexts/OrganizationContext';
import { ContextSwitcher } from '../components/dashboard/ContextSwitcher';
import { useAuth } from '../contexts/AuthContext';
import { SignOutButton } from '../components/auth/SignOutButton';
import { Toast } from '../components/ui/Toast';

import { auth, db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  doc as firestoreDoc,
  updateDoc,
  DocumentSnapshot,
  getDocs,
  limit,
  getDoc,
} from 'firebase/firestore';

import { Document } from '../models/Document';
interface Activity {
  id: string;
  text: string;
  date: string;
  icon: React.ReactNode;
  notification?: {
    id: string;
    [key: string]: any;
  };
}
// Using EnhancedDocumentCard instead of DocumentCard
import { EnhancedDocumentCard } from '../components/dashboard/EnhancedDocumentCard';
import { DocumentTable } from './components/DocumentTable';
import { NotificationBell } from '../components/dashboard/NotificationBell';
import { ProfileCard } from '../components/dashboard/ProfileCard';
import { Stats } from '../components/dashboard/Stats';
import { DocumentNotification } from '../components/dashboard/DocumentNotification';
import { getDocumentTypeName } from '../constants/documentTypes';
import { DocumentUploadDialog } from './components/DocumentUploadDialog';
import { DocumentShareDialog } from '../components/document/DocumentShareDialog';
import {
  getDocumentTypes,
  getVerifiedOrganizations,
} from '../../lib/api-client';

const IndividualDashboard = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [sharingDocument, setSharingDocument] = useState<{
    id: string | number;
    name: string;
  } | null>(null);
  const [uploadingStatus, setUploadingStatus] = useState('Upload');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [orgNames, setOrgNames] = useState<Record<string, string>>({});
  const [docName, setDocName] = useState('');
  const [documentType, setDocumentType] = useState('identity');
  const [account, setAccount] = useState(null);
  const { user, activeContext, setActiveContext } = useAuth();
  const { userOrganizations } = useOrganization();
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [verifyingOrgId, setVerifyingOrgId] = useState('');
  const [verifyingOrgs, setVerifyingOrgs] = useState<
    Array<{
      id: string;
      name: string;
      website?: string;
      description?: string;
      verificationBadge?: boolean;
      documentTypes?: string[];
      industry?: string;
      phoneNumber?: string;
    }>
  >([]);
  const [documentTypes, setDocumentTypes] = useState<
    Array<{ id: string; name: string; description: string }>
  >([]);

  // Add state to track loading and error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function gotoActivityPane() {
    setActiveTab('activity');
  }

  // Helper function to show toast messages
  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string
  ) => {
    setToastMessage({
      type: type === 'info' ? 'warning' : type, // Map 'info' to 'warning' since our Toast component doesn't have an info type
      message,
    });
  };
  const wallet = useActiveWallet();
  const thirdwebAccount = useActiveAccount();

  const router = useRouter();

  useEffect(() => {
    const fetchDocuments = async () => {
      // Only proceed if we have a Thirdweb account and user is authenticated
      if (thirdwebAccount && user) {
        try {
          console.log('Using Thirdweb account:', thirdwebAccount.address);

          // Set the account from Thirdweb
          const walletAddress = thirdwebAccount.address;
          console.log('Wallet address:', walletAddress);
          console.log('User UID:', user.uid);
          setAccount(walletAddress);

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

          const q = query(
            documentsRef,
            where('ownerUid', '==', user.uid),
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
                // Convert Firestore document to our Document model
                fetchedDocs.push(
                  new Document(
                    doc.id, // Use Firestore document ID
                    data.encryptedIpfsCid || '',
                    data.userWalletAddress || walletAddress,
                    data.originalDocHash || '',
                    mapStatusToCode(data.status), // Convert status string to code
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

              // Fetch organization names for the documents
              const orgIds = fetchedDocs
                .map((doc) => doc.verifier)
                .filter((id) => id && id.trim() !== '');

              if (orgIds.length > 0) {
                const uniqueOrgIds = Array.from(new Set(orgIds));
                const orgNamesMap: Record<string, string> = {};

                Promise.all(
                  uniqueOrgIds.map(async (orgId) => {
                    try {
                      const orgDoc = await getDoc(
                        firestoreDoc(db, 'organizations', orgId)
                      );
                      if (orgDoc.exists()) {
                        const orgData = orgDoc.data();
                        orgNamesMap[orgId] =
                          orgData.name || 'Unknown Organization';
                      }
                    } catch (error) {
                      console.error(
                        `Error fetching organization ${orgId}:`,
                        error
                      );
                    }
                  })
                )
                  .then(() => {
                    setOrgNames(orgNamesMap);
                    console.log('Fetched organization names:', orgNamesMap);
                  })
                  .catch((error) => {
                    console.error('Error fetching organization names:', error);
                  });
              }

              // If no documents found, check if there are any documents in the collection
              if (fetchedDocs.length === 0) {
                console.log(
                  'No documents found for this user. Checking collection...'
                );
                getDocs(documentsRef)
                  .then((allDocs) => {
                    console.log(
                      `Total documents in collection: ${allDocs.size}`
                    );
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
              setToastMessage({
                type: 'error',
                message: 'Failed to listen for document updates.',
              });
            }
          );

          // Clean up listener on unmount
          return () => unsubscribe();
        } catch (error) {
          console.error('Error fetching documents:', error);
          setToastMessage({
            type: 'error',
            message: 'Failed to load documents. Please try again later.',
          });
        }
      } else {
        console.log('No wallet connected or user not authenticated');
        setToastMessage({
          type: 'warning',
          message: 'Please connect your wallet to view your documents.',
        });
      }
    };

    fetchDocuments();

    // Return cleanup function
    return () => {
      // Cleanup will be handled by the unsubscribe function returned in fetchDocuments
    };
  }, [thirdwebAccount, user]);

  // Helper function to map status strings to codes
  const mapStatusToCode = (status: string): string => {
    switch (status) {
      case 'Verified':
        return '0';
      case 'Pending Verification':
      case 'Pending Blockchain Submission':
      case 'Submitting to Blockchain':
        return '1';
      case 'Rejected':
        return '2';
      case 'Blockchain Failed':
      case 'Verification Failed':
        return '3';
      default:
        return '1'; // Default to pending
    }
  };

  // Helper function to map status codes to strings
  const mapStatusCodeToString = (statusCode: string): string => {
    switch (statusCode) {
      case '0':
        return 'Verified';
      case '1':
        return 'Pending Verification';
      case '2':
        return 'Rejected';
      case '3':
        return 'Verification Failed';
      default:
        return 'Pending Verification';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadingStatus('Uploading File ...');
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
    setUploadingStatus('Upload');
  };

  const handleDocNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadingStatus('Updating...');
    setDocName(e.target.value);
    setUploadingStatus('Upload');
  };

  const handleVerOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUploadingStatus('Updating...');
    setVerifyingOrgId(e.target.value);
    setUploadingStatus('Upload');
  };

  const handleDocTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUploadingStatus('Updating...');
    setDocumentType(e.target.value);
    setUploadingStatus('Upload');
  };

  // Fetch document types from API
  const fetchDocumentTypes = useCallback(async () => {
    try {
      const types = await getDocumentTypes();
      setDocumentTypes(types);
      console.log('Fetched document types:', types);
    } catch (error) {
      console.error('Error fetching document types:', error);

      // Use fallback data if API fails
      console.log('Using fallback document types');
      setDocumentTypes([
        {
          id: 'identity',
          name: 'Identity Document',
          description: 'Government-issued identity documents',
        },
        {
          id: 'education',
          name: 'Educational Certificate',
          description: 'Diplomas, degrees, transcripts',
        },
        {
          id: 'employment',
          name: 'Employment Document',
          description: 'Employment contracts, offer letters',
        },
        {
          id: 'financial',
          name: 'Financial Document',
          description: 'Bank statements, tax returns',
        },
        {
          id: 'other',
          name: 'Other Document',
          description: 'Any other document type',
        },
      ]);
    }
  }, [setDocumentTypes]);

  // Define a single function to fetch organizations
  const fetchVerifiedOrganizations = useCallback(() => {
    // Prevent multiple simultaneous requests
    if (isLoading || !user) {
      return;
    }

    // Set loading state at the beginning of the fetch
    setIsLoading(true);

    // Use the API client to fetch organizations
    getVerifiedOrganizations()
      .then((orgs) => {
        if (orgs && Array.isArray(orgs) && orgs.length > 0) {
          // Check if the organizations have changed before updating state
          const currentOrgIds = new Set(verifyingOrgs.map((org) => org.id));
          const newOrgs = orgs.filter((org) => !currentOrgIds.has(org.id));

          if (newOrgs.length > 0 || verifyingOrgs.length !== orgs.length) {
            // Only log in development environment
            if (process.env.NODE_ENV === 'development') {
              console.log(
                `Updating organizations: found ${orgs.length} organizations`
              );
            }
            setVerifyingOrgs([...orgs]);
          }

          setError(null);
        } else {
          setError('No verified organizations available');

          // Use fallback data in development
          if (process.env.NODE_ENV === 'development') {
            const fallbackOrgs = [
              {
                id: 'org1',
                name: 'Example Organization 1',
                website: 'https://example.org',
                description: 'Example verified organization for testing',
                verificationBadge: true,
                documentTypes: ['identity', 'education'],
              },
              {
                id: 'org2',
                name: 'Example Organization 2',
                website: 'https://example2.org',
                description: 'Another example organization',
                verificationBadge: true,
                documentTypes: ['financial', 'legal'],
              },
            ];
            setVerifyingOrgs([...fallbackOrgs]);
          }
        }
      })
      .catch((error) => {
        console.error('Error fetching organizations:', error);
        setError('Failed to load organizations');

        // Use fallback data in development
        if (process.env.NODE_ENV === 'development') {
          const fallbackOrgs = [
            {
              id: 'org1',
              name: 'Example Organization 1',
              website: 'https://example.org',
              description: 'Example verified organization for testing',
              verificationBadge: true,
              documentTypes: ['identity', 'education'],
            },
            {
              id: 'org2',
              name: 'Example Organization 2',
              website: 'https://example2.org',
              description: 'Another example organization',
              verificationBadge: true,
              documentTypes: ['financial', 'legal'],
            },
          ];
          setVerifyingOrgs([...fallbackOrgs]);
        }
      })
      .finally(() => {
        // Set loading state to false when done
        setIsLoading(false);
      });
  }, [
    user,
    isLoading,
    verifyingOrgs,
    setVerifyingOrgs,
    setError,
    setIsLoading,
  ]);

  // Fetch organizations when user or wallet changes - with a ref to prevent excessive calls
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Only fetch if we have both user and wallet, and haven't already initialized
    if (user && thirdwebAccount && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      fetchVerifiedOrganizations();
    }

    // Reset the ref when user or wallet changes
    return () => {
      if (!user || !thirdwebAccount) {
        hasInitializedRef.current = false;
      }
    };
  }, [user, thirdwebAccount, fetchVerifiedOrganizations]);

  // Add useEffect to fetch document types when dialog opens
  useEffect(() => {
    // Only run this effect when the dialog opens
    if (!isUploadDialogOpen) return;

    // Fetch document types
    fetchDocumentTypes();

    // We don't need to fetch organizations here anymore since we're already
    // fetching them when the user or wallet changes, and the DocumentUploadDialog
    // component has its own mechanism to fetch organizations when needed.
  }, [isUploadDialogOpen, fetchDocumentTypes]);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadingStatus('Uploading ...');

    // Get the active account from Thirdweb
    if (!thirdwebAccount) {
      setToastMessage({
        type: 'error',
        message: 'No wallet connected',
      });
      setUploadingStatus('Upload');
      return;
    }

    if (!file) {
      setToastMessage({
        type: 'error',
        message: 'Please select a file to upload',
      });
      setUploadingStatus('Upload');
      return;
    }

    if (!verifyingOrgId) {
      setToastMessage({
        type: 'error',
        message: 'Please select a verifying organization',
      });
      setUploadingStatus('Upload');
      return;
    }

    const formData = new FormData();
    formData.append('document_file', file);
    formData.append('documentName', docName);
    formData.append('documentType', documentType);
    formData.append('verifyingOrgId', verifyingOrgId);
    // User identity will be extracted from the ID token on the server

    try {
      // Check if we're using example organizations (fallback data)
      const isExampleOrg = verifyingOrgId.startsWith('org');

      // Get Firebase ID token for real organizations
      let idToken: string | undefined;
      if (!isExampleOrg) {
        idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          throw new Error('Not authenticated');
        }
      }

      setUploadingStatus('Encrypting...');

      // Use the isExampleOrg variable from above
      if (isExampleOrg) {
        // Simulate upload with example organizations
        let progress = 0;
        const simulateProgress = setInterval(() => {
          progress += 10;
          if (progress <= 100) {
            setUploadingStatus(`Uploading: ${progress}%`);
          } else {
            clearInterval(simulateProgress);
          }
        }, 300);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Clear the interval if it's still running
        clearInterval(simulateProgress);

        // Create a mock document
        const mockDocument = new Document(
          Math.floor(Math.random() * 1000), // Random ID
          'ipfs://example', // Mock IPFS URL
          thirdwebAccount?.address || 'unknown', // User's wallet address from Thirdweb
          'example-hash', // Mock hash
          '1', // Status (Pending)
          documentType, // Document type
          verifyingOrgId, // Verifying org ID
          docName || 'Example Document', // Document name
          '0x' + Math.random().toString(16).substring(2, 42), // Mock transaction hash
          Math.floor(Math.random() * 1000000), // Mock block number
          Math.floor(Math.random() * 100), // Mock token ID
          new Date().toISOString(), // Created at
          new Date().toISOString() // Updated at
        );

        // Add the mock document to the list
        setDocuments([mockDocument, ...documents]);
      } else {
        // Import the API client
        const { uploadDocument } = await import('../../lib/api-client');

        // Real API upload
        await uploadDocument(formData, (percentCompleted: number) => {
          setUploadingStatus(`Uploading: ${percentCompleted}%`);
        });
      }

      // Close the dialog and show success message
      setIsUploadDialogOpen(false);
      setToastMessage({
        type: 'success',
        message: isExampleOrg
          ? 'Document uploaded successfully to example organization!'
          : 'Document uploaded successfully and queued for blockchain submission',
      });

      // Reset form
      setDocName('');
      setFile(null);
      setVerifyingOrgId('');
      setUploadingStatus('Upload');

      // Refresh documents after a short delay
      setTimeout(() => {
        // This would be replaced with a proper document fetch function
        // fetchDocuments();
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setToastMessage({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Document upload failed',
      });
      setUploadingStatus('Upload');
    }
  };

  // Redirect to home page when wallet is disconnected
  useEffect(() => {
    if (!wallet && user) {
      router.push('/');
    }
  }, [wallet, user, router]);

  // Set active context to individual when viewing this dashboard
  useEffect(() => {
    if (user && activeContext !== 'individual') {
      setActiveContext('individual');
    }
  }, [user, activeContext, setActiveContext]);

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
      },
      (error) => {
        console.error('Error in notifications listener:', error);
      }
    );

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [user]);

  const [activities, setActivities] = useState<Activity[]>([]);

  return (
    <AuthGuard allowedUserTypes={['individual']}>
      <div className="min-h-screen bg-ivory text-deep-moss flex flex-col md:flex-row font-archivo">
        {/* Sidebar - now becomes a bottom nav on mobile */}
        <aside className="fixed bottom-0 left-0 right-0 md:static w-full md:w-80 bg-soft-sage p-3 md:p-6 border-t-4 md:border-r-4 md:border-t-0 border-deep-moss flex md:flex-col h-auto md:h-screen md:sticky md:top-0 z-30">
          <h1 className="hidden md:block text-2xl font-black mb-8 text-deep-moss bg-soft-sage p-2 border-4 border-deep-moss inline-block">
            AUTHENTICO
          </h1>
          {/* User info moved to ProfileCard */}

          {/* Navigation - horizontal on mobile, vertical on desktop */}
          <nav className="flex-1">
            <ul className="flex md:flex-col md:space-y-4 justify-around md:justify-start">
              <li className="w-full">
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base ${
                    activeTab === 'documents'
                      ? 'bg-soft-sage shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                      : 'bg-ivory hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                  }`}
                >
                  <span className="hidden md:inline">Documents</span>
                </button>
              </li>

              <li className="w-full">
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base ${
                    activeTab === 'activity'
                      ? 'bg-soft-sage shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                      : 'bg-ivory hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                  }`}
                >
                  <span className="hidden md:inline">Status Updates</span>
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
                    </Link>
                  </li>
                )}
            </ul>
          </nav>

          {/* Sign Out Button - hidden on mobile */}
          <div className="hidden md:block mt-auto space-y-4">
            <SignOutButton className="block w-full bg-burnt-sienna bg-opacity-20 text-deep-moss p-3 font-bold border-4 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all" />
          </div>
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

                    // Mark all notifications as read
                    activities.forEach(async (activity) => {
                      if (activity.notification?.id) {
                        try {
                          const notificationRef = firestoreDoc(
                            db,
                            'notifications',
                            activity.notification.id
                          );
                          await updateDoc(notificationRef, { read: true });
                        } catch (error) {
                          console.error(
                            'Error marking notification as read:',
                            error
                          );
                        }
                      }
                    });
                  }}
                />
                <ProfileCard />
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-ivory">
            {activeTab === 'activity' && (
              <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                <h3 className="text-lg md:text-2xl font-archivo font-bold mb-4">
                  Document Status Updates
                </h3>
                {documents.length > 0 ? (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <DocumentNotification
                        key={doc.documentId.toString()}
                        documentId={doc.documentId.toString()}
                        documentName={doc.documentName || doc.documentType}
                        status={mapStatusCodeToString(doc.status)}
                        timestamp={new Date()}
                        isNew={doc.status === '1'} // New if pending
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-ivory p-6 border-2 border-deep-moss text-center">
                    <p className="text-lg font-bold text-deep-moss">
                      No document updates
                    </p>
                    <p className="text-deep-moss">
                      Upload your first document to see status updates here
                    </p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'documents' && (
              <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                <Stats documents={documents} />

                {/* Admin Dashboard Link - Only visible to admin wallet */}
                {account &&
                  account.toLowerCase() ===
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

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg md:text-2xl font-archivo font-bold">
                      Your Documents
                    </h3>

                    {documents.length > 0 && (
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          className={`px-3 py-1.5 border-2 border-deep-moss transition-all font-bold text-sm ${
                            viewMode === 'grid'
                              ? 'bg-forest-green text-ivory'
                              : 'bg-ivory text-deep-moss'
                          }`}
                          onClick={() => setViewMode('grid')}
                        >
                          Grid View
                        </button>
                        <button
                          type="button"
                          className={`px-3 py-1.5 border-2 border-deep-moss transition-all font-bold text-sm ${
                            viewMode === 'table'
                              ? 'bg-forest-green text-ivory'
                              : 'bg-ivory text-deep-moss'
                          }`}
                          onClick={() => setViewMode('table')}
                        >
                          Table View
                        </button>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="bg-burnt-sienna bg-opacity-20 p-4 border-2 border-deep-moss mb-4">
                      <p className="text-deep-moss font-bold">{error}</p>
                    </div>
                  )}

                  {documents.length === 0 ? (
                    <div className="bg-ivory p-6 border-2 border-deep-moss text-center">
                      <p className="text-lg font-bold text-deep-moss">
                        No documents found
                      </p>
                      <p className="text-deep-moss">
                        Upload your first document using the + button below
                      </p>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {documents.map((doc) => (
                        <EnhancedDocumentCard
                          key={doc.documentId}
                          doc={doc}
                          documentName={doc.documentName}
                          verifyingOrgName={orgNames[doc.verifier]}
                          transactionHash={doc.transactionHash}
                          blockNumber={doc.blockNumber}
                          tokenId={doc.tokenId}
                          createdAt={doc.createdAt}
                          updatedAt={doc.updatedAt}
                          onShare={(document) => {
                            setSharingDocument({
                              id: document.documentId,
                              name: doc.documentName || 'Document',
                            });
                            setIsShareDialogOpen(true);
                          }}
                          onAction={(doc) => {
                            if (doc.status === '1') {
                              // Pending
                              showToast(
                                'info',
                                'Your document is pending verification'
                              );
                            } else if (doc.status === '0') {
                              // Verified
                              showToast(
                                'success',
                                'Document verified successfully'
                              );
                            } else if (doc.status === '2') {
                              // Rejected
                              showToast(
                                'error',
                                `Document was rejected: ${doc.metadataHash}`
                              );
                            } else if (doc.status === '3') {
                              // Failed
                              showToast(
                                'error',
                                `Document processing failed: ${doc.metadataHash}`
                              );
                            }
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <DocumentTable
                      documents={documents}
                      orgNames={orgNames}
                      onShare={(document) => {
                        // Get document details from Firestore
                        const docRef = firestoreDoc(
                          db,
                          'documents',
                          document.documentId.toString()
                        );
                        const unsubscribe = onSnapshot(
                          docRef,
                          (snapshot: DocumentSnapshot) => {
                            if (snapshot.exists()) {
                              const data = snapshot.data();
                              setSharingDocument({
                                id: document.documentId,
                                name: data.documentName || 'Document',
                              });
                              setIsShareDialogOpen(true);
                            } else {
                              setToastMessage({
                                type: 'error',
                                message: 'Document not found',
                              });
                            }
                            // Unsubscribe after getting the data
                            unsubscribe();
                          }
                        );
                      }}
                      onAction={(doc) => {
                        if (doc.status === '1') {
                          // Pending
                          showToast(
                            'info',
                            'Your document is pending verification'
                          );
                        } else if (doc.status === '0') {
                          // Verified
                          showToast(
                            'success',
                            'Document verified successfully'
                          );
                        } else if (doc.status === '2') {
                          // Rejected
                          showToast(
                            'error',
                            `Document was rejected: ${doc.metadataHash}`
                          );
                        } else if (doc.status === '3') {
                          // Failed
                          showToast(
                            'error',
                            `Document processing failed: ${doc.metadataHash}`
                          );
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </main>
        </div>

        <button
          type="button"
          title="Upload Document"
          className="fixed bottom-24 md:bottom-8 right-4 md:right-8 bg-soft-sage text-deep-moss p-3 md:p-4 rounded-full border-4 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all z-40"
          onClick={() => {
            // Reset state before opening dialog
            setVerifyingOrgId('');
            setDocName('');
            setFile(null);
            setError(null);

            console.log(
              'Upload button clicked, current verifyingOrgs:',
              verifyingOrgs
            );
            setIsUploadDialogOpen(true);
          }}
        >
          <Plus size={24} />
        </button>

        {/* Document Upload Dialog */}
        <DocumentUploadDialog
          isOpen={isUploadDialogOpen}
          onClose={() => setIsUploadDialogOpen(false)}
          onSuccess={() => {
            setToastMessage({
              type: 'success',
              message:
                'Document uploaded successfully and queued for blockchain submission',
            });
          }}
        />

        {/* Document Share Dialog */}
        {sharingDocument && (
          <DocumentShareDialog
            isOpen={isShareDialogOpen}
            onClose={() => {
              setIsShareDialogOpen(false);
              setSharingDocument(null);
            }}
            documentId={sharingDocument.id}
            documentName={sharingDocument.name}
          />
        )}
      </div>

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

export default IndividualDashboard;
