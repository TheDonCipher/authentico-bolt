'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { AuthGuard } from '../../components/auth/AuthGuard';
import { ProfileCard } from '../../components/dashboard/ProfileCard';
import { NotificationBell } from '../../components/dashboard/NotificationBell';
import { Loader } from '../../components/ui/Loader';
import { Toast } from '../../components/ui/Toast';
import Link from 'next/link';
import { SignOutButton } from '../../components/auth/SignOutButton';
import {
  Home,
  Users,
  Building,
  FileText,
  Settings,
  Shield,
  Menu,
  X,
  User,
} from 'lucide-react';
import OrganizationApplications from '../components/OrganizationApplications';

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function OrganizationsPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [activeTab, setActiveTab] = useState<'organizations' | 'applications'>(
    'applications'
  );

  if (!user) {
    return <Loader />;
  }

  return (
    <AuthGuard allowedUserTypes={['admin']}>
      <div className="min-h-screen bg-ivory text-deep-moss flex flex-col md:flex-row font-archivo">
        {/* Mobile sidebar toggle button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden fixed bottom-4 right-4 z-50 p-3 bg-forest-green text-ivory rounded-full shadow-brutal hover:translate-y-[-2px] transition-all"
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'fixed inset-0 z-40' : 'hidden'
          } md:relative md:block md:w-64 bg-soft-sage border-r-4 border-deep-moss h-auto md:min-h-screen md:h-full md:sticky md:top-0 z-30 overflow-y-auto transition-all duration-300 ease-in-out`}
        >
          <div className="p-4 flex flex-col min-h-full">
            {/* Close button - only visible on mobile when sidebar is open */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden absolute top-4 right-4 p-2 text-deep-moss hover:text-forest-green"
              aria-label="Close sidebar"
            >
              <X size={24} />
            </button>

            {/* Admin title */}
            <div className="mb-8 text-center">
              <h2 className="text-xl font-black text-deep-moss bg-ivory p-2 border-2 border-deep-moss shadow-brutal">
                ADMIN PANEL
              </h2>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col gap-3 flex-grow">
              <Link href="/admin-dashboard">
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                  <Home size={20} className="text-deep-moss" />
                  <span className="font-bold text-deep-moss">Dashboard</span>
                </div>
              </Link>

              <Link href="/admin-dashboard/users">
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                  <Users size={20} className="text-deep-moss" />
                  <span className="font-bold text-deep-moss">Users</span>
                </div>
              </Link>

              <Link href="/admin-dashboard/organizations">
                <div className="flex items-center gap-3 px-4 py-3 border-2 bg-forest-green text-ivory border-deep-moss shadow-brutal">
                  <Building size={20} className="text-ivory" />
                  <span className="font-bold text-ivory">Organizations</span>
                </div>
              </Link>

              <Link href="/admin-dashboard/documents">
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                  <FileText size={20} className="text-deep-moss" />
                  <span className="font-bold text-deep-moss">Documents</span>
                </div>
              </Link>

              <Link href="/admin-dashboard/settings">
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                  <Settings size={20} className="text-deep-moss" />
                  <span className="font-bold text-deep-moss">Settings</span>
                </div>
              </Link>

              {/* Individual dashboard link */}
              <Link
                href={
                  user ? `/user/${user.uid}/dashboard` : '/individual-dashboard'
                }
              >
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                  <Users size={20} className="text-deep-moss" />
                  <span className="font-bold text-deep-moss">
                    Individual Dashboard
                  </span>
                </div>
              </Link>
            </nav>

            {/* Sign Out Button */}
            <div className="mt-4 pt-6">
              <SignOutButton className="flex items-center gap-3 w-full px-4 py-3 border-2 border-deep-moss bg-burnt-sienna bg-opacity-20 text-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all" />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-y-auto pb-20 md:pb-0">
          <header className="bg-soft-sage p-4 border-b-4 border-deep-moss sticky top-0 z-20">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-black text-deep-moss mr-4">
                  Organizations Management
                </h1>
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full border border-red-300 text-sm font-medium">
                  <Shield size={16} className="inline-block mr-1" />
                  Admin
                </div>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell count={0} onClick={() => {}} />
                <ProfileCard />
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto p-4 md:p-8 pb-20 md:pb-8">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-deep-moss pb-4 mb-6 md:mb-8 gap-4">
                <h2 className="text-3xl md:text-4xl font-black text-deep-moss">
                  Organization Management
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('organizations')}
                    className={`px-4 py-2 font-bold transition-all ${
                      activeTab === 'organizations'
                        ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                        : 'hover:bg-soft-sage hover:border-2 hover:border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                    }`}
                  >
                    Organizations
                  </button>
                  <button
                    onClick={() => setActiveTab('applications')}
                    className={`px-4 py-2 font-bold transition-all ${
                      activeTab === 'applications'
                        ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                        : 'hover:bg-soft-sage hover:border-2 hover:border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                    }`}
                  >
                    Applications
                  </button>
                </div>
              </div>
            </div>

            {activeTab === 'organizations' ? (
              <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
                <h3 className="text-2xl font-bold mb-4 text-deep-moss">
                  Verified Organizations
                </h3>
                <p className="text-deep-moss mb-4">
                  This section will display all verified organizations in the
                  system.
                </p>
                <div className="bg-white p-6 border-2 border-deep-moss text-center">
                  <p className="text-lg font-bold text-deep-moss">
                    Organization management features coming soon
                  </p>
                </div>
              </section>
            ) : (
              <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
                <h3 className="text-2xl font-bold mb-4 text-deep-moss">
                  Organization Verification Applications
                </h3>
                <p className="text-deep-moss mb-4">
                  Review and manage organization verification applications.
                </p>
                <OrganizationApplications />
              </section>
            )}
          </main>
        </div>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}
    </AuthGuard>
  );
}
