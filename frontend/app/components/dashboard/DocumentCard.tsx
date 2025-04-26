import { Document } from '../../types/dashboard';
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
} from 'lucide-react';
import { DocumentSeal } from '../document/DocumentSeal';
import { getDocumentTypeName } from '../../constants/documentTypes';
import { Toast } from '../ui/Toast';
import { DocumentViewer } from '../document/DocumentViewer';
import { NeubrutalistLoading } from '../ui/NeubrutalistLoading';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';
import {
  getVerificationUrl,
  isDocumentVerified,
} from '../../../lib/verification-util';

interface DocumentCardProps {
  doc: Document;
  onShare: (doc: Document) => void;
  onAction: (doc: Document) => void;
  documentName?: string;
  verifyingOrgName?: string;
}

export const DocumentCard = ({
  doc,
  onShare,
  onAction,
  documentName,
  verifyingOrgName,
}: DocumentCardProps) => {
  const [showQR, setShowQR] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [documentData, setDocumentData] = useState<{
    data: string;
    mimeType: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  const verificationUrl = getVerificationUrl(doc.documentId);

  // Function to fetch and view the document
  const viewDocument = async () => {
    try {
      setIsLoading(true);
      const idToken = await getAuthToken();

      if (!idToken) {
        throw new Error('Not authenticated');
      }

      const response = await axios.get(
        `/api/documents/${doc.documentId}/secure-details`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      setDocumentData({
        data: response.data.decryptedFile,
        mimeType: response.data.mimeType,
      });
      setShowDocument(true);
    } catch (error) {
      console.error('Error viewing document:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to load document for viewing',
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
    <div className="bg-ivory p-2 xs:p-3 sm:p-4 md:p-6 border-2 md:border-4 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[8px_8px_0px_0px_rgba(27,67,50,0.8)] transition-all flex flex-col h-full relative transform hover:-rotate-1">
      {/* Document corner fold */}
      <div className="absolute top-0 right-0 w-0 h-0 border-t-[15px] xs:border-t-[20px] md:border-t-[30px] border-r-[15px] xs:border-r-[20px] md:border-r-[30px] border-t-deep-moss border-r-deep-moss">
        <div className="absolute top-[-15px] xs:top-[-20px] md:top-[-30px] right-[-15px] xs:right-[-20px] md:right-[-30px] w-0 h-0 border-b-[13px] xs:border-b-[18px] md:border-b-[28px] border-l-[13px] xs:border-l-[18px] md:border-l-[28px] border-b-soft-sage border-l-soft-sage"></div>
      </div>

      {/* Document seal - for verified and rejected documents */}
      {(doc.status === 'Verified' ||
        doc.status === '0' ||
        doc.status === '2' ||
        doc.status === 'Rejected' ||
        doc.status === '3') && (
        <div className="absolute top-1 xs:top-2 right-6 xs:right-10 z-10">
          <DocumentSeal
            status={doc.status}
            date={doc.updatedAt || Date.now()}
            size={window.innerWidth < 480 ? 'small' : 'medium'}
            className="shadow-lg"
          />
        </div>
      )}
      {/* Header with document name and status */}
      <div className="flex justify-between items-start mb-2 xs:mb-3">
        <div className="overflow-hidden pr-2">
          <h4 className="font-bold text-base xs:text-lg md:text-xl truncate">
            {documentName || getDocumentTypeName(doc.documentType)}
          </h4>
          {documentName && (
            <p className="text-xs md:text-sm text-gray-600 mt-0.5 xs:mt-1 truncate">
              {getDocumentTypeName(doc.documentType)}
            </p>
          )}
        </div>
        <StatusBadge status={doc.status} />
      </div>

      {/* Document details */}
      <div className="mb-2 xs:mb-3 flex-grow">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1">
            <p className="text-xs md:text-sm text-gray-600">Verifying:</p>
            <p className="font-medium text-xs md:text-sm truncate max-w-full">
              {verifyingOrgName ||
                `ID: ${doc.verifier.slice(0, 5)}...${doc.verifier.slice(-3)}`}
            </p>
          </div>

          {doc.metadataHash && (
            <div className="mt-1 xs:mt-2">
              <p className="text-xs md:text-sm text-gray-600">Document Hash:</p>
              <div className="flex items-center bg-soft-sage bg-opacity-50 p-1 xs:p-1.5 rounded overflow-hidden">
                <p className="font-mono text-xs truncate">
                  {doc.metadataHash.slice(0, 10)}...{doc.metadataHash.slice(-4)}
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
                  <Copy size={12} className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 xs:gap-1.5 sm:gap-2 mt-auto">
        {/* View Document Button */}
        <button
          type="button"
          className="bg-forest-green text-ivory px-1.5 xs:px-2 py-1 xs:py-1.5 sm:px-3 sm:py-2 text-[10px] xs:text-xs sm:text-sm border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all font-bold flex items-center justify-center min-h-[32px] xs:min-h-[36px]"
          onClick={viewDocument}
          disabled={isLoading}
        >
          <Eye
            size={12}
            className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 mr-1 xs:mr-1 sm:mr-2"
          />
          <span className="hidden xs:inline">View</span>
        </button>

        {/* Download/Status Button */}
        <button
          type="button"
          className="bg-soft-sage px-1.5 xs:px-2 py-1 xs:py-1.5 sm:px-3 sm:py-2 text-[10px] xs:text-xs sm:text-sm border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all font-bold flex items-center justify-center min-h-[32px] xs:min-h-[36px]"
          onClick={() => onAction(doc)}
          disabled={isLoading}
        >
          {doc.status === '1' && (
            <>
              <FileText
                size={12}
                className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 mr-1 xs:mr-1 sm:mr-2"
              />
              <span className="hidden xs:inline">Status</span>
            </>
          )}
          {doc.status === '0' && (
            <>
              <Download
                size={12}
                className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 mr-1 xs:mr-1 sm:mr-2"
              />
              <span className="hidden xs:inline">Download</span>
            </>
          )}
          {doc.status === '2' && (
            <>
              <FileText
                size={12}
                className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 mr-1 xs:mr-1 sm:mr-2"
              />
              <span className="hidden xs:inline">Reason</span>
            </>
          )}
        </button>

        {/* Request Verification Button - Only show for pending documents */}
        {doc.status === '1' && (
          <button
            type="button"
            className="bg-soft-sage px-1.5 xs:px-2 py-1 xs:py-1.5 sm:px-3 sm:py-2 text-[10px] xs:text-xs sm:text-sm border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all font-bold flex items-center justify-center col-span-2 sm:col-span-1 min-h-[32px] xs:min-h-[36px]"
            onClick={requestVerification}
            disabled={isLoading}
          >
            <Send
              size={12}
              className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 mr-1 xs:mr-1 sm:mr-2"
            />
            <span className="hidden xs:inline">Request</span> Verification
          </button>
        )}

        {/* QR Code Button */}
        <button
          type="button"
          className="bg-ivory px-1.5 xs:px-2 py-1 xs:py-1.5 sm:px-3 sm:py-2 text-[10px] xs:text-xs sm:text-sm border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all font-bold flex items-center justify-center min-h-[32px] xs:min-h-[36px]"
          onClick={() => setShowQR(true)}
          disabled={isLoading}
        >
          <QrCode
            size={12}
            className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 mr-1 xs:mr-1 sm:mr-2"
          />
          <span className="hidden xs:inline">QR</span> Code
        </button>

        {/* Share Button */}
        <button
          type="button"
          className="bg-ivory px-1.5 xs:px-2 py-1 xs:py-1.5 sm:px-3 sm:py-2 text-[10px] xs:text-xs sm:text-sm border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all font-bold flex items-center justify-center sm:ml-auto min-h-[32px] xs:min-h-[36px]"
          onClick={() => {
            copyToClipboard(
              verificationUrl,
              'Verification link copied to clipboard!'
            );
          }}
          disabled={isLoading}
        >
          <Share2
            size={12}
            className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 mr-1 xs:mr-1 sm:mr-2"
          />
          <span className="hidden xs:inline">Share</span>
        </button>

        {/* QR Code Modal */}
        {showQR && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 xs:p-3 sm:p-4">
            <div className="bg-ivory p-3 xs:p-4 sm:p-6 border-2 sm:border-4 border-deep-moss max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-2 xs:mb-3 sm:mb-4">
                <h3 className="text-base xs:text-lg sm:text-xl font-bold">
                  Verification QR Code
                </h3>
                <button
                  onClick={() => setShowQR(false)}
                  className="p-1 hover:bg-soft-sage rounded-full touch-target"
                >
                  <X size={16} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="flex flex-col items-center">
                <QRCodeSVG
                  value={verificationUrl}
                  size={
                    window.innerWidth < 360
                      ? 140
                      : window.innerWidth < 480
                      ? 160
                      : 200
                  }
                  style={{ background: '#ffffff', padding: '10px' }}
                  level={'H'}
                />

                <p className="mt-2 xs:mt-3 sm:mt-4 text-center text-xs xs:text-sm text-gray-600">
                  Scan this QR code to verify the document&apos;s authenticity
                </p>

                <div className="mt-2 xs:mt-3 sm:mt-4 w-full">
                  <p className="text-xs text-gray-500 mb-1">
                    Verification URL:
                  </p>
                  <div className="flex flex-col xs:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={verificationUrl}
                      readOnly
                      className="w-full p-1.5 xs:p-2 text-xs xs:text-sm border border-gray-300 rounded"
                    />
                    <button
                      onClick={() =>
                        copyToClipboard(
                          verificationUrl,
                          'Verification URL copied to clipboard!'
                        )
                      }
                      className="w-full xs:w-auto p-1.5 xs:p-2 bg-soft-sage border border-deep-moss text-xs xs:text-sm touch-target min-h-[36px] flex items-center justify-center"
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
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 xs:p-3 sm:p-4">
          <div className="bg-ivory p-3 xs:p-4 sm:p-6 border-2 sm:border-4 border-deep-moss max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2 xs:mb-3 sm:mb-4">
              <h3 className="text-base xs:text-lg sm:text-xl font-bold">
                Document Viewer
              </h3>
              <button
                onClick={() => setShowDocument(false)}
                className="p-1 hover:bg-soft-sage rounded-full touch-target"
              >
                <X size={16} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <DocumentViewer
              documentData={documentData.data}
              mimeType={documentData.mimeType}
              fileName={documentName || `document-${doc.documentId}`}
              status={doc.status}
              updatedAt={doc.updatedAt}
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
        <NeubrutalistLoading
          message="Document"
          subMessage="Loading document content..."
          fullScreen={true}
          showSeal={true}
        />
      )}
    </div>
  );
};
