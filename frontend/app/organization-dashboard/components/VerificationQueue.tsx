'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  X,
  Eye,
  Clock,
  Bell,
  Shield,
  AlertTriangle,
  FileCheck,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';
import { Toast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import DocumentViewerModal from './DocumentViewerModal';

interface Document {
  id: string;
  documentName: string;
  documentType: string;
  status: string;
  createdAt: Date;
  ownerName: string;
  verifyingOrgId?: string;
}

const VerificationQueue = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  const [processingDoc, setProcessingDoc] = useState<{
    id: string;
    action: 'Verified' | 'Rejected';
  } | null>(null);
  const router = useRouter();

  const { user } = useAuth();

  // Set up real-time listener for pending documents
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Set up real-time listener for documents
    const documentsRef = collection(db, 'documents');
    const q = query(
      documentsRef,
      where('verifyingOrgId', '==', user.uid),
      where('status', '==', 'Pending Verification'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedDocs: Document[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Convert Firestore document to our Document model
          fetchedDocs.push({
            id: doc.id,
            documentName: data.documentName || 'Unnamed Document',
            documentType: data.documentType || 'Unknown Type',
            status: data.status || 'Unknown',
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(),
            ownerName: data.ownerName || 'Unknown User',
          });
        });

        setDocuments(fetchedDocs);
        setLoading(false);
      },
      (error) => {
        console.error('Error in document listener:', error);
        setToastMessage({
          type: 'error',
          message:
            'Failed to load verification queue. Please refresh the page.',
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
  }, [user]);

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

      // First update UI to show processing state
      setToastMessage({
        type: 'info',
        message: `Creating blockchain record for document ${status.toLowerCase()}...`,
      });

      console.log(`Verifying document ${docId} with status ${status}`);
      console.log(
        'Rejection reason:',
        status === 'Rejected' ? rejectionReason : 'None'
      );

      // Make the API call
      const response = await axios.post(
        `/api/documents/${docId}/verify`,
        {
          status,
          rejectionReason: status === 'Rejected' ? rejectionReason : '',
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      console.log('Verification response:', response.status, response.data);

      // Update local state
      setDocuments(documents.filter((doc) => doc.id !== docId));
      setSelectedDoc(null);
      setRejectionReason('');
      setProcessingDoc(null);

      // Show success message
      setToastMessage({
        type: 'success',
        message: `Document ${status.toLowerCase()} successfully and recorded on blockchain`,
      });
    } catch (error) {
      console.error('Error verifying document:', error);
      setProcessingDoc(null);
      setToastMessage({
        type: 'error',
        message: `Failed to ${status.toLowerCase()} document: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
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

  if (loading) {
    return (
      <div className="bg-soft-sage border-4 border-deep-moss p-6 shadow-brutal">
        <h2 className="text-3xl font-black mb-6 text-deep-moss">
          Verification Queue
        </h2>
        <div className="flex items-center justify-center p-12">
          <div className="relative">
            <motion.div
              className="w-16 h-20 bg-ivory border-4 border-deep-moss absolute"
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <motion.div
              className="w-16 h-20 bg-ivory border-4 border-deep-moss absolute"
              initial={{ rotate: 5 }}
              animate={{ rotate: [-3, 7, -3] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
            />
            <motion.div
              className="w-16 h-20 bg-ivory border-4 border-deep-moss relative z-10 flex items-center justify-center"
              initial={{ rotate: -3 }}
              animate={{ rotate: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
            >
              <FileCheck className="text-deep-moss" size={24} />
            </motion.div>
          </div>
          <div className="ml-6">
            <p className="text-deep-moss font-bold text-lg">
              Loading verification queue...
            </p>
            <p className="text-deep-moss text-sm">
              Fetching documents that need your verification
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (viewingDoc) {
    return (
      <div className="bg-soft-sage border-4 border-deep-moss p-6 shadow-brutal">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black text-deep-moss">
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

        <div className="flex space-x-4 mt-6">
          <button
            onClick={() => verifyDocument(viewingDoc, 'Verified')}
            className="flex-1 bg-sap-green text-ivory px-4 py-3 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
          >
            <Check className="inline-block mr-2" size={18} />
            Verify Document
          </button>

          <button
            onClick={() => {
              setViewingDoc(null);
              setSelectedDoc(viewingDoc);
            }}
            className="flex-1 bg-burnt-sienna bg-opacity-20 text-deep-moss px-4 py-3 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
          >
            <X className="inline-block mr-2" size={18} />
            Reject Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-soft-sage border-4 border-deep-moss p-6 shadow-brutal">
      <h2 className="text-3xl font-black mb-6 text-deep-moss">
        Verification Queue
      </h2>

      {documents.length === 0 ? (
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
          <div className="overflow-x-auto">
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-deep-moss hover:bg-soft-sage"
                  >
                    <td className="p-3 text-deep-moss">{doc.documentName}</td>
                    <td className="p-3 text-deep-moss">{doc.documentType}</td>
                    <td className="p-3 text-deep-moss">{doc.ownerName}</td>
                    <td className="p-3 text-deep-moss">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewDocument(doc.id)}
                          className="bg-soft-sage text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                          title="View Document"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => downloadDocument(doc.id)}
                          disabled={!!processingDoc}
                          className="bg-soft-sage text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                          title="Download Document"
                        >
                          <Download size={16} />
                        </button>
                        {processingDoc && processingDoc.id === doc.id ? (
                          <div className="flex space-x-2 items-center">
                            <motion.div
                              className="w-8 h-8 border-4 border-deep-moss border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{
                                repeat: Infinity,
                                duration: 1,
                                ease: 'linear',
                              }}
                            />
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
                              className="bg-sap-green text-ivory p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center"
                              title="Verify Document"
                              disabled={!!processingDoc}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setSelectedDoc(doc.id)}
                              className="bg-burnt-sienna bg-opacity-20 text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center"
                              title="Reject Document"
                              disabled={!!processingDoc}
                            >
                              <X size={16} />
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

          {/* Rejection Dialog */}
          <AnimatePresence>
            {selectedDoc && (
              <motion.div
                className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-ivory p-6 border-4 border-deep-moss max-w-md w-full"
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', bounce: 0.4 }}
                >
                  <h3 className="text-xl font-bold mb-4 text-deep-moss">
                    Reject Document
                  </h3>
                  <p className="mb-4 text-deep-moss">
                    Please provide a reason for rejection:
                  </p>

                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-3 border-2 border-deep-moss focus:border-forest-green focus:outline-none mb-4"
                    rows={4}
                    placeholder="Enter rejection reason..."
                    required
                  />

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setSelectedDoc(null);
                        setRejectionReason('');
                      }}
                      className="bg-soft-sage text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => verifyDocument(selectedDoc, 'Rejected')}
                      className="bg-burnt-sienna bg-opacity-20 text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                      disabled={!rejectionReason}
                    >
                      Reject
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Toast Notifications */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="fixed bottom-4 right-4 z-50"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <Toast
              type={toastMessage.type}
              message={toastMessage.message}
              onClose={() => setToastMessage(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerificationQueue;
