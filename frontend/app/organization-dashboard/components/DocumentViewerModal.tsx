'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, AlertCircle, Share2, QrCode, Copy } from 'lucide-react';
// Removed import for NeubrutalistLoading
import { useAuth } from '../../contexts/AuthContext'; // Corrected import path
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
    fallback?: boolean;
  } | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Get auth state
  const { user, loading: authLoading } = useAuth();

  // Helper function to create placeholder document based on mime type
  const createPlaceholderDocument = (
    mimeType: string,
    documentName: string,
    status: string,
    updatedAt: string | number | Date
  ) => {
    console.log(
      `Creating placeholder for ${mimeType} document: ${documentName}`
    );

    // Create a placeholder based on the document type
    if (mimeType === 'application/pdf') {
      // Create a minimal valid PDF
      const pdfPlaceholder =
        'JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDEgMCBSIC9MYXN0TW9kaWZpZWQgKEQ6MjAyMzAxMDEwMDAwMDArMDAnMDAnKQovUmVzb3VyY2VzIDIgMCBSIC9NZWRpYUJveCBbMCAwIDU5NSA4NDJdIC9Dcm9wQm94IFswIDAgNTk1IDg0Ml0gL0JsZWVkQm94IFswIDAgNTk1IDg0Ml0KL0NvbnRlbnRzIDYgMCBSIC9Sb3RhdGUgMCA+PgplbmRvYmoKNiAwIG9iago8PCAvTGVuZ3RoIDc3IC9GaWx0ZXIgL0ZsYXRlRGVjb2RlID4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAw1DMwsdQzNFrFpWBmYGZqZGJgYKZnqGRmYGRmYGxkbmJpZGJpZmJmYWlkZmwJFHO1sDTVMzRcxQUAzXUPJgplbmRzdHJlYW0KZW5kb2JqCjEgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFs1IDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1T5cGUgL0NhdGFsb2cgL1BhZ2VzIDEgMCBSIC9NZXRhZGF0YSA0IDAgRiA+PgplbmRvYmoKNCAwIG9iago8PCAvTGVuZ3RoIDIzIC9UeXBlIC9NZXRhZGF0YSAvU3VidHlwZSAvWE1MID4+CnN0cmVhbQo8P3hwYWNrZXQgYmVnaW49Iu+7vyI/Pgo8P3hwYWNrZXQgZW5kPSJ3Ij8+CmVuZHN0cmVhbQplbmRvYmoKMiAwIG9iago8PCAvUHJvY1NldCBbL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSV0gPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZi AKMDAwMDAwMDI4MSAwMDAwMCBuIAowMDAwMDAwNDQwIDAwMDAwIG4gCjAwMDAwMDAzNDAgMDAwMDAgbi AKMDAwMDAwMDM5OSAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAxNDQgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA3IC9Sb290IDMgMCBSIC9JbmZvIDIgMCBSID4+CnN0YXR0eHJlZgo1MDEKJSVFT0YK';

      setDocumentData({
        data: pdfPlaceholder,
        mimeType: mimeType,
        name: documentName,
        status: status,
        updatedAt: updatedAt,
        fallback: true,
      });
    } else if (mimeType.startsWith('image/')) {
      // For images, use a placeholder image
      const imagePlaceholder =
        'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAABjUExURUdwTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHqUlBYAAAAgdFJOUwAQIDBAUGBwgI+fr7P3+8gMEBQYHCAj5+vv8/f7y9hWVIAAAGwSURBVHja7d3LbsIwFEXRm1BSniWlpdDy+P9PpGKUdoDkPvbV3p8QWfKJldiOUhQAAAAAAAAAAAAAAAAAAAAAAAAAAADYqHbVN/10aBbbuWuaYTqN/Xj4XbvqxrE/rR+b5nDo+nH1gHbVDcNqbLtFM/XrBnTb5jOm7XoB7XH+YtodVwroP5av+tMqAe2h/2bsDuUDuv3yzX5XOqBdLt/tywb0y/cO+5IBu+X7h13BgG65fO9QLKD/uPzHvlDA7vPyH7tCAfvl8r1DoYD98r1DoYD98r1DoYDd8r1DoYBu+d6hUMBh+d6hUMBx+d6hUMBp+d6hUMB5+d6hUMBl+d6hUMB1+d6hUMBt+d6hUMB9+d6hUMBj+d6hUMBz+d6hUMB/y/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOAAAAAAAAAAAAAAAAAAAAAAAAAAAA8Oe9AYiaJ1FsXZZLAAAAAElFTkSuQmCC';

      setDocumentData({
        data: imagePlaceholder,
        mimeType: mimeType,
        name: documentName,
        status: status,
        updatedAt: updatedAt,
        fallback: true,
      });
    } else {
      // For other types, use a generic placeholder
      setDocumentData({
        data: 'VGhpcyBpcyBhIHBsYWNlaG9sZGVyIGZvciB0aGUgZG9jdW1lbnQgY29udGVudC4gVGhlIGFjdHVhbCBkb2N1bWVudCBjYW4gYmUgdmlld2VkIGluIHRoZSBhZG1pbiBkYXNoYm9hcmQu',
        mimeType: 'text/plain',
        name: documentName,
        status: status,
        updatedAt: updatedAt,
        fallback: true,
      });
    }
  };

  useEffect(() => {
    // Only fetch document if documentId is available and auth is not loading
    if (!documentId || authLoading) {
      setLoading(true); // Keep loading state true while auth is loading
      return;
    }

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
        // Removed temporary log for verifyingOrgId

        // Check if the current user has permission to view this document
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          throw new Error('Not authenticated');
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

        // Try the direct-view endpoint first as it's more reliable
        console.log(
          `Trying secure-details endpoint for document ID: ${documentId}`
        );
        try {
          const response = await axios.get(
            `/api/documents/${documentId}/secure-details`,
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
              timeout: 30000, // 30 second timeout for decryption
            }
          );

          console.log('Secure details response status:', response.status);
          if (response.data) {
            console.log('Response data keys:', Object.keys(response.data));
            if (response.data.fileSize) {
              console.log(
                `Document file size: ${response.data.fileSize} bytes`
              );
            }
          } else {
            console.log('Response data is empty');
          }

          if (!response.data) {
            throw new Error('Empty response data received');
          }

          if (response.data.decryptedFile) {
            const documentName =
              response.data.documentName || docData.documentName || 'Document';
            const mimeType =
              response.data.mimeType ||
              docData.mimeType ||
              'application/octet-stream';

            console.log(
              `Document found: ${documentName}, type: ${mimeType}, decryption successful`
            );

            setDocumentData({
              data: response.data.decryptedFile,
              mimeType: mimeType,
              name: documentName,
              status: response.data.status || docData.status,
              updatedAt: docData.updatedAt,
              fallback: false,
            });
          } else if (response.data.documentInfo) {
            // Handle case where decryption failed but we have document info
            console.log('Document decryption failed but metadata available');

            const documentInfo = response.data.documentInfo;
            const documentName =
              documentInfo.documentName || docData.documentName || 'Document';
            const mimeType =
              documentInfo.mimeType ||
              docData.mimeType ||
              'application/octet-stream';

            console.log(
              `Using fallback for document: ${documentName}, type: ${mimeType}`
            );

            // Use helper function to create placeholder
            createPlaceholderDocument(
              mimeType,
              documentName,
              docData.status,
              docData.updatedAt
            );
          } else {
            throw new Error('Invalid document data received from server');
          }
        } catch (apiError) {
          console.error('API error fetching secure details:', apiError);

          // If both endpoints failed, use document metadata from Firestore to show a placeholder
          console.log(
            'Both API endpoints failed, using document metadata from Firestore'
          );

          const documentName = docData.documentName || 'Document';
          const mimeType = docData.mimeType || 'application/octet-stream';

          // Use helper function to create placeholder
          createPlaceholderDocument(
            mimeType,
            documentName,
            docData.status,
            docData.updatedAt
          );
        }
      } catch (error: unknown) {
        console.error('Error fetching document details:', error);
        // Implement proper user feedback for this error state
        setError(
          `Failed to load document details: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      } finally {
        setLoading(false); // Ensure loading is set to false after fetch attempt
      }
    };

    fetchDocument();
  }, [documentId, authLoading]); // Dependency array is correct

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
          // Removed NeubrutalistLoading, show a simple loading message instead
          <div className="flex flex-col items-center justify-center p-12 text-deep-moss font-medium">
            Loading document content...
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
