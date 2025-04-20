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
  userType: 'individual' | 'organization' | 'admin';
  name: string;
  organizationName?: string;
  isVerified?: boolean;
  email?: string;
}

// Define the shape of the auth context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isInitializing: boolean;
  activeContext: 'individual' | 'organization' | null;
  setActiveContext: (
    context: 'individual' | 'organization',
    orgId?: string
  ) => void;
  login: (walletAddress: string) => Promise<{
    success: boolean;
    newUser?: boolean;
    networkError?: boolean;
    firebaseAuthError?: boolean;
    message?: string;
  }>;
  register: (
    walletAddress: string,
    userType: 'individual' | 'organization',
    userData: any
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  isAdmin: boolean;
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
  const [activeContext, setActiveContextState] = useState<
    'individual' | 'organization' | null
  >(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  // Track wallets that are known to be unregistered to avoid login loops
  const [unregisteredWallets, setUnregisteredWallets] = useState<string[]>([]);
  const router = useRouter();
  const account = useActiveAccount();

  // Compute admin status
  const isAdmin: boolean =
    user?.userType === 'admin' ||
    !!(
      user?.walletAddress &&
      user.walletAddress.toLowerCase() ===
        (
          process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ||
          '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c'
        ).toLowerCase()
    );

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
          return {
            success: true,
            message: result.message || 'Sign in successful!',
          };
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
          return {
            success: false,
            newUser: true,
            message:
              result.message ||
              'This wallet is not registered yet. Please register first.',
          };
        } else if (result.networkError) {
          console.log('Network error during login, API may be offline');
          // Set a non-blocking error that doesn't prevent the app from working
          setError(
            result.message || 'Network error. API server may be offline.'
          );
          return {
            success: false,
            networkError: true,
            message:
              result.message || 'Network error. API server may be offline.',
          };
        }

        console.log('Login failed for other reasons');
        setError('Authentication failed. Please try again.');
        return {
          success: false,
          message: 'Authentication failed. Please try again.',
        };
      } catch (err: any) {
        console.error('Login error:', err);
        const errorMessage =
          err.message || 'Failed to login. Please try again.';
        setError(errorMessage);
        return { success: false, message: errorMessage };
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

  // Track wallet connection and disconnection
  const [previousWalletAddress, setPreviousWalletAddress] = useState<
    string | null
  >(null);

  // Check if wallet is connected but user is not authenticated
  useEffect(() => {
    // If we're initializing, don't do anything yet
    if (isInitializing) {
      return;
    }

    // Track wallet connection/disconnection
    if (account) {
      console.log('Wallet connected:', account.address);

      // If the wallet address changed, clear any previous errors
      if (previousWalletAddress !== account.address) {
        clearError();
        setPreviousWalletAddress(account.address);
      }

      // If we have a wallet but no user, try to authenticate
      if (!user && !loading) {
        console.log(
          'Wallet connected but no user authenticated. Checking wallet:',
          account.address
        );
        console.log('Unregistered wallets:', unregisteredWallets);

        // Skip if this wallet is known to be unregistered
        if (unregisteredWallets.includes(account.address)) {
          console.log('Wallet is in unregistered list, skipping auto-login');
          setError('This wallet is not registered. Please register first.');
          return;
        }

        // Check if auto-login is disabled due to repeated failures
        const autoLoginDisabled = localStorage.getItem('autoLoginDisabled');
        if (autoLoginDisabled === 'true') {
          console.log('Auto-login is disabled due to repeated failures');
          // Clear this flag if it's been more than 5 minutes since it was set
          const disabledTimestamp = parseInt(
            localStorage.getItem('autoLoginDisabledTimestamp') || '0',
            10
          );
          const now = Date.now();
          const fiveMinutesMs = 5 * 60 * 1000;

          if (now - disabledTimestamp > fiveMinutesMs) {
            console.log('Auto-login disabled flag is stale, clearing it');
            localStorage.removeItem('autoLoginDisabled');
            localStorage.removeItem('autoLoginDisabledTimestamp');
            localStorage.setItem('autoLoginFailureCount', '0');
          } else {
            setError(
              'Automatic login is disabled due to repeated failures. Please login manually.'
            );
            return;
          }
        }

        // Store the last auto-login attempt timestamp in session storage
        const lastAttemptStr = sessionStorage.getItem('lastAutoLoginAttempt');
        const lastAttempt = lastAttemptStr ? parseInt(lastAttemptStr, 10) : 0;
        const now = Date.now();

        // If we've tried recently (within the last 10 seconds), don't try again
        if (lastAttempt && now - lastAttempt < 10000) {
          console.log('Skipping auto-login attempt - tried recently');
          return;
        }

        // Update the timestamp before attempting login
        sessionStorage.setItem('lastAutoLoginAttempt', now.toString());

        // Attempt to login with the connected wallet
        (async () => {
          try {
            console.log(
              'Attempting to auto-login with wallet:',
              account.address
            );
            setLoading(true);
            setError('Authenticating with your wallet...');

            const result = await login(account.address);

            if (result.success) {
              console.log('Successfully authenticated with wallet');
              clearError();
              // Reset failure count on success
              localStorage.setItem('autoLoginFailureCount', '0');
            } else if (result.newUser) {
              console.log(
                'Auto-login failed - new user, adding to unregistered list'
              );
              setError('This wallet is not registered. Please register first.');
            } else {
              console.log('Auto-login failed:', result.message);
              setError(
                result.message ||
                  'Failed to authenticate with wallet. Please try again.'
              );

              // Track login failures
              const currentFailures = parseInt(
                localStorage.getItem('autoLoginFailureCount') || '0'
              );
              const newFailureCount = currentFailures + 1;
              localStorage.setItem(
                'autoLoginFailureCount',
                newFailureCount.toString()
              );

              // Disable auto-login after 2 consecutive failures
              if (newFailureCount >= 2) {
                console.log('Disabling auto-login due to repeated failures');
                localStorage.setItem('autoLoginDisabled', 'true');
                localStorage.setItem(
                  'autoLoginDisabledTimestamp',
                  Date.now().toString()
                );

                // We'll check the timestamp when needed instead of using setTimeout
                // This is more reliable across page refreshes
              }
            }
          } catch (err: any) {
            console.error('Wallet auth error:', err);
            setError(err.message || 'Failed to authenticate with wallet');
          } finally {
            setLoading(false);
          }
        })();
      }
    } else {
      // Wallet disconnected
      if (previousWalletAddress) {
        console.log('Wallet disconnected');
        setPreviousWalletAddress(null);

        // If we had a user but wallet disconnected, log them out
        if (user) {
          console.log('Logging out due to wallet disconnection');
          logout();
        }
      }
    }
  }, [
    account,
    user,
    loading,
    isInitializing,
    unregisteredWallets,
    login,
    logout,
    previousWalletAddress,
    clearError,
  ]);

  // Function to set active context
  const setActiveContext = useCallback(
    (context: 'individual' | 'organization', orgId?: string) => {
      // Check if user is trying to switch to individual context but is an organization user
      if (
        context === 'individual' &&
        user &&
        user.userType === 'organization'
      ) {
        // We'll still set the context, but the ContextSwitcher will handle the redirection
        console.log('Organization user trying to switch to individual context');
      }

      setActiveContextState(context);
      if (context === 'organization' && orgId) {
        setActiveOrgId(orgId);
      } else {
        setActiveOrgId(null);
      }
    },
    [user]
  );

  // Navigate to the appropriate dashboard based on context
  const navigateToDashboard = useCallback(() => {
    if (user) {
      if (activeContext === 'individual') {
        router.push(`/individual-dashboard`);
      } else if (activeContext === 'organization' && activeOrgId) {
        router.push(`/organization-dashboard`);
      }
    }
  }, [user, activeContext, activeOrgId, router]);

  // Set initial active context based on user type and navigate to dashboard
  useEffect(() => {
    if (user) {
      console.log('User authenticated in AuthContext:', user);
      setActiveContextState(user.userType as 'individual' | 'organization');
      if (user.userType === 'organization') {
        console.log('Setting active org ID to:', user.uid);
        setActiveOrgId(user.uid);
      }

      // Navigate to the appropriate dashboard
      if (user.userType === 'individual') {
        console.log('Navigating to individual dashboard');
        router.push(`/user/${user.uid}/dashboard`);
      } else if (user.userType === 'organization') {
        console.log('Navigating to organization dashboard');
        router.push(`/org/${user.uid}/dashboard`);
      }
    } else {
      console.log('No user authenticated, clearing context');
      setActiveContextState(null);
      setActiveOrgId(null);
    }
  }, [user, router]);

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
        activeContext,
        setActiveContext,
        isAdmin,
      }}
    >
      {isInitializing || loading ? (
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

              <p className="text-[#2F4F4F] font-bold">
                {isInitializing
                  ? 'Loading Authentico...'
                  : loading && !user
                  ? 'Securely Signing Out...'
                  : loading && user
                  ? 'Preparing Your Dashboard...'
                  : error && error !== 'Authenticating with your wallet...'
                  ? error
                  : 'Verifying Your Blockchain Credentials...'}
              </p>

              {!isInitializing && (
                <button
                  onClick={() => {
                    setLoading(false);
                    clearError();
                  }}
                  className="mt-4 bg-[#2E7D32] text-white px-4 py-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Cancel
                </button>
              )}
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
