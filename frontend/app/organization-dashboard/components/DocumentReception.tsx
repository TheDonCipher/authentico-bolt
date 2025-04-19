'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Eye, Clock, Download, FileText } from 'lucide-react';
import { db } from '../../../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';
import { Toast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { DocumentViewer } from '../../components/document/DocumentViewer';

interface Document {
  id: string;
  documentName: string;
  documentType: string;
  documentTypeName: string;
  status: string;
  createdAt: Date;
  ownerName: string;
  ownerUid: string;
}

const DocumentReception: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
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

    // Query documents where this organization is the verifying organization
    const documentsRef = collection(db, 'documents');
    const q = query(
      documentsRef,
      where('verifyingOrgId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            documentName: data.documentName || 'Unnamed Document',
            documentType: data.documentType || 'unknown',
            documentTypeName: data.documentTypeName || 'Unknown Type',
            status: data.status || 'Unknown',
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
            ownerName: data.ownerName || 'Unknown User',
            ownerUid: data.ownerUid || '',
          };
        });
        setDocuments(docs);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching documents:', error);
        setToastMessage({
          type: 'error',
          message: 'Failed to load documents',
        });
        setLoading(false);
      }
    );

    // Set up notification listener for new verification requests
    const notificationsRef = collection(db, 'notifications');
    const notificationQuery = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('read', '==', false),
      where('title', '==', 'New Verification Request'),
      orderBy('createdAt', 'desc')
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

  const handleVerifyDocument = async (documentId: string, action: 'Verified' | 'Rejected') => {
    try {
      const idToken = await getAuthToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // Get rejection reason if rejecting
      let rejectionReason = '';
      if (action === 'Rejected') {
        rejectionReason = prompt('Please provide a reason for rejection:') || '';
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
          status: action,
          rejectionReason: action === 'Rejected' ? rejectionReason : '',
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      setToastMessage({
        type: 'success',
        message: `Document ${action === 'Verified' ? 'verified' : 'rejected'} successfully`,
      });
    } catch (error) {
      console.error('Error verifying document:', error);
      setToastMessage({
        type: 'error',
        message: `Failed to ${action.toLowerCase()} document`,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
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
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-[#E8EDE1] border-4 border-[#556B2F] p-6 shadow-brutal">
        <h2 className="text-2xl font-bold mb-6 text-[#2F4F4F]">
          Document Reception
        </h2>
        <div className="animate-pulse">
          <div className="h-8 bg-[#D2E3C8] w-1/3 mb-4"></div>
          <div className="h-24 bg-[#D2E3C8] w-full mb-4"></div>
          <div className="h-24 bg-[#D2E3C8] w-full mb-4"></div>
        </div>
      </div>
    );
  }

  if (!user?.isVerified) {
    return (
      <div className="bg-[#E8EDE1] border-4 border-[#556B2F] p-6 shadow-brutal">
        <h2 className="text-2xl font-bold mb-4 text-[#2F4F4F]">
          Document Reception
        </h2>
        <div className="bg-yellow-50 border-2 border-yellow-200 p-4 mb-6">
          <p className="text-yellow-800">
            Your organization needs to be verified before you can receive documents for verification.
            Please complete the verification process.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#E8EDE1] border-4 border-[#556B2F] p-6 shadow-brutal">
      <h2 className="text-2xl font-bold mb-6 text-[#2F4F4F]" id="document-reception">
        Document Reception
      </h2>

      {documents.length === 0 ? (
        <div className="bg-white p-6 border-2 border-[#556B2F] text-center">
          <FileText size={48} className="mx-auto mb-4 text-[#556B2F]" />
          <p className="text-lg font-bold text-[#2F4F4F]">
            No documents received yet
          </p>
          <p className="text-[#2F4F4F]">
            When users submit documents for your organization to verify, they will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white border-2 border-[#556B2F]">
            <thead>
              <tr className="bg-[#D2E3C8]">
                <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">
                  Document Name
                </th>
                <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">
                  Type
                </th>
                <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">
                  Submitted By
                </th>
                <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">
                  Date
                </th>
                <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">
                  Status
                </th>
                <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-[#556B2F] hover:bg-[#F5F7F2]"
                >
                  <td className="p-3 text-[#2F4F4F] font-medium">
                    {doc.documentName}
                  </td>
                  <td className="p-3 text-[#2F4F4F]">{doc.documentTypeName}</td>
                  <td className="p-3 text-[#2F4F4F]">{doc.ownerName}</td>
                  <td className="p-3 text-[#2F4F4F]">
                    {formatDate(doc.createdAt)}
                  </td>
                  <td className="p-3">{getStatusBadge(doc.status)}</td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setViewingDocument(doc.id)}
                        className="bg-[#D2E3C8] text-[#2F4F4F] p-2 border border-[#556B2F] hover:shadow-[1px_1px_0px_0px_rgba(85,107,47,0.8)] transition-all"
                        title="View Document"
                      >
                        <Eye size={16} />
                      </button>
                      {doc.status === 'Pending Verification' && (
                        <>
                          <button
                            onClick={() => handleVerifyDocument(doc.id, 'Verified')}
                            className="bg-[#698B69] text-white p-2 border border-[#556B2F] hover:shadow-[1px_1px_0px_0px_rgba(85,107,47,0.8)] transition-all"
                            title="Verify Document"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleVerifyDocument(doc.id, 'Rejected')}
                            className="bg-[#E6B8AF] text-[#2F4F4F] p-2 border border-[#556B2F] hover:shadow-[1px_1px_0px_0px_rgba(85,107,47,0.8)] transition-all"
                            title="Reject Document"
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
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <DocumentViewer
          documentId={viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
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
