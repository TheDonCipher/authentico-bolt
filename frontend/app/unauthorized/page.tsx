'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

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
      router.push(`/user/${user.uid}/dashboard`);
    } else if (user.userType === 'organization') {
      router.push(`/org/${user.uid}/dashboard`);
    } else if (user.userType === 'admin') {
      router.push('/admin-dashboard');
    } else {
      router.push('/');
    }
  };

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
        <div className="bg-soft-sage border-4 border-deep-moss p-8 shadow-brutal max-w-md w-full text-center transform rotate-1">
          <div className="flex justify-center mb-6">
            <div className="bg-ivory p-4 rounded-full border-4 border-deep-moss transform -rotate-2">
              <Shield size={64} className="text-deep-moss" />
            </div>
          </div>

          <h1 className="text-3xl font-black mb-4 text-deep-moss">
            Access Denied
          </h1>

          <p className="text-lg mb-6 text-deep-moss">
            You don't have permission to access this page. This could be
            because:
          </p>

          <ul className="text-left mb-8 text-deep-moss">
            <li className="mb-2 flex items-start">
              <span className="mr-2 text-forest-green">•</span>
              <span>You're not logged in</span>
            </li>
            <li className="mb-2 flex items-start">
              <span className="mr-2 text-forest-green">•</span>
              <span>You don't have the required permissions</span>
            </li>
            <li className="mb-2 flex items-start">
              <span className="mr-2 text-forest-green">•</span>
              <span>
                You're trying to access an organization you don't belong to
              </span>
            </li>
          </ul>

          <div className="flex flex-col gap-3">
            <button
              onClick={goToDashboard}
              className="flex items-center justify-center gap-2 w-full bg-forest-green text-ivory px-4 py-3 font-bold border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all"
            >
              <ArrowLeft size={20} />
              <span>Back to Dashboard</span>
            </button>

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
