import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectButton, darkTheme } from 'thirdweb/react';
import { useActiveAccount } from 'thirdweb/react';
import { useAuth } from '../../contexts/AuthContext';
import { Wallet } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ConnectWalletButtonProps {
  client: any;
  wallets: any[];
  onSuccess?: () => void;
  buttonText?: string;
  className?: string;
}

export const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  client,
  wallets,
  onSuccess,
  buttonText = 'Connect Wallet',
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const account = useActiveAccount();
  const { login, error } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!account) return;

    try {
      setIsLoading(true);
      const result = await login(account.address);

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          // Success message
          if (result.message) {
            // You can add toast notification here if needed
          }
          // Redirect will happen automatically via AuthContext
        }
      } else if (result.newUser) {
        // New user needs to register
        if (result.message) {
          // You can add toast notification here if needed
        }
        router.push('/register');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // You can add error toast notification here if needed
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
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
        connectButton={{ label: buttonText }}
        connectModal={{
          size: 'wide',
          welcomeScreen: {
            title: 'Welcome to Authentico',
            subtitle: 'Secure document verification powered by blockchain',
          },
        }}
      />

      {account && (
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className={`flex items-center justify-center gap-2 bg-[#4A6741] text-white py-2 px-4 rounded-lg hover:bg-[#5D8C5D] transition-colors ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          } ${className}`}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size={16} />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <Wallet size={16} />
              <span>Sign In</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};
