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
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { getDocumentTypeName } from '../../constants/documentTypes';
import { getAuthToken } from '../../../lib/token-util';
import axios from 'axios';
import { DocumentViewer } from '../../components/document/DocumentViewer';
import { Toast } from '../../components/ui/Toast';
import { getFirestore, doc as firestoreDoc, getDoc } from 'firebase/firestore';

interface DocumentTableProps {
  documents: Document[];
  orgNames: Record<string, string>;
  onShare: (doc: Document) => void;
  onAction: (doc: Document) => void;
}

export const DocumentTable = ({
  documents,
  orgNames,
  onShare,
  onAction,
}: DocumentTableProps) => {
  const [showDocument, setShowDocument] = useState(false);
  const [documentData, setDocumentData] = useState<{
    data: string;
    mimeType: string;
    name: string;
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

  // Function to fetch and view the document
  const viewDocument = async (doc: Document) => {
    try {
      setIsLoading(true);
      const idToken = await getAuthToken();

      if (!idToken) {
        throw new Error('Not authenticated');
      }

      console.log(`Fetching document details for ID: ${doc.documentId}`);

      // First, get the document details from Firestore to ensure we have the latest data
      const db = getFirestore();
      const docRef = firestoreDoc(db, 'documents', doc.documentId.toString());

      // Get the document from Firestore
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Document not found in Firestore');
      }

      const docData = docSnap.data();
      console.log('Document data from Firestore:', docData);

      // Now fetch the secure details from the API
      const response = await axios.get(
        `/api/documents/${doc.documentId}/secure-details`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      console.log('Document details response:', response.status);

      if (response.data && response.data.decryptedFile) {
        setDocumentData({
          data: response.data.decryptedFile,
          mimeType: response.data.mimeType || 'application/octet-stream',
          name:
            doc.documentName ||
            docData.documentName ||
            getDocumentTypeName(doc.documentType),
        });
        setShowDocument(true);
      } else {
        throw new Error('Invalid document data received from server');
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

  // Function to get verification URL
  const getVerificationUrl = (docId: string | number) => {
    return `${window.location.origin}/verify/${docId}`;
  };

  return (
    <div className="overflow-x-auto">
      {/* Desktop Table View */}
      <table className="w-full border-collapse hidden md:table">
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
                  {doc.documentName || getDocumentTypeName(doc.documentType)}
                </div>
                <div className="text-xs text-gray-600 mt-1 truncate max-w-[200px]">
                  {doc.metadataHash}
                </div>
              </td>
              <td className="px-4 py-3 text-deep-moss">
                {getDocumentTypeName(doc.documentType)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={doc.status} />
              </td>
              <td className="px-4 py-3 text-deep-moss">
                {orgNames[doc.verifier] ? (
                  <span className="font-medium">{orgNames[doc.verifier]}</span>
                ) : (
                  <span className="text-gray-500 text-sm">{`ID: ${doc.verifier.slice(
                    0,
                    5
                  )}...${doc.verifier.slice(-3)}`}</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex space-x-2">
                  <button
                    onClick={() => viewDocument(doc)}
                    className="p-2 bg-forest-green text-ivory rounded-sm hover:bg-opacity-90 transition-all"
                    title="View Document"
                    disabled={isLoading}
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    onClick={() => onAction(doc)}
                    className="p-2 bg-soft-sage text-deep-moss rounded-sm hover:bg-opacity-90 transition-all"
                    title={
                      doc.status === '1'
                        ? 'Check Status'
                        : doc.status === '0'
                        ? 'Download'
                        : 'View Reason'
                    }
                    disabled={isLoading}
                  >
                    {doc.status === '1' ? (
                      <FileText size={16} />
                    ) : doc.status === '0' ? (
                      <Download size={16} />
                    ) : (
                      <FileText size={16} />
                    )}
                  </button>

                  {doc.status === '1' && (
                    <button
                      onClick={() => requestVerification(doc)}
                      className="p-2 bg-soft-sage text-deep-moss rounded-sm hover:bg-opacity-90 transition-all"
                      title="Request Verification"
                      disabled={isLoading}
                    >
                      <Send size={16} />
                    </button>
                  )}

                  <button
                    onClick={() => setShowQR(doc.documentId.toString())}
                    className="p-2 bg-ivory text-deep-moss border border-deep-moss rounded-sm hover:bg-soft-sage transition-all"
                    title="QR Code"
                    disabled={isLoading}
                  >
                    <QrCode size={16} />
                  </button>

                  <button
                    onClick={() => onShare(doc)}
                    className="p-2 bg-ivory text-deep-moss border border-deep-moss rounded-sm hover:bg-soft-sage transition-all"
                    title="Share"
                    disabled={isLoading}
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
      <div className="md:hidden space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.documentId}
            className="bg-ivory p-4 border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-lg truncate max-w-[200px]">
                  {doc.documentName || getDocumentTypeName(doc.documentType)}
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  {getDocumentTypeName(doc.documentType)}
                </p>
              </div>
              <StatusBadge status={doc.status} />
            </div>

            <div className="mb-3">
              <p className="text-xs text-gray-600">Verifying Organization:</p>
              {orgNames[doc.verifier] ? (
                <p className="text-sm font-medium">{orgNames[doc.verifier]}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  {`ID: ${doc.verifier.slice(0, 5)}...${doc.verifier.slice(
                    -3
                  )}`}
                </p>
              )}
            </div>

            <div className="mb-3">
              <p className="text-xs text-gray-600">Document Hash:</p>
              <div className="flex items-center bg-soft-sage bg-opacity-50 p-1.5 rounded overflow-hidden">
                <p className="font-mono text-xs truncate">
                  {doc.metadataHash.slice(0, 15)}...{doc.metadataHash.slice(-4)}
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
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1">
              <button
                onClick={() => viewDocument(doc)}
                className="p-2 bg-forest-green text-ivory rounded-sm hover:bg-opacity-90 transition-all flex items-center justify-center"
                title="View Document"
                disabled={isLoading}
              >
                <Eye size={16} />
              </button>

              <button
                onClick={() => onAction(doc)}
                className="p-2 bg-soft-sage text-deep-moss rounded-sm hover:bg-opacity-90 transition-all flex items-center justify-center"
                title={
                  doc.status === '1'
                    ? 'Check Status'
                    : doc.status === '0'
                    ? 'Download'
                    : 'View Reason'
                }
                disabled={isLoading}
              >
                {doc.status === '1' ? (
                  <FileText size={16} />
                ) : doc.status === '0' ? (
                  <Download size={16} />
                ) : (
                  <FileText size={16} />
                )}
              </button>

              {doc.status === '1' ? (
                <button
                  onClick={() => requestVerification(doc)}
                  className="p-2 bg-soft-sage text-deep-moss rounded-sm hover:bg-opacity-90 transition-all flex items-center justify-center"
                  title="Request Verification"
                  disabled={isLoading}
                >
                  <Send size={16} />
                </button>
              ) : (
                <div className="p-2"></div> // Empty space to maintain grid
              )}

              <button
                onClick={() => setShowQR(doc.documentId.toString())}
                className="p-2 bg-ivory text-deep-moss border border-deep-moss rounded-sm hover:bg-soft-sage transition-all flex items-center justify-center"
                title="QR Code"
                disabled={isLoading}
              >
                <QrCode size={16} />
              </button>

              <button
                onClick={() => onShare(doc)}
                className="p-2 bg-ivory text-deep-moss border border-deep-moss rounded-sm hover:bg-soft-sage transition-all flex items-center justify-center"
                title="Share"
                disabled={isLoading}
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Document Viewer Modal */}
      {showDocument && documentData && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-ivory p-6 border-4 border-deep-moss max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
              fileName={documentData.name}
            />
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-ivory p-6 border-4 border-deep-moss max-w-md w-full">
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
