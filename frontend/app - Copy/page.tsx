'use client';
import React, { useState, useEffect, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectButton, darkTheme, useActiveAccount } from 'thirdweb/react';
import { createWallet, inAppWallet } from 'thirdweb/wallets';
import { AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Upload, LayoutDashboard, Share2, Shield, Users } from 'lucide-react';

// Components
import { NavBar } from './components/landing/NavBar';
import { FeatureCard } from './components/landing/FeatureCard';
import { ProcessStep } from './components/landing/ProcessStep';
import { FAQItem } from './components/landing/FAQItem';
import { Toast } from './components/ui/Toast';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { WalletConnectionModal } from './components/landing/WalletConnectionModal';
import { OrganizationSignUp } from './components/forms/OrganizationSignUp';
import { PersonalSignUp } from './components/forms/PersonalSignUp';
import { Footer } from './components/layout/Footer';
import {
  HeroSection,
  HowItWorksSection,
  FeaturesSection,
  WhoIsItForSection,
  FAQSection,
} from './components/sections';

// Utils
import { handleWalletAuth } from './utils/auth';
import { client } from './client';

// Assets
import reviewng from './img/roller-skating.svg';
import sittingreading from './img/sitting-reading.svg';

// Wallet Configuration
const wallets = [
  createWallet('io.metamask'),
  inAppWallet({
    auth: {
      options: ['email', 'google', 'apple', 'facebook', 'phone'],
    },
  }),
];

function modalManager(state, action) {
  if (action.type === 'openLogin') return { open: true };
  if (action.type === 'closeLogin') return { open: false };
  return state;
}

const NeubrutalistLanding = () => {
  // State management
  const [state, dispatch] = useReducer(modalManager, { open: false });
  const [showOrgSignUp, setShowOrgSignUp] = useState(false);
  const [showIndSignUp, setShowIndSignUp] = useState(false);
  const [orgDetails, setOrgDetails] = useState({ orgName: '', email: '' });
  const [indDetails, setIndDetails] = useState({
    password: '',
    name: '',
    email: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false); // Add this new state
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState(null);

  const account = useActiveAccount();
  const router = useRouter();

  // Handlers
  const toogleShow = () => {
    setIsModalOpen(!isModalOpen);
  };

  const toogleLogin = (open: boolean) => {
    dispatch({ type: open ? 'openLogin' : 'closeLogin' });
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setDetails: any
  ) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  // Effects
  useEffect(() => {
    const checkAuth = async () => {
      if (account) {
        try {
          const response = await handleWalletAuth(account, router);
          if (response.error) {
            showToast('error', response.error);
          } else if (response.user) {
            router.push(
              response.user.userType === 'organization'
                ? '/organization-dashboard'
                : '/individual-dashboard' // Updated path
            );
          }
        } catch (error) {
          console.error('Auth error:', error);
          showToast('error', 'Authentication failed. Please try again.');
        }
      }
    };

    checkAuth();
  }, [account, router]);

  return (
    <div className="min-h-screen bg-[#F0EAD6] text-[#2C3E50] flex flex-col relative overflow-x-hidden">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%234A6741' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px',
        }}
      />

      <NavBar toogleShow={toogleShow} openForm={() => toogleLogin(true)} />

      <main className="w-screen flex flex-col flex-1 pt-24">
        {/* Hero Section */}
        <HeroSection toogleShow={toogleShow} />

        <AnimatePresence mode="wait">
          {isModalOpen && ( // Update the condition here
            <WalletConnectionModal
              key="wallet-modal"
              client={client}
              wallets={wallets}
              account={account}
              isSigningIn={isSigningIn}
              handleSignIn={() => handleWalletAuth(account, router)}
              showIndSignUp={showIndSignUp}
              showOrgSignUp={showOrgSignUp}
              setShowIndSignUp={setShowIndSignUp}
              setShowOrgSignUp={setShowOrgSignUp}
              toogleShow={toogleShow}
            />
          )}
        </AnimatePresence>

        {/* Sign-up Forms */}
        <AnimatePresence>
          {showIndSignUp && (
            <PersonalSignUp
              closeSignup={() => setShowIndSignUp(false)}
              showIndSignUp={showIndSignUp}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showOrgSignUp && (
            <OrganizationSignUp
              orgDetails={orgDetails}
              handleInputChange={(e) => handleInputChange(e, setOrgDetails)}
              isLoading={isLoading}
              closeSignup={() => setShowOrgSignUp(false)}
            />
          )}
        </AnimatePresence>

        {/* Main Sections */}
        <HowItWorksSection />
        <FeaturesSection />
        <WhoIsItForSection />
        <FAQSection />

        {/* Notifications */}
        <AnimatePresence>
          {toastMessage && (
            <Toast type={toastMessage.type} message={toastMessage.message} />
          )}
        </AnimatePresence>
        {authError && (
          <div className="mb-8 text-center">
            <p className="text-red-600 font-bold text-lg">{authError}</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default NeubrutalistLanding;
