import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDisconnect } from 'thirdweb/react';

interface SignOutButtonProps {
  className?: string;
}

export const SignOutButton: React.FC<SignOutButtonProps> = ({
  className = '',
}) => {
  const { logout, loading } = useAuth();
  const { disconnect } = useDisconnect();

  const handleSignOut = async () => {
    try {
      // First sign out from the app
      await logout();

      // Then disconnect the wallet
      disconnect();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={`flex items-center gap-2 text-red-600 hover:text-red-800 transition-colors ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <LogOut size={16} />
      <span>Sign Out</span>
    </button>
  );
};
