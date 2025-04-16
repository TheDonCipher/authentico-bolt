'use client';

declare global {
  interface Window {
    ethereum: any;
  }
}

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarNavigation from './components/SidebarNavigation';
import DocumentTable from './components/DocumentTable';
import VerificationQueue from './components/VerificationQueue';
import OrganizationStatus from './components/OrganizationStatus';
import AuthenticoContractAbi from 'public/contractsData/AuthenticoContract.json';
import AuthenticoContractAddress from 'public/contractsData/AuthenticoContract-address.json';
import { AuthGuard } from '../components/auth/AuthGuard';
import { useAuth } from '../contexts/AuthContext';
import { SignOutButton } from '../components/auth/SignOutButton';
import { ProfileCard } from '../components/dashboard/ProfileCard';
import { NotificationBell } from '../components/dashboard/NotificationBell';
import { Toast } from '../components/ui/Toast';
import { auth, db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';

import { ethers } from 'ethers';
const OrganizationDashboard = () => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search input value:', event.target.value);
  };
  const [documents, setDocuments] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();
  const { user } = useAuth();

  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

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
              console.log('documentID document details', documentID);
              console.log('--each documentID document details--=======', i);
              console.log('documentID document details', documentID);
              console.log('documentID document url', documentID.documentType);

              // const documentID = await AuthenticoContract.getAllDocuments();
              console.log('documentID document name', documentID.name);
              console.log('documentID document url', documentID.documentType);
              console.log(
                'documentID document metadataHash',
                documentID.metadataHash
              );
              console.log(
                'documentID document  publicAddress',
                documentID.publicAddress
              );
              console.log('documentID document status', documentID.status);
              console.log(
                'documentID document    urlPicture',
                documentID.urlPicture
              );
              console.log(
                'documentID document    urlPicture',
                documentID.verifier
              );
              console.log('regulator accpunt ', account);

              if (documentID.verifier == account) {
                console.log(
                  'documentID document    urlPicture',
                  documentID.verifier
                );
                fetchedDocs.push(documentID);
              }
            }
            setDocuments([...documents, ...fetchedDocs]);
          } catch (error) {
            console.error('Error fetching documents:', error);
          }

          console.log('=-----stop fetching documents=-----', fetchedDocs);
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
  }, [provider]);

  const showToast = (type, message) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Set up notifications listener
  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for notifications
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedNotifications = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedNotifications.push({
            id: doc.id,
            ...data,
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(),
          });
        });

        setNotifications(fetchedNotifications);
      },
      (error) => {
        console.error('Error in notifications listener:', error);
      }
    );

    // Clean up listener on unmount
    return () => unsubscribe();
  }, [user]);

  return (
    <AuthGuard allowedUserTypes={['organization']}>
      <div className="relative flex flex-col md:flex-row min-h-screen bg-ivory">
        <SidebarNavigation />
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          {' '}
          {/* Added bottom padding for mobile to account for fixed nav */}
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-deep-moss pb-4 mb-6 md:mb-8 gap-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-deep-moss">
                Organization Dashboard
              </h1>
              <div className="flex items-center gap-4">
                <NotificationBell
                  count={notifications.length}
                  onClick={() => {
                    // Mark all notifications as read
                    notifications.forEach(async (notification) => {
                      try {
                        const notificationRef = doc(
                          db,
                          'notifications',
                          notification.id
                        );
                        await updateDoc(notificationRef, { read: true });
                      } catch (error) {
                        console.error(
                          'Error marking notification as read:',
                          error
                        );
                      }
                    });

                    // Switch to verification queue tab
                    setActiveTab('verification');
                  }}
                />
                <ProfileCard />
              </div>
            </div>

            {/* Organization Verification Status */}
            <section className="mb-8 md:mb-12">
              <OrganizationStatus userId={user?.uid || ''} />
            </section>

            {/* Stats Section */}
            <section className="mb-8 md:mb-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-soft-sage p-4 md:p-6 border-2 md:border-4 border-deep-moss shadow-brutal">
                  <h3 className="font-bold text-lg md:text-xl mb-2 text-deep-moss">
                    Total Documents
                  </h3>
                  <p className="text-3xl md:text-4xl font-black text-deep-moss">
                    2
                  </p>
                </div>
                <div className="bg-soft-sage p-4 md:p-6 border-2 md:border-4 border-deep-moss shadow-brutal">
                  <h3 className="font-bold text-lg md:text-xl mb-2 text-deep-moss">
                    Verified
                  </h3>
                  <p className="text-3xl md:text-4xl font-black text-sap-green">
                    1
                  </p>
                </div>
                <div className="bg-soft-sage p-4 md:p-6 border-2 md:border-4 border-deep-moss shadow-brutal sm:col-span-2 md:col-span-1">
                  <h3 className="font-bold text-lg md:text-xl mb-2 text-deep-moss">
                    Pending
                  </h3>
                  <p className="text-3xl md:text-4xl font-black text-sunflower">
                    1
                  </p>
                </div>
              </div>
            </section>

            <div className="flex flex-wrap mb-6 border-b-4 border-deep-moss pb-4 gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`mr-2 md:mr-4 px-3 md:px-4 py-2 font-bold text-sm md:text-base ${
                  activeTab === 'dashboard'
                    ? 'bg-soft-sage border-2 border-deep-moss shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                    : 'hover:bg-soft-sage hover:border-2 hover:border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`px-3 md:px-4 py-2 font-bold text-sm md:text-base ${
                  activeTab === 'verification'
                    ? 'bg-soft-sage border-2 border-deep-moss shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                    : 'hover:bg-soft-sage hover:border-2 hover:border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                }`}
              >
                Verification Queue
              </button>
            </div>

            {activeTab === 'dashboard' ? (
              <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal overflow-x-auto">
                <h2 className="text-2xl md:text-3xl font-black mb-4 md:mb-6 text-deep-moss">
                  Recent Documents
                </h2>
                <div className="overflow-x-auto -mx-4 px-4">
                  <DocumentTable documents={documents} />
                </div>
              </section>
            ) : (
              <VerificationQueue />
            )}
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-4 right-4 z-50">
          <Toast type={toastMessage.type} message={toastMessage.message} />
        </div>
      )}
    </AuthGuard>
  );
};

export default OrganizationDashboard;
