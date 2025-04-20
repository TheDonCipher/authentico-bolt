'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '../../../../../lib/token-util';
import { DocumentViewer } from '../../../../components/document/DocumentViewer';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Loader } from '../../../../components/ui/Loader';

interface DocumentViewerModalProps {
  documentId: string;
  onClose: () => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  documentId,
  onClose,
}) => {
  const [documentData, setDocumentData] = useState<{
    data: string;
    mimeType: string;
    name: string;
    status?: string;
    updatedAt?: string | number | Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle click outside to close
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!documentData) return;

    const link = document.createElement('a');
    link.href = `data:${documentData.mimeType};base64,${documentData.data}`;
    link.download = documentData.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch document data
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get auth token
        const token = await getAuthToken();
        if (!token) {
          throw new Error('Authentication required');
        }

        // First get document metadata from Firestore
        const db = getFirestore();
        const docRef = doc(db, 'documents', documentId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error('Document not found');
        }

        const docData = docSnap.data();
        console.log('Document metadata:', docData);

        // Now fetch the actual document content
        const response = await axios.get(
          `/api/documents/${documentId}/secure-details`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.decryptedFile) {
          const documentName =
            response.data.documentName || docData.documentName || 'Document';
          const mimeType = response.data.mimeType || 'application/octet-stream';

          setDocumentData({
            data: response.data.decryptedFile,
            mimeType: mimeType,
            name: documentName,
            status: docData.status,
            updatedAt: docData.updatedAt,
          });
        } else {
          throw new Error('Invalid document data received from server');
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load document for viewing'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackgroundClick}
    >
      <div className="bg-ivory p-6 border-4 border-deep-moss max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-ivory z-10">
          <h3 className="text-xl font-bold text-deep-moss">Document Viewer</h3>
          <div className="flex items-center gap-2">
            {documentData && (
              <button
                onClick={handleDownload}
                className="p-2 bg-soft-sage text-deep-moss rounded-sm hover:bg-opacity-90 transition-all"
                title="Download"
              >
                <span className="flex items-center justify-center">
                  <Download size={20} />
                </span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-soft-sage rounded-full"
              title="Close"
            >
              <span className="flex items-center justify-center">
                <X size={20} />
              </span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="mb-4">
              <Loader className="h-8 w-8 text-deep-moss" />
            </div>
            <p className="text-deep-moss">Loading document...</p>
          </div>
        ) : error ? (
          <div className="bg-burnt-sienna bg-opacity-20 p-4 border-2 border-deep-moss flex items-start">
            <span className="text-burnt-sienna mr-2 flex-shrink-0 mt-1">
              <AlertCircle size={18} />
            </span>
            <p className="text-deep-moss">{error}</p>
          </div>
        ) : documentData ? (
          <div className="h-[600px]">
            {' '}
            {/* Fixed height for better visibility */}
            {documentData && (
              <DocumentViewer
                documentData={documentData.data}
                mimeType={documentData.mimeType}
                fileName={documentData.name}
                status={documentData.status}
                updatedAt={documentData.updatedAt}
              />
            )}
          </div>
        ) : (
          <div className="bg-burnt-sienna bg-opacity-20 p-4 border-2 border-deep-moss">
            <p className="text-deep-moss">No document data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewerModal;
