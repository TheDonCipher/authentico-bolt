import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDisconnect, useActiveAccount } from 'thirdweb/react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface SignOutButtonProps {
  className?: string;
}

export const SignOutButton: React.FC<SignOutButtonProps> = ({
  className = '',
}) => {
  const { logout, loading: authLoading } = useAuth();
  const { disconnect } = useDisconnect();
  const account = useActiveAccount();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);

      // First sign out from the app
      await logout();

      // Then disconnect the wallet if it exists
      if (account) {
        try {
          disconnect();
        } catch (disconnectError) {
          console.error('Error disconnecting wallet:', disconnectError);
          // Continue even if wallet disconnect fails
        }
      }

      // Keep loading state for a moment to show the user something is happening
      // This is especially important for mobile where the UI might not update fast enough
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading || authLoading}
      className={`flex items-center justify-center gap-2 px-4 py-2 bg-forest-green text-ivory font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all ${
        loading || authLoading ? 'opacity-70 cursor-not-allowed' : ''
      } ${className}`}
    >
      {loading ? (
        <>
          <LoadingSpinner size={16} className="animate-spin" />
          <span>Signing Out...</span>
        </>
      ) : (
        <>
          <LogOut size={16} />
          <span>Sign Out</span>
        </>
      )}
    </button>
  );
};
