'use client';

declare global {
  interface Window {
    ethereum: any;
  }
}

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Check, X, Bell } from 'lucide-react';
import { useActiveAccount, useActiveWallet } from 'thirdweb/react';
import { AuthGuard } from '../components/auth/AuthGuard';
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
  doc,
  updateDoc,
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
import { DocumentCard } from '../components/dashboard/DocumentCard';

import { NotificationBell } from '../components/dashboard/NotificationBell';
import { ProfileCard } from '../components/dashboard/ProfileCard';
import { Stats } from '../components/dashboard/Stats';
import {
  getDocumentTypes,
  getVerifiedOrganizations,
} from '../../lib/api-client';

const IndividualDashboard = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [uploadingStatus, setUploadingStatus] = useState('Upload');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docName, setDocName] = useState('');
  const [documentType, setDocumentType] = useState('identity');
  const [account, setAccount] = useState(null);
  const { user } = useAuth();
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
          setAccount(walletAddress);

          // Set up real-time listener for documents
          const documentsRef = collection(db, 'documents');
          const q = query(
            documentsRef,
            where('ownerUid', '==', user.uid),
            orderBy('createdAt', 'desc')
          );

          const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              const fetchedDocs = [];
              snapshot.forEach((doc) => {
                const data = doc.data();
                // Convert Firestore document to our Document model
                fetchedDocs.push(
                  new Document(
                    doc.id, // Use Firestore document ID
                    data.encryptedIpfsCid || '',
                    data.userWalletAddress || walletAddress,
                    data.originalDocHash || '',
                    mapStatusToCode(data.status), // Convert status string to code
                    data.documentType || 'Document',
                    data.verifyingOrgId || ''
                  )
                );
              });

              setDocuments(fetchedDocs);
              console.log(
                'Fetched documents from Firestore:',
                fetchedDocs.length
              );
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
  const fetchDocumentTypes = async () => {
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
  };

  // Fetch verified organizations
  useEffect(() => {
    let mounted = true;
    console.log('Initial organizations fetch useEffect triggered');
    console.log(
      'Current state - user:',
      !!user,
      'isLoading:',
      isLoading,
      'thirdwebAccount:',
      !!thirdwebAccount
    );

    const fetchOrganizations = async () => {
      // Prevent multiple simultaneous requests
      if (isLoading) {
        console.log('Already loading organizations, skipping fetch');
        return;
      }

      setIsLoading(true);
      try {
        // Make sure we have a Firebase user and wallet connected
        if (!user || !auth.currentUser) {
          console.warn('No authenticated user when fetching organizations');
          throw new Error('User not authenticated');
        }

        if (!thirdwebAccount) {
          console.warn('No wallet connected when fetching organizations');
        }

        console.log('Fetching verified organizations with user:', user.uid);

        // Use the getVerifiedOrganizations function
        const organizations = await getVerifiedOrganizations();
        console.log('Verified organizations response:', organizations);
        console.log('Verified organizations count:', organizations.length);

        if (mounted) {
          if (organizations.length > 0) {
            console.log('Setting verified organizations:', organizations);
            setVerifyingOrgs(organizations);
            setError(null);
          } else {
            console.warn('No verified organizations returned from API');
            setError('No verified organizations available');
            // Use fallback data in development
            if (process.env.NODE_ENV === 'development') {
              console.log('Using fallback data in development mode');
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
              setVerifyingOrgs(fallbackOrgs);
            }
          }
        }
      } catch (apiError) {
        console.error('Error fetching verified organizations:', apiError);
        if (mounted) {
          setError('Failed to fetch organizations');
          // Use fallback data only in development
          if (process.env.NODE_ENV === 'development') {
            console.log('Using fallback organization data in development');
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
            setVerifyingOrgs(fallbackOrgs);
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Only fetch organizations if user is authenticated
    if (user) {
      console.log('User authenticated, calling fetchOrganizations');
      fetchOrganizations();
    } else {
      console.log('No user, skipping organization fetch');
    }

    return () => {
      mounted = false;
    };
  }, [user, isLoading, thirdwebAccount]); // Add thirdwebAccount as dependency

  // Add useEffect to fetch document types and organizations when dialog opens
  useEffect(() => {
    console.log(
      'Dialog open useEffect triggered, isUploadDialogOpen:',
      isUploadDialogOpen
    );
    console.log(
      'Current state - user:',
      !!user,
      'isLoading:',
      isLoading,
      'verifyingOrgs.length:',
      verifyingOrgs.length
    );

    if (isUploadDialogOpen) {
      // Fetch document types
      fetchDocumentTypes();

      // Force fetch organizations when dialog opens, regardless of current state
      if (user && !isLoading && verifyingOrgs.length === 0) {
        console.log('Upload dialog opened, fetching organizations');

        // Set loading state
        setIsLoading(true);

        // Use the API client to fetch organizations
        getVerifiedOrganizations()
          .then((orgs) => {
            console.log('Organizations fetched successfully:', orgs);
            if (orgs.length > 0) {
              console.log('Setting verified organizations in state:', orgs);
              setVerifyingOrgs(orgs);
              setError(null);
            } else {
              console.warn('No organizations found');
              setError('No verified organizations available');

              // Use fallback data in development
              if (process.env.NODE_ENV === 'development') {
                console.log('Using fallback data in development mode');
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
                setVerifyingOrgs(fallbackOrgs);
              }
            }
          })
          .catch((error) => {
            console.error('Error fetching organizations:', error);
            setError('Failed to load organizations');

            // Use fallback data in development
            if (process.env.NODE_ENV === 'development') {
              console.log('Using fallback data in development mode');
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
              setVerifyingOrgs(fallbackOrgs);
            }
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        console.log(
          'Not fetching organizations - loading in progress or no user or organizations already loaded'
        );
        console.log('Current verifyingOrgs:', verifyingOrgs);
      }
    }
  }, [isUploadDialogOpen, user, isLoading, verifyingOrgs.length]);

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
          verifyingOrgId // Verifying org ID
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

  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string
  ) => {
    // Convert info to success for toast display (since our Toast only supports success/error/warning)
    const toastType = type === 'info' ? 'success' : type;
    setToastMessage({ type: toastType, message });
    setTimeout(() => setToastMessage(null), 5000);
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

              {/* Admin Dashboard Link - Only visible to admin wallet */}
              {thirdwebAccount &&
                thirdwebAccount.address.toLowerCase() ===
                  '0x4ca717eaac6ec3917cb6e23557e1cea7267e2a1c'.toLowerCase() && (
                  <li className="w-full">
                    <Link
                      href="/admin"
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
                          const notificationRef = doc(
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
                        href="/admin"
                        className="inline-block bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                      >
                        Admin Dashboard
                      </Link>
                    </div>
                  )}

                <div>
                  <h3 className="text-lg md:text-2xl font-archivo font-bold mb-4">
                    Your Documents
                  </h3>
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
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {documents.map((doc) => (
                        <DocumentCard
                          key={doc.documentId}
                          doc={doc}
                          onShare={() => {
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
            // Simply open the dialog - organizations will be loaded by the useEffect
            console.log(
              'Upload button clicked, current verifyingOrgs:',
              verifyingOrgs
            );
            setIsUploadDialogOpen(true);
          }}
        >
          <Plus size={24} />
        </button>

        {/* Dialogs - make them mobile friendly */}
        {isUploadDialogOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-ivory p-4 md:p-8 border-4 md:border-8 border-deep-moss max-w-md w-full">
              <h3 className="text-2xl font-black mb-6 bg-soft-sage p-2 border-4 border-deep-moss inline-block">
                Upload Document
              </h3>
              <form onSubmit={handleUpload}>
                <div className="mb-4">
                  <label
                    htmlFor="docName"
                    className="block font-bold mb-1 text-deep-moss"
                  >
                    Document Name *
                  </label>
                  <input
                    type="text"
                    id="docName"
                    name="docName"
                    value={docName}
                    onChange={handleDocNameChange}
                    placeholder="Enter document name"
                    className="w-full p-3 border-2 border-deep-moss focus:border-forest-green focus:outline-none"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="document_file"
                    className="block font-bold mb-1 text-deep-moss"
                  >
                    Document File *
                  </label>
                  <input
                    type="file"
                    id="document_file"
                    name="document_file"
                    onChange={handleFileChange}
                    className="w-full p-3 border-2 border-deep-moss focus:border-forest-green focus:outline-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max file size: 10MB
                  </p>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="documentType"
                    className="block font-bold mb-1 text-deep-moss"
                  >
                    Document Type *
                  </label>
                  <select
                    id="documentType"
                    name="documentType"
                    value={documentType}
                    onChange={handleDocTypeChange}
                    className="w-full p-3 border-2 border-deep-moss focus:border-forest-green focus:outline-none"
                    required
                  >
                    <option value="">Select document type</option>
                    {documentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select the type of document you are uploading
                  </p>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="verifyingOrgId"
                    className="block font-bold mb-1 text-deep-moss"
                  >
                    Verifying Organization *
                  </label>
                  <div className="relative">
                    {isLoading ? (
                      <div className="w-full p-3 border-2 border-deep-moss bg-soft-sage">
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-deep-moss mr-2"></div>
                          <span>Loading organizations...</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Log the organizations being rendered */}
                        {(() => {
                          console.log(
                            'Rendering dropdown with orgs:',
                            verifyingOrgs
                          );
                          console.log('isLoading state:', isLoading);
                          console.log(
                            'verifyingOrgId selected:',
                            verifyingOrgId
                          );
                          console.log(
                            'verifyingOrgs.length:',
                            verifyingOrgs.length
                          );
                          return null;
                        })()}

                        <select
                          id="verifyingOrgId"
                          name="verifyingOrgId"
                          value={verifyingOrgId}
                          onChange={handleVerOrgChange}
                          className="w-full p-3 border-2 border-deep-moss focus:border-forest-green focus:outline-none"
                          required
                        >
                          <option value="">Select an organization</option>

                          {verifyingOrgs.length === 0 ? (
                            <option value="" disabled>
                              No verified organizations available
                            </option>
                          ) : (
                            verifyingOrgs.map((org) => {
                              // Log each organization to help with debugging
                              console.log(
                                `Rendering org option: ${org.id}`,
                                org
                              );

                              // Check if org.name is defined
                              if (!org.name) {
                                console.warn(
                                  `Organization ${org.id} has no name property:`,
                                  org
                                );
                              }

                              // Create the display text for the option
                              const displayName =
                                org.name || 'Unnamed Organization';
                              const badge = org.verificationBadge ? '✓' : '';
                              const industryText = org.industry
                                ? ` (${org.industry})`
                                : '';
                              const optionText = `${displayName} ${badge}${industryText}`;
                              console.log(
                                `Option text for ${org.id}:`,
                                optionText
                              );

                              return (
                                <option key={org.id} value={org.id}>
                                  {displayName} {badge}
                                  {industryText}
                                </option>
                              );
                            })
                          )}
                        </select>
                      </>
                    )}
                  </div>
                  {error && (
                    <p className="text-burnt-sienna text-sm mt-1">{error}</p>
                  )}

                  {verifyingOrgId && (
                    <div className="mt-3 p-3 bg-soft-sage border-2 border-deep-moss">
                      {verifyingOrgs.find((org) => org.id === verifyingOrgId)
                        ?.verificationBadge && (
                        <div className="flex items-center mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-400 mr-2">
                            <Check className="mr-1" size={12} />
                            Verified
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-deep-moss mb-2">
                        {verifyingOrgs.find((org) => org.id === verifyingOrgId)
                          ?.description || 'No description available'}
                      </p>
                      {verifyingOrgs.find((org) => org.id === verifyingOrgId)
                        ?.documentTypes && (
                        <div className="mt-2">
                          <p className="text-xs font-bold text-deep-moss mb-1">
                            Verifies document types:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {verifyingOrgs
                              .find((org) => org.id === verifyingOrgId)
                              ?.documentTypes?.map((type) => (
                                <span
                                  key={type}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#D2E3C8] text-[#2F4F4F] border border-[#556B2F]"
                                >
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsUploadDialogOpen(false)}
                    className="mr-2 bg-burnt-sienna bg-opacity-20 text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                    disabled={uploadingStatus !== 'Upload'}
                  >
                    {uploadingStatus}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Share Dialog */}
        {isShareDialogOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-ivory p-4 md:p-6 border-2 md:border-4 border-deep-moss max-w-md w-full shadow-brutal">
              <h3 className="text-xl md:text-2xl font-black mb-4 text-deep-moss bg-soft-sage p-2 border-2 border-deep-moss inline-block">
                Share Document
              </h3>
              <p className="mb-6 text-deep-moss">
                Are you sure you want to share this document?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsShareDialogOpen(false)}
                  className="bg-burnt-sienna bg-opacity-20 text-deep-moss px-3 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                >
                  Cancel
                </button>
                <button className="bg-forest-green text-ivory px-3 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all">
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-4 right-4 z-50">
          <Toast type={toastMessage.type} message={toastMessage.message} />
        </div>
      )}
    </AuthGuard>
  );
};

export default IndividualDashboard;
