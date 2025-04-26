'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, X, ExternalLink, Copy, FileText } from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import { DocumentSeal } from '../../components/document/DocumentSeal';
import { NeubrutalistLoading } from '../../components/ui/NeubrutalistLoading';
import axios from 'axios';
import '../../components/document/documentViewer.css';

interface DocumentData {
  documentName: string;
  documentType: string;
  documentTypeName: string;
  status: string;
  createdAt: Date;
  updatedAt: Date | null;
  verifiedAt: Date | null;
  ownerName: string;
  verifyingOrgName: string;
  transactionHash: string;
  verificationTransactionHash?: string;
  tokenId: number;
  originalDocHash: string;
}

const VerifyPage = () => {
  const params = useParams();
  const docId = params?.docId as string;

  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [animateStamp, setAnimateStamp] = useState(false);

  useEffect(() => {
    const fetchDocumentVerification = async () => {
      try {
        setLoading(true);
        console.log(
          `[Verify Page] Fetching verification for document ID: ${docId}`
        );

        // Call the public verification endpoint with timeout
        const response = await axios.get(`/api/verify/${docId}`, {
          timeout: 20000, // 20 second timeout
        });

        console.log('[Verify Page] Verification response:', response.data);

        // Format dates
        const data = response.data;
        setDocument({
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
          verifiedAt: data.verifiedAt ? new Date(data.verifiedAt) : null,
        });

        setError(null);
      } catch (error: any) {
        console.error(
          '[Verify Page] Error fetching document verification:',
          error
        );

        // Log more detailed error information
        if (error.response) {
          console.error(
            '[Verify Page] Error response status:',
            error.response.status
          );
          console.error(
            '[Verify Page] Error response data:',
            error.response.data
          );
        } else if (error.request) {
          console.error('[Verify Page] No response received:', error.request);
        } else {
          console.error('[Verify Page] Request setup error:', error.message);
        }

        // Set a more descriptive error message
        const errorMessage =
          error.response?.data?.error || 'Failed to verify document';
        const errorDetails = error.response?.data?.details || error.message;
        setError(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`);
      } finally {
        setLoading(false);
      }
    };

    if (docId) {
      fetchDocumentVerification();
    }
  }, [docId]);

  // Start animation after component mounts
  useEffect(() => {
    // Small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      setAnimateStamp(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setToastMessage({
          type: 'success',
          message: `${label} copied to clipboard`,
        });
        setTimeout(() => setToastMessage(null), 3000);
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        setToastMessage({
          type: 'error',
          message: 'Failed to copy to clipboard',
        });
        setTimeout(() => setToastMessage(null), 3000);
      });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'pending verification':
        return 'text-amber-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return <Check className="inline-block mr-1" size={18} />;
      case 'rejected':
        return <X className="inline-block mr-1" size={18} />;
      default:
        return <FileText className="inline-block mr-1" size={18} />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7F2] flex items-center justify-center">
        <div className="w-full max-w-md">
          <NeubrutalistLoading
            message="Verifying Document"
            subMessage="Retrieving blockchain verification data..."
            fullScreen={false}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F7F2] flex items-center justify-center">
        <div className="bg-white border-4 border-[#556B2F] p-8 shadow-brutal text-center max-w-2xl mx-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Verification Error
          </h1>
          <p className="mb-6 whitespace-pre-wrap">{error}</p>
          <div className="mb-6 text-left bg-gray-100 p-4 rounded border border-gray-300 text-sm">
            <p className="font-semibold mb-2">Troubleshooting:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Check if the document ID is correct</li>
              <li>
                The document may not have been anchored on the blockchain yet
              </li>
              <li>
                The document may have been deleted or is no longer available
              </li>
              <li>
                There might be a temporary issue with the verification service
              </li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/"
              className="bg-[#698B69] text-white px-4 py-2 font-bold border-2 border-[#556B2F] hover:bg-[#556B2F] transition-colors"
            >
              Return Home
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-[#556B2F] px-4 py-2 font-bold border-2 border-[#556B2F] hover:bg-gray-100 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F2] text-[#2F4F4F] flex flex-col font-archivo w-full max-w-full">
      {/* Header */}
      <header className="bg-[#E8EDE1] border-b-4 border-[#556B2F] sticky top-0 z-20 w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-2xl font-black text-[#2F4F4F] transform -rotate-2 bg-[#D2E3C8] p-2 border-4 border-[#556B2F] inline-block"
          >
            AUTHENTICO
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-4 md:p-8 w-full">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border-2 sm:border-4 border-[#556B2F] p-4 sm:p-6 md:p-8 shadow-brutal relative">
            <h1 className="text-3xl font-black mb-2 text-[#2F4F4F]">
              Document Verification
            </h1>

            {document && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start mb-6 relative">
                  <div
                    className={`inline-flex items-center font-bold text-base sm:text-lg ${getStatusColor(
                      document.status
                    )}`}
                  >
                    {getStatusIcon(document.status)}
                    {document.status}
                  </div>

                  {/* Document Seal */}
                  {(document.status.toLowerCase() === 'verified' ||
                    document.status === '0' ||
                    document.status === '2' ||
                    document.status.toLowerCase() === 'rejected' ||
                    document.status === '3') && (
                    <div
                      className={`stamp-container relative sm:absolute top-auto sm:top-4 right-auto sm:right-4 mt-4 sm:mt-0 ${
                        animateStamp
                          ? 'stamp-animation'
                          : 'stamp-animation-initial'
                      }`}
                    >
                      <DocumentSeal
                        status={document.status}
                        date={document.updatedAt || document.createdAt}
                        size="medium"
                        className={`${
                          animateStamp
                            ? 'stamp-ink-animation'
                            : 'stamp-ink-animation-initial'
                        }`}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h2 className="text-sm font-bold uppercase text-gray-500">
                        Document Name
                      </h2>
                      <p className="text-lg">{document.documentName}</p>
                    </div>

                    <div>
                      <h2 className="text-sm font-bold uppercase text-gray-500">
                        Document Type
                      </h2>
                      <p className="text-lg">{document.documentType}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h2 className="text-sm font-bold uppercase text-gray-500">
                        Document Owner
                      </h2>
                      <p className="text-lg">{document.ownerName}</p>
                    </div>

                    <div>
                      <h2 className="text-sm font-bold uppercase text-gray-500">
                        Verifying Organization
                      </h2>
                      <p className="text-lg">{document.verifyingOrgName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h2 className="text-sm font-bold uppercase text-gray-500">
                        Created Date
                      </h2>
                      <p className="text-lg">
                        {formatDate(document.createdAt)}
                      </p>
                    </div>

                    {document.updatedAt && (
                      <div>
                        <h2 className="text-sm font-bold uppercase text-gray-500">
                          Last Updated
                        </h2>
                        <p className="text-lg">
                          {formatDate(document.updatedAt)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-sm font-bold uppercase text-gray-500">
                      Document Hash
                    </h2>
                    <div className="flex items-center">
                      <p className="text-lg font-mono break-all">
                        {document.originalDocHash}
                      </p>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            document.originalDocHash,
                            'Document hash'
                          )
                        }
                        className="ml-2 text-gray-500 hover:text-gray-700"
                        title="Copy to clipboard"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  {document.transactionHash && (
                    <div>
                      <h2 className="text-sm font-bold uppercase text-gray-500">
                        Blockchain Transaction
                      </h2>
                      <div className="flex items-center">
                        <p className="text-lg font-mono">
                          {truncateHash(document.transactionHash)}
                        </p>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              document.transactionHash,
                              'Transaction hash'
                            )
                          }
                          className="ml-2 text-gray-500 hover:text-gray-700"
                          title="Copy to clipboard"
                        >
                          <Copy size={16} />
                        </button>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${document.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-500 hover:text-blue-700"
                          title="View on Etherscan"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  )}

                  {document.tokenId > 0 && (
                    <div>
                      <h2 className="text-sm font-bold uppercase text-gray-500">
                        Token ID
                      </h2>
                      <p className="text-lg font-mono">{document.tokenId}</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t-2 border-gray-200">
                  <p className="text-sm text-gray-500">
                    This document verification record is stored on the Ethereum
                    blockchain and cannot be altered. The document content is
                    encrypted and stored securely.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast type={toastMessage.type} message={toastMessage.message} />
        </div>
      )}
    </div>
  );
};

export default VerifyPage;
