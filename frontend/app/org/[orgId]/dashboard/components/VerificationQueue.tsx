'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Clock, Download, AlertTriangle } from 'lucide-react';
import { db } from '../../../../../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import axios from 'axios';
import { getAuthToken } from '../../../../../lib/token-util';
import { Toast } from '../../../../components/ui/Toast';
import { Loader } from '../../../../components/ui/Loader';
import DocumentViewerModal from './DocumentViewerModal';

interface Document {
  id: string;
  documentName: string;
  documentType: string;
  ownerUid: string;
  ownerName?: string;
  ownerEmail?: string;
  email?: string;
  requesterName?: string;
  requesterId?: string;
  createdAt: any;
  submittedAt?: any;
  status: string;
  metadataHash?: string;
  originalDocHash?: string;
  verifyingOrgId: string;
  publicAddress?: string;
  name?: string;
  documentTypeName?: string;
  source?: string; // 'documents' or 'requests'
}

interface VerificationQueueProps {
  orgId: string;
  onVerificationStatusChange?: () => void;
}

const VerificationQueue = ({
  orgId,
  onVerificationStatusChange,
}: VerificationQueueProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  const [processingDoc, setProcessingDoc] = useState<{
    id: string;
    action: 'Verified' | 'Rejected';
  } | null>(null);
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({});

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';

    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleDateString();
    }

    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }

    try {
      return new Date(timestamp).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Set up real-time listener for pending documents
  useEffect(() => {
    if (!orgId) return;

    setLoading(true);

    // Set up real-time listener for documents
    // Use a simpler query that doesn't require a composite index
    const documentsRef = collection(db, 'documents');
    const q = query(documentsRef, where('verifyingOrgId', '==', orgId));

    // Also set up a listener for verification requests
    const requestsRef = collection(db, 'verificationRequests');
    const requestsQuery = query(
      requestsRef,
      where('verifyingOrgId', '==', orgId)
    );

    // Create a combined unsubscribe function
    let unsubscribeDocuments: () => void;
    let unsubscribeRequests: () => void;

    // Function to process documents
    const processDocuments = async (snapshot: any, source: string) => {
      const fetchedDocuments: Document[] = [];
      const ownerIds = new Set<string>();

      // Filter for pending documents in memory
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        const status = data.status?.toLowerCase?.() || '';

        console.log(`Document ${doc.id} has status: ${status}`);

        // Check for any status that indicates pending verification
        // Explicitly exclude verified and rejected documents
        if (
          (status === 'pending verification' ||
            status === 'pending' ||
            status === 'awaiting verification' ||
            status === 'submitted') &&
          status !== 'verified' &&
          status !== 'rejected'
        ) {
          console.log(`Processing ${source} document:`, data);
          fetchedDocuments.push({
            id: doc.id,
            documentName: data.documentName || data.name || 'Unnamed Document',
            documentType:
              data.documentType || data.documentTypeName || 'Unknown',
            ownerUid: data.ownerUid || data.requesterId || '',
            ownerName: data.ownerName || data.requesterName || '',
            ownerEmail: data.ownerEmail || data.email || '',
            createdAt: data.createdAt || data.submittedAt || new Date(),
            status: data.status || 'Pending Verification',
            metadataHash: data.metadataHash || data.originalDocHash || '',
            verifyingOrgId: data.verifyingOrgId || '',
            publicAddress: data.publicAddress || '',
            source: source, // Track where this document came from
          });

          if (data.ownerUid) {
            ownerIds.add(data.ownerUid);
          } else if (data.requesterId) {
            ownerIds.add(data.requesterId);
          }
        }
      });

      return { fetchedDocuments, ownerIds };
    };

    // Set up the documents listener
    unsubscribeDocuments = onSnapshot(
      q,
      async (snapshot) => {
        try {
          // Process documents from the documents collection
          const { fetchedDocuments, ownerIds } = await processDocuments(
            snapshot,
            'documents'
          );

          // Get verification requests as well
          const requestsSnapshot = await getDocs(requestsQuery);
          const {
            fetchedDocuments: requestDocuments,
            ownerIds: requestOwnerIds,
          } = await processDocuments(requestsSnapshot, 'requests');

          // Combine the results
          const allDocuments = [...fetchedDocuments, ...requestDocuments];
          const allOwnerIds = new Set([...ownerIds, ...requestOwnerIds]);

          // Remove duplicates (if a document appears in both collections)
          const uniqueDocuments = allDocuments.filter(
            (doc, index, self) =>
              index === self.findIndex((d) => d.id === doc.id)
          );

          // Sort by createdAt in descending order (newest first)
          uniqueDocuments.sort((a, b) => {
            const dateA =
              a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB =
              b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });

          setDocuments(uniqueDocuments);

          // Fetch owner names
          if (allOwnerIds.size > 0) {
            const names: Record<string, string> = {};

            for (const ownerId of allOwnerIds) {
              try {
                const userDoc = await getDocs(
                  query(
                    collection(db, 'users'),
                    where('__name__', '==', ownerId)
                  )
                );

                if (!userDoc.empty) {
                  const userData = userDoc.docs[0].data();
                  names[ownerId] =
                    userData.name || userData.displayName || 'Unknown User';
                }
              } catch (error) {
                console.error(`Error fetching user ${ownerId}:`, error);
              }
            }

            setOwnerNames(names);
          }

          setLoading(false);
        } catch (error) {
          console.error('Error processing documents:', error);
          setToastMessage({
            type: 'error',
            message: 'Failed to load verification queue. Please try again.',
          });
          setDocuments([]);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error in document listener:', error);
        setToastMessage({
          type: 'error',
          message:
            'Failed to load verification queue. Please refresh the page.',
        });
        setDocuments([]);
        setLoading(false);
      }
    );

    // Set up a listener for verification requests to catch real-time updates
    unsubscribeRequests = onSnapshot(
      requestsQuery,
      async (snapshot) => {
        // When verification requests change, process them and update the UI
        console.log('Verification requests updated, refreshing data...');
        try {
          // Process documents from the documents collection
          const docsSnapshot = await getDocs(q);
          const { fetchedDocuments, ownerIds } = await processDocuments(
            docsSnapshot,
            'documents'
          );

          // Process verification requests
          const {
            fetchedDocuments: requestDocuments,
            ownerIds: requestOwnerIds,
          } = await processDocuments(snapshot, 'requests');

          // Combine the results
          const allDocuments = [...fetchedDocuments, ...requestDocuments];
          const allOwnerIds = new Set([...ownerIds, ...requestOwnerIds]);

          // Remove duplicates
          const uniqueDocuments = allDocuments.filter(
            (doc, index, self) =>
              index === self.findIndex((d) => d.id === doc.id)
          );

          // Sort by createdAt in descending order (newest first)
          uniqueDocuments.sort((a, b) => {
            const dateA =
              a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB =
              b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });

          setDocuments(uniqueDocuments);
        } catch (error) {
          console.error('Error refreshing verification requests:', error);
        }
      },
      (error) => {
        console.error('Error in verification requests listener:', error);
      }
    );

    return () => {
      unsubscribeDocuments();
      if (unsubscribeRequests) unsubscribeRequests();
    };
  }, [orgId]);

  const viewDocument = (docId: string) => {
    setViewingDoc(docId);
  };

  const downloadDocument = async (docId: string) => {
    try {
      const idToken = await getAuthToken();

      if (!idToken) {
        throw new Error('Not authenticated');
      }

      const response = await axios.get(
        `/api/documents/${docId}/secure-details`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (response.data && response.data.decryptedFile) {
        // Create a download link
        const link = document.createElement('a');
        const mimeType = response.data.mimeType || 'application/octet-stream';
        const fileName = response.data.documentName || 'document';

        link.href = `data:${mimeType};base64,${response.data.decryptedFile}`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setToastMessage({
          type: 'success',
          message: 'Document download started',
        });
      } else {
        throw new Error('Invalid document data received');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to download document',
      });
    }
  };

  const verifyDocument = async (
    docId: string,
    status: 'Verified' | 'Rejected'
  ) => {
    try {
      // Set processing state
      setProcessingDoc({
        id: docId,
        action: status,
      });

      // Show processing toast
      setToastMessage({
        type: 'info',
        message: `Processing document ${
          status === 'Verified' ? 'verification' : 'rejection'
        }...`,
      });

      const idToken = await getAuthToken();

      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // If rejecting, ensure there's a reason
      if (status === 'Rejected' && !rejectionReason) {
        setToastMessage({
          type: 'error',
          message: 'Please provide a reason for rejection',
        });
        setProcessingDoc(null);
        return;
      }

      // First update the document in Firestore
      const docRef = doc(db, 'documents', docId);

      // Normalize status to lowercase for consistency
      const normalizedStatus = status === 'Verified' ? 'verified' : 'rejected';

      console.log(`Updating document ${docId} status to ${normalizedStatus}`);

      // Update the document status in Firestore directly
      await updateDoc(docRef, {
        status: normalizedStatus,
        ...(normalizedStatus === 'verified'
          ? {
              verifiedAt: new Date(),
              verifiedBy: orgId,
            }
          : {
              rejectedAt: new Date(),
              rejectedBy: orgId,
              rejectionReason: rejectionReason,
            }),
      });

      // Make the API call for blockchain anchoring
      const response = await axios.post(
        `/api/documents/${docId}/verify`,
        {
          status: normalizedStatus,
          rejectionReason: status === 'Rejected' ? rejectionReason : '',
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      console.log('Blockchain verification response:', response.data);

      // Update local state to remove the document from the list
      setDocuments((prevDocuments) =>
        prevDocuments.filter((doc) => doc.id !== docId)
      );

      // Notify parent component that verification status has changed
      if (onVerificationStatusChange) {
        onVerificationStatusChange();
      }

      // Show success message
      setToastMessage({
        type: 'success',
        message: `Document ${
          status === 'Verified' ? 'verified' : 'rejected'
        } successfully`,
      });

      // Reset states
      setSelectedDoc(null);
      setRejectionReason('');
      setViewingDoc(null); // Close document viewer if open
    } catch (error) {
      console.error(
        `Error ${status === 'Verified' ? 'verifying' : 'rejecting'} document:`,
        error
      );
      setToastMessage({
        type: 'error',
        message: `Failed to ${
          status === 'Verified' ? 'verify' : 'reject'
        } document. Please try again.`,
      });
    } finally {
      setProcessingDoc(null);
    }
  };

  if (viewingDoc) {
    return (
      <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-deep-moss">
            Document Viewer
          </h2>
          <button
            onClick={() => setViewingDoc(null)}
            className="bg-burnt-sienna bg-opacity-20 text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
          >
            Back to Queue
          </button>
        </div>

        <DocumentViewerModal
          documentId={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button
            onClick={() => verifyDocument(viewingDoc, 'Verified')}
            className="flex-1 bg-forest-green text-ivory px-4 py-3 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
            disabled={!!processingDoc}
          >
            <span className="inline-flex items-center">
              <Check className="mr-2" size={18} />
              Verify Document
            </span>
          </button>

          <button
            onClick={() => {
              setViewingDoc(null);
              setSelectedDoc(viewingDoc);
            }}
            className="flex-1 bg-burnt-sienna bg-opacity-20 text-deep-moss px-4 py-3 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
            disabled={!!processingDoc}
          >
            <span className="inline-flex items-center">
              <X className="mr-2" size={18} />
              Reject Document
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-deep-moss">
        Verification Queue
      </h2>

      {/* Rejection Dialog */}
      {selectedDoc && (
        <div className="bg-ivory border-2 border-deep-moss p-4 mb-6">
          <h3 className="text-xl font-bold mb-3 text-deep-moss">
            Reject Document
          </h3>
          <div className="mb-4">
            <label
              htmlFor="rejectionReason"
              className="block text-sm font-medium text-deep-moss mb-1"
            >
              Reason for Rejection:
            </label>
            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2 border-2 border-deep-moss text-deep-moss"
              rows={3}
              placeholder="Please provide a detailed reason for rejection"
              disabled={!!processingDoc}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => verifyDocument(selectedDoc, 'Rejected')}
              className="bg-burnt-sienna text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
              disabled={!rejectionReason.trim() || !!processingDoc}
            >
              {processingDoc?.id === selectedDoc &&
              processingDoc?.action === 'Rejected' ? (
                <span>Processing...</span>
              ) : (
                <span>Confirm Rejection</span>
              )}
            </button>
            <button
              onClick={() => {
                setSelectedDoc(null);
                setRejectionReason('');
              }}
              className="bg-soft-sage text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
              disabled={!!processingDoc}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader text="Loading verification queue..." />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-ivory p-6 border-2 border-deep-moss text-center">
          <Clock size={48} className="mx-auto mb-4 text-deep-moss" />
          <p className="text-lg font-bold text-deep-moss">
            No pending documents
          </p>
          <p className="text-deep-moss">
            When users submit documents for verification, they will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
            <table className="w-full bg-ivory border-2 border-deep-moss">
              <thead>
                <tr className="bg-soft-sage">
                  <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                    Document Name
                  </th>
                  <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss hidden sm:table-cell">
                    Type
                  </th>
                  <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                    Requested By
                  </th>
                  <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                    Date
                  </th>
                  <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss hidden md:table-cell">
                    Email
                  </th>
                  <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-deep-moss hover:bg-soft-sage hover:bg-opacity-30"
                  >
                    <td className="p-3 text-deep-moss font-medium">
                      {doc.documentName}
                    </td>
                    <td className="p-3 text-deep-moss hidden sm:table-cell">
                      {doc.documentType}
                    </td>
                    <td className="p-3 text-deep-moss">
                      {doc.ownerName
                        ? doc.ownerName
                        : doc.ownerUid && ownerNames[doc.ownerUid]
                        ? ownerNames[doc.ownerUid]
                        : 'Unknown User'}
                    </td>
                    <td className="p-3 text-deep-moss">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="p-3 text-deep-moss hidden md:table-cell">
                      {doc.ownerEmail || doc.email || 'No email provided'}
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewDocument(doc.id)}
                          className="bg-soft-sage text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                          title="View Document"
                          disabled={!!processingDoc}
                        >
                          <span className="flex items-center justify-center">
                            <Eye size={16} />
                          </span>
                        </button>
                        <button
                          onClick={() => downloadDocument(doc.id)}
                          className="bg-soft-sage text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                          title="Download Document"
                          disabled={!!processingDoc}
                        >
                          <span className="flex items-center justify-center">
                            <Download size={16} />
                          </span>
                        </button>

                        {processingDoc?.id === doc.id ? (
                          <div className="flex items-center justify-center bg-soft-sage p-2 border border-deep-moss">
                            <div className="animate-spin h-4 w-4 border-2 border-forest-green border-t-transparent rounded-full mr-2"></div>
                            <span className="text-xs text-deep-moss font-medium">
                              {processingDoc.action === 'Verified'
                                ? 'Verifying...'
                                : 'Rejecting...'}
                            </span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => verifyDocument(doc.id, 'Verified')}
                              className="bg-forest-green text-ivory p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                              title="Verify Document"
                              disabled={!!processingDoc}
                            >
                              <span className="flex items-center justify-center">
                                <Check size={16} />
                              </span>
                            </button>
                            <button
                              onClick={() => setSelectedDoc(doc.id)}
                              className="bg-burnt-sienna bg-opacity-20 text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                              title="Reject Document"
                              disabled={!!processingDoc}
                            >
                              <span className="flex items-center justify-center">
                                <X size={16} />
                              </span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View for Small Screens */}
          <div className="md:hidden mt-4 space-y-4">
            {documents.map((doc) => (
              <div
                key={`mobile-${doc.id}`}
                className="bg-ivory p-4 border-2 border-deep-moss"
              >
                <h4 className="font-bold text-deep-moss text-lg mb-2">
                  {doc.documentName}
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-xs text-gray-600">Type:</p>
                    <p className="text-sm text-deep-moss">{doc.documentType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Date:</p>
                    <p className="text-sm text-deep-moss">
                      {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-gray-600">Requested By:</p>
                  <p className="text-sm text-deep-moss font-medium">
                    {doc.ownerName
                      ? doc.ownerName
                      : doc.ownerUid && ownerNames[doc.ownerUid]
                      ? ownerNames[doc.ownerUid]
                      : 'Unknown User'}
                  </p>
                  {(doc.ownerEmail || doc.email) && (
                    <p className="text-xs text-deep-moss mt-1 break-words">
                      {doc.ownerEmail || doc.email}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => viewDocument(doc.id)}
                    className="flex-1 bg-soft-sage text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center justify-center"
                    disabled={!!processingDoc}
                  >
                    <span className="inline-flex items-center">
                      <Eye size={16} className="mr-1" /> View
                    </span>
                  </button>
                  <button
                    onClick={() => verifyDocument(doc.id, 'Verified')}
                    className="flex-1 bg-forest-green text-ivory p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center justify-center"
                    disabled={!!processingDoc}
                  >
                    <span className="inline-flex items-center">
                      <Check size={16} className="mr-1" /> Verify
                    </span>
                  </button>
                  <button
                    onClick={() => setSelectedDoc(doc.id)}
                    className="flex-1 bg-burnt-sienna bg-opacity-20 text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center justify-center"
                    disabled={!!processingDoc}
                  >
                    <span className="inline-flex items-center">
                      <X size={16} className="mr-1" /> Reject
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
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

export default VerificationQueue;
