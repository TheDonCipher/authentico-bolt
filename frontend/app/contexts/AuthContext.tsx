'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import {
  loginWithWallet,
  registerUser,
  getUserData,
  signOutUser,
} from '../../lib/auth-service';
import { useActiveAccount } from 'thirdweb/react';

// Define the shape of the user object
interface User {
  uid: string;
  walletAddress: string;
  userType: 'individual' | 'organization';
  name: string;
  organizationName?: string;
}

// Define the shape of the auth context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isInitializing: boolean;
  login: (
    walletAddress: string
  ) => Promise<{ success: boolean; newUser?: boolean; message?: string }>;
  register: (
    walletAddress: string,
    userType: 'individual' | 'organization',
    userData: any
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Track wallets that are known to be unregistered to avoid login loops
  const [unregisteredWallets, setUnregisteredWallets] = useState<string[]>([]);
  const router = useRouter();
  const account = useActiveAccount();

  // Clear any error
  const clearError = () => setError(null);

  // Login with wallet
  const login = useCallback(
    async (walletAddress: string) => {
      try {
        setLoading(true);
        clearError();
        console.log('Logging in with wallet address:', walletAddress);
        const result = await loginWithWallet(walletAddress);

        if (result.success && result.user) {
          console.log('Login successful, setting user:', result.user);
          setUser(result.user as User);
          // Remove from unregistered wallets if it was there
          if (unregisteredWallets.includes(walletAddress)) {
            console.log(
              'Removing wallet from unregistered list:',
              walletAddress
            );
            setUnregisteredWallets((prev) =>
              prev.filter((address) => address !== walletAddress)
            );
          }
          return { success: true, message: result.message };
        } else if (result.newUser) {
          console.log('New user detected, needs registration');
          // Add to unregistered wallets to prevent auto-login attempts
          if (!unregisteredWallets.includes(walletAddress)) {
            console.log(
              'Adding new wallet to unregistered list:',
              walletAddress
            );
            setUnregisteredWallets((prev) => [...prev, walletAddress]);
          }
          return { success: false, newUser: true, message: result.message };
        }

        console.log('Login failed for other reasons');
        return { success: false };
      } catch (err: any) {
        console.error('Login error:', err);
        setError(err.message || 'Failed to login');
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [unregisteredWallets]
  );

  // Register a new user
  const register = useCallback(
    async (
      walletAddress: string,
      userType: 'individual' | 'organization',
      userData: any
    ) => {
      try {
        setLoading(true);
        clearError();
        const result = await registerUser(walletAddress, userType, userData);

        if (result.success && result.user) {
          // If registration is successful, remove from unregistered wallets list
          setUnregisteredWallets((prev) =>
            prev.filter((address) => address !== walletAddress)
          );
          setUser(result.user as User);
        }

        return { success: result.success, message: result.message };
      } catch (err: any) {
        setError(err.message || 'Failed to register');
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      clearError();

      // Sign out from Firebase
      await signOutUser();

      // Clear user state
      setUser(null);

      // Add the current wallet to unregistered wallets to prevent auto-login attempts
      // This is a temporary measure until the user explicitly tries to log in again
      if (account) {
        console.log(
          'Adding wallet to unregistered list on logout:',
          account.address
        );
        setUnregisteredWallets((prev) => {
          // Only add if not already in the list
          if (!prev.includes(account.address)) {
            return [...prev, account.address];
          }
          return prev;
        });
      }

      // Redirect to home page
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to logout');
    } finally {
      setLoading(false);
    }
  }, [router, account]);

  // Listen for auth state changes
  useEffect(() => {
    setIsInitializing(true);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          try {
            // Get the user data from our API
            const userData = await getUserData();
            setUser(userData as User);
          } catch (err: any) {
            console.error('Error fetching user data:', err);
            setError(err.message || 'Failed to fetch user data');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err: any) {
        console.error('Auth state change error:', err);
        setError(err.message || 'Authentication error');
      } finally {
        setIsInitializing(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Check if wallet is connected but user is not authenticated
  useEffect(() => {
    // Skip the effect if no account, already logged in, loading, or initializing
    if (!account || user || loading || isInitializing) {
      return;
    }

    console.log(
      'Wallet connected but no user authenticated. Checking wallet:',
      account.address
    );
    console.log('Unregistered wallets:', unregisteredWallets);

    // Create a memoized function to avoid dependency issues
    const checkWalletAuth = async () => {
      // Skip if this wallet is known to be unregistered
      if (unregisteredWallets.includes(account.address)) {
        console.log('Wallet is in unregistered list, skipping auto-login');
        // Just show the error message but don't try to login again
        setError('This wallet is not registered. Please register first.');
        return;
      }

      try {
        console.log('Attempting to auto-login with wallet:', account.address);
        const result = await login(account.address);

        // If login failed because user doesn't exist, add to unregistered wallets
        if (!result.success && result.newUser) {
          console.log(
            'Auto-login failed - new user, adding to unregistered list'
          );
          setError('This wallet is not registered. Please register first.');
        } else if (result.success) {
          console.log('Successfully authenticated with wallet');
          // Clear any previous errors
          clearError();
        } else {
          console.log('Auto-login failed for other reasons');
          setError('Failed to authenticate with wallet. Please try again.');
        }
      } catch (err: any) {
        // Handle login errors
        setError(err.message || 'Failed to authenticate with wallet');
        console.error('Wallet auth error:', err);
      }
    };

    // Execute the check
    checkWalletAuth();
  }, [account, user, loading, isInitializing, login, unregisteredWallets]);

  // Provide the auth context
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        isInitializing,
      }}
    >
      {isInitializing ? (
        <div className="min-h-screen bg-[#F0EAD6]">
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white border-4 border-[#556B2F] p-6 shadow-[8px_8px_0px_0px_rgba(85,107,47,1)] max-w-sm w-full text-center transform rotate-1">
              <h3 className="text-2xl font-black mb-4 text-[#2F4F4F] transform -rotate-2 inline-block bg-[#D2E3C8] p-2 border-4 border-[#556B2F]">
                AUTHENTICO
              </h3>

              <div className="flex justify-center my-4">
                <div className="relative w-24 h-24">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className="absolute top-0 left-0 w-full h-full border-4 border-[#556B2F] animate-pulse"
                      style={{
                        rotate: `${index * 15}deg`,
                        backgroundColor:
                          index === 0
                            ? '#D2E3C8'
                            : index === 1
                            ? '#E8EDE1'
                            : '#F0EAD6',
                        animationDelay: `${index * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <p className="text-[#2F4F4F] font-bold">Loading Authentico...</p>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
