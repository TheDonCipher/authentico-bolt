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

        const response = await axios.get(
          '/api/organizations/application/status',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setVerificationStatus(response.data.status);
      } catch (err) {
        console.error('Error fetching verification status:', err);
      }
    };

    fetchVerificationStatus();
  }, [user]);

  // Function to fetch verification requests
  const fetchVerificationRequests = async () => {
    if (!orgId) return;

    try {
      setLoading(true);

      try {
        const requestsQuery = query(
          collection(db, 'verificationRequests'),
          where('verifyingOrgId', '==', orgId),
          orderBy('createdAt', 'desc')
        );

        const requestsSnapshot = await getDocs(requestsQuery);
        const requests = requestsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            documentId: data.documentId,
            documentName: data.documentName || 'Unnamed Document',
            documentType: data.documentType || 'Unknown Type',
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
            ownerId: data.ownerId,
            ownerName: data.ownerName || 'Unknown User',
            verifyingOrgId: data.verifyingOrgId,
          };
        });

        setVerificationRequests(requests);
        setError(null);
      } catch (firestoreError) {
        console.error(
          'Error accessing verificationRequests collection:',
          firestoreError
        );
        // Set empty array if there's a permissions error
        setVerificationRequests([]);

        // If this is a permissions error, we'll show a more user-friendly message
        if (firestoreError.toString().includes('permission')) {
          console.log(
            'Permission error accessing verificationRequests. Using empty array instead.'
          );
          setError(
            'Verification requests are not available at this time. Please try again later.'
          );
        } else {
          // Re-throw if it's not a permissions error
          throw firestoreError;
        }
      }
    } catch (err) {
      console.error('Error fetching verification requests:', err);
      setError('Failed to load verification requests');
      // Set empty array as fallback
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
            className={`mb-8 p-4 border-2 border-deep-moss ${
              verificationStatus === 'verified'
                ? 'bg-forest-green bg-opacity-10'
                : 'bg-burnt-sienna bg-opacity-10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {verificationStatus === 'verified' ? (
                  <Check className="mr-3 text-forest-green" size={24} />
                ) : verificationStatus === 'pending' ? (
                  <Clock className="mr-3 text-amber-500" size={24} />
                ) : (
                  <AlertTriangle className="mr-3 text-burnt-sienna" size={24} />
                )}
                <div>
                  <h2 className="font-bold text-lg text-deep-moss">
                    Organization Verification Status:{' '}
                    {verificationStatus.charAt(0).toUpperCase() +
                      verificationStatus.slice(1)}
                  </h2>
                  {verificationStatus !== 'verified' && (
                    <p className="text-sm text-deep-moss">
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
                  className="text-deep-moss underline text-sm"
                >
                  {showVerificationInfo ? 'Hide Info' : 'Show Info'}
                </button>
              ) : verificationStatus === 'not_verified' ? (
                <Link
                  href={`/org/${orgId}/dashboard`}
                  className="px-4 py-2 bg-forest-green text-ivory border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all text-sm"
                >
                  Apply for Verification
                </Link>
              ) : null}
            </div>

            {showVerificationInfo && verificationStatus === 'verified' && (
              <div className="mt-4 p-4 bg-ivory border-2 border-deep-moss">
                <p className="mb-2">
                  As a verified organization, you can verify documents submitted
                  by users. When a user selects your organization during
                  document upload, you'll receive a verification request.
                </p>
                <p>You can view and manage all verification requests below.</p>
              </div>
            )}
          </div>
        )}

        {/* Verification Requests */}
        <div className="bg-soft-sage border-2 border-deep-moss p-4 md:p-6">
          <h2 className="text-2xl font-bold text-deep-moss mb-4">
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
                    <th className="p-3 text-left">Document</th>
                    <th className="p-3 text-left">Submitted By</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verificationRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b-2 border-deep-moss hover:bg-ivory"
                    >
                      <td className="p-3">
                        <div className="font-bold">{request.documentName}</div>
                        <div className="text-sm text-gray-600">
                          {request.documentType}
                        </div>
                      </td>
                      <td className="p-3">{request.ownerName}</td>
                      <td className="p-3">
                        {request.createdAt.toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        {request.status === 'pending' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Pending
                          </span>
                        ) : request.status === 'verified' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {request.status === 'pending' ? (
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
                          <span className="text-sm text-gray-500">
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
