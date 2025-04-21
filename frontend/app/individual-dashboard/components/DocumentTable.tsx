'use client';

import React, { useState } from 'react';
import { Document } from '../../models/Document';
import {
  Eye,
  Download,
  FileText,
  Send,
  Share2,
  QrCode,
  ExternalLink,
  Copy,
  X,
  Upload,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { getDocumentTypeName } from '../../constants/documentTypes';
import { getAuthToken } from '../../../lib/token-util';
import {
  getVerificationUrl,
  isDocumentVerified,
} from '../../../lib/verification-util';
import axios from 'axios';
import { DocumentViewer } from '../../components/document/DocumentViewer';
import { Toast } from '../../components/ui/Toast';
import { getFirestore, doc as firestoreDoc, getDoc } from 'firebase/firestore';

interface DocumentTableProps {
  documents: Document[];
  orgNames?: Record<string, string>;
  onShare: (doc: Document) => void;
  onAction?: (doc: Document) => void;
  onReupload?: (doc: Document) => void; // New prop for re-upload action
}

export const DocumentTable = ({
  documents,
  orgNames = {},
  onShare,
  onAction = () => {},
  onReupload = () => {}, // Default empty function
}: DocumentTableProps) => {
  const [showDocument, setShowDocument] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<{
    data: string;
    mimeType: string;
    name: string;
    fallback?: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  // Function to copy text to clipboard
  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setToastMessage({
          type: 'success',
          message: successMessage,
        });
      },
      () => {
        setToastMessage({
          type: 'error',
          message: 'Failed to copy to clipboard',
        });
      }
    );
  };

  // Check if document is verified (using the utility function)
  const checkIsVerified = (doc: Document) => {
    return isDocumentVerified(doc);
  };

  // Check if document is rejected (status = 'Rejected' or '3')
  const isDocumentRejected = (doc: Document) => {
    return doc.status === 'Rejected' || doc.status === '3';
  };

  // Get Etherscan URL for transaction hash
  const getEtherscanUrl = (transactionHash: string) => {
    return `https://sepolia.etherscan.io/tx/${transactionHash}`;
  };

  // Function to fetch and view the document
  const viewDocument = async (doc: Document, downloadOnly: boolean = false) => {
    try {
      if (!doc || !doc.documentId) {
        setToastMessage({
          type: 'error',
          message: 'Invalid document ID',
        });
        return;
      }

      // Validate document ID is a non-empty string
      const docId = doc.documentId.toString();
      if (!docId || docId.trim() === '') {
        setToastMessage({
          type: 'error',
          message: 'Invalid document ID',
        });
        return;
      }

      setIsLoading(true);
      const idToken = await getAuthToken();

      if (!idToken) {
        throw new Error('Not authenticated');
      }

      console.log(`Fetching document details for ID: ${docId}`);

      // First, get the document details from Firestore to ensure we have access
      const db = getFirestore();
      const docRef = firestoreDoc(db, 'documents', docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Document not found in Firestore');
      }

      console.log('Document data from Firestore:', docSnap.data());

      try {
        // Try the primary endpoint first
        console.log('Trying primary secure-details endpoint');
        const response = await axios.get(
          `/api/documents/${docId}/secure-details`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
            timeout: 20000, // 20 second timeout
          }
        );

        console.log(
          'Document details response:',
          response.status,
          response.data
        );

        // Use document name from response if available, otherwise fallback to local data
        const documentName =
          response.data.documentName ||
          doc.documentName ||
          getDocumentTypeName(doc.documentType);
        const mimeType = response.data.mimeType || 'application/octet-stream';

        if (response.data && response.data.decryptedFile) {
          if (downloadOnly) {
            // Create a download link and trigger it
            const link = document.createElement('a');
            link.href = `data:${mimeType};base64,${response.data.decryptedFile}`;
            link.download = `${documentName}.${
              mimeType.split('/')[1] || 'file'
            }`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setToastMessage({
              type: 'success',
              message: 'Document download started',
            });
          } else {
            // Show the document in the viewer
            setDocumentData({
              data: response.data.decryptedFile,
              mimeType: mimeType,
              name: documentName,
            });
            setShowDocument(docId);
          }
          return;
        } else if (response.data && response.data.fallback) {
          // This is a fallback response without document content
          setToastMessage({
            type: 'warning',
            message:
              response.data.message ||
              'Document content unavailable. Using fallback view.',
          });

          // Show the document viewer with placeholder content
          setDocumentData({
            data: '', // Empty content
            mimeType: mimeType,
            name: documentName,
            fallback: true,
          });
          setShowDocument(docId);
          return;
        } else {
          throw new Error('Invalid document data received from server');
        }
      } catch (primaryError) {
        console.error('Primary endpoint failed:', primaryError);

        // Try the direct-view endpoint as fallback
        try {
          console.log('Trying direct-view fallback endpoint');
          const fallbackResponse = await axios.get(
            `/api/documents/${docId}/direct-view`,
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
              timeout: 15000,
            }
          );

          if (fallbackResponse.data && fallbackResponse.data.directView) {
            const documentName =
              fallbackResponse.data.documentName ||
              doc.documentName ||
              getDocumentTypeName(doc.documentType) ||
              'Document';

            const mimeType =
              fallbackResponse.data.mimeType ||
              docSnap.data().mimeType ||
              'application/octet-stream';

            setToastMessage({
              type: 'warning',
              message:
                'Using simplified document view. Some features may be limited.',
            });

            // Show the document viewer with placeholder content
            setDocumentData({
              data: '', // Empty content
              mimeType: mimeType,
              name: documentName,
              fallback: true,
            });
            setShowDocument(docId);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback endpoint also failed:', fallbackError);
          // Continue to the main error handler
          throw primaryError;
        }

        // If we get here, both endpoints failed
        throw primaryError;
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      setToastMessage({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to load document for viewing',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to request verification
  const requestVerification = async (doc: Document) => {
    try {
      setIsLoading(true);
      const idToken = await getAuthToken();

      if (!idToken) {
        throw new Error('Not authenticated');
      }

      console.log(`Requesting verification for document: ${doc.documentId}`);

      // In a real implementation, we would call an API endpoint
      // For now, just show a success message
      setToastMessage({
        type: 'success',
        message: `Verification request sent for ${
          doc.documentName || getDocumentTypeName(doc.documentType)
        }`,
      });
    } catch (error) {
      console.error('Error requesting verification:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to request verification',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check if document is verified (using the utility function)
  const checkDocumentVerified = (doc: Document) => {
    return isDocumentVerified(doc);
  };

  return (
    <div className="overflow-x-auto w-full">
      {/* Desktop Table View */}
      <table className="w-full border-collapse hidden md:table table-auto">
        <thead>
          <tr className="bg-soft-sage bg-opacity-50">
            <th className="px-4 py-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
              Document
            </th>
            <th className="px-4 py-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
              Type
            </th>
            <th className="px-4 py-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
              Status
            </th>
            <th className="px-4 py-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
              Verifying Organization
            </th>
            <th className="px-4 py-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
              Upload Date
            </th>
            <th className="px-4 py-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc.documentId}
              className="border-b border-deep-moss hover:bg-soft-sage hover:bg-opacity-30"
            >
              <td className="px-4 py-3">
                <div className="font-medium text-deep-moss">
                  {doc.documentName ||
                    (doc.documentType
                      ? getDocumentTypeName(doc.documentType)
                      : 'Unnamed Document')}
                </div>
                <div className="text-xs text-gray-600 mt-1 truncate max-w-[200px]">
                  {doc.metadataHash}
                </div>
              </td>
              <td className="px-4 py-3 text-deep-moss">
                {doc.documentType ? (
                  <span className="font-medium">
                    {getDocumentTypeName(doc.documentType)}
                  </span>
                ) : (
                  <span className="text-gray-500 text-sm">Unknown</span>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={doc.status} />
              </td>
              <td className="px-4 py-3 text-deep-moss">
                {doc.verifyingOrgId ? (
                  orgNames[doc.verifyingOrgId] ? (
                    <span className="font-medium">
                      {orgNames[doc.verifyingOrgId]}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-sm">{`ID: ${doc.verifyingOrgId.slice(
                      0,
                      5
                    )}...${doc.verifyingOrgId.slice(-3)}`}</span>
                  )
                ) : (
                  <span className="text-gray-500 text-sm">Not assigned</span>
                )}
              </td>
              <td className="px-4 py-3 text-deep-moss">
                {doc.createdAt ? (
                  <span title={new Date(doc.createdAt).toLocaleString()}>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-gray-500">Unknown</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex space-x-2">
                  <button
                    key={`view-${doc.documentId}`}
                    onClick={() => viewDocument(doc)}
                    className="p-2 bg-forest-green text-ivory rounded-sm hover:bg-opacity-90 transition-all"
                    title="View Document"
                    disabled={isLoading}
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    key={`download-${doc.documentId}`}
                    onClick={() => viewDocument(doc, true)}
                    className="p-2 bg-soft-sage text-deep-moss rounded-sm hover:bg-opacity-90 transition-all"
                    title="Download Document"
                    disabled={isLoading}
                  >
                    <Download size={16} />
                  </button>

                  {doc.status === '1' && (
                    <button
                      key={`verify-${doc.documentId}`}
                      onClick={() => requestVerification(doc)}
                      className="p-2 bg-soft-sage text-deep-moss rounded-sm hover:bg-opacity-90 transition-all"
                      title="Request Verification"
                      disabled={isLoading}
                    >
                      <Send size={16} />
                    </button>
                  )}

                  <button
                    key={`qr-${doc.documentId}`}
                    onClick={() => {
                      const docId = doc.documentId
                        ? doc.documentId.toString()
                        : '';
                      if (docId) {
                        setShowQR(docId);
                      } else {
                        setToastMessage({
                          type: 'error',
                          message: 'Invalid document ID',
                        });
                      }
                    }}
                    className="p-2 bg-ivory text-deep-moss border border-deep-moss rounded-sm hover:bg-soft-sage transition-all"
                    title="QR Code"
                    disabled={isLoading}
                  >
                    <QrCode size={16} />
                  </button>

                  <button
                    key={`share-${doc.documentId}`}
                    onClick={() => {
                      if (isDocumentVerified(doc)) {
                        onShare(doc);
                      } else {
                        setToastMessage({
                          type: 'warning',
                          message: 'Only verified documents can be shared',
                        });
                      }
                    }}
                    className={`p-2 ${
                      isDocumentVerified(doc) ? 'bg-ivory' : 'bg-gray-200'
                    } text-deep-moss border border-deep-moss rounded-sm hover:bg-soft-sage transition-all`}
                    title={
                      isDocumentVerified(doc)
                        ? 'Share'
                        : 'Only verified documents can be shared'
                    }
                    disabled={isLoading || !isDocumentVerified(doc)}
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 w-full">
        {documents.map((doc) => (
          <div
            key={doc.documentId}
            className="bg-ivory p-4 border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-lg truncate max-w-[200px]">
                  {doc.documentName ||
                    (doc.documentType
                      ? getDocumentTypeName(doc.documentType)
                      : 'Unnamed Document')}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {doc.documentType
                    ? getDocumentTypeName(doc.documentType)
                    : 'Unknown'}
                </p>
              </div>
              <StatusBadge status={doc.status} />
            </div>

            <div className="mb-3">
              <p className="text-xs text-gray-600">Verifying Organization:</p>
              {doc.verifyingOrgId ? (
                orgNames[doc.verifyingOrgId] ? (
                  <p className="text-sm font-medium">
                    {orgNames[doc.verifyingOrgId]}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {`ID: ${doc.verifyingOrgId.slice(
                      0,
                      5
                    )}...${doc.verifyingOrgId.slice(-3)}`}
                  </p>
                )
              ) : (
                <p className="text-sm text-gray-500">Not assigned</p>
              )}
            </div>

            <div className="mb-3">
              <p className="text-xs text-gray-600">Upload Date:</p>
              <p className="text-sm">
                {doc.createdAt
                  ? new Date(doc.createdAt).toLocaleDateString()
                  : 'Unknown'}
              </p>
            </div>

            <div className="mb-3">
              <p className="text-xs text-gray-600">Document Hash:</p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center bg-soft-sage bg-opacity-50 p-1.5 rounded overflow-hidden">
                  <p className="font-mono text-xs truncate">
                    {doc.metadataHash
                      ? `${doc.metadataHash.slice(
                          0,
                          15
                        )}...${doc.metadataHash.slice(-4)}`
                      : 'No hash available'}
                  </p>
                  <button
                    onClick={() =>
                      doc.metadataHash
                        ? copyToClipboard(
                            doc.metadataHash,
                            'Hash copied to clipboard!'
                          )
                        : setToastMessage({
                            type: 'error',
                            message: 'No hash available to copy',
                          })
                    }
                    className="ml-1 text-deep-moss hover:text-forest-green flex-shrink-0"
                    title="Copy hash"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                {doc.transactionHash && (
                  <div className="text-xs text-gray-600 mt-1">
                    <a
                      href={getEtherscanUrl(doc.transactionHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-forest-green hover:underline flex items-center"
                    >
                      View on Etherscan{' '}
                      <ExternalLink size={10} className="ml-1" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {isDocumentRejected(doc) && (
              <div className="mb-3 p-2 bg-burnt-sienna bg-opacity-20 border border-deep-moss text-xs">
                <p className="font-medium text-deep-moss">
                  This document was rejected. Please re-upload with correct
                  information.
                </p>
                <button
                  onClick={() => onReupload(doc)}
                  className="mt-2 bg-forest-green text-ivory px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all font-medium flex items-center justify-center w-full"
                >
                  <Upload size={12} className="mr-1" />
                  Re-upload Document
                </button>
              </div>
            )}
            <div className="grid grid-cols-5 gap-1">
              <button
                key={`mobile-view-${doc.documentId}`}
                onClick={() => viewDocument(doc)}
                className="p-2 bg-forest-green text-ivory rounded-sm hover:bg-opacity-90 transition-all flex items-center justify-center"
                title="View Document"
                disabled={isLoading}
              >
                <Eye size={16} />
              </button>

              <button
                key={`mobile-download-${doc.documentId}`}
                onClick={() => viewDocument(doc, true)}
                className="p-2 bg-soft-sage text-deep-moss rounded-sm hover:bg-opacity-90 transition-all flex items-center justify-center"
                title="Download Document"
                disabled={isLoading}
              >
                <Download size={16} />
              </button>

              {doc.status === '1' ? (
                <button
                  key={`mobile-verify-${doc.documentId}`}
                  onClick={() => requestVerification(doc)}
                  className="p-2 bg-soft-sage text-deep-moss rounded-sm hover:bg-opacity-90 transition-all flex items-center justify-center"
                  title="Request Verification"
                  disabled={isLoading}
                >
                  <Send size={16} />
                </button>
              ) : (
                <div
                  key={`mobile-empty-${doc.documentId}`}
                  className="p-2"
                ></div> // Empty space to maintain grid
              )}

              <button
                key={`mobile-qr-${doc.documentId}`}
                onClick={() => {
                  const docId = doc.documentId ? doc.documentId.toString() : '';
                  if (docId) {
                    setShowQR(docId);
                  } else {
                    setToastMessage({
                      type: 'error',
                      message: 'Invalid document ID',
                    });
                  }
                }}
                className="p-2 bg-ivory text-deep-moss border border-deep-moss rounded-sm hover:bg-soft-sage transition-all flex items-center justify-center"
                title="QR Code"
                disabled={isLoading}
              >
                <QrCode size={16} />
              </button>

              <button
                key={`mobile-share-${doc.documentId}`}
                onClick={() => {
                  if (isDocumentVerified(doc)) {
                    onShare(doc);
                  } else {
                    setToastMessage({
                      type: 'warning',
                      message: 'Only verified documents can be shared',
                    });
                  }
                }}
                className={`p-2 ${
                  isDocumentVerified(doc) ? 'bg-ivory' : 'bg-gray-200'
                } text-deep-moss border border-deep-moss rounded-sm hover:bg-soft-sage transition-all flex items-center justify-center`}
                title={
                  isDocumentVerified(doc)
                    ? 'Share'
                    : 'Only verified documents can be shared'
                }
                disabled={isLoading || !isDocumentVerified(doc)}
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Document Viewer Modal */}
      {showDocument !== null && documentData && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-ivory p-3 sm:p-6 border-2 sm:border-4 border-deep-moss max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{documentData.name}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={`data:${documentData.mimeType};base64,${documentData.data}`}
                  download={`${documentData.name}.${
                    documentData.mimeType.split('/')[1]
                  }`}
                  className="p-2 bg-soft-sage text-deep-moss rounded-sm hover:bg-opacity-90 transition-all"
                  title="Download"
                >
                  <Download size={20} />
                </a>
                <button
                  onClick={() => setShowDocument(null)}
                  className="p-1 hover:bg-soft-sage rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <DocumentViewer
              documentData={documentData.data}
              mimeType={documentData.mimeType}
              fileName={documentData.name}
              status={
                documents.find((d) => d.documentId === showDocument)?.status
              }
              updatedAt={
                documents.find((d) => d.documentId === showDocument)
                  ?.updatedAt || Date.now()
              }
              fallback={documentData.fallback}
            />
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-ivory p-3 sm:p-6 border-2 sm:border-4 border-deep-moss max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Verification QR Code</h3>
              <button
                onClick={() => setShowQR(null)}
                className="p-1 hover:bg-soft-sage rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-md">
                <QRCodeSVG
                  value={getVerificationUrl(showQR)}
                  size={200}
                  style={{ background: '#ffffff', padding: '10px' }}
                  level={'H'}
                />
              </div>

              <p className="mt-4 text-center text-sm text-gray-600">
                Scan this QR code to verify the document&apos;s authenticity
              </p>

              <div className="mt-4 w-full">
                <p className="text-xs text-gray-500 mb-1">Verification Link:</p>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={getVerificationUrl(showQR)}
                    readOnly
                    className="flex-1 p-2 border border-deep-moss text-sm font-mono bg-soft-sage bg-opacity-30"
                  />
                  <button
                    onClick={() => {
                      copyToClipboard(
                        getVerificationUrl(showQR),
                        'Verification link copied to clipboard!'
                      );
                    }}
                    className="p-2 bg-soft-sage text-deep-moss border border-deep-moss border-l-0"
                  >
                    <Copy size={16} />
                  </button>
                  <a
                    href={getVerificationUrl(showQR)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-forest-green text-ivory border border-deep-moss border-l-0"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
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
            duration={3000}
          />
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md shadow-md">
            <div className="animate-spin h-8 w-8 border-4 border-forest-green border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-center text-deep-moss">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};
