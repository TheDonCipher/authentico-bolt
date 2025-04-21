'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { ContextSwitcher } from '../../../components/dashboard/ContextSwitcher';
import { ProfileCard } from '../../../components/dashboard/ProfileCard';
import { NotificationBell } from '../../../components/dashboard/NotificationBell';
import { Loader } from '../../../components/ui/Loader';
import { Toast } from '../../../components/ui/Toast';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
// Import components
import DocumentReception from '../../../organization-dashboard/components/DocumentReception';
import OrganizationVerificationStatus from '../../../organization-dashboard/components/OrganizationVerificationStatus';
import VerificationQueue from './components/VerificationQueue';
import { Eye } from 'lucide-react';

interface ToastMessage {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export default function OrganizationDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { hasOrgAccess, userOrganizations, isLoadingOrgs } = useOrganization();
  const [orgData, setOrgData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  const orgId = params?.orgId as string;

  // Fetch organization data
  useEffect(() => {
    const fetchOrgData = async () => {
      if (!orgId) return;

      try {
        // First, get the organization user data
        const orgDoc = await getDocs(
          query(collection(db, 'users'), where('__name__', '==', orgId))
        );

        if (!orgDoc.empty) {
          const userData = orgDoc.docs[0].data();
          console.log('Organization user data:', userData);

          // Determine the verification status
          let verificationStatus = 'not_verified';
          if (userData.verificationStatus) {
            verificationStatus = userData.verificationStatus;
          } else if (userData.status) {
            verificationStatus = userData.status;
          } else if (userData.isVerified === true) {
            verificationStatus = 'verified';
          }

          // Now, try to get the organization application data which might have more details
          let applicationData: Record<string, any> = {};
          try {
            const appQuery = query(
              collection(db, 'organizationApplications'),
              where('orgId', '==', orgId)
            );
            const appDocs = await getDocs(appQuery);

            if (!appDocs.empty) {
              applicationData = appDocs.docs[0].data() as Record<string, any>;
              console.log('Organization application data:', applicationData);
            }
          } catch (appError) {
            console.error('Error fetching organization application:', appError);
            // Continue with user data only
          }

          // Merge the data, prioritizing application data for certain fields
          const mergedData: Record<string, any> = {
            ...userData,
            ...applicationData, // Application data overrides user data
            // But we want to ensure these specific fields from userData are preserved
            uid: userData.uid || orgId,
            status: verificationStatus, // Use our determined status
          };

          // Always use the application email for contact if available
          if ('email' in applicationData && applicationData.email) {
            mergedData.applicationEmail = applicationData.email;
            // Also set as contactEmail for backward compatibility
            mergedData.contactEmail = applicationData.email;
          }

          // If application has organizationName but user data doesn't, use it
          if (
            'organizationName' in applicationData &&
            (!('organizationName' in userData) || !userData.organizationName)
          ) {
            mergedData.organizationName = applicationData.organizationName;
          }

          setOrgData(mergedData);
          console.log('Processed organization data:', mergedData);
        }
      } catch (error) {
        console.error('Error fetching organization data:', error);
        setToastMessage({
          type: 'error' as const,
          message: 'Failed to load organization data',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrgData();
  }, [orgId]);

  // Fetch documents for this organization
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!orgId) return;

      try {
        const docsQuery = query(
          collection(db, 'documents'),
          where('verifyingOrgId', '==', orgId)
        );

        const docsSnapshot = await getDocs(docsQuery);
        const docs = docsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    fetchDocuments();
  }, [orgId]);

  // Function to fetch verification requests
  const fetchVerificationRequests = async () => {
    if (!orgId) return;

    try {
      console.log(`Fetching verification requests for organization: ${orgId}`);

      // Use a simpler query that doesn't require a composite index
      // Just query by verifyingOrgId and then filter the results in memory
      const docsQuery = query(
        collection(db, 'documents'),
        where('verifyingOrgId', '==', orgId)
      );

      const docsSnapshot = await getDocs(docsQuery);
      console.log(
        `Found ${docsSnapshot.docs.length} total documents for this organization`
      );

      // Filter for pending documents in memory - check for multiple possible status values
      const pendingDocs = docsSnapshot.docs
        .filter((doc) => {
          const data = doc.data();
          const status = data.status?.toLowerCase?.() || '';
          // Check for any status that indicates pending verification
          return (
            status === 'pending verification' ||
            status === 'pending' ||
            status === 'awaiting verification' ||
            status === 'submitted'
          );
        })
        .map((doc) => {
          const data = doc.data();
          console.log(`Processing pending document: ${doc.id}`, data);
          return {
            id: doc.id,
            ...data,
            // Ensure we have owner information
            ownerName:
              data.ownerName ||
              data.requesterName ||
              data.ownerUid ||
              'Unknown User',
            // Ensure we have document name
            documentName: data.documentName || data.name || 'Unnamed Document',
            // Ensure we have document type
            documentType:
              data.documentType || data.documentTypeName || 'Unknown Type',
            // Ensure we have a date
            createdAt: data.createdAt || data.submittedAt || new Date(),
          };
        });

      console.log(
        `Found ${pendingDocs.length} pending documents for verification`
      );

      // Sort by date (newest first)
      pendingDocs.sort((a, b) => {
        const dateA =
          a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB =
          b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      setVerificationRequests(pendingDocs);

      // If we didn't find any pending documents in the documents collection,
      // try the verificationRequests collection as a fallback
      if (pendingDocs.length === 0) {
        try {
          console.log(
            'No pending documents found, checking verificationRequests collection'
          );
          // Use a simpler query here too
          const requestsQuery = query(
            collection(db, 'verificationRequests'),
            where('verifyingOrgId', '==', orgId)
          );

          const requestsSnapshot = await getDocs(requestsQuery);
          console.log(
            `Found ${requestsSnapshot.docs.length} verification requests`
          );

          // Filter for pending requests in memory - check for multiple possible status values
          const pendingRequests = requestsSnapshot.docs
            .filter((doc) => {
              const data = doc.data();
              const status = data.status?.toLowerCase?.() || '';
              // Check for any status that indicates pending
              return (
                status === 'pending' ||
                status === 'awaiting verification' ||
                status === 'submitted'
              );
            })
            .map((doc) => {
              const data = doc.data();
              console.log(`Processing pending request: ${doc.id}`, data);
              return {
                id: doc.id,
                ...data,
                // Ensure we have requester information
                requesterName:
                  data.requesterName ||
                  data.ownerName ||
                  data.requesterId ||
                  'Unknown User',
                // Ensure we have document name
                documentName:
                  data.documentName || data.name || 'Unnamed Document',
                // Ensure we have a date
                createdAt: data.createdAt || data.submittedAt || new Date(),
              };
            });

          if (pendingRequests.length > 0) {
            console.log(
              `Found ${pendingRequests.length} pending verification requests`
            );

            // Sort by date (newest first)
            pendingRequests.sort((a, b) => {
              const dateA =
                a.createdAt instanceof Date
                  ? a.createdAt
                  : new Date(a.createdAt);
              const dateB =
                b.createdAt instanceof Date
                  ? b.createdAt
                  : new Date(b.createdAt);
              return dateB.getTime() - dateA.getTime();
            });

            setVerificationRequests(pendingRequests);
          }
        } catch (firestoreError) {
          console.error(
            'Error accessing verificationRequests collection:',
            firestoreError
          );
          // We already have the pendingDocs array (which might be empty)
          // so we don't need to do anything here
        }
      }
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      // Set empty array as fallback
      setVerificationRequests([]);
    }
  };

  // Fetch verification requests on component mount and set up a refresh interval
  useEffect(() => {
    fetchVerificationRequests();

    // Set up an interval to refresh verification requests every 30 seconds
    const intervalId = setInterval(() => {
      fetchVerificationRequests();
    }, 30000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadNotificationsCount = async () => {
      if (!orgId) return;

      try {
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', orgId),
          where('read', '==', false)
        );

        const notificationsSnapshot = await getDocs(notificationsQuery);
        setUnreadNotifications(notificationsSnapshot.size);
      } catch (error) {
        console.error('Error fetching notifications count:', error);
      }
    };

    fetchUnreadNotificationsCount();

    // Set up an interval to refresh notifications count every minute
    const intervalId = setInterval(() => {
      fetchUnreadNotificationsCount();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [orgId]);

  // Check if user has access to this organization
  useEffect(() => {
    if (!authLoading && !isLoadingOrgs && user) {
      if (!hasOrgAccess(orgId)) {
        router.push('/unauthorized');
      }
    }
  }, [authLoading, isLoadingOrgs, user, hasOrgAccess, orgId, router]);

  // Organization data display variables
  const orgName =
    orgData?.organizationName ||
    orgData?.name ||
    userOrganizations.find((org) => org.orgId === orgId)?.orgName ||
    'Organization';

  // Get contact email - prioritize the application email
  let contactEmail = 'No email provided';
  if (orgData?.applicationEmail) {
    contactEmail = orgData.applicationEmail;
  } else if (
    orgData?.contactEmail &&
    orgData.contactEmail !== 'No email provided'
  ) {
    contactEmail = orgData.contactEmail;
  } else if (orgData?.email) {
    contactEmail = orgData.email;
  }

  // We don't allow email editing - the application email is used for all communications
  console.log('Organization contact email:', contactEmail);

  // Loading state
  if (authLoading || isLoadingOrgs || isLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Loader
          fullScreen
          text="Loading organization dashboard..."
          size="large"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory w-full max-w-full">
      <header className="bg-soft-sage p-3 sm:p-4 border-b-2 sm:border-b-4 border-deep-moss sticky top-0 z-20 w-full">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-black text-deep-moss mr-2 sm:mr-4">
                {orgName}
              </h1>
              <div className="hidden sm:block">
                <ContextSwitcher />
              </div>
            </div>

            {/* Mobile-only notification bell */}
            <div className="flex sm:hidden items-center gap-3">
              <NotificationBell
                count={unreadNotifications}
                notificationsPath={`/org/${orgId}/notifications`}
              />
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 sm:gap-4">
            <NotificationBell
              count={unreadNotifications}
              notificationsPath={`/org/${orgId}/notifications`}
            />
            <ProfileCard />
          </div>

          <div className="flex sm:hidden items-center w-full justify-between mt-2">
            <div className="block sm:hidden">
              <ContextSwitcher />
            </div>
            <ProfileCard />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 sm:p-4 md:p-8 pb-24 md:pb-8 w-full">
        {/* Organization Info Card */}
        <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal mb-8">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-2xl font-bold text-deep-moss">{orgName}</h3>
                <div className="bg-forest-green text-ivory px-3 py-1 rounded-full border border-deep-moss text-sm font-medium">
                  {orgData?.status === 'verified' ? 'Verified' : 'Organization'}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-bold text-deep-moss">
                    Organization Name
                  </p>
                  <p className="text-deep-moss">{orgName}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-deep-moss">
                    Contact Email
                  </p>
                  <p className="text-deep-moss break-words">{contactEmail}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center mt-4 md:mt-0">
              <div className="bg-ivory p-4 border-2 border-deep-moss rounded-md">
                <p className="text-sm font-bold text-deep-moss mb-1">
                  Organization ID
                </p>
                <p className="text-xs font-mono text-deep-moss">{orgId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Verification Status Section */}
        <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal mb-8">
          <h3 className="text-2xl font-bold mb-4 text-deep-moss">
            Organization Verification Status
          </h3>
          <OrganizationVerificationStatus
            status={orgData?.status || 'not_verified'}
            submittedAt={orgData?.submittedAt || undefined}
            notes={orgData?.notes || ''}
          />

          {/* Show pending verification requests count for all organizations */}
          <div className="bg-ivory p-4 border-2 border-deep-moss rounded-md mt-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="font-bold text-deep-moss">
                  Pending Verification Requests
                </p>
                <p className="text-3xl font-black text-forest-green">
                  {verificationRequests.length}
                </p>
                {verificationRequests.length > 0 && (
                  <p className="text-sm text-deep-moss mt-1">
                    Last request:{' '}
                    {verificationRequests[0]?.documentName ||
                      'Unknown document'}
                  </p>
                )}
              </div>
              <button
                onClick={() => setActiveTab('verification')}
                className="bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                disabled={verificationRequests.length === 0}
              >
                {verificationRequests.length > 0
                  ? 'View Requests'
                  : 'No Pending Requests'}
              </button>
            </div>
          </div>
        </section>

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-deep-moss pb-4 mb-6 md:mb-8 gap-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-deep-moss">
              Organization Dashboard
            </h2>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 sm:px-4 py-2 font-bold transition-all whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'dashboard'
                    ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                    : 'bg-ivory text-deep-moss border-2 border-deep-moss hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`px-3 sm:px-4 py-2 font-bold transition-all whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'verification'
                    ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                    : 'bg-ivory text-deep-moss border-2 border-deep-moss hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                Verification Queue
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-3 sm:px-4 py-2 font-bold transition-all whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'documents'
                    ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                    : 'bg-ivory text-deep-moss border-2 border-deep-moss hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                Document Reception
              </button>
            </div>
          </div>
        </div>

        {/* Always render all components, but only display the active one */}
        <section
          className={`bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal ${
            activeTab !== 'dashboard' ? 'hidden' : ''
          }`}
        >
          <h3 className="text-2xl font-bold mb-4 text-deep-moss">
            Recent Documents
          </h3>
          {documents.length > 0 ? (
            <>
              {/* Desktop/Tablet View */}
              <div className="hidden sm:block overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 w-full">
                <table className="w-full border-collapse text-sm md:text-base table-auto">
                  <thead>
                    <tr className="bg-forest-green text-ivory">
                      <th className="p-2 text-left">Document Name</th>
                      <th className="p-2 text-left hidden sm:table-cell">
                        Type
                      </th>
                      <th className="p-2 text-left hidden md:table-cell">
                        Submitted By
                      </th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b border-deep-moss">
                        <td className="p-2 whitespace-nowrap text-deep-moss">
                          {doc.documentName || doc.name || 'Unnamed Document'}
                        </td>
                        <td className="p-2 whitespace-nowrap hidden sm:table-cell text-deep-moss">
                          {doc.documentTypeName ||
                            doc.documentType ||
                            'Unknown'}
                        </td>
                        <td className="p-2 whitespace-nowrap hidden md:table-cell text-deep-moss">
                          {doc.ownerName || doc.ownerUid || 'Unknown User'}
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              doc.status === 'verified'
                                ? 'bg-green-100 text-green-800'
                                : doc.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {doc.status || 'pending'}
                          </span>
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setActiveTab('documents');
                                localStorage.setItem('viewDocumentId', doc.id);
                              }}
                              className="bg-soft-sage text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                              title="View Document"
                            >
                              <span className="flex items-center justify-center">
                                <Eye size={16} />
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="sm:hidden space-y-4">
                {documents.slice(0, 5).map((doc) => (
                  <div
                    key={`mobile-${doc.id}`}
                    className="bg-ivory p-4 border-2 border-deep-moss"
                  >
                    <h4 className="font-bold text-deep-moss text-lg mb-2">
                      {doc.documentName || doc.name || 'Unnamed Document'}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-xs text-gray-600">Type:</p>
                        <p className="text-sm text-deep-moss">
                          {doc.documentTypeName ||
                            doc.documentType ||
                            'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Status:</p>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            doc.status === 'verified'
                              ? 'bg-green-100 text-green-800'
                              : doc.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {doc.status || 'pending'}
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-600">Submitted By:</p>
                      <p className="text-sm text-deep-moss">
                        {doc.ownerName || doc.ownerUid || 'Unknown User'}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setActiveTab('documents');
                          localStorage.setItem('viewDocumentId', doc.id);
                        }}
                        className="bg-soft-sage text-deep-moss px-3 py-1.5 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center gap-1"
                      >
                        <Eye size={16} /> View
                      </button>
                    </div>
                  </div>
                ))}
                {documents.length > 5 && (
                  <div className="text-center mt-2">
                    <button
                      onClick={() => setActiveTab('documents')}
                      className="text-deep-moss underline text-sm"
                    >
                      View all {documents.length} documents
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-deep-moss font-medium">No documents found</p>
          )}
        </section>

        <div className={activeTab !== 'verification' ? 'hidden' : ''}>
          <VerificationQueue
            orgId={orgId}
            onVerificationStatusChange={fetchVerificationRequests}
          />
        </div>

        <div className={activeTab !== 'documents' ? 'hidden' : ''}>
          <DocumentReception
            orgId={orgId}
            onVerificationStatusChange={fetchVerificationRequests}
          />
        </div>
      </main>

      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
          duration={5000}
        />
      )}
    </div>
  );
}
