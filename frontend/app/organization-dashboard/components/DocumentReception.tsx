'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  X,
  Eye,
  Clock,
  Download,
  FileText,
  QrCode,
  Share2,
  AlertTriangle,
} from 'lucide-react';
import { db } from '../../../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  getDocs,
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';
import { getVerificationUrl } from '../../../lib/verification-util';
import {
  normalizeDocumentStatus,
  isDocumentVerified,
  isDocumentRejected,
  isDocumentPending,
} from '../../../lib/document-status-util';
import { Toast } from '../../components/ui/Toast';
import { NeubrutalistLoading } from '../../components/ui/NeubrutalistLoading';
import { useAuth } from '../../contexts/AuthContext';
import DocumentViewerModal from './DocumentViewerModal';
import { QRCodeSVG } from 'qrcode.react';

interface Document {
  id: string;
  documentName: string;
  documentType: string;
  documentTypeName: string;
  status: string;
  createdAt: Date;
  ownerName: string;
  ownerUid: string;
  ownerEmail?: string;
  email?: string;
}

interface DocumentReceptionProps {
  orgId?: string;
  onVerificationStatusChange?: () => void;
}

const DocumentReception: React.FC<DocumentReceptionProps> = ({
  orgId,
  onVerificationStatusChange,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showRevokeConfirmation, setShowRevokeConfirmation] = useState(false);
  const [documentToRevoke, setDocumentToRevoke] = useState<string | null>(null);
  const [revocationReason, setRevocationReason] = useState('');
  const [showQR, setShowQR] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || !user.uid) return;

    // Only load for verified organizations
    if (user.userType !== 'organization' || !user.isVerified) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Check if we have a document ID to view from localStorage
    const viewDocId =
      typeof window !== 'undefined'
        ? localStorage.getItem('viewDocumentId')
        : null;
    if (viewDocId) {
      // Clear it immediately to prevent it from being used again
      localStorage.removeItem('viewDocumentId');
      // Set the viewing document
      setViewingDocument(viewDocId);
    }

    // Query documents where this organization is the verifying organization
    const documentsRef = collection(db, 'documents');
    const q = query(
      documentsRef,
      where('verifyingOrgId', '==', orgId || user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log('Document data:', data);
          return {
            id: doc.id,
            documentName: data.documentName || 'Unnamed Document',
            documentType: data.documentType || 'unknown',
            documentTypeName: data.documentTypeName || 'Unknown Type',
            status: normalizeDocumentStatus(data.status || 'Unknown'), // Normalize status for consistency
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
            ownerName: data.ownerName || 'Unknown User',
            ownerUid: data.ownerUid || '',
            ownerEmail: data.ownerEmail || data.email || '',
          };
        });
        setDocuments(docs);
        setTotalPages(Math.ceil(docs.length / itemsPerPage));
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching documents:', error);
        setToastMessage({
          type: 'error',
          message: 'Failed to load documents. Please refresh the page.',
        });
        // Set empty documents array to avoid showing stale data
        setDocuments([]);
        setLoading(false);
      }
    );

    // Set up notification listener for new verification requests
    // Using a simpler query to avoid index requirements
    const notificationsRef = collection(db, 'notifications');
    const notificationQuery = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('read', '==', false)
      // Removed the title filter and orderBy to avoid index requirements
    );

    const notificationUnsubscribe = onSnapshot(
      notificationQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          // Show notification for new verification requests
          setToastMessage({
            type: 'success',
            message: 'New document verification request received',
          });
        }
      }
    );

    // Clean up listeners on unmount
    return () => {
      unsubscribe();
      notificationUnsubscribe();
    };
  }, [user, orgId]);

  const handleDownloadDocument = async (documentId: string) => {
    try {
      setIsLoading(true);
      const idToken = await getAuthToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // Fetch document details from API
      const response = await axios.get(
        `/api/documents/${documentId}/secure-details`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (response.data && response.data.decryptedFile) {
        // Create a download link and trigger it
        const link = document.createElement('a');
        link.href = `data:${
          response.data.mimeType || 'application/octet-stream'
        };base64,${response.data.decryptedFile}`;
        link.download = `${response.data.documentName || 'document'}.${
          (response.data.mimeType || 'application/octet-stream').split(
            '/'
          )[1] || 'file'
        }`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setToastMessage({
          type: 'success',
          message: 'Document download started',
        });
      } else {
        throw new Error('Invalid document data received from server');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      setToastMessage({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to download document',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDocument = async (
    documentId: string,
    action: 'Verified' | 'Rejected'
  ) => {
    try {
      setIsLoading(true);
      const idToken = await getAuthToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // Get rejection reason if rejecting
      let rejectionReason = '';
      if (action === 'Rejected') {
        rejectionReason =
          prompt('Please provide a reason for rejection:') || '';
        if (!rejectionReason) {
          setToastMessage({
            type: 'error',
            message: 'Rejection reason is required',
          });
          setIsLoading(false);
          return;
        }
      }

      // Get the document from Firestore first to ensure we have the latest data
      const db = getFirestore();
      const docRef = doc(db, 'documents', documentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }

      // Use our utility function to normalize status
      const normalizedStatus = action;

      console.log(
        `Updating document ${documentId} status to ${normalizedStatus}`
      );

      // Update the document status in Firestore directly
      await updateDoc(docRef, {
        status: normalizedStatus,
        ...(normalizedStatus === 'Verified'
          ? {
              verifiedAt: new Date(),
              verifiedBy: user?.uid,
            }
          : {
              rejectedAt: new Date(),
              rejectedBy: user?.uid,
              rejectionReason: rejectionReason,
            }),
      });

      // Call API to verify/reject document (for blockchain anchoring)
      const response = await axios.post(
        `/api/documents/${documentId}/verify`,
        {
          status: normalizedStatus,
          rejectionReason:
            normalizedStatus === 'Rejected' ? rejectionReason : '',
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      console.log('Blockchain verification response:', response.data);

      // Update local state to remove the document from the pending list
      // and update its status in the documents list
      setDocuments((prevDocuments) => {
        // First update the status of the document
        const updatedDocs = prevDocuments.map((doc) => {
          if (doc.id === documentId) {
            return {
              ...doc,
              status: normalizedStatus,
            };
          }
          return doc;
        });

        // If we're in a filtered view that only shows pending documents,
        // we should remove the document that was just verified/rejected
        if (onVerificationStatusChange) {
          return updatedDocs.filter(
            (doc) => doc.id !== documentId || isDocumentPending(doc.status)
          );
        }

        return updatedDocs;
      });

      // Close document viewer if open
      setViewingDocument(null);

      // Notify parent component that verification status has changed
      if (onVerificationStatusChange) {
        onVerificationStatusChange();
      }

      setToastMessage({
        type: 'success',
        message: `Document ${normalizedStatus} successfully`,
      });
    } catch (error) {
      console.error('Error verifying document:', error);
      setToastMessage({
        type: 'error',
        message: `Failed to ${action.toLowerCase()} document`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeVerification = async () => {
    if (!documentToRevoke) return;

    try {
      setIsLoading(true);
      const idToken = await getAuthToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      if (!revocationReason) {
        setToastMessage({
          type: 'error',
          message: 'Revocation reason is required',
        });
        setIsLoading(false);
        return;
      }

      // Call API to revoke document verification
      const response = await axios.post(
        `/api/documents/${documentToRevoke}/verify`,
        {
          status: 'revoked',
          rejectionReason: revocationReason,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      console.log('Blockchain revocation response:', response.data);

      // Update local state to reflect the revoked status
      setDocuments((prevDocuments) =>
        prevDocuments.map((doc) => {
          if (doc.id === documentToRevoke) {
            return {
              ...doc,
              status: 'revoked',
            };
          }
          return doc;
        })
      );

      // Close confirmation modal and reset states
      setShowRevokeConfirmation(false);
      setDocumentToRevoke(null);
      setRevocationReason('');

      // Notify parent component that verification status has changed
      if (onVerificationStatusChange) {
        onVerificationStatusChange();
      }

      setToastMessage({
        type: 'success',
        message: 'Document verification revoked successfully',
      });
    } catch (error) {
      console.error('Error revoking document verification:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to revoke document verification',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get current documents for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDocuments = documents.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Go to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getStatusBadge = (status: string) => {
    // Use our utility function to normalize status
    const normalizedStatus = normalizeDocumentStatus(status);

    switch (normalizedStatus) {
      case 'Verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
            <Check className="inline-block mr-1" size={12} />
            Verified
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
            <X className="inline-block mr-1" size={12} />
            Rejected
          </span>
        );
      case 'Revoked':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-400 text-gray-800 border border-gray-600">
            <AlertTriangle className="inline-block mr-1" size={12} />
            Revoked
          </span>
        );
      case 'Pending Verification':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
            <Clock className="inline-block mr-1" size={12} />
            Pending Verification
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
            <FileText className="inline-block mr-1" size={12} />
            {status || 'Unknown'}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
        <h2 className="text-2xl font-bold mb-6 text-deep-moss">
          Document Reception
        </h2>
        <div className="flex justify-center py-8">
          <NeubrutalistLoading
            message="Documents"
            subMessage="Loading your document reception..."
            showSeal={false}
          />
        </div>
      </div>
    );
  }

  if (!user?.isVerified) {
    return (
      <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
        <h2 className="text-2xl font-bold mb-4 text-deep-moss">
          Document Reception
        </h2>
        <div className="bg-ivory border-2 border-deep-moss p-4 mb-6">
          <p className="text-deep-moss">
            Your organization needs to be verified before you can receive
            documents for verification. Please complete the verification
            process.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
      <h2
        className="text-2xl font-bold mb-6 text-deep-moss"
        id="document-reception"
      >
        Document Reception
      </h2>

      {documents.length === 0 ? (
        <div className="bg-ivory p-6 border-2 border-deep-moss text-center">
          <FileText size={48} className="mx-auto mb-4 text-deep-moss" />
          <p className="text-lg font-bold text-deep-moss">
            No documents received yet
          </p>
          <p className="text-deep-moss">
            When users submit documents for your organization to verify, they
            will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full bg-ivory border-2 border-deep-moss">
            <thead>
              <tr className="bg-soft-sage">
                <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                  Document Name
                </th>
                <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                  Type
                </th>
                <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                  Submitted By
                </th>
                <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                  Date
                </th>
                <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                  Status
                </th>
                <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-deep-moss hover:bg-soft-sage hover:bg-opacity-30"
                >
                  <td className="p-3 text-deep-moss font-medium">
                    {doc.documentName}
                  </td>
                  <td className="p-3 text-deep-moss">{doc.documentTypeName}</td>
                  <td className="p-3 text-deep-moss">{doc.ownerName}</td>
                  <td className="p-3 text-deep-moss">
                    {formatDate(doc.createdAt)}
                  </td>
                  <td className="p-3">{getStatusBadge(doc.status)}</td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setViewingDocument(doc.id)}
                        className="bg-soft-sage text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                        title="View Document"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(doc.id)}
                        disabled={isLoading}
                        className="bg-soft-sage text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                        title="Download Document"
                      >
                        <Download size={16} />
                      </button>

                      <button
                        onClick={() => setShowQR(doc.id)}
                        disabled={isLoading}
                        className="bg-soft-sage text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                        title="QR Code"
                      >
                        <QrCode size={16} />
                      </button>

                      <button
                        onClick={() => {
                          const verificationUrl = getVerificationUrl(doc.id);
                          navigator.clipboard.writeText(verificationUrl).then(
                            () => {
                              setToastMessage({
                                type: 'success',
                                message:
                                  'Verification link copied to clipboard!',
                              });
                            },
                            () => {
                              setToastMessage({
                                type: 'error',
                                message: 'Failed to copy to clipboard',
                              });
                            }
                          );
                        }}
                        disabled={isLoading}
                        className="bg-soft-sage text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                        title="Share Verification Link"
                      >
                        <Share2 size={16} />
                      </button>
                      {doc.status === 'Pending Verification' && (
                        <>
                          <button
                            onClick={() =>
                              handleVerifyDocument(doc.id, 'Verified')
                            }
                            className="bg-forest-green text-ivory p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                            title="Verify Document"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleVerifyDocument(doc.id, 'Rejected')
                            }
                            className="bg-burnt-sienna bg-opacity-20 text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                            title="Reject Document"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      {doc.status === 'Verified' && (
                        <button
                          onClick={() => {
                            setDocumentToRevoke(doc.id);
                            setShowRevokeConfirmation(true);
                          }}
                          className="bg-burnt-sienna bg-opacity-20 text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                          title="Revoke Verification"
                        >
                          <X size={16} />
                        </button>
                      )}
                      {doc.status === 'Rejected' && (
                        <button
                          onClick={() =>
                            handleVerifyDocument(doc.id, 'Verified')
                          }
                          className="bg-forest-green text-ivory p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                          title="Approve Document"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 gap-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`px-3 py-1 border-2 border-deep-moss ${
                  currentPage === 1
                    ? 'bg-gray-200 cursor-not-allowed'
                    : 'bg-soft-sage hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)]'
                } transition-all`}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`px-3 py-1 border-2 border-deep-moss ${
                      currentPage === number
                        ? 'bg-forest-green text-white'
                        : 'bg-soft-sage'
                    } hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all`}
                  >
                    {number}
                  </button>
                )
              )}

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 border-2 border-deep-moss ${
                  currentPage === totalPages
                    ? 'bg-gray-200 cursor-not-allowed'
                    : 'bg-soft-sage hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)]'
                } transition-all`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <DocumentViewerModal
          documentId={viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 border-4 border-deep-moss max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-deep-moss">
                Verification QR Code
              </h3>
              <button
                onClick={() => setShowQR(null)}
                className="text-deep-moss hover:text-forest-green"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-soft-sage border-2 border-deep-moss">
              <QRCodeSVG
                value={getVerificationUrl(showQR)}
                size={200}
                bgColor={'#FFFFFF'}
                fgColor={'#1B4332'}
                level={'H'}
                includeMargin={true}
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-deep-moss mb-2">
                Scan this QR code to verify the document
              </p>
              <button
                onClick={() => {
                  const verificationUrl = getVerificationUrl(showQR);
                  navigator.clipboard.writeText(verificationUrl).then(
                    () => {
                      setToastMessage({
                        type: 'success',
                        message: 'Verification link copied to clipboard!',
                      });
                    },
                    () => {
                      setToastMessage({
                        type: 'error',
                        message: 'Failed to copy to clipboard',
                      });
                    }
                  );
                }}
                className="px-4 py-2 bg-forest-green text-white font-bold border-2 border-deep-moss hover:shadow-brutal-sm transition-all"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Verification Confirmation Dialog */}
      {showRevokeConfirmation && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-ivory p-6 border-4 border-deep-moss max-w-md w-full">
            <h3 className="text-xl font-bold text-deep-moss mb-4">
              Confirm Revocation
            </h3>
            <p className="text-deep-moss mb-6">
              Are you sure you want to revoke verification for this document?
              This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRevokeConfirmation(false);
                  setDocumentToRevoke(null);
                }}
                className="bg-soft-sage px-4 py-2 text-deep-moss font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (documentToRevoke) {
                    handleVerifyDocument(documentToRevoke, 'Rejected');
                    setShowRevokeConfirmation(false);
                    setDocumentToRevoke(null);
                  }
                }}
                className="bg-burnt-sienna px-4 py-2 text-white font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
              >
                Revoke Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast
            type={toastMessage.type}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
            duration={5000}
          />
        </div>
      )}
    </div>
  );
};

export default DocumentReception;
