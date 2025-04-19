'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, activeContext } = useAuth();

  // Function to navigate to appropriate dashboard
  const goToDashboard = () => {
    if (!user) {
      router.push('/');
      return;
    }

    if (user.userType === 'individual') {
      router.push('/individual-dashboard');
    } else if (user.userType === 'organization') {
      router.push('/organization-dashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-4">
      <div className="bg-white border-4 border-deep-moss p-8 shadow-brutal max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-soft-sage p-4 rounded-full border-4 border-deep-moss">
            <Shield size={64} className="text-deep-moss" />
          </div>
        </div>

        <h1 className="text-3xl font-black mb-4 text-deep-moss">
          Access Denied
        </h1>

        <p className="text-lg mb-6 text-deep-moss">
          You don't have permission to access this page. This could be because:
        </p>

        <ul className="text-left mb-8 text-deep-moss">
          <li className="mb-2">• You're not logged in</li>
          <li className="mb-2">• You don't have the required permissions</li>
          <li className="mb-2">
            • You're trying to access an organization you don't belong to
          </li>
        </ul>

        <button
          onClick={goToDashboard}
          className="flex items-center justify-center gap-2 w-full bg-forest-green text-white px-4 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <ArrowLeft size={20} />
          <span>Go to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
