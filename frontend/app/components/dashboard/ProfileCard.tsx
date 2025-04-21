'use client';

import { useAuth } from '../../contexts/AuthContext';
import { ConnectButton, darkTheme, useActiveAccount } from 'thirdweb/react';
import { client } from '../../client';
import { createWallet, inAppWallet } from 'thirdweb/wallets';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

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
      {/* Combined Profile Card and Connect Button */}
      <div className="bg-ivory border-2 sm:border-4 border-deep-moss shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] sm:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] overflow-hidden flex items-center transition-all hover:translate-y-[-1px] sm:hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_0px_rgba(27,67,50,1)] sm:hover:shadow-[6px_6px_0px_0px_rgba(27,67,50,1)]">
        {/* User Profile */}
        <div className="flex items-center p-2 sm:p-3 border-r-2 sm:border-r-4 border-deep-moss">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-soft-sage border-2 sm:border-4 border-deep-moss rounded-full flex items-center justify-center mr-2 sm:mr-3 shadow-[1px_1px_0px_0px_rgba(27,67,50,0.7)] sm:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.7)]">
            {user?.userType === 'admin' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-deep-moss sm:w-[18px] sm:h-[18px]"
              >
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path>
                <path d="M12 8v8"></path>
                <path d="M12 16v.01"></path>
              </svg>
            ) : user?.userType === 'organization' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-deep-moss sm:w-[18px] sm:h-[18px]"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-deep-moss sm:w-[18px] sm:h-[18px]"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-deep-moss text-sm sm:text-base tracking-tight truncate max-w-[80px] sm:max-w-[120px] md:max-w-[150px]">
              {user?.userType === 'organization'
                ? user?.organizationName || 'Organization'
                : user?.name || 'User'}
            </span>
            <div className="flex items-center">
              <span className="text-xs font-medium text-forest-green hidden xs:inline">
                {user?.userType === 'admin'
                  ? 'Admin Account'
                  : user?.userType === 'individual'
                  ? 'Individual Account'
                  : 'Organization Account'}
              </span>
              {user?.userType === 'admin' && (
                <span className="ml-1 bg-red-100 text-red-800 text-xs px-1 rounded-full">
                  Admin
                </span>
              )}
            </div>
            {user?.walletAddress && (
              <span className="text-xs text-gray-500 font-mono truncate max-w-[80px] sm:max-w-[120px] md:max-w-[150px]">
                {user.walletAddress.substring(0, 4)}...
                {user.walletAddress.substring(user.walletAddress.length - 4)}
              </span>
            )}
          </div>
        </div>

        {/* Connect Button */}
        <div className="bg-forest-green h-full flex items-center px-1">
          {loading || authLoading ? (
            <div className="flex items-center justify-center px-2 sm:px-4 py-2 text-white">
              <LoadingSpinner
                size={14}
                className="mr-1 sm:mr-2 animate-spin sm:w-4 sm:h-4"
              />
              <span className="text-xs sm:text-sm">Signing Out...</span>
            </div>
          ) : (
            <ConnectButton
              client={client}
              wallets={wallets}
              theme={darkTheme({
                colors: {
                  accentText: '#ffffff',
                  accentButtonBg: '#2E7D32', // Forest Green
                  primaryButtonBg: '#2E7D32', // Forest Green
                  modalOverlayBg: 'rgba(250, 249, 246, 0.8)', // Ivory
                  primaryText: '#FFFFFF',
                  secondaryText: '#FAF9F6', // Ivory
                  connectedButtonBg: '#2E7D32', // Forest Green
                },
              })}
              connectButton={{
                label: 'Wallet',
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
          )}
        </div>
      </div>
    </div>
  );
};
