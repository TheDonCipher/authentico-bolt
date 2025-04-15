'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Eye, Clock } from 'lucide-react';
import { auth } from '../../../lib/firebase';
import axios from 'axios';
import { Toast } from '../../components/ui/Toast';

interface Document {
  id: string;
  documentName: string;
  documentType: string;
  status: string;
  createdAt: Date;
  ownerName: string;
}

const VerificationQueue = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{
    id: string;
    data: string;
    mimeType: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPendingDocuments();
  }, []);

  const fetchPendingDocuments = async () => {
    try {
      setLoading(true);
      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) {
        throw new Error('Not authenticated');
      }

      const response = await axios.get('/api/documents', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      // Filter for pending verification documents
      const pendingDocs = response.data.filter(
        (doc: any) => doc.status === 'Pending Verification'
      );

      // Format dates
      const formattedDocs = pendingDocs.map((doc: any) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
      }));

      setDocuments(formattedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to load verification queue',
      });
    } finally {
      setLoading(false);
    }
  };

  const viewDocument = async (docId: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();

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

      setViewingDoc({
        id: docId,
        data: response.data.decryptedFile,
        mimeType: response.data.mimeType,
      });
    } catch (error) {
      console.error('Error viewing document:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to load document for viewing',
      });
    }
  };

  const verifyDocument = async (
    docId: string,
    status: 'Verified' | 'Rejected'
  ) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // If rejecting, ensure there's a reason
      if (status === 'Rejected' && !rejectionReason) {
        setToastMessage({
          type: 'error',
          message: 'Please provide a reason for rejection',
        });
        return;
      }

      await axios.post(
        `/api/documents/${docId}/verify`,
        {
          status,
          rejectionReason: status === 'Rejected' ? rejectionReason : null,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      // Update local state
      setDocuments(documents.filter((doc) => doc.id !== docId));
      setSelectedDoc(null);
      setRejectionReason('');

      setToastMessage({
        type: 'success',
        message: `Document ${status.toLowerCase()} successfully`,
      });
    } catch (error) {
      console.error('Error verifying document:', error);
      setToastMessage({
        type: 'error',
        message: `Failed to ${status.toLowerCase()} document`,
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
        <div className="animate-pulse">
          <div className="h-8 bg-ivory w-1/3 mb-6"></div>
          <div className="h-6 bg-ivory w-full mb-4"></div>
          <div className="h-6 bg-ivory w-full mb-4"></div>
          <div className="h-6 bg-ivory w-full mb-4"></div>
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

        {viewingDoc.mimeType.startsWith('image/') ? (
          <img
            src={`data:${viewingDoc.mimeType};base64,${viewingDoc.data}`}
            alt="Document"
            className="max-w-full border-2 border-deep-moss mb-6"
          />
        ) : viewingDoc.mimeType === 'application/pdf' ? (
          <iframe
            src={`data:${viewingDoc.mimeType};base64,${viewingDoc.data}`}
            className="w-full h-[600px] border-2 border-deep-moss mb-6"
            title="PDF Document"
          />
        ) : (
          <div className="bg-ivory p-4 border-2 border-deep-moss mb-6">
            <p>
              This document type cannot be previewed directly. Please download
              to view.
            </p>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={() => verifyDocument(viewingDoc.id, 'Verified')}
            className="flex-1 bg-sap-green text-ivory px-4 py-3 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
          >
            <Check className="inline-block mr-2" size={18} />
            Verify Document
          </button>

          <button
            onClick={() => {
              setViewingDoc(null);
              setSelectedDoc(viewingDoc.id);
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
                          onClick={() => verifyDocument(doc.id, 'Verified')}
                          className="bg-sap-green text-ivory p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                          title="Verify Document"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setSelectedDoc(doc.id)}
                          className="bg-burnt-sienna bg-opacity-20 text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                          title="Reject Document"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rejection Dialog */}
          {selectedDoc && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-ivory p-6 border-4 border-deep-moss max-w-md w-full">
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
              </div>
            </div>
          )}
        </>
      )}

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast type={toastMessage.type} message={toastMessage.message} />
        </div>
      )}
    </div>
  );
};

export default VerificationQueue;
