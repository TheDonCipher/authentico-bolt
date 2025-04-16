'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, X, ExternalLink, Copy, FileText } from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import axios from 'axios';

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
  const docId = params.docId as string;

  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchDocumentVerification = async () => {
      try {
        setLoading(true);

        // Call the public verification endpoint
        const response = await axios.get(`/api/verify/${docId}`);

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
        console.error('Error fetching document verification:', error);
        setError(error.response?.data?.error || 'Failed to verify document');
      } finally {
        setLoading(false);
      }
    };

    if (docId) {
      fetchDocumentVerification();
    }
  }, [docId]);

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
        <div className="bg-white border-4 border-[#556B2F] p-8 shadow-brutal">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-64 bg-gray-200 mb-4"></div>
            <div className="h-4 w-48 bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F7F2] flex items-center justify-center">
        <div className="bg-white border-4 border-[#556B2F] p-8 shadow-brutal text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="mb-6">{error}</p>
          <Link
            href="/"
            className="bg-[#698B69] text-white px-4 py-2 font-bold border-2 border-[#556B2F]"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F2] text-[#2F4F4F] flex flex-col font-archivo">
      {/* Header */}
      <header className="bg-[#E8EDE1] border-b-4 border-[#556B2F] sticky top-0 z-20">
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
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border-4 border-[#556B2F] p-6 md:p-8 shadow-brutal">
            <h1 className="text-3xl font-black mb-2 text-[#2F4F4F]">
              Document Verification
            </h1>

            {document && (
              <>
                <div
                  className={`inline-flex items-center font-bold text-lg mb-6 ${getStatusColor(
                    document.status
                  )}`}
                >
                  {getStatusIcon(document.status)}
                  {document.status}
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
