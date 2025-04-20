import { Document } from '../../models/Document';
import { StatusBadge } from './StatusBadge';
import { useState, useEffect } from 'react';
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
  Key,
} from 'lucide-react';
import { getDocumentTypeName } from '../../constants/documentTypes';
import { Toast } from '../ui/Toast';
import { DocumentViewer } from '../document/DocumentViewer';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';
import { Tooltip } from '../ui/Tooltip';

interface EnhancedDocumentCardProps {
  doc: Document;
  onShare: (doc: Document) => void;
  onAction?: (doc: Document) => void;
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
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  const verificationUrl = doc.documentId
    ? `${window.location.origin}/verify/${doc.documentId}`
    : `${window.location.origin}/verify`;
  const explorerUrl = transactionHash
    ? `https://sepolia.etherscan.io/tx/${transactionHash}`
    : undefined;

  // Function to fetch and view the document
  const viewDocument = async () => {
    try {
      if (!doc || !doc.documentId) {
        throw new Error('Invalid document ID');
      }

      setIsLoading(true);
      const idToken = await getAuthToken();

      if (!idToken) {
        throw new Error('Not authenticated');
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

      if (!response.data || !response.data.decryptedFile) {
        throw new Error('Invalid document data received from server');
      }

      setDocumentData({
        data: response.data.decryptedFile,
        mimeType: response.data.mimeType || 'application/octet-stream',
      });
      setShowDocument(true);
    } catch (error) {
      console.error('Error viewing document:', error);
      // More detailed error logging
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }
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
      {/* Document-like styling */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-soft-sage border-b border-l border-deep-moss transform rotate-[-10deg] translate-x-[8px] translate-y-[-8px]"></div>

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
                (doc.verifier
                  ? `ID: ${doc.verifier.slice(0, 5)}...${doc.verifier.slice(
                      -3
                    )}`
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
                  title="Copy wallet address"
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
                        title="View on blockchain explorer"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
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
          onClick={viewDocument}
          disabled={isLoading}
        >
          <Eye size={12} className="mr-1" />
          View
        </button>

        {/* Download/Status Button */}
        <button
          type="button"
          key="action-button"
          className="bg-soft-sage px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all font-medium flex items-center justify-center flex-1"
          onClick={() => onAction(doc)}
          disabled={isLoading}
        >
          {doc.status === '1' && (
            <>
              <FileText key="status-icon-1" size={12} className="mr-1" />
              Status
            </>
          )}
          {doc.status === '0' && (
            <>
              <Download key="status-icon-0" size={12} className="mr-1" />
              Download
            </>
          )}
          {doc.status === '2' && (
            <>
              <FileText key="status-icon-2" size={12} className="mr-1" />
              Reason
            </>
          )}
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

        {/* Share Button */}
        <button
          type="button"
          key="share-button"
          className="bg-ivory px-2 py-1 text-xs border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all font-medium flex items-center justify-center flex-1"
          onClick={() => {
            copyToClipboard(
              verificationUrl,
              'Verification link copied to clipboard!'
            );
          }}
          disabled={isLoading}
        >
          <Share2 size={12} className="mr-1" />
          Share
        </button>

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
                  <p className="text-xs text-gray-500 mb-1">
                    Verification URL:
                  </p>
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
      </div>

      {/* Document Viewer Modal */}
      {showDocument && documentData && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-ivory p-6 border-4 border-deep-moss max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Document Viewer</h3>
              <div className="flex items-center gap-2">
                {documentData.data && documentData.mimeType && (
                  <a
                    href={`data:${documentData.mimeType};base64,${documentData.data}`}
                    download={`${
                      documentName || `document-${doc.documentId}`
                    }.${documentData.mimeType.split('/')[1] || 'file'}`}
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

            <DocumentViewer
              documentData={documentData.data}
              mimeType={documentData.mimeType}
              fileName={documentName || `document-${doc.documentId}`}
            />
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
