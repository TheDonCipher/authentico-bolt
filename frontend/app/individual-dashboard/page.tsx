'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Check,
  X,
  Bell,
  Grid,
  List,
  FileText,
  Share2,
  QrCode,
  Eye,
  Lock,
  Database,
  Shield,
  Copy,
  Download,
  Upload,
} from 'lucide-react';
import { Toast } from '../components/ui/Toast';
import { motion } from 'framer-motion';

interface ToastMessage {
  type: 'success' | 'error' | 'warning';
  message: string;
}

interface DemoDocument {
  id: string;
  name: string;
  type: string;
  status: 'verified' | 'pending' | 'rejected';
  uploadDate: string;
  organization: string;
  txHash: string;
  ipfsCid: string;
  previewUrl: string;
}

interface ModalState {
  isOpen: boolean;
  type: 'view' | 'details' | 'share' | 'qr' | 'upload' | null;
  document: DemoDocument | null;
}

const IndividualDashboardDemo = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: null,
    document: null,
  });
  const router = useRouter();

  // Demo documents data
  const demoDocuments: DemoDocument[] = [
    {
      id: '12345',
      name: 'Passport',
      type: 'Identity Document',
      status: 'verified',
      uploadDate: '01/15/2023',
      organization: 'Ministry of Foreign Affairs',
      txHash: '0x71c...9e3f',
      ipfsCid: 'Qm7a...8j2k',
      previewUrl: '/demo-passport.png',
    },
    {
      id: '12346',
      name: 'Degree Certificate',
      type: 'Education Document',
      status: 'pending',
      uploadDate: '02/20/2023',
      organization: 'University of Technology',
      txHash: '0x83d...7c2a',
      ipfsCid: 'Qm9b...4f3p',
      previewUrl: '/demo-degree.png',
    },
    {
      id: '12347',
      name: 'Employment Contract',
      type: 'Employment Document',
      status: 'verified',
      uploadDate: '03/10/2023',
      organization: 'TechCorp Inc.',
      txHash: '0x92f...5d1b',
      ipfsCid: 'Qm3c...7g5r',
      previewUrl: '/demo-contract.png',
    },
  ];

  // Check if we need to show a message for organization users
  useEffect(() => {
    const showMessage = sessionStorage.getItem('showIndividualAccountMessage');
    if (showMessage === 'true') {
      setToastMessage({
        type: 'warning',
        message:
          'You are viewing the individual dashboard demo. Organization users need to register a separate individual account to use this dashboard.',
      });
      sessionStorage.removeItem('showIndividualAccountMessage');
    }
  }, []);

  // Handle connect wallet button click
  const handleConnectWallet = () => {
    setToastMessage({
      type: 'warning',
      message:
        'This is a demo. In the real app, this would connect to your wallet.',
    });
  };

  // Handle document view
  const handleViewDocument = (document: DemoDocument) => {
    setModal({
      isOpen: true,
      type: 'view',
      document,
    });
  };

  // Handle document details
  const handleViewDetails = (document: DemoDocument) => {
    setModal({
      isOpen: true,
      type: 'details',
      document,
    });
  };

  // Handle document sharing
  const handleShareDocument = (document: DemoDocument) => {
    setModal({
      isOpen: true,
      type: 'share',
      document,
    });
  };

  // Handle QR code generation
  const handleShowQR = (document: DemoDocument) => {
    setModal({
      isOpen: true,
      type: 'qr',
      document,
    });
  };

  // Handle document upload
  const handleUploadDocument = () => {
    setModal({
      isOpen: true,
      type: 'upload',
      document: null,
    });
  };

  // Close modal
  const closeModal = () => {
    setModal({
      isOpen: false,
      type: null,
      document: null,
    });
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage({
      type: 'success',
      message: 'Copied to clipboard!',
    });
  };

  return (
    <div className="min-h-screen bg-ivory text-deep-moss flex flex-col md:flex-row font-archivo">
      {/* Sidebar - now becomes a bottom nav on mobile */}
      <aside className="fixed bottom-0 left-0 right-0 md:static w-full md:w-80 bg-soft-sage p-3 md:p-6 border-t-4 md:border-r-4 md:border-t-0 border-deep-moss flex md:flex-col h-auto md:h-screen md:sticky md:top-0 z-30">
        <Link
          href="/"
          className="hidden md:block text-2xl font-black mb-8 text-deep-moss bg-soft-sage p-2 border-4 border-deep-moss inline-block"
        >
          AUTHENTICO
        </Link>
        {/* Demo user info */}
        <div className="hidden md:flex items-center gap-2 mb-6 p-4 bg-soft-sage border-2 border-deep-moss">
          <div className="bg-forest-green text-ivory p-2 rounded-full">
            <span className="font-bold">Demo</span>
          </div>
          <div>
            <p className="font-bold">Demo User</p>
            <p className="text-sm">This is a demo dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex justify-around md:block">
          <ul className="flex md:flex-col w-full gap-2 md:gap-4">
            <li className="w-full">
              <button
                onClick={() => setActiveTab('documents')}
                className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base ${
                  activeTab === 'documents'
                    ? 'bg-forest-green text-ivory'
                    : 'hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                <span className="hidden md:inline">My Documents</span>
                <span className="md:hidden">Docs</span>
              </button>
            </li>
            <li className="w-full">
              <button
                onClick={() => setActiveTab('activity')}
                className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base ${
                  activeTab === 'activity'
                    ? 'bg-forest-green text-ivory'
                    : 'hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                <span className="hidden md:inline">Activity</span>
                <span className="md:hidden">Activity</span>
              </button>
            </li>
            <li className="w-full">
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base ${
                  activeTab === 'settings'
                    ? 'bg-forest-green text-ivory'
                    : 'hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                <span className="hidden md:inline">Settings</span>
                <span className="md:hidden">Settings</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
        {/* Header */}
        <header className="bg-soft-sage border-b-4 border-deep-moss sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:h-20 flex flex-col md:flex-row gap-4 md:gap-0 md:items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-deep-moss mr-4">
                Individual Dashboard Demo
              </h2>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
              <button
                onClick={handleConnectWallet}
                className="bg-forest-green text-ivory p-2 md:px-4 md:py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center gap-2"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          {activeTab === 'documents' && (
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
              <div className="mb-6 p-6 bg-sunflower bg-opacity-20 border-2 border-deep-moss rounded-md">
                <h3 className="text-xl font-bold mb-3">
                  Welcome to Authentico Individual Dashboard
                </h3>
                <p className="mb-4">
                  This is a demo of the Individual Dashboard where you can
                  securely manage your official documents. Connect your wallet
                  to access your personal dashboard and start using the full
                  features.
                </p>

                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <button
                    onClick={handleConnectWallet}
                    className="inline-block bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                  >
                    Connect Wallet
                  </button>
                  <Link
                    href="/register/individual"
                    className="inline-block bg-sunflower text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                  >
                    Register Individual Account
                  </Link>
                  <Link
                    href="/"
                    className="inline-block bg-soft-sage text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                  >
                    Learn More
                  </Link>
                </div>
              </div>

              {/* Educational section about blockchain */}
              <div className="mb-8 p-6 bg-soft-sage border-2 border-deep-moss rounded-md">
                <h3 className="text-xl font-bold mb-4 text-deep-moss">
                  How Authentico Uses Blockchain Technology
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <motion.div
                    className="bg-ivory p-4 border-2 border-deep-moss flex flex-col items-center text-center"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className="bg-forest-green text-ivory p-3 rounded-full mb-3">
                      <Lock size={24} />
                    </div>
                    <h4 className="font-bold mb-2">Secure Encryption</h4>
                    <p className="text-sm">
                      Your documents are encrypted with AES-256 encryption
                      before being stored, ensuring only authorized parties can
                      access them.
                    </p>
                  </motion.div>

                  <motion.div
                    className="bg-ivory p-4 border-2 border-deep-moss flex flex-col items-center text-center"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className="bg-forest-green text-ivory p-3 rounded-full mb-3">
                      <Database size={24} />
                    </div>
                    <h4 className="font-bold mb-2">Decentralized Storage</h4>
                    <p className="text-sm">
                      Documents are stored on IPFS (InterPlanetary File System),
                      a distributed system for storing and accessing files.
                    </p>
                  </motion.div>

                  <motion.div
                    className="bg-ivory p-4 border-2 border-deep-moss flex flex-col items-center text-center"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className="bg-forest-green text-ivory p-3 rounded-full mb-3">
                      <Shield size={24} />
                    </div>
                    <h4 className="font-bold mb-2">Blockchain Verification</h4>
                    <p className="text-sm">
                      Document hashes are recorded on the Ethereum blockchain
                      (Sepolia testnet), creating an immutable record of
                      verification.
                    </p>
                  </motion.div>
                </div>

                <div className="bg-ivory p-4 border-2 border-deep-moss rounded-md">
                  <h4 className="font-bold mb-2">
                    Document Verification Process:
                  </h4>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      You upload a document and select a verifying organization
                    </li>
                    <li>The document is encrypted and stored on IPFS</li>
                    <li>
                      A hash of the document is created and recorded on the
                      blockchain
                    </li>
                    <li>
                      The selected organization reviews and verifies the
                      document
                    </li>
                    <li>
                      The verification status is updated on the blockchain
                    </li>
                    <li>
                      You can now share your verified document with a secure
                      link or QR code
                    </li>
                  </ol>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-2xl font-bold text-deep-moss">
                  My Documents
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex border-2 border-deep-moss">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${
                        viewMode === 'grid'
                          ? 'bg-forest-green text-ivory'
                          : 'bg-soft-sage'
                      }`}
                      aria-label="Grid view"
                    >
                      <Grid size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2 ${
                        viewMode === 'table'
                          ? 'bg-forest-green text-ivory'
                          : 'bg-soft-sage'
                      }`}
                      aria-label="Table view"
                    >
                      <List size={20} />
                    </button>
                  </div>
                  <button
                    onClick={handleUploadDocument}
                    className="bg-forest-green text-ivory p-2 md:px-4 md:py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all flex items-center gap-2"
                  >
                    <Plus size={20} />
                    <span className="hidden md:inline">Upload Document</span>
                  </button>
                </div>
              </div>

              <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {demoDocuments.map((doc) => (
                    <motion.div
                      key={doc.id}
                      className="bg-white border-2 border-deep-moss p-4 hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all relative"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-deep-moss">{doc.name}</h3>
                        <div
                          className={`px-2 py-1 text-xs font-bold border rounded ${
                            doc.status === 'verified'
                              ? 'bg-green-100 text-green-800 border-green-800'
                              : doc.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-800'
                              : 'bg-red-100 text-red-800 border-red-800'
                          }`}
                        >
                          {doc.status === 'verified'
                            ? 'Verified'
                            : doc.status === 'pending'
                            ? 'Pending'
                            : 'Rejected'}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{doc.type}</p>
                      <div className="flex justify-between text-sm text-gray-500 mb-3">
                        <span>Uploaded: {doc.uploadDate}</span>
                        <span>ID: #{doc.id}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        <p>
                          Verifying Organization:{' '}
                          <span className="font-semibold">
                            {doc.organization}
                          </span>
                        </p>
                        <p>
                          Blockchain TX:{' '}
                          <span className="font-mono">{doc.txHash}</span>
                        </p>
                        <p>
                          IPFS CID:{' '}
                          <span className="font-mono">{doc.ipfsCid}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          onClick={() => handleViewDocument(doc)}
                          className="p-1 text-deep-moss hover:bg-soft-sage rounded"
                          title="View Document"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleViewDetails(doc)}
                          className="p-1 text-deep-moss hover:bg-soft-sage rounded"
                          title="View Details"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => handleShareDocument(doc)}
                          className="p-1 text-deep-moss hover:bg-soft-sage rounded"
                          title="Share Document"
                        >
                          <Share2 size={18} />
                        </button>
                        <button
                          onClick={() => handleShowQR(doc)}
                          className="p-1 text-deep-moss hover:bg-soft-sage rounded"
                          title="QR Code"
                        >
                          <QrCode size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
                <h3 className="text-2xl font-bold mb-6 text-deep-moss">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {/* Demo Activity 1 */}
                  <div className="bg-ivory p-4 border-2 border-deep-moss flex items-start gap-3">
                    <div className="bg-soft-sage p-2 border-2 border-deep-moss">
                      <Check size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-deep-moss">
                        Your Passport document has been verified by Ministry of
                        Foreign Affairs
                      </p>
                      <p className="text-sm text-gray-500">01/15/2023</p>
                    </div>
                  </div>

                  {/* Demo Activity 2 */}
                  <div className="bg-ivory p-4 border-2 border-deep-moss flex items-start gap-3">
                    <div className="bg-soft-sage p-2 border-2 border-deep-moss">
                      <Bell size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-deep-moss">
                        Your Degree Certificate is pending verification by
                        University of Technology
                      </p>
                      <p className="text-sm text-gray-500">02/20/2023</p>
                    </div>
                  </div>

                  {/* Demo Activity 3 */}
                  <div className="bg-ivory p-4 border-2 border-deep-moss flex items-start gap-3">
                    <div className="bg-soft-sage p-2 border-2 border-deep-moss">
                      <Check size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-deep-moss">
                        Your Employment Contract has been verified by TechCorp
                        Inc.
                      </p>
                      <p className="text-sm text-gray-500">03/10/2023</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-7xl mx-auto">
              <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
                <h3 className="text-2xl font-bold mb-6 text-deep-moss">
                  Account Settings
                </h3>
                <div className="bg-ivory p-6 border-2 border-deep-moss mb-6">
                  <p className="text-deep-moss mb-4">
                    Connect your wallet to access your account settings and
                    manage your profile.
                  </p>
                  <button
                    onClick={handleConnectWallet}
                    className="bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                  >
                    Connect Wallet
                  </button>
                </div>

                <div className="bg-sunflower bg-opacity-20 p-6 border-2 border-deep-moss">
                  <h4 className="font-bold mb-3">
                    About Wallet Authentication
                  </h4>
                  <p className="mb-4">
                    Authentico uses blockchain wallet authentication to provide
                    a secure, passwordless experience:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Your wallet serves as your digital identity</li>
                    <li>No need to remember passwords</li>
                    <li>Cryptographically secure authentication</li>
                    <li>Full control over your data and documents</li>
                    <li>Compatible with most popular web3 wallets</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Components */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-ivory border-4 border-deep-moss p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-deep-moss">
                {modal.type === 'view' && 'Document Preview'}
                {modal.type === 'details' && 'Document Details'}
                {modal.type === 'share' && 'Share Document'}
                {modal.type === 'qr' && 'QR Code'}
                {modal.type === 'upload' && 'Upload New Document'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-soft-sage rounded"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            {modal.type === 'view' && modal.document && (
              <div className="space-y-4">
                <div className="bg-white border-2 border-deep-moss p-4 flex flex-col items-center">
                  <div className="w-full max-w-md h-64 bg-gray-200 flex items-center justify-center mb-4">
                    <FileText size={64} className="text-gray-400" />
                  </div>
                  <p className="text-center text-deep-moss">
                    This is a demo preview of {modal.document.name}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border-2 border-deep-moss hover:bg-soft-sage"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setToastMessage({
                        type: 'success',
                        message: 'Document downloaded successfully!',
                      });
                    }}
                    className="px-4 py-2 bg-forest-green text-ivory border-2 border-deep-moss flex items-center gap-2"
                  >
                    <Download size={18} />
                    Download
                  </button>
                </div>
              </div>
            )}

            {modal.type === 'details' && modal.document && (
              <div className="space-y-4">
                <div className="bg-white border-2 border-deep-moss p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold text-deep-moss">Document Name</p>
                      <p>{modal.document.name}</p>
                    </div>
                    <div>
                      <p className="font-bold text-deep-moss">Document Type</p>
                      <p>{modal.document.type}</p>
                    </div>
                    <div>
                      <p className="font-bold text-deep-moss">Upload Date</p>
                      <p>{modal.document.uploadDate}</p>
                    </div>
                    <div>
                      <p className="font-bold text-deep-moss">Status</p>
                      <p className="capitalize">{modal.document.status}</p>
                    </div>
                    <div>
                      <p className="font-bold text-deep-moss">
                        Verifying Organization
                      </p>
                      <p>{modal.document.organization}</p>
                    </div>
                    <div>
                      <p className="font-bold text-deep-moss">Document ID</p>
                      <p>#{modal.document.id}</p>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <p className="font-bold text-deep-moss">
                        Blockchain Transaction
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono">{modal.document.txHash}</p>
                        <button
                          onClick={() =>
                            modal.document &&
                            handleCopyToClipboard(modal.document.txHash)
                          }
                          className="p-1 hover:bg-soft-sage rounded"
                          title="Copy to clipboard"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <p className="font-bold text-deep-moss">IPFS CID</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono">{modal.document.ipfsCid}</p>
                        <button
                          onClick={() =>
                            modal.document &&
                            handleCopyToClipboard(modal.document.ipfsCid)
                          }
                          className="p-1 hover:bg-soft-sage rounded"
                          title="Copy to clipboard"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border-2 border-deep-moss hover:bg-soft-sage"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {modal.type === 'share' && modal.document && (
              <div className="space-y-4">
                <div className="bg-white border-2 border-deep-moss p-4">
                  <p className="mb-4">Share this document with others:</p>

                  <div className="mb-4">
                    <p className="font-bold text-deep-moss mb-2">
                      Verification Link
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={`https://authentico.com/verify/${modal.document.id}`}
                        readOnly
                        className="w-full p-2 border-2 border-deep-moss bg-soft-sage"
                      />
                      <button
                        onClick={() =>
                          modal.document &&
                          handleCopyToClipboard(
                            `https://authentico.com/verify/${modal.document.id}`
                          )
                        }
                        className="p-2 bg-forest-green text-ivory border-2 border-deep-moss"
                        title="Copy to clipboard"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="font-bold text-deep-moss mb-2">
                      Share via Email
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="Enter recipient's email"
                        className="flex-1 p-2 border-2 border-deep-moss"
                      />
                      <button
                        onClick={() => {
                          setToastMessage({
                            type: 'success',
                            message: 'Email sent successfully!',
                          });
                          closeModal();
                        }}
                        className="px-4 py-2 bg-forest-green text-ivory border-2 border-deep-moss"
                      >
                        Send
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-deep-moss mb-2">
                      Share on Social Media
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setToastMessage({
                            type: 'success',
                            message: 'Shared on Twitter!',
                          });
                        }}
                        className="px-4 py-2 bg-[#1DA1F2] text-white border-2 border-deep-moss"
                      >
                        Twitter
                      </button>
                      <button
                        onClick={() => {
                          setToastMessage({
                            type: 'success',
                            message: 'Shared on LinkedIn!',
                          });
                        }}
                        className="px-4 py-2 bg-[#0077B5] text-white border-2 border-deep-moss"
                      >
                        LinkedIn
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border-2 border-deep-moss hover:bg-soft-sage"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {modal.type === 'qr' && modal.document && (
              <div className="space-y-4">
                <div className="bg-white border-2 border-deep-moss p-4 flex flex-col items-center">
                  <div className="w-48 h-48 bg-white border-2 border-deep-moss flex items-center justify-center mb-4">
                    <QrCode size={120} />
                  </div>
                  <p className="text-center text-deep-moss">
                    Scan this QR code to verify {modal.document.name}
                  </p>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Verification URL: authentico.com/verify/{modal.document.id}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border-2 border-deep-moss hover:bg-soft-sage"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setToastMessage({
                        type: 'success',
                        message: 'QR Code downloaded!',
                      });
                    }}
                    className="px-4 py-2 bg-forest-green text-ivory border-2 border-deep-moss flex items-center gap-2"
                  >
                    <Download size={18} />
                    Download QR
                  </button>
                </div>
              </div>
            )}

            {modal.type === 'upload' && (
              <div className="space-y-4">
                <div className="bg-white border-2 border-deep-moss p-4">
                  <div className="mb-4">
                    <label className="block font-bold text-deep-moss mb-2">
                      Document Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter document name"
                      className="w-full p-2 border-2 border-deep-moss"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block font-bold text-deep-moss mb-2">
                      Document Type
                    </label>
                    <select className="w-full p-2 border-2 border-deep-moss">
                      <option value="">Select document type</option>
                      <option value="identity">Identity Document</option>
                      <option value="education">Education Document</option>
                      <option value="employment">Employment Document</option>
                      <option value="financial">Financial Document</option>
                      <option value="medical">Medical Document</option>
                      <option value="legal">Legal Document</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block font-bold text-deep-moss mb-2">
                      Verifying Organization
                    </label>
                    <select className="w-full p-2 border-2 border-deep-moss">
                      <option value="">Select organization</option>
                      <option value="ministry">
                        Ministry of Foreign Affairs
                      </option>
                      <option value="university">
                        University of Technology
                      </option>
                      <option value="techcorp">TechCorp Inc.</option>
                      <option value="hospital">Central Hospital</option>
                      <option value="lawfirm">Legal Associates LLP</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block font-bold text-deep-moss mb-2">
                      Upload Document
                    </label>
                    <div className="border-2 border-dashed border-deep-moss p-8 text-center">
                      <Upload
                        size={48}
                        className="mx-auto mb-4 text-deep-moss"
                      />
                      <p className="mb-2">Drag and drop your file here</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Supported formats: PDF, JPG, PNG (Max 10MB)
                      </p>
                      <button className="px-4 py-2 bg-soft-sage border-2 border-deep-moss">
                        Browse Files
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border-2 border-deep-moss hover:bg-soft-sage"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setToastMessage({
                        type: 'success',
                        message: 'Document uploaded successfully!',
                      });
                      closeModal();
                    }}
                    className="px-4 py-2 bg-forest-green text-ivory border-2 border-deep-moss"
                  >
                    Upload Document
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
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

export default IndividualDashboardDemo;
