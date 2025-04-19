'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthToken } from '../../../lib/token-util';
import axios from 'axios';
import { Loader } from '../ui/Loader';
import Link from 'next/link';
import { Home, AlertTriangle } from 'lucide-react';

interface OrganizationVerificationCheckProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

export const OrganizationVerificationCheck: React.FC<
  OrganizationVerificationCheckProps
> = ({ children, requireVerified = false }) => {
  // Default to false so organizations can access their dashboard
  const { user, loading: authLoading } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user || user.userType !== 'organization') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const token = await getAuthToken();

        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await axios.get(
          '/api/organizations/application/status',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setVerificationStatus(response.data.status);
      } catch (err) {
        console.error('Error checking organization verification status:', err);
        setError('Failed to check organization verification status');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      checkVerificationStatus();
    }
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full border-solid border-4 border-forest-green border-t-transparent h-10 w-10 mb-4"></div>
          <p className="text-lg">Checking organization status...</p>
        </div>
      </div>
    );
  }

  // If user is not an organization, just render children
  if (!user || user.userType !== 'organization') {
    return <>{children}</>;
  }

  // If verification is required and organization is not verified
  if (requireVerified && verificationStatus !== 'verified') {
    return (
      <div className="min-h-screen bg-ivory flex flex-col p-4">
        {/* Header */}
        <header className="bg-soft-sage p-4 border-b-4 border-deep-moss mb-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link
              href="/"
              className="text-2xl font-black text-deep-moss transform -rotate-2 bg-ivory p-2 border-4 border-deep-moss inline-block"
            >
              AUTHENTICO
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="bg-soft-sage border-4 border-deep-moss p-8 shadow-brutal max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-ivory p-4 rounded-full border-4 border-deep-moss">
                <AlertTriangle size={64} className="text-amber-500" />
              </div>
            </div>

            <h1 className="text-3xl font-black mb-4 text-deep-moss">
              Organization Not Verified
            </h1>

            <p className="text-lg mb-6 text-deep-moss">
              Your organization needs to be verified before you can access this
              feature.
            </p>

            <div className="mb-6 p-4 bg-ivory border-2 border-deep-moss">
              <h2 className="font-bold text-xl mb-2 text-deep-moss">
                Current Status: {verificationStatus}
              </h2>
              {verificationStatus === 'pending' && (
                <p>
                  Your verification application is being reviewed. Please check
                  back later.
                </p>
              )}
              {verificationStatus === 'rejected' && (
                <p>
                  Your verification application was rejected. Please apply again
                  with updated information.
                </p>
              )}
              {verificationStatus === 'not_verified' && (
                <p>
                  Please apply for verification from your organization
                  dashboard.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/organization-dashboard"
                className="flex items-center justify-center gap-2 w-full bg-forest-green text-ivory px-4 py-3 font-bold border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all"
              >
                <span>Go to Organization Dashboard</span>
              </Link>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full bg-ivory text-deep-moss px-4 py-3 font-bold border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all"
              >
                <Home size={20} />
                <span>Go to Home Page</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no verification required or organization is verified
  return <>{children}</>;
};
