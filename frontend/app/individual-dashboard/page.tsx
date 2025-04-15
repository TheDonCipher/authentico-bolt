'use client';

declare global {
  interface Window {
    ethereum: any;
  }
}

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const [toastMessage, setToastMessage] = useState(null);
  const [file, setFile] = useState(null);
  const [verifyingOrg, setVerifyingOrg] = useState('');

  const [error, setError] = useState(null);
  const baseUrl = 'http://localhost:666';
  const [IPFSHash, setIPFSHash] = useState('');

  function gotoActivityPane() {
    setActiveTab('activity');
  }
  const wallet = useActiveWallet();

  const router = useRouter();
  const { disconnect } = useDisconnect();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Mark component as client-side rendered
  }, []);

  useEffect(() => {
    const connectWallet = async () => {
      if (window.ethereum) {
        try {
          console.log('------window.ethereum-----', window.ethereum);
          await window.ethereum.enable();

          const provider = new ethers.providers.Web3Provider(window.ethereum);
          console.log('------provider-----', provider);
          await provider.send('eth_requestAccounts', []);
          const signer = provider.getSigner();
          console.log('------signer-----', signer);
          const account = await signer.getAddress();
          console.log('------account-----', account);

          setProvider(provider);
          setSigner(signer);
          setAccount(account);

          const AuthenticoContract = new ethers.Contract(
            AuthenticoContractAddress.address,
            AuthenticoContractAbi.abi,
            signer
          );

          const name = await AuthenticoContract.name();
          console.log('name', name);
          const symbol = await AuthenticoContract.symbol();
          console.log('symbol', symbol);

          console.log('---fetching network details----');
          const network = await provider.getNetwork();
          if (!network.ensAddress) {
            console.warn('Network does not support ENS');
          }

          console.log('=-----start fetching documents=-----');
          const fetchedDocs = [];
          try {
            for (let i = 1; i < 3; i++) {
              const documentID =
                await AuthenticoContract.getDocumentDetailsByID(i);
              const mappedDoc = new Document(
                documentID.documentId.toNumber(), // Convert BigNumber to number
                documentID.urlPicture,
                documentID.publicAddress,
                documentID.metadataHash,
                documentID.status.toString(), // Convert status to string
                documentID.documentType || 'Unknown', // Provide default if missing
                documentID.verifier
              );
              if (documentID.verifier == account) {
                console.log(
                  'documentID document    urlPicture',
                  documentID.verifier
                );
                fetchedDocs.push(mappedDoc);
              }
            }
            setDocuments(fetchedDocs);
          } catch (error) {
            console.error('Error fetching documents:', error);
          }

          console.log('=-----stop fetching documents=-----');
        } catch (error) {
          console.error(error);
        }
      } else {
        alert(
          'MetaMask is not installed. Please install it to use this feature.'
        );
      }
    };

    if (!signer) {
      connectWallet();
    } else {
      console.log('connect wallet');
    }
  }, [provider, signer]);

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

  const handleVerOrgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadingStatus('Updating...');
    setVerifyingOrg(e.target.value);
    setUploadingStatus('Upload');
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadingStatus('Uploading ...');

    // Get the active account from Thirdweb
    if (!account) {
      setError('No wallet connected');
      setUploadingStatus('Upload');
      return;
    }

    const formData = new FormData();
    formData.append('document_file', file);
    formData.append('userWalletAddress', account);
    formData.append('documentHolderName', docName);
    formData.append('document_type', verifyingOrg);

    try {
      // Get Firebase ID token
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      const response = await axios.post(`${baseUrl}/upload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${idToken}`,
        },
      });

      const ipfsHash = response.data.IpfsHash;
      setIPFSHash(ipfsHash);
      setUploadingStatus('Minting...');

      // Rest of your minting code...
    } catch (e) {
      console.error('Upload error:', e);
      setError(e instanceof Error ? e.message : 'Upload failed');
      setUploadingStatus('Upload');
    }
  };

  const handleSignOut = () => {
    if (signer) {
      disconnect(signer);
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
      <div className="min-h-screen bg-[#F5F7F2] text-[#2F4F4F] flex flex-col md:flex-row font-archivo">
        {/* Sidebar - now becomes a bottom nav on mobile */}
        <aside className="fixed bottom-0 left-0 right-0 md:static w-full md:w-80 bg-[#E8EDE1] p-3 md:p-6 border-t-4 md:border-r-4 md:border-t-0 border-[#556B2F] flex md:flex-col h-auto md:h-screen md:sticky md:top-0 z-30">
          <h1 className="hidden md:block text-2xl font-black mb-8 text-[#2F4F4F] transform -rotate-2 bg-[#D2E3C8] p-2 border-4 border-[#556B2F] inline-block">
            AUTHENTICO
          </h1>
          {/* User info moved to ProfileCard */}

          {/* Navigation - horizontal on mobile, vertical on desktop */}
          <nav className="flex-1">
            <ul className="flex md:flex-col md:space-y-4 justify-around md:justify-start">
              <li className="w-full">
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`w-full text-center md:text-left p-2 md:p-3 border-2 md:border-4 border-[#556B2F] font-bold text-sm md:text-base ${
                    activeTab === 'documents'
                      ? 'bg-[#D2E3C8] shadow-[2px_2px_0px_0px_rgba(85,107,47,1)] md:shadow-[4px_4px_0px_0px_rgba(85,107,47,1)]'
                      : 'bg-white hover:bg-[#D2E3C8] hover:shadow-[2px_2px_0px_0px_rgba(85,107,47,1)] md:hover:shadow-[4px_4px_0px_0px_rgba(85,107,47,1)]'
                  }`}
                >
                  <span className="hidden md:inline">Documents</span>
                </button>
              </li>
              {/* ... similar styling for other nav items ... */}
            </ul>
          </nav>

          {/* Sign Out Button - hidden on mobile */}
          <div className="hidden md:block mt-auto space-y-4">
            <SignOutButton className="block w-full bg-[#E6B8AF] text-[#2F4F4F] p-3 font-bold border-4 border-[#556B2F] hover:shadow-[4px_4px_0px_0px_rgba(85,107,47,1)] transition-all" />
          </div>
        </aside>

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
          {/* Header */}
          <header className="bg-[#E8EDE1] border-b-4 border-[#556B2F] sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:h-20 flex flex-col md:flex-row gap-4 md:gap-0 md:items-center justify-between">
              <div className="flex items-center">
                <h2 className="text-xl font-bold text-[#2F4F4F] mr-4">
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
          <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-[#F0F4F8]">
            {activeTab === 'documents' && (
              <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                <Stats documents={documents} />
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
          className="fixed bottom-24 md:bottom-8 right-4 md:right-8 bg-[#D2E3C8] text-[#2F4F4F] p-3 md:p-4 rounded-full border-4 border-[#556B2F] hover:shadow-[4px_4px_0px_0px_rgba(85,107,47,1)] transition-all z-40"
          onClick={() => setIsUploadDialogOpen(true)}
        >
          <Plus size={24} />
        </button>

        {/* Dialogs - make them mobile friendly */}
        {isUploadDialogOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white p-4 md:p-8 border-4 md:border-8 border-black max-w-md w-full transform rotate-1">
              <h3 className="text-2xl font-black mb-6 bg-[#D2E3C8] p-2 border-4 border-black inline-block -rotate-2">
                Upload Document
              </h3>
              <form onSubmit={handleUpload}>
                <input
                  type="text"
                  name="docName"
                  onChange={handleDocNameChange}
                  placeholder="Document Name"
                  className="w-full p-2 mb-4 bg-stone-100 border border-stone-300 text-stone-800 rounded-md"
                  required
                />

                <input
                  type="file"
                  name="Document"
                  placeholder="Document"
                  onChange={handleFileChange}
                  className="w-full p-2 mb-4 bg-gray-700 border-4 border-white text-white"
                  required
                />
                <input
                  type="text"
                  name="verifyingOrg"
                  onChange={handleVerOrgChange}
                  placeholder="Verifying Organization"
                  className="w-full p-2 mb-4 bg-gray-700 border-4 border-white text-white"
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsUploadDialogOpen(false)}
                    className="mr-2 bg-stone-400 text-white px-4 py-2 rounded hover:bg-stone-500 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#698B69] text-white px-4 py-2 rounded hover:bg-[#8B7355] transition"
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
            <div className="bg-[#F0EAD6] p-6 rounded-lg shadow-xl max-w-md w-full border-2 border-[#2C3E50]">
              <h3 className="text-2xl font-bold mb-4 text-[#2C3E50]">
                Share Document
              </h3>
              <p className="mb-4">
                Are you sure you want to share this document?
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setIsShareDialogOpen(false)}
                  className="mr-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
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
