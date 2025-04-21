'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  AlertCircle,
  Loader,
  Share2,
  QrCode,
  Copy,
} from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';
import {
  getVerificationUrl,
  isDocumentVerified,
} from '../../../lib/verification-util';
import { DocumentViewer } from '../../components/document/DocumentViewer';
import { QRCodeSVG } from 'qrcode.react';
import { Toast } from '../../components/ui/Toast';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface DocumentViewerModalProps {
  documentId: string;
  onClose: () => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  documentId,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<{
    data: string;
    mimeType: string;
    name: string;
    status?: string;
    updatedAt?: string | number | Date;
  } | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        const idToken = await getAuthToken();
        if (!idToken) {
          throw new Error('Not authenticated');
        }

        // First, get the document details from Firestore to ensure we have access
        console.log(`Fetching document details from Firestore: ${documentId}`);
        const db = getFirestore();
        const docRef = doc(db, 'documents', documentId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error('Document not found in Firestore');
        }

        const docData = docSnap.data();
        console.log('Document data from Firestore:', docData);

        // Check if the current user has permission to view this document
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          throw new Error('User not authenticated');
        }

        // Log information for debugging
        console.log(`Current user ID: ${currentUser.uid}`);
        console.log(
          `Document verifying org ID: ${
            docData.verifyingOrgId || docData.verifier
          }`
        );
        console.log(`Document owner ID: ${docData.ownerUid}`);

        // For organizations, we'll let the backend API handle the verification status check
        // For document owners, we'll check access here
        let hasAccess = false;

        // If the user is the document owner, they have access
        if (
          docData.ownerUid === currentUser.uid ||
          docData.publicAddress === currentUser.uid
        ) {
          hasAccess = true;
        }

        // For admin users, always grant access
        if (currentUser.uid === '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c') {
          hasAccess = true;
        }

        // For organizations, we'll let the backend handle the verification check
        if (
          docData.verifyingOrgId === currentUser.uid ||
          docData.verifier === currentUser.uid
        ) {
          hasAccess = true;
        }

        if (!hasAccess) {
          throw new Error('You do not have permission to view this document');
        }

        // Now fetch the secure details from the API
        console.log(`Fetching secure details for document ID: ${documentId}`);

        try {
          const response = await axios.get(
            `/api/documents/${documentId}/secure-details`,
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            }
          );

          console.log('Secure details response:', response.status);
          console.log('Response data keys:', Object.keys(response.data));

          if (!response.data) {
            throw new Error('Empty response data received');
          }

          if (response.data.decryptedFile) {
            const documentName =
              response.data.documentName || docData.documentName || 'Document';
            const mimeType =
              response.data.mimeType || 'application/octet-stream';

            console.log(`Document found: ${documentName}, type: ${mimeType}`);

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
        } catch (apiError) {
          console.error('API error fetching secure details:', apiError);
          throw new Error(
            apiError instanceof Error
              ? apiError.message
              : 'Failed to fetch document details from API'
          );
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

  const handleDownload = () => {
    if (!documentData) return;

    const link = document.createElement('a');
    link.href = `data:${documentData.mimeType};base64,${documentData.data}`;
    link.download = `${documentData.name}.${
      documentData.mimeType.split('/')[1] || 'file'
    }`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the background overlay was clicked directly
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
              <>
                <button
                  onClick={handleDownload}
                  className="p-2 bg-soft-sage text-deep-moss rounded-sm hover:bg-opacity-90 transition-all"
                  title="Download"
                >
                  <Download size={20} />
                </button>
                <button
                  onClick={() => setShowQR(true)}
                  className="p-2 bg-soft-sage text-deep-moss rounded-sm hover:bg-opacity-90 transition-all"
                  title="QR Code"
                >
                  <QrCode size={20} />
                </button>
                <button
                  onClick={() => {
                    const verificationUrl = getVerificationUrl(documentId);
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
                  className="p-2 bg-soft-sage text-deep-moss rounded-sm hover:bg-opacity-90 transition-all"
                  title="Copy Verification Link"
                >
                  <Copy size={20} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-soft-sage rounded-full"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader className="animate-spin h-8 w-8 text-deep-moss mb-4" />
            <p className="text-deep-moss">Loading document...</p>
          </div>
        ) : error ? (
          <div className="bg-burnt-sienna bg-opacity-20 p-4 border-2 border-deep-moss flex items-start">
            <AlertCircle
              className="text-burnt-sienna mr-2 flex-shrink-0 mt-1"
              size={18}
            />
            <p className="text-deep-moss">{error}</p>
          </div>
        ) : documentData ? (
          <DocumentViewer
            documentData={documentData.data}
            mimeType={documentData.mimeType}
            fileName={documentData.name}
            status={documentData.status}
            updatedAt={documentData.updatedAt}
          />
        ) : (
          <div className="bg-burnt-sienna bg-opacity-20 p-4 border-2 border-deep-moss">
            <p className="text-deep-moss">No document data available</p>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 border-4 border-deep-moss max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-deep-moss">
                Verification QR Code
              </h3>
              <button
                onClick={() => setShowQR(false)}
                className="text-deep-moss hover:text-forest-green"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-soft-sage border-2 border-deep-moss">
              <QRCodeSVG
                value={getVerificationUrl(documentId)}
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
                  const verificationUrl = getVerificationUrl(documentId);
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

      {/* Toast message */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export default DocumentViewerModal;
