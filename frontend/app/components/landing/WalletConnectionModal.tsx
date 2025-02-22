import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ConnectButton, darkTheme } from 'thirdweb/react';
import { Wallet, X } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface WalletConnectionModalProps {
  client: any;
  wallets: any[];
  account: any;
  isSigningIn: boolean;
  handleSignIn: () => void;
  showIndSignUp: boolean;
  showOrgSignUp: boolean;
  setShowIndSignUp: (show: boolean) => void;
  setShowOrgSignUp: (show: boolean) => void;
  toogleShow: () => void;
}

export const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({
  client,
  wallets,
  account,
  isSigningIn,
  handleSignIn,
  showIndSignUp,
  showOrgSignUp,
  setShowIndSignUp,
  setShowOrgSignUp,
  toogleShow,
}) => {
  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toogleShow();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      toogleShow();
    }
  };

  const handleIndividualSignUp = () => {
    toogleShow(); // First close modal
    setTimeout(() => {
      setShowIndSignUp(true); // Then show form after modal animation
      setShowOrgSignUp(false);
    }, 300);
  };

  const handleOrganizationSignUp = () => {
    toogleShow(); // First close modal
    setTimeout(() => {
      setShowOrgSignUp(true); // Then show form after modal animation
      setShowIndSignUp(false);
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md m-4 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[#2C3E50]">
            Get Started with Authentico
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="font-bold text-lg text-[#1E3A8A] mb-4">
            Follow these steps:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Connect your wallet using the button below</li>
            <li>
              Sign in if you&apos;re a returning user, or sign up if you&apos;re
              new
            </li>
          </ol>
        </div>

        <div className="mb-6">
          <ConnectButton
            client={client}
            wallets={wallets}
            theme={darkTheme({
              colors: {
                accentText: '#ffffff',
                accentButtonBg: '#4A6741',
                primaryButtonBg: '#5D8C5D',
              },
              fontFamily: 'Archivo',
            })}
            connectButton={{ label: 'Connect Wallet' }}
            connectModal={{
              size: 'wide',
              welcomeScreen: {
                title: 'Welcome to Authentico',
                subtitle: 'Secure document verification powered by blockchain',
              },
            }}
          />
        </div>

        {account && (
          <div className="mb-6 text-center">
            <p className="text-green-600 font-bold">
              Wallet connected successfully!
            </p>
          </div>
        )}

        <div className="space-y-4">
          {!account ? (
            <motion.button
              onClick={handleSignIn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSigningIn || !account}
              className="w-full bg-[#4A6741] text-white text-lg font-bold py-3 px-6 rounded-lg border-2 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigningIn ? (
                <>
                  <LoadingSpinner />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Wallet className="inline-block mr-2" />
                  <span>Sign In</span>
                </>
              )}
            </motion.button>
          ) : (
            <div className="flex flex-col gap-2">
              <motion.button
                onClick={handleIndividualSignUp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#5D8C5D] text-white text-lg font-bold py-3 px-6 rounded-lg border-2 border-[#2C3E50] hover:bg-[#4A6741] transition duration-300"
              >
                Sign Up as Individual
              </motion.button>
              <motion.button
                onClick={handleOrganizationSignUp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#5D8C5D] text-white text-lg font-bold py-3 px-6 rounded-lg border-2 border-[#2C3E50] hover:bg-[#4A6741] transition duration-300"
              >
                Sign Up as Organization
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
