import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ConnectButton, darkTheme, useActiveAccount } from 'thirdweb/react';
import { Wallet, X } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Toast } from '../ui/Toast';
import { AnimatePresence } from 'framer-motion';

interface WalletConnectionModalProps {
  client: any;
  wallets: any[];
  toogleShow: () => void;
}

export const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({
  client,
  wallets,
  toogleShow,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const account = useActiveAccount();
  const { login } = useAuth();
  const router = useRouter();
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

  const handleSignIn = async () => {
    if (!account) {
      setToastMessage({
        type: 'error',
        message: 'Please connect your wallet first',
      });
      return;
    }

    try {
      setIsLoading(true);
      const result = await login(account.address);

      if (result.success) {
        setToastMessage({
          type: 'success',
          message:
            result.message || 'Sign in successful! Redirecting to dashboard...',
        });
        // Redirect will happen automatically via AuthContext
        setTimeout(() => toogleShow(), 1500); // Close modal after successful login
      } else if (result.newUser) {
        // New user needs to register
        setToastMessage({
          type: 'error',
          message: 'This wallet is not registered yet. Please register first.',
        });
        setTimeout(() => {
          router.push('/register');
          toogleShow(); // Close modal before redirecting
        }, 2000);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setToastMessage({
        type: 'error',
        message: err.message || 'Failed to sign in. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    if (!account) {
      setToastMessage({
        type: 'error',
        message: 'Please connect your wallet first',
      });
      return;
    }
    toogleShow();
    router.push('/register');
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
        className="bg-white p-8 border-4 border-[#556B2F] shadow-[8px_8px_0px_0px_rgba(85,107,47,1)] w-full max-w-md m-4 cursor-default transform rotate-1"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notifications */}
        <AnimatePresence>
          {toastMessage && (
            <Toast
              type={toastMessage.type}
              message={toastMessage.message}
              onClose={() => setToastMessage(null)}
            />
          )}
        </AnimatePresence>
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
          <div className="mb-6 p-3 bg-[#E8EDE1] border-2 border-[#556B2F] rounded">
            <p className="text-sm font-medium text-[#2F4F4F]">
              Connected Wallet:
            </p>
            <p className="font-mono text-sm truncate">{account.address}</p>
            <p className="text-green-600 font-bold mt-2">
              Wallet connected successfully!
            </p>
          </div>
        )}

        <div className="space-y-4">
          {account ? (
            <div className="flex flex-col gap-2">
              <motion.button
                onClick={handleSignIn}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                className="w-full bg-[#4A6741] text-white text-lg font-bold py-3 px-6 rounded-lg border-2 border-[#2C3E50] hover:bg-[#5D8C5D] transition duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
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
              <motion.button
                onClick={handleRegister}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                className="w-full bg-[#5D8C5D] text-white text-lg font-bold py-3 px-6 rounded-lg border-2 border-[#2C3E50] hover:bg-[#4A6741] transition duration-300"
              >
                Register New Account
              </motion.button>
            </div>
          ) : (
            <div className="p-4 bg-[#F8F0E3] border-2 border-[#E6B8AF] rounded text-center">
              <p className="text-[#2F4F4F] font-medium">
                Please connect your wallet first
              </p>
              <p className="text-xs text-gray-600 mt-2">
                You need to connect your wallet to sign in or register
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
