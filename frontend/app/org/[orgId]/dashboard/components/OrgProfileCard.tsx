'use client';

import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';

export const OrgProfileCard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Handle logout
  const handleLogout = async () => {
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

  return (
    <div className="flex items-center">
      {/* Combined Profile Card and Logout Button */}
      <div className="bg-ivory border-4 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] overflow-hidden flex items-center transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(27,67,50,1)]">
        {/* User Profile */}
        <div className="flex items-center p-3 border-r-4 border-deep-moss">
          <div className="w-12 h-12 bg-soft-sage border-4 border-deep-moss rounded-full flex items-center justify-center mr-3 shadow-[2px_2px_0px_0px_rgba(27,67,50,0.7)]">
            {user?.userType === 'admin' ? (
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
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path>
                <path d="M12 8v8"></path>
                <path d="M12 16v.01"></path>
              </svg>
            ) : user?.userType === 'organization' ? (
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
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            ) : (
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
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-deep-moss text-base tracking-tight truncate max-w-[120px] sm:max-w-[150px]">
              {user?.userType === 'organization'
                ? user?.organizationName || 'Organization'
                : user?.name || 'User'}
            </span>
            <div className="flex items-center">
              <span className="text-xs font-medium text-forest-green">
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
              <span className="text-xs text-gray-500 font-mono truncate max-w-[120px] sm:max-w-[150px]">
                {user.walletAddress.substring(0, 6)}...
                {user.walletAddress.substring(user.walletAddress.length - 4)}
              </span>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="bg-forest-green h-full flex items-center px-1">
          {loading || authLoading ? (
            <div className="flex items-center justify-center px-4 py-2 text-white">
              <LoadingSpinner size={16} className="mr-2 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="text-white px-4 py-2 text-sm font-bold hover:bg-opacity-90 transition-all"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
