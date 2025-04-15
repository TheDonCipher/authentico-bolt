'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createWallet, inAppWallet } from 'thirdweb/wallets';
import { AnimatePresence } from 'framer-motion';

// Components
import { NavBar } from './components/landing/NavBar';
import { WalletConnectionModal } from './components/landing/WalletConnectionModal';
import { Footer } from './components/layout/Footer';
import { Toast } from './components/ui/Toast';
import {
  HeroSection,
  HowItWorksSection,
  FeaturesSection,
  WhoIsItForSection,
  FAQSection,
} from './components/sections';

// Utils
import { client } from './client';
import { useAuth } from './contexts/AuthContext';

// Wallet Configuration
const wallets = [
  createWallet('io.metamask'),
  inAppWallet({
    auth: {
      options: ['email', 'google', 'apple', 'facebook', 'phone'],
    },
  }),
];

interface ToastMessage {
  type: 'success' | 'error';
  message: string;
}

const NeubrutalistLanding = () => {
  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  // Handlers
  const toogleShow = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Effects
  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (user) {
      if (user.userType === 'individual') {
        router.push('/individual-dashboard');
      } else {
        router.push('/organization-dashboard');
      }
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-ivory text-deep-moss flex flex-col relative overflow-x-hidden">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232E7D32' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px',
        }}
      />

      <NavBar toogleShow={toogleShow} openForm={() => {}} />

      <main className="w-screen flex flex-col flex-1 pt-24">
        {/* Hero Section */}
        <HeroSection toogleShow={toogleShow} />

        <AnimatePresence mode="wait">
          {isModalOpen && (
            <WalletConnectionModal
              key="wallet-modal"
              client={client}
              wallets={wallets}
              toogleShow={toogleShow}
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
      </main>

      <Footer />
    </div>
  );
};

export default NeubrutalistLanding;
