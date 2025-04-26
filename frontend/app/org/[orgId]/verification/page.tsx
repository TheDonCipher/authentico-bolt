'use client';

import DocumentVerification from '../../../organization-dashboard/components/DocumentVerification';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getAuthToken } from '../../../../lib/token-util';
import axios from 'axios';
import { Check, X, AlertTriangle, FileText, Clock } from 'lucide-react';
import {
  normalizeDocumentStatus,
  isDocumentPending,
} from '../../../../lib/document-status-util';
import Link from 'next/link';
import { Toast } from '../../../components/ui/Toast';

interface VerificationRequest {
  id: string;
  documentId: string;
  documentName: string;
  documentType: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt?: Date;
  ownerId: string;
  ownerName: string;
  verifyingOrgId: string;
}

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function VerificationPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const { user } = useAuth();

  const [verificationRequests, setVerificationRequests] = useState<
    VerificationRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(
    null
  );
  const [showVerificationInfo, setShowVerificationInfo] = useState(false);

  // Fetch verification status
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      if (!user || user.userType !== 'organization') return;

      try {
        const token = await getAuthToken();
        if (!token) return;

        console.log('Fetching organization verification status...');
        const response = await axios.get(
          '/api/organizations/application/status',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log('Verification status response:', response.data);
        setVerificationStatus(response.data.status);

        // If status is not set or undefined, set a default
        if (!response.data.status) {
          console.log(
            'No status found in response, defaulting to not_verified'
          );
          setVerificationStatus('not_verified');
        }
      } catch (err) {
        console.error('Error fetching verification status:', err);
        // Set a default status in case of error
        setVerificationStatus('not_verified');
      }
    };

    fetchVerificationStatus();
  }, [user]);

  // Function to fetch verification requests
  const fetchVerificationRequests = async () => {
    if (!orgId) return;

    try {
      setLoading(true);
      console.log(`Fetching verification requests for organization: ${orgId}`);

      // First try the verificationRequests collection
      try {
        // Use a simpler query that doesn't require a composite index
        const requestsQuery = query(
          collection(db, 'verificationRequests'),
          where('verifyingOrgId', '==', orgId)
        );

        const requestsSnapshot = await getDocs(requestsQuery);
        console.log(
          `Found ${requestsSnapshot.docs.length} verification requests in verificationRequests collection`
        );

        if (!requestsSnapshot.empty) {
          const requests = requestsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              documentId: data.documentId,
              documentName: data.documentName || 'Unnamed Document',
              documentType: data.documentType || 'Unknown Type',
              status: normalizeDocumentStatus(data.status || 'pending'),
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate(),
              ownerId: data.ownerId,
              ownerName: data.ownerName || 'Unknown User',
              verifyingOrgId: data.verifyingOrgId,
            };
          });

          // Sort manually by createdAt in descending order (newest first)
          const sortedRequests = [...requests].sort((a, b) => {
            return b.createdAt.getTime() - a.createdAt.getTime();
          });

          // Ensure the status is one of the allowed values
          const typedRequests = sortedRequests.map((req) => ({
            ...req,
            status: req.status as 'pending' | 'verified' | 'rejected',
          }));

          setVerificationRequests(typedRequests);
          setError(null);
          setLoading(false);
          return; // Exit early if we found requests
        }
      } catch (verificationRequestsError) {
        console.error(
          'Error accessing verificationRequests collection:',
          verificationRequestsError
        );
        // Continue to try the documents collection
      }

      // If we get here, try the documents collection as a fallback
      try {
        console.log(
          'Checking documents collection for pending verification requests'
        );

        // First try with 'in' operator if supported
        try {
          const documentsQuery = query(
            collection(db, 'documents'),
            where('verifyingOrgId', '==', orgId),
            where('status', 'in', [
              'pending',
              'Pending',
              'pending verification',
              'Pending Verification',
            ])
          );

          const documentsSnapshot = await getDocs(documentsQuery);
          console.log(
            `Found ${documentsSnapshot.docs.length} pending documents in documents collection using 'in' operator`
          );

          if (!documentsSnapshot.empty) {
            const pendingDocs = documentsSnapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                documentId: doc.id,
                documentName:
                  data.documentName || data.name || 'Unnamed Document',
                documentType:
                  data.documentType || data.documentTypeName || 'Unknown Type',
                status: normalizeDocumentStatus('pending'),
                createdAt:
                  data.createdAt?.toDate() ||
                  data.uploadedAt?.toDate() ||
                  new Date(),
                updatedAt: data.updatedAt?.toDate(),
                ownerId: data.uploadedBy || data.ownerUid || '',
                ownerName: data.ownerName || 'Document Owner',
                verifyingOrgId: data.verifyingOrgId,
              };
            });

            // Sort by date
            const sortedDocs = [...pendingDocs].sort((a, b) => {
              return b.createdAt.getTime() - a.createdAt.getTime();
            });

            // Ensure the status is one of the allowed values
            const typedDocs = sortedDocs.map((doc) => ({
              ...doc,
              status: doc.status as 'pending' | 'verified' | 'rejected',
            }));
            setVerificationRequests(typedDocs);
            setError(null);
            setLoading(false);
            return;
          }
        } catch (inOperatorError) {
          console.error(
            'Error using in operator, falling back to simpler query:',
            inOperatorError
          );
        }

        // If 'in' operator failed or returned no results, try with just the orgId
        const documentsQuery = query(
          collection(db, 'documents'),
          where('verifyingOrgId', '==', orgId)
        );

        const documentsSnapshot = await getDocs(documentsQuery);
        console.log(
          `Found ${documentsSnapshot.docs.length} total documents in documents collection`
        );

        if (!documentsSnapshot.empty) {
          // Filter for pending documents in memory using our utility function
          const pendingDocs = documentsSnapshot.docs
            .filter((doc) => {
              const data = doc.data();
              const status = data.status || '';
              // Use our utility function to check if document is pending verification
              return isDocumentPending(status);
            })
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                documentId: doc.id,
                documentName:
                  data.documentName || data.name || 'Unnamed Document',
                documentType:
                  data.documentType || data.documentTypeName || 'Unknown Type',
                status: normalizeDocumentStatus('pending'),
                createdAt:
                  data.createdAt?.toDate() ||
                  data.uploadedAt?.toDate() ||
                  new Date(),
                updatedAt: data.updatedAt?.toDate(),
                ownerId: data.uploadedBy || data.ownerUid || '',
                ownerName: data.ownerName || 'Document Owner',
                verifyingOrgId: data.verifyingOrgId,
              };
            });

          console.log(`Filtered to ${pendingDocs.length} pending documents`);

          // Sort by date
          const sortedDocs = [...pendingDocs].sort((a, b) => {
            return b.createdAt.getTime() - a.createdAt.getTime();
          });

          // Ensure the status is one of the allowed values
          const typedDocs = sortedDocs.map((doc) => ({
            ...doc,
            status: doc.status as 'pending' | 'verified' | 'rejected',
          }));
          setVerificationRequests(typedDocs);
          setError(null);
          setLoading(false);
          return;
        }
      } catch (documentsError) {
        console.error('Error accessing documents collection:', documentsError);
      }

      // If we get here, we didn't find any verification requests
      console.log('No verification requests found in either collection');
      setVerificationRequests([]);
      setError(null);
    } catch (err) {
      console.error('Error fetching verification requests:', err);
      setError('Failed to load verification requests');
      setVerificationRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch verification requests on component mount
  useEffect(() => {
    fetchVerificationRequests();
  }, [orgId]);

  const handleVerifyDocument = async (
    requestId: string,
    documentId: string,
    action: 'verified' | 'rejected'
  ) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setToastMessage({
          type: 'error',
          message: 'Authentication required',
        });
        return;
      }

      // Get rejection reason if rejecting
      let rejectionReason = '';
      if (action === 'rejected') {
        rejectionReason =
          prompt('Please provide a reason for rejection:') || '';
        if (!rejectionReason) {
          setToastMessage({
            type: 'error',
            message: 'Rejection reason is required',
          });
          return;
        }
      }

      // Call API to verify/reject document
      await axios.post(
        `/api/documents/${documentId}/verify`,
        {
          status: action === 'verified' ? 'Verified' : 'Rejected',
          rejectionReason: action === 'rejected' ? rejectionReason : '',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setVerificationRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                status: action,
                updatedAt: new Date(),
              }
            : req
        )
      );

      setToastMessage({
        type: 'success',
        message: `Document ${
          action === 'verified' ? 'verified' : 'rejected'
        } successfully`,
      });
    } catch (err) {
      console.error(`Error ${action} document:`, err);
      setToastMessage({
        type: 'error',
        message: `Failed to ${action} document`,
      });
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-deep-moss pb-4 mb-6 md:mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-deep-moss">
            Verification
          </h1>
        </div>

        {/* Verification Status Banner */}
        {verificationStatus && (
          <div
            className={`mb-8 p-6 border-4 border-deep-moss shadow-brutal ${
              verificationStatus === 'verified'
                ? 'bg-forest-green bg-opacity-20'
                : verificationStatus === 'pending'
                ? 'bg-amber-100'
                : 'bg-burnt-sienna bg-opacity-20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {verificationStatus === 'verified' ? (
                  <Check className="mr-4 text-forest-green" size={32} />
                ) : verificationStatus === 'pending' ? (
                  <Clock className="mr-4 text-amber-700" size={32} />
                ) : (
                  <AlertTriangle className="mr-4 text-burnt-sienna" size={32} />
                )}
                <div>
                  <h2 className="font-bold text-xl text-deep-moss mb-2">
                    Organization Verification Status:{' '}
                    <span className="font-black">
                      {verificationStatus.charAt(0).toUpperCase() +
                        verificationStatus.slice(1)}
                    </span>
                  </h2>
                  {verificationStatus !== 'verified' && (
                    <p className="text-base text-deep-moss font-medium">
                      {verificationStatus === 'pending'
                        ? 'Your verification application is being reviewed. You will be notified when it is approved or rejected.'
                        : verificationStatus === 'rejected'
                        ? 'Your verification application was rejected. Please apply again with updated information.'
                        : 'Your organization needs to be verified to verify documents. Please apply for verification.'}
                    </p>
                  )}
                </div>
              </div>

              {verificationStatus === 'verified' ? (
                <button
                  onClick={() => setShowVerificationInfo(!showVerificationInfo)}
                  className="px-4 py-2 bg-deep-moss text-ivory font-bold border-2 border-forest-green hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                >
                  {showVerificationInfo ? 'Hide Info' : 'Show Info'}
                </button>
              ) : verificationStatus === 'not_verified' ? (
                <Link
                  href={`/org/${orgId}/dashboard`}
                  className="px-4 py-2 bg-forest-green text-ivory font-bold border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                >
                  Apply for Verification
                </Link>
              ) : null}
            </div>

            {showVerificationInfo && verificationStatus === 'verified' && (
              <div className="mt-6 p-6 bg-ivory border-4 border-deep-moss shadow-brutal">
                <h3 className="text-xl font-bold text-deep-moss mb-3">
                  Verification Information
                </h3>
                <p className="mb-3 text-deep-moss font-medium text-base">
                  As a verified organization, you can verify documents submitted
                  by users. When a user selects your organization during
                  document upload, you'll receive a verification request.
                </p>
                <p className="text-deep-moss font-medium text-base">
                  You can view and manage all verification requests below.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Verification Requests */}
        <div className="bg-soft-sage border-4 border-deep-moss p-6 md:p-8 shadow-brutal">
          <h2 className="text-3xl font-black text-deep-moss mb-6">
            Verification Requests
          </h2>

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full border-solid border-4 border-forest-green border-t-transparent h-10 w-10 mb-4"></div>
            </div>
          ) : error ? (
            <div className="bg-burnt-sienna bg-opacity-20 p-4 border-2 border-deep-moss">
              <p className="text-deep-moss">{error}</p>
            </div>
          ) : verificationRequests.length === 0 ? (
            <div className="bg-ivory p-6 border-2 border-deep-moss text-center">
              <FileText
                size={48}
                className="mx-auto mb-4 text-deep-moss opacity-50"
              />
              <h3 className="text-xl font-bold text-deep-moss mb-2">
                No Verification Requests
              </h3>
              <p className="text-deep-moss">
                You don't have any document verification requests at the moment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-deep-moss text-ivory">
                    <th className="p-3 text-left font-bold text-base">
                      Document
                    </th>
                    <th className="p-3 text-left font-bold text-base">
                      Submitted By
                    </th>
                    <th className="p-3 text-left font-bold text-base">Date</th>
                    <th className="p-3 text-left font-bold text-base">
                      Status
                    </th>
                    <th className="p-3 text-left font-bold text-base">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {verificationRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b-2 border-deep-moss hover:bg-ivory"
                    >
                      <td className="p-3">
                        <div className="font-bold text-deep-moss">
                          {request.documentName}
                        </div>
                        <div className="text-sm text-deep-moss">
                          {request.documentType}
                        </div>
                      </td>
                      <td className="p-3 text-deep-moss font-medium">
                        {request.ownerName}
                      </td>
                      <td className="p-3 text-deep-moss">
                        {request.createdAt.toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        {(() => {
                          const normalizedStatus = normalizeDocumentStatus(
                            request.status
                          );

                          switch (normalizedStatus) {
                            case 'Pending Verification':
                              return (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-800">
                                  <Clock
                                    className="inline-block mr-1"
                                    size={12}
                                  />
                                  Pending Verification
                                </span>
                              );
                            case 'Verified':
                              return (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-800">
                                  <Check
                                    className="inline-block mr-1"
                                    size={12}
                                  />
                                  Verified
                                </span>
                              );
                            case 'Rejected':
                              return (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-800">
                                  <X className="inline-block mr-1" size={12} />
                                  Rejected
                                </span>
                              );
                            default:
                              return (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-800">
                                  <Clock
                                    className="inline-block mr-1"
                                    size={12}
                                  />
                                  Pending Verification
                                </span>
                              );
                          }
                        })()}
                      </td>
                      <td className="p-3">
                        {isDocumentPending(request.status) ? (
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
                        ) : (
                          <span className="text-sm text-deep-moss">
                            {request.updatedAt
                              ? `Updated ${request.updatedAt.toLocaleDateString()}`
                              : 'No update date'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast
            type={toastMessage.type}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
          />
        </div>
      )}
    </div>
  );
}
