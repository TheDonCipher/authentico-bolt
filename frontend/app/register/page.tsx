'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'thirdweb/react';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';
import { NavBar } from '../components/landing/NavBar';
import { Footer } from '../components/layout/Footer';
import { NeubrutalistLoading } from '../components/ui/NeubrutalistLoading';
import { Toast } from '../components/ui/Toast';
import { AnimatePresence } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const { user, loading, isInitializing } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user && !loading && !isInitializing) {
      setToastMessage({
        type: 'success',
        message: 'Redirecting to user dashboard...',
      });
      setTimeout(() => {
        if (user.userType === 'individual') {
          router.push('/individual-dashboard');
        } else {
          router.push('/organization-dashboard');
        }
      }, 1500);
    }
  }, [user, loading, isInitializing, router]);

  // If no wallet is connected, redirect to home
  useEffect(() => {
    if (!account && !loading && !isInitializing) {
      setToastMessage({
        type: 'error',
        message: 'Please connect your wallet first',
      });
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
  }, [account, loading, isInitializing, router]);

  // Set page loading state
  useEffect(() => {
    if (!isInitializing) {
      // Add a small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setPageLoading(false);
      }, 800); // Increased delay for smoother transition
      return () => clearTimeout(timer);
    }
  }, [isInitializing]);

  // Show loading state when navigating to register page
  useEffect(() => {
    // Set loading to true on initial render
    setPageLoading(true);

    // Add a listener for route changes
    const handleRouteChange = () => {
      setPageLoading(true);
    };

    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  if (pageLoading || isInitializing) {
    return (
      <NeubrutalistLoading
        message="Preparing Blockchain Registration"
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-ivory text-deep-moss flex flex-col">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232E7D32' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px',
        }}
      />

      <NavBar toogleShow={() => {}} openForm={() => {}} />

      <main className="flex-1 flex items-center justify-center p-4 pt-24 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 inline-block bg-soft-sage p-2 border-4 border-deep-moss">
              Create Your Account
            </h1>
            <p className="text-gray-600 mt-4">
              Complete your registration to start using Authentico
            </p>
          </div>

          {registering ? (
            <NeubrutalistLoading message="Establishing Blockchain Identity..." />
          ) : (
            <RegisterForm
              onCancel={() => router.push('/')}
              onRegisterStart={() => setRegistering(true)}
              onRegisterEnd={() => setRegistering(false)}
            />
          )}
        </div>
      </main>

      <Footer />

      {/* Toast Notifications */}
      <AnimatePresence>
        {toastMessage && (
          <Toast
            type={toastMessage.type}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
            duration={5000}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
