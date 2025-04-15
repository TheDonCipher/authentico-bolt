'use client';

import { useAuth } from '../../contexts/AuthContext';
import { ConnectButton, darkTheme, useActiveAccount } from 'thirdweb/react';
import { client } from '../../client';
import { createWallet, inAppWallet } from 'thirdweb/wallets';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
  const { user, logout, login } = useAuth();
  const router = useRouter();
  const account = useActiveAccount();

  // Handle wallet disconnection
  const handleWalletDisconnect = async () => {
    try {
      // Log the user out
      await logout();
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Ensure wallet is connected when user is logged in
  useEffect(() => {
    const syncWalletState = async () => {
      // If user is logged in, make sure wallet state is correct
      if (user) {
        console.log('User is logged in, checking wallet state:', {
          userWallet: user.walletAddress,
          connectedWallet: account?.address || 'not connected',
        });

        // If we have a connected wallet but it doesn't match the user's wallet
        if (
          account &&
          user.walletAddress?.toLowerCase() !== account.address.toLowerCase()
        ) {
          console.log("Wallet addresses don't match, attempting to sync");
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
    if (user && !account) {
      console.log(
        'User is logged in but wallet is not connected, attempting to reconnect'
      );
      // This will trigger the wallet connection modal if needed
      // We can't directly connect the wallet programmatically due to security restrictions
    }
  }, [user, account]);

  return (
    <div className="flex items-center">
      {/* Combined Profile Card and Connect Button */}
      <div className="bg-ivory border-4 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] overflow-hidden flex items-center transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(27,67,50,1)]">
        {/* User Profile */}
        <div className="flex items-center p-3 border-r-4 border-deep-moss">
          <div className="w-12 h-12 bg-soft-sage border-4 border-deep-moss rounded-full flex items-center justify-center mr-3 shadow-[2px_2px_0px_0px_rgba(27,67,50,0.7)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-deep-moss"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-deep-moss text-base tracking-tight">
              {user?.name || 'User'}
            </span>
            <span className="text-xs font-medium text-forest-green">
              {user?.userType === 'individual'
                ? 'Individual Account'
                : 'Organization Account'}
            </span>
          </div>
        </div>

        {/* Connect Button */}
        <div className="bg-forest-green h-full flex items-center px-1">
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
              console.log('Wallet connected event triggered');
              // Wait a moment for the account to be updated
              setTimeout(async () => {
                if (account) {
                  console.log(
                    'Account available after connection:',
                    account.address
                  );
                  if (!user || user.walletAddress !== account.address) {
                    console.log('Syncing user with newly connected wallet');
                    await login(account.address);
                  }
                }
              }, 500);
            }}
            onDisconnect={handleWalletDisconnect}
          />
        </div>
      </div>
    </div>
  );
};
