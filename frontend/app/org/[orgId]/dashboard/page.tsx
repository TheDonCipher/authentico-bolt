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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import DocumentReception from '../../../organization-dashboard/components/DocumentReception';
import DocumentVerification from '../../../organization-dashboard/components/DocumentVerification';

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

  const orgId = params.orgId as string;

  // Fetch organization data
  useEffect(() => {
    const fetchOrgData = async () => {
      if (!orgId) return;

      try {
        const orgDoc = await getDocs(
          query(collection(db, 'users'), where('__name__', '==', orgId))
        );

        if (!orgDoc.empty) {
          setOrgData(orgDoc.docs[0].data());
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
      // First check if the verificationRequests collection exists and is accessible
      try {
        const requestsQuery = query(
          collection(db, 'verificationRequests'),
          where('verifyingOrgId', '==', orgId),
          where('status', '==', 'pending')
        );

        const requestsSnapshot = await getDocs(requestsQuery);
        const requests = requestsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setVerificationRequests(requests);
      } catch (firestoreError) {
        console.error(
          'Error accessing verificationRequests collection:',
          firestoreError
        );
        // Set empty array if there's a permissions error
        setVerificationRequests([]);

        // If this is a permissions error, we'll just show 0 pending requests
        // The user will still be able to use the dashboard
        if (firestoreError.toString().includes('permission')) {
          console.log(
            'Permission error accessing verificationRequests. Using empty array instead.'
          );
        } else {
          // Re-throw if it's not a permissions error
          throw firestoreError;
        }
      }
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      // Set empty array as fallback
      setVerificationRequests([]);
    }
  };

  // Fetch verification requests on component mount
  useEffect(() => {
    fetchVerificationRequests();
  }, [orgId]);

  // Check if user has access to this organization
  useEffect(() => {
    if (!authLoading && !isLoadingOrgs && user) {
      if (!hasOrgAccess(orgId)) {
        router.push('/unauthorized');
      }
    }
  }, [authLoading, isLoadingOrgs, user, hasOrgAccess, orgId, router]);

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

  // Organization data display
  const orgName =
    orgData?.organizationName ||
    orgData?.name ||
    userOrganizations.find((org) => org.orgId === orgId)?.orgName ||
    'Organization';
  // Organization data is already displayed in the header
  const contactEmail =
    orgData?.contactEmail || orgData?.email || 'No email provided';

  return (
    <div className="min-h-screen bg-ivory w-full">
      <header className="bg-soft-sage p-4 border-b-4 border-deep-moss sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-black text-deep-moss mr-4">
              {orgName}
            </h1>
            <ContextSwitcher />
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell count={0} onClick={() => {}} />
            <ProfileCard />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 pb-20 md:pb-8">
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
                  <p className="text-sm font-bold text-gray-500">
                    Organization Name
                  </p>
                  <p className="text-deep-moss">{orgName}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500">
                    Contact Email
                  </p>
                  <p className="text-deep-moss">{contactEmail}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center mt-4 md:mt-0">
              <div className="bg-ivory p-4 border-2 border-deep-moss rounded-md">
                <p className="text-sm font-bold text-deep-moss mb-1">
                  Organization ID
                </p>
                <p className="text-xs font-mono text-gray-600">{orgId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Verification Status Section */}
        <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal mb-8">
          <h3 className="text-2xl font-bold mb-4 text-deep-moss">
            Organization Verification Status
          </h3>
          {orgData?.status === 'verified' ? (
            <>
              <div className="flex flex-col md:flex-row items-start md:items-center mb-4">
                <div className="bg-forest-green text-ivory p-3 border-2 border-deep-moss mr-4 mb-4 md:mb-0 transform -rotate-3 shadow-brutal">
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="font-black text-lg">VERIFIED</span>
                  </div>
                </div>
                <div>
                  <p className="text-deep-moss">
                    Your organization has been verified and can now verify
                    documents on the Authentico platform. When users select your
                    organization during document upload, you&apos;ll receive a
                    verification request.
                  </p>
                </div>
              </div>
              <div className="bg-ivory p-4 border-2 border-deep-moss rounded-md">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <p className="font-bold text-deep-moss">
                      Pending Verification Requests
                    </p>
                    <p className="text-3xl font-black text-forest-green">
                      {verificationRequests.length}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('verification')}
                    className="bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                  >
                    View Requests
                  </button>
                </div>
              </div>
            </>
          ) : orgData?.status === 'pending' ? (
            <div className="bg-yellow-50 border-2 border-yellow-200 p-4 mb-4">
              <div className="flex items-center mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="font-bold text-yellow-800">
                  Application Under Review
                </h3>
              </div>
              <p className="text-yellow-800 mb-2">
                Your application is currently being reviewed by our team.
                We&apos;ll notify you once a decision has been made.
              </p>
              <p className="text-sm text-yellow-700">
                Submitted on:{' '}
                {orgData?.submittedAt
                  ? new Date(orgData.submittedAt).toLocaleDateString()
                  : 'Unknown'}
              </p>
            </div>
          ) : orgData?.status === 'rejected' ? (
            <div className="bg-red-50 border-2 border-red-200 p-4 mb-4">
              <div className="flex items-center mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <h3 className="font-bold text-red-800">Application Rejected</h3>
              </div>
              <p className="text-red-800 mb-2">
                Unfortunately, your application has been rejected.
              </p>
              {orgData?.notes && (
                <div className="mb-2">
                  <h4 className="font-bold text-red-800">Reason:</h4>
                  <p className="text-red-800">{orgData.notes}</p>
                </div>
              )}
              <button
                onClick={() => router.push('/apply/organization')}
                className="mt-4 bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
              >
                Submit New Application
              </button>
            </div>
          ) : (
            <>
              <p className="mb-4 text-deep-moss">
                Your organization is not verified yet. Verified organizations
                can verify documents submitted by users. Apply for verification
                to unlock this feature.
              </p>
              <div className="bg-ivory p-4 border-2 border-deep-moss rounded-md">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <p className="font-bold text-deep-moss">
                      Verification Status
                    </p>
                    <p className="text-xl font-bold text-amber-500">
                      Not Verified
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/apply/organization')}
                    className="bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                  >
                    Apply for Verification
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-deep-moss pb-4 mb-6 md:mb-8 gap-4">
            <h2 className="text-3xl md:text-4xl font-black text-deep-moss">
              Organization Dashboard
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 font-bold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                    : 'hover:bg-soft-sage hover:border-2 hover:border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`px-4 py-2 font-bold transition-all ${
                  activeTab === 'verification'
                    ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                    : 'hover:bg-soft-sage hover:border-2 hover:border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                Verification Queue
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 font-bold transition-all ${
                  activeTab === 'documents'
                    ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                    : 'hover:bg-soft-sage hover:border-2 hover:border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                Document Reception
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'dashboard' ? (
          <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
            <h3 className="text-2xl font-bold mb-4 text-deep-moss">
              Recent Documents
            </h3>
            {documents.length > 0 ? (
              <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                <table className="w-full border-collapse text-sm md:text-base">
                  <thead>
                    <tr className="bg-deep-moss text-ivory">
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
                        <td className="p-2 whitespace-nowrap">
                          {doc.name || 'Unnamed Document'}
                        </td>
                        <td className="p-2 whitespace-nowrap hidden sm:table-cell">
                          {doc.documentType || 'Unknown'}
                        </td>
                        <td className="p-2 whitespace-nowrap hidden md:table-cell">
                          {doc.ownerName || doc.ownerUid}
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
                          <button className="text-forest-green hover:text-deep-moss">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No documents found</p>
            )}
          </section>
        ) : activeTab === 'verification' ? (
          <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
            <h3 className="text-2xl font-bold mb-4 text-deep-moss">
              Verification Requests
            </h3>
            {verificationRequests.length > 0 ? (
              <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
                <table className="w-full border-collapse text-sm md:text-base">
                  <thead>
                    <tr className="bg-deep-moss text-ivory">
                      <th className="p-2 text-left">Document</th>
                      <th className="p-2 text-left hidden sm:table-cell">
                        Requested By
                      </th>
                      <th className="p-2 text-left hidden md:table-cell">
                        Date
                      </th>
                      <th className="p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationRequests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-b border-deep-moss"
                      >
                        <td className="p-2 whitespace-nowrap">
                          {request.documentName || 'Unnamed Document'}
                        </td>
                        <td className="p-2 whitespace-nowrap hidden sm:table-cell">
                          {request.requesterName || request.requesterId}
                        </td>
                        <td className="p-2 whitespace-nowrap hidden md:table-cell">
                          {request.createdAt
                            ? new Date(request.createdAt).toLocaleDateString()
                            : 'Unknown'}
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          <DocumentVerification
                            request={request}
                            onVerificationComplete={() => {
                              // Refresh verification requests
                              fetchVerificationRequests();
                              // Show success toast
                              setToastMessage({
                                type: 'success',
                                message:
                                  'Document verification status updated successfully',
                              });
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No pending verification requests
              </p>
            )}
          </section>
        ) : (
          <DocumentReception />
        )}
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
