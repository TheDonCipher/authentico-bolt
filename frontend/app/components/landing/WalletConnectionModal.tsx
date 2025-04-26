import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ConnectButton, darkTheme, useActiveAccount } from 'thirdweb/react';
import { Wallet, X } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { NeubrutalistLoading } from '../ui/NeubrutalistLoading';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { redirectToDashboard } from '../../../lib/redirect-utils';
import { Toast } from '../ui/Toast';
import { AnimatePresence } from 'framer-motion';
import { AuthResult, isSuccessfulAuthResult } from '../../types/auth';

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
  const { login, activeContext, isAutoLogin } = useAuth();
  const { userOrganizations } = useOrganization();
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

      if (isSuccessfulAuthResult(result)) {
        setToastMessage({
          type: 'success',
          message:
            result.message || 'Sign in successful! Redirecting to dashboard...',
        });
        // Use the redirect utility to determine the best dashboard
        setTimeout(() => {
          // Get active org ID if in organization context
          const activeOrgId =
            activeContext === 'organization' && userOrganizations.length > 0
              ? userOrganizations[0].orgId
              : null;

          // Create a User object from the account
          const user = {
            uid: account.address, // Use address as uid
            walletAddress: account.address,
            name: 'User', // Default name
            userType: 'individual' as 'individual' | 'organization' | 'admin',
          };

          // Don't close the modal - the redirect will navigate away from this page
          redirectToDashboard(router, user, activeContext, activeOrgId);
        }, 1000);
      } else if (result.success === false && result.newUser === true) {
        // New user needs to register
        setToastMessage({
          type: 'error',
          message: 'This wallet is not registered yet. Please register first.',
        });
        setTimeout(() => {
          router.push('/register');
          // Do NOT close the modal before redirecting
        }, 2000);
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setToastMessage({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Failed to sign in. Please try again.',
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
    // Don't close the modal before redirecting
    router.push('/register');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer p-3 sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1F2937] p-4 sm:p-6 md:p-8 border-2 sm:border-4 border-deep-moss shadow-brutal sm:shadow-[8px_8px_0px_0px_rgba(27,67,50,0.8)] w-full max-w-md cursor-default overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notifications */}
        <AnimatePresence>
          {toastMessage && (
            <Toast
              type={toastMessage.type}
              message={toastMessage.message}
              onClose={() => setToastMessage(null)}
              duration={5000}
            />
          )}
        </AnimatePresence>
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
            Get Started with Authentico
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors touch-target"
            aria-label="Close modal"
          >
            <X size={18} className="sm:w-5 sm:h-5 text-white" />
          </button>
        </div>

        <div className="mb-4 sm:mb-6">
          <p className="font-bold text-base sm:text-lg text-[#81D4FA] mb-2 sm:mb-4">
            Follow these steps:
          </p>
          <ol className="list-decimal list-inside space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-300">
            <li>Connect your wallet using the button below</li>
            <li>
              Sign in if you&apos;re a returning user, or sign up if you&apos;re
              new
            </li>
          </ol>
        </div>

        <div className="mb-4 sm:mb-6">
          <ConnectButton
            client={client}
            wallets={wallets}
            theme={darkTheme({
              colors: {
                accentText: '#ffffff',
                accentButtonBg: '#2E7D32', // Forest Green
                primaryButtonBg: '#1B4332', // Deep Moss
                modalBg: '#1F2937', // Dark background
                modalOverlayBg: 'rgba(0, 0, 0, 0.7)', // Darker overlay
                secondaryButtonBg: '#374151', // Dark secondary button
                secondaryButtonHoverBg: '#4B5563', // Darker on hover
                secondaryButtonText: '#FFFFFF', // White text
                connectedButtonBg: '#2E7D32', // Forest Green
                primaryText: '#FFFFFF', // White text
                secondaryText: '#D1D5DB', // Light gray text
              },
              fontFamily: 'Archivo',
            })}
            connectButton={{
              label: 'Connect Wallet',
              className:
                'bg-forest-green text-ivory border-2 border-deep-moss hover:bg-deep-moss transition-colors font-bold py-2 px-4 shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]',
            }}
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
          <div className="mb-4 sm:mb-6 p-2 sm:p-3 bg-[#374151] border-2 border-deep-moss rounded">
            <p className="text-xs sm:text-sm font-medium text-gray-200">
              Connected Wallet:
            </p>
            <p className="font-mono text-xs sm:text-sm truncate text-gray-300">
              {account.address}
            </p>
            <p className="text-sap-green text-xs sm:text-sm font-bold mt-1 sm:mt-2">
              Wallet connected successfully!
            </p>
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {account ? (
            <div className="flex flex-col gap-2">
              <motion.button
                onClick={handleSignIn}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading || isAutoLogin}
                className="w-full bg-forest-green text-ivory text-base sm:text-lg font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg border-2 border-deep-moss hover:bg-deep-moss transition duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed touch-target"
              >
                {isLoading || isAutoLogin ? (
                  <div className="flex items-center justify-center w-full">
                    <NeubrutalistLoading
                      message={isAutoLogin ? 'Auto Sign-In' : 'Verification'}
                      subMessage={
                        isAutoLogin
                          ? 'Automatically signing you in...'
                          : 'Verifying your wallet credentials...'
                      }
                      showSeal={false}
                    />
                  </div>
                ) : (
                  <>
                    <Wallet
                      className="inline-block mr-2 sm:w-5 sm:h-5"
                      size={16}
                    />
                    <span>Sign In</span>
                  </>
                )}
              </motion.button>
              <motion.button
                onClick={handleRegister}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading || isAutoLogin}
                className="w-full bg-soft-sage text-deep-moss text-base sm:text-lg font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg border-2 border-deep-moss hover:bg-forest-green hover:text-ivory transition duration-300 touch-target"
              >
                Register New Account
              </motion.button>
            </div>
          ) : (
            <div className="p-3 sm:p-4 bg-[#374151] border-2 border-deep-moss rounded text-center">
              <p className="text-gray-200 text-sm sm:text-base font-medium">
                Please connect your wallet first
              </p>
              <p className="text-xs text-gray-400 mt-1 sm:mt-2">
                You need to connect your wallet to sign in or register
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
