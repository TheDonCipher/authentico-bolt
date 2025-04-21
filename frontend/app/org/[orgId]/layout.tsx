'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { AuthGuard } from '../../components/auth/AuthGuard';
import { OrganizationVerificationCheck } from '../../components/auth/OrganizationVerificationCheck';
import Link from 'next/link';
import {
  Home,
  FileText,
  CheckSquare,
  Settings,
  Users,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import { SignOutButton } from '../../components/auth/SignOutButton';
import { useState } from 'react';

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const orgId = params?.orgId as string;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <AuthGuard
      allowedUserTypes={['organization', 'individual']}
      requiredOrgId={orgId}
    >
      {/* Don't require verification for the dashboard layout */}
      <OrganizationVerificationCheck requireVerified={false}>
        <div className="flex flex-col md:flex-row min-h-screen bg-ivory w-full max-w-full">
          {/* Mobile sidebar toggle button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden fixed bottom-4 right-4 z-50 p-3 bg-forest-green text-ivory rounded-full shadow-brutal hover:translate-y-[-2px] transition-all touch-target"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Overlay for mobile sidebar */}
          {sidebarOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={toggleSidebar}
              aria-hidden="true"
            />
          )}

          {/* Sidebar */}
          <aside
            className={`${
              sidebarOpen
                ? 'fixed right-0 top-0 bottom-0 w-[280px] z-40'
                : 'hidden'
            } md:static md:block md:w-64 bg-soft-sage border-r-2 md:border-r-4 border-deep-moss h-auto md:min-h-screen md:h-full md:sticky md:top-0 z-30 overflow-y-auto transition-all duration-300 ease-in-out`}
          >
            <div className="p-3 md:p-4 flex flex-col min-h-full">
              {/* Close button - only visible on mobile when sidebar is open */}
              <button
                onClick={toggleSidebar}
                className="md:hidden absolute top-4 right-4 p-2 text-deep-moss hover:text-forest-green touch-target"
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>

              {/* Organization name */}
              <div className="mb-6 md:mb-8 text-center">
                <h2 className="text-lg md:text-xl font-black text-deep-moss bg-ivory p-2 border-2 border-deep-moss shadow-brutal-sm md:shadow-brutal">
                  AUTHENTICO
                </h2>
              </div>

              {/* Navigation links */}
              <nav className="flex flex-col gap-2 sm:gap-3 flex-grow">
                <Link href={`/org/${orgId}/dashboard`}>
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal-sm sm:hover:shadow-brutal hover:-translate-y-0.5 transition-all touch-target">
                    <Home size={18} className="text-deep-moss flex-shrink-0" />
                    <span className="font-bold text-deep-moss text-sm sm:text-base">
                      Dashboard
                    </span>
                  </div>
                </Link>

                <Link href={`/org/${orgId}/documents`}>
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal-sm sm:hover:shadow-brutal hover:-translate-y-0.5 transition-all touch-target">
                    <FileText
                      size={18}
                      className="text-deep-moss flex-shrink-0"
                    />
                    <span className="font-bold text-deep-moss text-sm sm:text-base">
                      Documents
                    </span>
                  </div>
                </Link>

                <Link href={`/org/${orgId}/verification`}>
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal-sm sm:hover:shadow-brutal hover:-translate-y-0.5 transition-all touch-target">
                    <CheckSquare
                      size={18}
                      className="text-deep-moss flex-shrink-0"
                    />
                    <span className="font-bold text-deep-moss text-sm sm:text-base">
                      Verification
                    </span>
                  </div>
                </Link>

                <Link href={`/org/${orgId}/members`}>
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal-sm sm:hover:shadow-brutal hover:-translate-y-0.5 transition-all touch-target">
                    <Users size={18} className="text-deep-moss flex-shrink-0" />
                    <span className="font-bold text-deep-moss text-sm sm:text-base">
                      Members
                    </span>
                  </div>
                </Link>

                <Link href={`/org/${orgId}/notifications`}>
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal-sm sm:hover:shadow-brutal hover:-translate-y-0.5 transition-all touch-target">
                    <Bell size={18} className="text-deep-moss flex-shrink-0" />
                    <span className="font-bold text-deep-moss text-sm sm:text-base">
                      Notifications
                    </span>
                  </div>
                </Link>

                <Link href={`/org/${orgId}/settings`}>
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal-sm sm:hover:shadow-brutal hover:-translate-y-0.5 transition-all touch-target">
                    <Settings
                      size={18}
                      className="text-deep-moss flex-shrink-0"
                    />
                    <span className="font-bold text-deep-moss text-sm sm:text-base">
                      Settings
                    </span>
                  </div>
                </Link>

                {/* Admin link - only visible to admins */}
                {isAdmin && (
                  <Link href="/admin-dashboard">
                    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal-sm sm:hover:shadow-brutal hover:-translate-y-0.5 transition-all touch-target">
                      <span className="font-bold text-deep-moss text-sm sm:text-base">
                        Admin Dashboard
                      </span>
                    </div>
                  </Link>
                )}
              </nav>

              {/* Sign out button */}
              <div className="mt-3 sm:mt-4 pt-4 sm:pt-6">
                <SignOutButton className="flex items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-deep-moss bg-burnt-sienna bg-opacity-20 text-deep-moss hover:shadow-brutal-sm sm:hover:shadow-brutal hover:-translate-y-0.5 transition-all text-sm sm:text-base touch-target" />
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-y-auto pb-24 md:pb-0 w-full max-w-full">
            <div className="p-responsive w-full">{children}</div>
          </div>
        </div>
      </OrganizationVerificationCheck>
    </AuthGuard>
  );
}
