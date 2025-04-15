import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectButton, darkTheme } from 'thirdweb/react';
import { useActiveAccount } from 'thirdweb/react';
import { useAuth } from '../../contexts/AuthContext';
import { Wallet } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Toast } from '../ui/Toast';
import { AnimatePresence } from 'framer-motion';

interface ConnectWalletButtonProps {
  client: any;
  wallets: any[];
  onSuccess?: () => void;
  buttonText?: string;
  className?: string;
}

interface ToastMessage {
  type: 'success' | 'error';
  message: string;
}

export const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  client,
  wallets,
  onSuccess,
  buttonText = 'Connect Wallet',
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const account = useActiveAccount();
  const { login, error, clearError } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!account) {
      setToastMessage({
        type: 'error',
        message: 'Please connect your wallet first',
      });
      return;
    }

    try {
      setIsLoading(true);
      clearError(); // Clear any previous errors
      const result = await login(account.address);

      if (result.success) {
        setToastMessage({
          type: 'success',
          message:
            result.message || 'Sign in successful! Redirecting to dashboard...',
        });

        if (onSuccess) {
          onSuccess();
        }
        // Redirect will happen automatically via AuthContext
      } else if (result.newUser) {
        // New user needs to register
        setToastMessage({
          type: 'error',
          message:
            result.message ||
            'This wallet is not registered yet. Please register first.',
        });

        // Delay redirect to allow toast to be seen
        setTimeout(() => {
          router.push('/register');
        }, 2000);
      } else {
        // Other login failures
        setToastMessage({
          type: 'error',
          message: result.message || 'Failed to sign in. Please try again.',
        });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'An error occurred during sign in. Please try again.';

      // Handle specific error types
      if (err.message && err.message.includes('authentication')) {
        errorMessage = 'Authentication error. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setToastMessage({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
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

      <ConnectButton
        client={client}
        wallets={wallets}
        theme={darkTheme({
          colors: {
            accentText: '#ffffff',
            accentButtonBg: '#2E7D32', // Forest Green
            primaryButtonBg: '#1B4332', // Deep Moss
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
          className={`flex items-center justify-center gap-2 bg-forest-green text-ivory py-2 px-4 rounded-lg hover:bg-deep-moss transition-colors ${
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
