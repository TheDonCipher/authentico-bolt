'use client';

import React from 'react';
import { useParams } from 'next/navigation';
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
  const { isAdmin } = useAuth();
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
        <div className="flex flex-col md:flex-row min-h-screen bg-ivory">
          {/* Mobile sidebar toggle button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden fixed bottom-4 right-4 z-50 p-3 bg-forest-green text-ivory rounded-full shadow-brutal hover:translate-y-[-2px] transition-all"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Sidebar */}
          <aside
            className={`${
              sidebarOpen ? 'fixed inset-0 z-40' : 'hidden'
            } md:static md:block md:w-64 bg-soft-sage border-r-4 border-deep-moss h-auto md:min-h-screen md:h-full md:sticky md:top-0 z-30 overflow-y-auto transition-all duration-300 ease-in-out`}
          >
            <div className="p-4 flex flex-col min-h-full">
              {/* Close button - only visible on mobile when sidebar is open */}
              <button
                onClick={toggleSidebar}
                className="md:hidden absolute top-4 right-4 p-2 text-deep-moss hover:text-forest-green"
                aria-label="Close sidebar"
              >
                <X size={24} />
              </button>

              {/* Organization name */}
              <div className="mb-8 text-center">
                <h2 className="text-xl font-black text-deep-moss bg-ivory p-2 border-2 border-deep-moss shadow-brutal">
                  AUTHENTICO
                </h2>
              </div>

              {/* Navigation links */}
              <nav className="flex flex-col gap-3 flex-grow">
                <Link href={`/org/${orgId}/dashboard`}>
                  <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                    <Home size={20} className="text-deep-moss" />
                    <span className="font-bold text-deep-moss">Dashboard</span>
                  </div>
                </Link>

                <Link href={`/org/${orgId}/documents`}>
                  <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                    <FileText size={20} className="text-deep-moss" />
                    <span className="font-bold text-deep-moss">Documents</span>
                  </div>
                </Link>

                <Link href={`/org/${orgId}/verification`}>
                  <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                    <CheckSquare size={20} className="text-deep-moss" />
                    <span className="font-bold text-deep-moss">
                      Verification
                    </span>
                  </div>
                </Link>

                <Link href={`/org/${orgId}/members`}>
                  <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                    <Users size={20} className="text-deep-moss" />
                    <span className="font-bold text-deep-moss">Members</span>
                  </div>
                </Link>

                <Link href={`/org/${orgId}/notifications`}>
                  <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                    <Bell size={20} className="text-deep-moss" />
                    <span className="font-bold text-deep-moss">
                      Notifications
                    </span>
                  </div>
                </Link>

                <Link href={`/org/${orgId}/settings`}>
                  <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                    <Settings size={20} className="text-deep-moss" />
                    <span className="font-bold text-deep-moss">Settings</span>
                  </div>
                </Link>

                {/* Admin link - only visible to admins */}
                {isAdmin && (
                  <Link href="/admin-dashboard">
                    <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                      <span className="font-bold text-deep-moss">
                        Admin Dashboard
                      </span>
                    </div>
                  </Link>
                )}

                {/* Individual dashboard link */}
                <Link href="/individual-dashboard">
                  <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                    <span className="font-bold text-deep-moss">
                      Individual Dashboard
                    </span>
                  </div>
                </Link>
              </nav>

              {/* Sign out button */}
              <div className="mt-4 pt-6">
                <SignOutButton className="flex items-center gap-3 w-full px-4 py-3 border-2 border-deep-moss bg-burnt-sienna bg-opacity-20 text-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all" />
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-y-auto pb-20 md:pb-0">
            {children}
          </div>
        </div>
      </OrganizationVerificationCheck>
    </AuthGuard>
  );
}
