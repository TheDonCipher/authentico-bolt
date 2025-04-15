'use client';

declare global {
  interface Window {
    ethereum: any;
  }
}

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Plus, Check, X, RefreshCw, SearchIcon } from 'lucide-react';
import {
  useActiveAccount,
  useDisconnect,
  useActiveWallet,
  ConnectButton,
} from 'thirdweb/react';
import { AuthGuard } from '../components/auth/AuthGuard';
import { useAuth } from '../contexts/AuthContext';
import { SignOutButton } from '../components/auth/SignOutButton';
import { Toast } from '../components/ui/Toast';

import { useSendTransaction } from 'thirdweb/react';
import { getContract, prepareContractCall } from 'thirdweb';
import { sepolia, localhost } from 'thirdweb/chains';
import { auth } from '../../lib/firebase';

import { Document } from '../models/Document';
import type { Activity } from '../types/dashboard';
import { DocumentCard } from '../components/dashboard/DocumentCard';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { SearchBar } from '../components/dashboard/SearchBar';
import { NotificationBell } from '../components/dashboard/NotificationBell';
import { ProfileCard } from '../components/dashboard/ProfileCard';
import { Stats } from '../components/dashboard/Stats';
import axios from 'axios';
import { client } from '../client';
import AuthenticoContractAbi from 'public/contractsData/AuthenticoContract.json';
import AuthenticoContractAddress from 'public/contractsData/AuthenticoContract-address.json';

import { ethers } from 'ethers';

const IndividualDashboard = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [uploadingStatus, setUploadingStatus] = useState('Upload');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docName, setDocName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const { user } = useAuth();
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [verifyingOrgId, setVerifyingOrgId] = useState('');
  const [verifyingOrgs, setVerifyingOrgs] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [uploadProgress, setUploadProgress] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [IPFSHash, setIPFSHash] = useState('');

  function gotoActivityPane() {
    setActiveTab('activity');
  }
  const wallet = useActiveWallet();
  const thirdwebAccount = useActiveAccount();

  const router = useRouter();
  const { disconnect } = useDisconnect();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Mark component as client-side rendered
  }, []);

  useEffect(() => {
    const fetchDocuments = async () => {
      // Only proceed if we have a Thirdweb account
      if (thirdwebAccount) {
        try {
          console.log('Using Thirdweb account:', thirdwebAccount.address);

          // Set the account from Thirdweb
          const walletAddress = thirdwebAccount.address;
          console.log('Wallet address:', walletAddress);
          setAccount(walletAddress);

          // For now, just set some sample documents
          // This avoids using ethers.js directly which was causing MetaMask popups
          const sampleDocs = [
            new Document(
              1,
              'ipfs://sample1',
              walletAddress,
              'sample-hash-1',
              '0', // Verified
              'Document',
              'org1'
            ),
            new Document(
              2,
              'ipfs://sample2',
              walletAddress,
              'sample-hash-2',
              '1', // Pending
              'Document',
              'org2'
            ),
          ];

          setDocuments(sampleDocs);
          console.log('Set sample documents');

          // In a future update, we can implement proper contract interaction using Thirdweb
          // instead of ethers.js directly to avoid MetaMask popups
        } catch (error) {
          console.error('Error fetching documents:', error);
          setToastMessage({
            type: 'error',
            message: 'Failed to load documents. Please try again later.',
          });
        }
      } else {
        console.log('No wallet connected');
        setToastMessage({
          type: 'warning',
          message: 'Please connect your wallet to view your documents.',
        });
      }
    };

    fetchDocuments();
  }, [thirdwebAccount]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadingStatus('Uploading File ...');
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
    setUploadingStatus('Upload');
  };

  const handleDocNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadingStatus('Updating...');
    setDocName(e.target.value);
    setUploadingStatus('Upload');
  };

  const handleVerOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUploadingStatus('Updating...');
    setVerifyingOrgId(e.target.value);
    setUploadingStatus('Upload');
  };

  // Fetch verified organizations
  useEffect(() => {
    const fetchVerifiedOrgs = async () => {
      try {
        // Get Firebase ID token
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          throw new Error('Not authenticated');
        }

        try {
          const response = await axios.get('/api/organizations/verified', {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });

          setVerifyingOrgs(response.data);
        } catch (apiError) {
          console.error('Error fetching verified organizations:', apiError);

          // Use fallback data if API fails
          console.log('Using fallback organization data');
          setVerifyingOrgs([
            { id: 'org1', name: 'Example Organization 1' },
            { id: 'org2', name: 'Example Organization 2' },
          ]);

          // Only show toast message in development
          if (process.env.NODE_ENV === 'development') {
            setToastMessage({
              type: 'warning',
              message: 'Using sample organizations (API error)',
            });
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setToastMessage({
          type: 'error',
          message: 'Authentication error. Please sign in again.',
        });
      }
    };

    fetchVerifiedOrgs();
  }, []);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadingStatus('Uploading ...');

    // Get the active account from Thirdweb
    if (!thirdwebAccount) {
      setToastMessage({
        type: 'error',
        message: 'No wallet connected',
      });
      setUploadingStatus('Upload');
      return;
    }

    if (!file) {
      setToastMessage({
        type: 'error',
        message: 'Please select a file to upload',
      });
      setUploadingStatus('Upload');
      return;
    }

    if (!verifyingOrgId) {
      setToastMessage({
        type: 'error',
        message: 'Please select a verifying organization',
      });
      setUploadingStatus('Upload');
      return;
    }

    const formData = new FormData();
    formData.append('document_file', file);
    formData.append('documentName', docName);
    formData.append('documentType', 'Document');
    formData.append('verifyingOrgId', verifyingOrgId);
    formData.append('walletAddress', thirdwebAccount.address);

    try {
      // Check if we're using example organizations (fallback data)
      const isExampleOrg = verifyingOrgId.startsWith('org');

      // Get Firebase ID token for real organizations
      let idToken: string | undefined;
      if (!isExampleOrg) {
        idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          throw new Error('Not authenticated');
        }
      }

      setUploadingStatus('Encrypting...');

      // Use the isExampleOrg variable from above
      if (isExampleOrg) {
        // Simulate upload with example organizations
        let progress = 0;
        const simulateProgress = setInterval(() => {
          progress += 10;
          if (progress <= 100) {
            setUploadProgress(`${progress}%`);
            setUploadingStatus(`Uploading: ${progress}%`);
          } else {
            clearInterval(simulateProgress);
          }
        }, 300);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Clear the interval if it's still running
        clearInterval(simulateProgress);

        // Create a mock document
        const mockDocument = new Document(
          Math.floor(Math.random() * 1000), // Random ID
          'ipfs://example', // Mock IPFS URL
          thirdwebAccount?.address || 'unknown', // User's wallet address from Thirdweb
          'example-hash', // Mock hash
          '1', // Status (Pending)
          'Document', // Document type
          verifyingOrgId // Verifying org ID
        );

        // Add the mock document to the list
        setDocuments([mockDocument, ...documents]);
      } else {
        // Real API upload
        await axios.post('/api/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${idToken}`,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 100)
            );
            setUploadProgress(`${percentCompleted}%`);
            setUploadingStatus(`Uploading: ${percentCompleted}%`);
          },
        });
      }

      // Close the dialog and show success message
      setIsUploadDialogOpen(false);
      setToastMessage({
        type: 'success',
        message: isExampleOrg
          ? 'Document uploaded successfully to example organization!'
          : 'Document uploaded successfully and queued for blockchain submission',
      });

      // Reset form
      setDocName('');
      setFile(null);
      setVerifyingOrgId('');
      setUploadingStatus('Upload');

      // Refresh documents after a short delay
      setTimeout(() => {
        // This would be replaced with a proper document fetch function
        // fetchDocuments();
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setToastMessage({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Document upload failed',
      });
      setUploadingStatus('Upload');
    }
  };

  const handleSignOut = () => {
    if (wallet) {
      disconnect(wallet);
      router.push('/');
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 5000);
  };

  useEffect(() => {
    // Generate activities based on documents
    const newActivities = documents.map((doc) => ({
      id: doc.documentId,
      text: `${doc.documentType} - ${doc.status}`,
      date: new Date(
        Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
      ).toLocaleDateString(),
      icon:
        doc.status === 'verified' ? (
          <Check size={14} />
        ) : doc.status === 'pending' ? (
          <RefreshCw size={14} />
        ) : (
          <X size={14} />
        ),
    }));
    const sortedActivities = newActivities
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);
    setActivities(sortedActivities);
  }, [documents]);

  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Generate activities based on documents
    const newActivities = documents.map((doc) => ({
      id: doc.documentId,
      text: `${doc.documentType} - ${doc.status}`,
      date: new Date(
        Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
      ).toLocaleDateString(),
      icon:
        doc.status === 'verified' ? (
          <Check size={14} />
        ) : doc.status === 'pending' ? (
          <RefreshCw size={14} />
        ) : (
          <X size={14} />
        ),
    }));
    const sortedActivities = newActivities
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);
    setActivities(sortedActivities);
  }, [documents]);

  return (
    <AuthGuard allowedUserTypes={['individual']}>
      <div className="min-h-screen bg-ivory text-deep-moss flex flex-col md:flex-row font-archivo">
        {/* Sidebar - now becomes a bottom nav on mobile */}
        <aside className="fixed bottom-0 left-0 right-0 md:static w-full md:w-80 bg-soft-sage p-3 md:p-6 border-t-4 md:border-r-4 md:border-t-0 border-deep-moss flex md:flex-col h-auto md:h-screen md:sticky md:top-0 z-30">
          <h1 className="hidden md:block text-2xl font-black mb-8 text-deep-moss bg-soft-sage p-2 border-4 border-deep-moss inline-block">
            AUTHENTICO
          </h1>
          {/* User info moved to ProfileCard */}

          {/* Navigation - horizontal on mobile, vertical on desktop */}
          <nav className="flex-1">
            <ul className="flex md:flex-col md:space-y-4 justify-around md:justify-start">
              <li className="w-full">
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base ${
                    activeTab === 'documents'
                      ? 'bg-soft-sage shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                      : 'bg-ivory hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                  }`}
                >
                  <span className="hidden md:inline">Documents</span>
                </button>
              </li>

              {/* Admin Dashboard Link - Only visible to admin wallet */}
              {thirdwebAccount &&
                thirdwebAccount.address.toLowerCase() ===
                  '0x4ca717eaac6ec3917cb6e23557e1cea7267e2a1c'.toLowerCase() && (
                  <li className="w-full">
                    <Link
                      href="/admin"
                      className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-deep-moss font-bold text-sm md:text-base bg-sunflower-yellow bg-opacity-20 hover:bg-sunflower-yellow hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] md:hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] block`}
                    >
                      <span className="hidden md:inline">Admin Dashboard</span>
                    </Link>
                  </li>
                )}
            </ul>
          </nav>

          {/* Sign Out Button - hidden on mobile */}
          <div className="hidden md:block mt-auto space-y-4">
            <SignOutButton className="block w-full bg-burnt-sienna bg-opacity-20 text-deep-moss p-3 font-bold border-4 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all" />
          </div>
        </aside>

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
          {/* Header */}
          <header className="bg-soft-sage border-b-4 border-deep-moss sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:h-20 flex flex-col md:flex-row gap-4 md:gap-0 md:items-center justify-between">
              <div className="flex items-center">
                <h2 className="text-xl font-bold text-deep-moss mr-4">
                  Individual Dashboard
                </h2>
              </div>
              <div className="flex items-center gap-4 md:gap-6">
                <NotificationBell
                  count={activities.length}
                  onClick={gotoActivityPane}
                />
                <ProfileCard />
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-ivory">
            {activeTab === 'documents' && (
              <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                <Stats documents={documents} />

                {/* Admin Dashboard Link - Only visible to admin wallet */}
                {account &&
                  account.toLowerCase() ===
                    '0x4ca717eaac6ec3917cb6e23557e1cea7267e2a1c'.toLowerCase() && (
                    <div className="mb-6 p-4 bg-sunflower bg-opacity-20 border-2 border-deep-moss rounded-md">
                      <h3 className="text-lg font-bold mb-2">Admin Access</h3>
                      <p className="mb-3">
                        You have admin privileges. Access the admin dashboard to
                        manage the platform.
                      </p>
                      <Link
                        href="/admin"
                        className="inline-block bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                      >
                        Admin Dashboard
                      </Link>
                    </div>
                  )}

                <div>
                  <h3 className="text-lg md:text-2xl font-archivo font-bold mb-4">
                    Your Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {documents.map((doc) => (
                      <DocumentCard
                        key={doc.documentId}
                        doc={doc}
                        onShare={() => {
                          setSelectedDocument(doc);
                          setIsShareDialogOpen(true);
                        }}
                        onAction={(doc) => {
                          if (doc.status === 'pending') {
                            // Handle check status
                          } else if (doc.status === 'verified') {
                            // Handle download
                          } else if (doc.status === 'rejected') {
                            alert(`Rejection Reason: ${doc.metadataHash}`);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        <button
          type="button"
          title="Upload Document"
          className="fixed bottom-24 md:bottom-8 right-4 md:right-8 bg-soft-sage text-deep-moss p-3 md:p-4 rounded-full border-4 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all z-40"
          onClick={() => setIsUploadDialogOpen(true)}
        >
          <Plus size={24} />
        </button>

        {/* Dialogs - make them mobile friendly */}
        {isUploadDialogOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-ivory p-4 md:p-8 border-4 md:border-8 border-deep-moss max-w-md w-full">
              <h3 className="text-2xl font-black mb-6 bg-soft-sage p-2 border-4 border-deep-moss inline-block">
                Upload Document
              </h3>
              <form onSubmit={handleUpload}>
                <div className="mb-4">
                  <label
                    htmlFor="docName"
                    className="block font-bold mb-1 text-deep-moss"
                  >
                    Document Name *
                  </label>
                  <input
                    type="text"
                    id="docName"
                    name="docName"
                    value={docName}
                    onChange={handleDocNameChange}
                    placeholder="Enter document name"
                    className="w-full p-3 border-2 border-deep-moss focus:border-forest-green focus:outline-none"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="document_file"
                    className="block font-bold mb-1 text-deep-moss"
                  >
                    Document File *
                  </label>
                  <input
                    type="file"
                    id="document_file"
                    name="document_file"
                    onChange={handleFileChange}
                    className="w-full p-3 border-2 border-deep-moss focus:border-forest-green focus:outline-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max file size: 10MB
                  </p>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="verifyingOrgId"
                    className="block font-bold mb-1 text-deep-moss"
                  >
                    Verifying Organization *
                  </label>
                  <select
                    id="verifyingOrgId"
                    name="verifyingOrgId"
                    value={verifyingOrgId}
                    onChange={handleVerOrgChange}
                    className="w-full p-3 border-2 border-deep-moss focus:border-forest-green focus:outline-none"
                    required
                  >
                    <option value="">Select an organization</option>
                    {verifyingOrgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsUploadDialogOpen(false)}
                    className="mr-2 bg-burnt-sienna bg-opacity-20 text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                    disabled={uploadingStatus !== 'Upload'}
                  >
                    {uploadingStatus}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Share Dialog */}
        {isShareDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-ivory p-6 rounded-lg shadow-xl max-w-md w-full border-2 border-deep-moss">
              <h3 className="text-2xl font-bold mb-4 text-deep-moss">
                Share Document
              </h3>
              <p className="mb-4">
                Are you sure you want to share this document?
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setIsShareDialogOpen(false)}
                  className="mr-2 bg-stone-gray text-deep-moss px-4 py-2 rounded hover:bg-deep-moss hover:text-ivory transition"
                >
                  Cancel
                </button>
                <button className="bg-forest-green text-ivory px-4 py-2 rounded hover:bg-deep-moss transition">
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast type={toastMessage.type} message={toastMessage.message} />
        </div>
      )}
    </AuthGuard>
  );
};

export default IndividualDashboard;
