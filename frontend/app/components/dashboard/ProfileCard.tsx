'use client';

import { useAuth } from '../../contexts/AuthContext';
import { ConnectButton, darkTheme, useActiveAccount } from 'thirdweb/react';
import { client } from '../../client';
import { createWallet, inAppWallet } from 'thirdweb/wallets';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NeubrutalistLoading } from '../ui/NeubrutalistLoading';
import { motion } from 'framer-motion';

// Wallet Configuration
const wallets = [
  createWallet('io.metamask'),
  inAppWallet({
    auth: {
      options: ['email', 'google', 'apple', 'facebook', 'phone'],
    },
  }),
];

export const ProfileCard = () => {
  const { user, logout, login, loading: authLoading } = useAuth();
  const router = useRouter();
  const account = useActiveAccount();
  const [loading, setLoading] = useState(false);

  // Handle wallet disconnection
  const handleWalletDisconnect = async () => {
    try {
      setLoading(true);
      // Log the user out
      await logout();
      // Redirect to home page
      router.push('/');
      // Keep loading state for a moment to show the user something is happening
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ensure wallet is connected when user is logged in
  useEffect(() => {
    const syncWalletState = async () => {
      // If user is logged in, make sure wallet state is correct
      if (user) {
        // If we have a connected wallet but it doesn't match the user's wallet
        if (
          account &&
          user.walletAddress?.toLowerCase() !== account.address.toLowerCase()
        ) {
          try {
            await login(account.address);
          } catch (err) {
            console.error('Error syncing wallet state:', err);
          }
        }
      }
    };

    // Run the sync function
    syncWalletState();
  }, [user, account, login]);

  // Force wallet connection if we have a user but no connected wallet
  useEffect(() => {
    // This will trigger the wallet connection modal if needed
    // We can't directly connect the wallet programmatically due to security restrictions
  }, [user, account]);

  return (
    <div className="flex items-center">
      {/* Enhanced Modern Web3 Profile Card */}
      <motion.div
        className="relative bg-indigo-900 overflow-hidden flex items-center"
        initial={{ opacity: 0.9 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        style={{
          boxShadow:
            '0 0 15px rgba(138, 43, 226, 0.4), 0 0 30px rgba(72, 61, 139, 0.2), 4px 4px 0px #000',
          border: '2px solid #000',
          backdropFilter: 'blur(5px)',
        }}
      >
        {/* Solid background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-indigo-900" />
        </div>

        {/* User Profile */}
        <div className="flex items-center p-1.5 xs:p-2 sm:p-3 z-10">
          <div className="flex flex-col">
            {user?.userType === 'admin' && (
              <motion.span
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[8px] xs:text-[10px] font-bold px-1 xs:px-1.5 py-0.5 rounded-md mb-0.5 xs:mb-1"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)' }}
              >
                Admin
              </motion.span>
            )}
            <span
              className="font-bold text-white text-[10px] xs:text-xs sm:text-sm tracking-tight truncate max-w-[80px] xs:max-w-[100px] sm:max-w-[120px] md:max-w-[140px]"
              style={{ textShadow: '0 0 5px rgba(255, 255, 255, 0.3)' }}
            >
              {user?.userType === 'organization'
                ? user?.organizationName || 'Organization'
                : user?.name || 'User'}
            </span>
            {account && (
              <div className="flex items-center mt-0.5 xs:mt-1">
                <motion.div
                  className="flex items-center rounded-md px-1 xs:px-1.5 py-0.5"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(79, 70, 229, 0.2) 0%, rgba(45, 212, 191, 0.2) 100%)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    boxShadow: '0 0 8px rgba(79, 70, 229, 0.2)',
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  {/* Blockchain connection indicator */}
                  <div className="relative mr-1 xs:mr-1.5">
                    <motion.div
                      className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-green-400"
                      animate={{
                        boxShadow: [
                          '0 0 0px rgba(74, 222, 128, 0)',
                          '0 0 5px rgba(74, 222, 128, 0.6)',
                          '0 0 0px rgba(74, 222, 128, 0)',
                        ],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-green-400 opacity-40"
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </div>

                  {/* Blockchain network info - hide on very small screens */}
                  <div className="hidden xs:flex items-center">
                    {account ? (
                      <div className="flex items-center">
                        <svg
                          className="w-2 h-2 xs:w-2.5 xs:h-2.5 mr-0.5 xs:mr-1 text-indigo-200"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M12 8V16M8 12H16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="text-[8px] xs:text-[10px] text-indigo-200 font-mono font-medium">
                          {(account as any).chainId === 11155111
                            ? 'Sepolia'
                            : (account as any).chainId === 1
                            ? 'Ethereum'
                            : (account as any).chainId === 137
                            ? 'Polygon'
                            : (account as any).chainId === 56
                            ? 'BNB'
                            : (account as any).chainId === 10
                            ? 'Optimism'
                            : (account as any).chainId === 42161
                            ? 'Arbitrum'
                            : (account as any).chainId === 8453
                            ? 'Base'
                            : 'Connected'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[8px] xs:text-[10px] text-indigo-200 font-mono">
                        Connecting...
                      </span>
                    )}

                    {/* Connected indicator */}
                    {account && (
                      <motion.div
                        className="ml-1 xs:ml-1.5 w-3 h-3 xs:w-3.5 xs:h-3.5 bg-green-400 rounded-full flex items-center justify-center"
                        initial={{ opacity: 0.8 }}
                        animate={{
                          opacity: [0.8, 0.9, 0.8],
                          boxShadow: [
                            '0 0 0px rgba(74, 222, 128, 0)',
                            '0 0 3px rgba(74, 222, 128, 0.5)',
                            '0 0 0px rgba(74, 222, 128, 0)',
                          ],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-1.5 h-1.5 xs:w-2 xs:h-2 text-white"
                        >
                          <path
                            d="M7.5 12L10.5 15L16.5 9"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Connect Button */}
        <div className="h-full flex items-center ml-1 xs:ml-2 z-10">
          {loading || authLoading ? (
            <div className="flex items-center justify-center px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 text-white">
              <NeubrutalistLoading
                message="Processing"
                subMessage="Please wait..."
                showSeal={false}
              />
            </div>
          ) : (
            <motion.div
              className="overflow-hidden"
              whileHover={{
                scale: 1.02,
                transform: 'translate(-2px, -2px)',
                boxShadow: '4px 4px 0px #000',
              }}
              style={{
                backgroundColor: '#000000',
                border: '2px solid #000',
                boxShadow: '3px 3px 0px #000',
                borderRadius: '0',
              }}
            >
              <ConnectButton
                client={client}
                wallets={wallets}
                theme={darkTheme({
                  colors: {
                    accentText: '#ffffff',
                    accentButtonBg: '#4338CA', // Solid Indigo
                    primaryButtonBg: '#4338CA', // Solid Indigo
                    modalBg: '#1F2937', // Dark background for modal
                    secondaryButtonBg: '#374151', // Dark secondary button
                    secondaryButtonHoverBg: '#4B5563', // Darker on hover
                    secondaryButtonText: '#FFFFFF', // White text
                    connectedButtonBg: '#4338CA', // Solid Indigo
                    modalOverlayBg: 'rgba(17, 24, 39, 0.8)', // Dark gray
                    primaryText: '#FFFFFF',
                  },
                })}
                connectButton={{
                  label: 'Connect',
                  className:
                    'text-white font-bold py-1 xs:py-1.5 sm:py-2 px-2 xs:px-3 sm:px-5 text-[10px] xs:text-xs sm:text-sm !rounded-none',
                }}
                onConnect={async () => {
                  // When wallet is connected, we need to check if the account is updated
                  // Wait a moment for the account to be updated
                  setTimeout(async () => {
                    if (account) {
                      if (!user || user.walletAddress !== account.address) {
                        await login(account.address);
                      }
                    }
                  }, 500);
                }}
                onDisconnect={handleWalletDisconnect}
              />
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
