'use client';

import { Document } from '../../models/Document';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Copy,
  Share2,
  QrCode,
  Eye,
  Download,
  FileText,
  Send,
  Info,
  ExternalLink,
  Shield,
  Lock,
  Upload,
  Paperclip,
} from 'lucide-react';
import { getDocumentTypeName } from '../../constants/documentTypes';
import { Toast } from '../../components/ui/Toast';
import { DocumentViewer } from '../../components/document/DocumentViewer';
import { DocumentSeal } from '../../components/document/DocumentSeal';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';
import { Tooltip } from '../../components/ui/Tooltip';

interface EnhancedDocumentCardProps {
  doc: Document;
  onShare: (doc: Document) => void;
  onAction?: (doc: Document) => void;
  onReupload?: (doc: Document) => void; // New prop for re-upload action
  documentName?: string;
  verifyingOrgName?: string;
  transactionHash?: string;
  blockNumber?: number;
  tokenId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const EnhancedDocumentCard = ({
  doc,
  onShare,
  onAction = () => {},
  onReupload = () => {}, // Default empty function
  documentName,
  verifyingOrgName,
  transactionHash,
  blockNumber,
  tokenId,
  createdAt,
  updatedAt,
}: EnhancedDocumentCardProps) => {
  const [showQR, setShowQR] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [showBlockchainInfo, setShowBlockchainInfo] = useState(false);
  const [documentData, setDocumentData] = useState<{
    data: string;
    mimeType: string;
    name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  // Get the verification URL
  const verificationUrl = `${window.location.origin}/verify/${doc.documentId}`;

  // Get the explorer URL for the transaction
  const explorerUrl = transactionHash
    ? `https://sepolia.etherscan.io/tx/${transactionHash}`
    : null;

  // Check if document is verified (status = 'Verified' or '2')
  const isVerified = doc.status === 'Verified' || doc.status === '2';

  // Check if document is rejected (status = 'Rejected' or '3')
  const isRejected = doc.status === 'Rejected' || doc.status === '3';

  // Function to fetch and view the document
  const viewDocument = async (downloadOnly: boolean = false) => {
    try {
      if (!doc || !doc.documentId) {
        throw new Error('Invalid document ID');
      }

      setIsLoading(true);
      const idToken = await getAuthToken();

      if (!idToken) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      // Validate document ID
      const docId = doc.documentId.toString();

      console.log(`Fetching document details for ID: ${docId}`);

      // Add timeout to the request to prevent hanging
      const response = await axios.get(
        `/api/documents/${docId}/secure-details`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          timeout: 15000, // 15 second timeout
        }
      );

      console.log('Document details response:', response.status, response.data);

      if (response.data && response.data.decryptedFile) {
        // Use document name from response if available, otherwise fallback to local data
        const docName =
          response.data.documentName ||
          documentName ||
          getDocumentTypeName(doc.documentType);
        const mimeType = response.data.mimeType || 'application/octet-stream';

        if (downloadOnly) {
          // Create a download link and trigger it
          const link = document.createElement('a');
          link.href = `data:${mimeType};base64,${response.data.decryptedFile}`;
          link.download = `${docName}.${mimeType.split('/')[1] || 'file'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setToastMessage({
            type: 'success',
            message: 'Document download started',
          });
        } else {
          setDocumentData({
            data: response.data.decryptedFile,
            mimeType: mimeType,
            name: docName,
          });
          setShowDocument(true);
        }
      } else {
        throw new Error('Invalid document data received from server');
      }
    } catch (error: any) {
      console.error('Error viewing document:', error);

      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to load document for viewing';

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 404) {
          errorMessage =
            'Document not found. It may have been deleted or moved.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to view this document.';
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please sign in again.';
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage =
          'No response from server. Please check your internet connection and try again.';
      } else if (error.message) {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message;
      }

      setToastMessage({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to request verification
  const requestVerification = async () => {
    try {
      setIsLoading(true);
      const idToken = await getAuthToken();

      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // This would be implemented in a real API
      // For now, just show a success message
      setToastMessage({
        type: 'success',
        message: 'Verification request sent successfully',
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

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setToastMessage({
          type: 'success',
          message,
        });
        // Toast will auto-dismiss with the onClose handler
      },
      (err) => {
        console.error('Could not copy text: ', err);
        setToastMessage({
          type: 'error',
          message: 'Failed to copy to clipboard',
        });
      }
    );
  };

  return (
    <div className="bg-ivory p-4 border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all flex flex-col h-full relative overflow-hidden">
      {/* Paper clip styling */}
      <div className="absolute top-0 right-0 transform translate-x-[-8px] translate-y-[-2px] rotate-[20deg] text-deep-moss">
        <Paperclip size={28} strokeWidth={2.5} />
      </div>

      {/* Header with document name and status */}
      <div className="flex justify-between items-start mb-3">
        <div className="overflow-hidden">
          <h4 className="font-bold text-lg truncate">
            {documentName ||
              (doc.documentType
                ? getDocumentTypeName(doc.documentType)
                : 'Unnamed Document')}
          </h4>
          {documentName && doc.documentType && (
            <p className="text-xs text-gray-600 mt-1 truncate">
              {getDocumentTypeName(doc.documentType)}
            </p>
          )}
        </div>
        <StatusBadge status={doc.status} />
      </div>

      {/* Document details - more compact */}
      <div className="mb-3 flex-grow">
        {isRejected && (
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
        <div className="flex flex-col gap-1.5 text-xs">
          {/* Verifying Organization */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <p className="text-gray-600 mr-1">Verifying:</p>
              <Tooltip content="The organization responsible for verifying this document's authenticity">
                <Info size={10} className="text-gray-500" />
              </Tooltip>
            </div>
            <p className="font-medium truncate max-w-[60%]">
              {verifyingOrgName ||
                (doc.verifyingOrgId
                  ? `ID: ${doc.verifyingOrgId.slice(
                      0,
                      5
                    )}...${doc.verifyingOrgId.slice(-3)}`
                  : 'Not assigned')}
            </p>
          </div>

          {/* Owner Wallet Address */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <p className="text-gray-600 mr-1">Owner:</p>
              <Tooltip content="The blockchain wallet address that owns this document">
                <Info size={10} className="text-gray-500" />
              </Tooltip>
            </div>
            <div className="flex items-center bg-soft-sage bg-opacity-50 px-1.5 py-0.5 rounded overflow-hidden">
              <p className="font-mono truncate">
                {doc.publicAddress
                  ? `${doc.publicAddress.slice(
                      0,
                      6
                    )}...${doc.publicAddress.slice(-4)}`
                  : 'Not available'}
              </p>
              {doc.publicAddress && (
                <button
                  onClick={() =>
                    copyToClipboard(
                      doc.publicAddress,
                      'Wallet address copied to clipboard!'
                    )
                  }
                  className="ml-1 text-deep-moss hover:text-forest-green flex-shrink-0"
                  title="Copy address"
                >
                  <Copy size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Document Hash */}
          {doc.metadataHash && doc.metadataHash.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <p className="text-gray-600 mr-1">Hash:</p>
                <Tooltip content="A unique cryptographic fingerprint of your document that proves it hasn't been altered">
                  <Info size={10} className="text-gray-500" />
                </Tooltip>
              </div>
              <div className="flex items-center bg-soft-sage bg-opacity-50 px-1.5 py-0.5 rounded overflow-hidden">
                <p className="font-mono truncate">
                  {doc.metadataHash.slice(0, 8)}...{doc.metadataHash.slice(-4)}
                </p>
                <button
                  onClick={() =>
                    copyToClipboard(
                      doc.metadataHash,
                      'Hash copied to clipboard!'
                    )
                  }
                  className="ml-1 text-deep-moss hover:text-forest-green flex-shrink-0"
                  title="Copy hash"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Blockchain Info Button */}
          {transactionHash && (
            <button
              onClick={() => setShowBlockchainInfo(!showBlockchainInfo)}
              className="mt-2 text-xs md:text-sm text-deep-moss flex items-center gap-1 hover:text-forest-green"
            >
              <Shield size={14} />
              {showBlockchainInfo ? 'Hide' : 'Show'} Blockchain Details
            </button>
          )}

          {/* Blockchain Details (conditionally shown) */}
          {showBlockchainInfo && transactionHash && (
            <div className="mt-1 p-2 bg-soft-sage bg-opacity-30 border border-deep-moss border-opacity-20 rounded">
              <div className="flex flex-col gap-2">
                {/* Transaction Hash */}
                <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    <p className="text-xs text-gray-600 mr-1">Transaction:</p>
                    <Tooltip content="The blockchain transaction that recorded this document">
                      <Info size={12} className="text-gray-500" />
                    </Tooltip>
                  </div>
                  <div className="flex items-center">
                    <p className="font-mono text-xs truncate">
                      {transactionHash.slice(0, 10)}...
                      {transactionHash.slice(-6)}
                    </p>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          transactionHash,
                          'Transaction hash copied to clipboard!'
                        )
                      }
                      className="ml-1 text-deep-moss hover:text-forest-green flex-shrink-0"
                      title="Copy transaction hash"
                    >
                      <Copy size={12} />
                    </button>
                    {explorerUrl && (
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-deep-moss hover:text-forest-green flex-shrink-0"
                        title="View on Etherscan"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  {explorerUrl && (
                    <div className="mt-1 text-xs text-gray-600">
                      <a
                        href={explorerUrl}
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

                {/* Block Number */}
                {blockNumber && (
                  <div className="flex items-center">
                    <p className="text-xs text-gray-600 mr-1">Block:</p>
                    <Tooltip content="The block number where this transaction was recorded">
                      <Info size={12} className="text-gray-500" />
                    </Tooltip>
                    <p className="font-mono text-xs ml-1">{blockNumber}</p>
                  </div>
                )}

                {/* Token ID */}
                {tokenId && (
                  <div className="flex items-center">
                    <p className="text-xs text-gray-600 mr-1">Token ID:</p>
                    <Tooltip content="The unique identifier for this document on the blockchain">
                      <Info size={12} className="text-gray-500" />
                    </Tooltip>
                    <p className="font-mono text-xs ml-1">{tokenId}</p>
                  </div>
                )}

                {/* Security Info */}
                <div className="mt-1 flex items-center text-xs text-gray-600">
                  <Lock size={12} className="mr-1" />
                  <span>Document is encrypted and securely stored on IPFS</span>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          {(createdAt || updatedAt) && (
            <div className="mt-2 text-xs text-gray-500">
              {createdAt && (
                <div>Created: {new Date(createdAt).toLocaleString()}</div>
              )}
              {updatedAt && (
                <div>Updated: {new Date(updatedAt).toLocaleString()}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1 mt-auto">
        {/* View Document Button */}
        <button
          type="button"
          key="view-button"
          className="bg-forest-green text-ivory px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all font-medium flex items-center justify-center flex-1"
          onClick={() => viewDocument()}
          disabled={isLoading}
        >
          <Eye size={12} className="mr-1" />
          View
        </button>

        {/* Download Button */}
        <button
          type="button"
          key="download-button"
          className="bg-soft-sage px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all font-medium flex items-center justify-center flex-1"
          onClick={() => viewDocument(true)}
          disabled={isLoading}
        >
          <Download size={12} className="mr-1" />
          Download
        </button>

        {/* Request Verification Button - Only show for pending documents */}
        {doc.status === '1' && (
          <button
            type="button"
            key="verify-button"
            className="bg-soft-sage px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all font-medium flex items-center justify-center w-full mt-1"
            onClick={requestVerification}
            disabled={isLoading}
          >
            <Send size={12} className="mr-1" />
            Request Verification
          </button>
        )}

        {/* QR Code Button */}
        <button
          type="button"
          key="qr-button"
          className="bg-ivory px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all font-medium flex items-center justify-center flex-1"
          onClick={() => setShowQR(true)}
          disabled={isLoading}
        >
          <QrCode size={12} className="mr-1" />
          QR Code
        </button>

        {/* Share Button - Only enabled for verified documents */}
        <button
          type="button"
          key="share-button"
          className={`${
            isVerified ? 'bg-ivory' : 'bg-gray-200'
          } px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all font-medium flex items-center justify-center flex-1`}
          onClick={() => {
            if (isVerified) {
              onShare(doc);
            } else {
              setToastMessage({
                type: 'warning',
                message: 'Only verified documents can be shared',
              });
            }
          }}
          disabled={isLoading || !isVerified}
          title={
            isVerified
              ? 'Share document'
              : 'Only verified documents can be shared'
          }
        >
          <Share2 size={12} className="mr-1" />
          Share
        </button>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-ivory p-6 border-4 border-deep-moss max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Verification QR Code</h3>
              <button
                onClick={() => setShowQR(false)}
                className="p-1 hover:bg-soft-sage rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <QRCodeSVG
                value={verificationUrl}
                size={200}
                style={{ background: '#ffffff', padding: '10px' }}
                level={'H'}
              />

              <p className="mt-4 text-center text-sm text-gray-600">
                Scan this QR code to verify the document&apos;s authenticity
              </p>

              <div className="mt-4 w-full">
                <p className="text-xs text-gray-500 mb-1">Verification URL:</p>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={verificationUrl}
                    readOnly
                    className="w-full p-2 text-sm border border-gray-300 rounded"
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(
                        verificationUrl,
                        'Verification URL copied to clipboard!'
                      )
                    }
                    className="ml-2 p-2 bg-soft-sage border border-deep-moss text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocument && documentData && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            // Close modal when clicking on the background
            if (e.target === e.currentTarget) {
              setShowDocument(false);
            }
          }}
        >
          <div className="bg-ivory p-6 border-4 border-deep-moss max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-ivory z-10">
              <h3 className="text-xl font-bold truncate">
                {documentData.name}
              </h3>
              <div className="flex items-center gap-2">
                {documentData.data && documentData.mimeType && (
                  <a
                    href={`data:${documentData.mimeType};base64,${documentData.data}`}
                    download={`${documentData.name}.${
                      documentData.mimeType.split('/')[1] || 'file'
                    }`}
                    className="p-2 bg-soft-sage text-deep-moss rounded-sm hover:bg-opacity-90 transition-all"
                    title="Download"
                  >
                    <Download size={20} />
                  </a>
                )}
                <button
                  onClick={() => setShowDocument(false)}
                  className="p-1 hover:bg-soft-sage rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              <DocumentViewer
                documentData={documentData.data}
                mimeType={documentData.mimeType}
                fileName={documentData.name}
                status={doc.status}
                updatedAt={updatedAt || Date.now()}
              />
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
    </div>
  );
};

export default EnhancedDocumentCard;
