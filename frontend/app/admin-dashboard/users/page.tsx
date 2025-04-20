'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { AuthGuard } from '../../components/auth/AuthGuard';
import { ProfileCard } from '../../components/dashboard/ProfileCard';
import { NotificationBell } from '../../components/dashboard/NotificationBell';
import { Loader } from '../../components/ui/Loader';
import { Toast } from '../../components/ui/Toast';
import { getAuthToken } from '../../../lib/token-util';
import { API_ENDPOINTS } from '../../../lib/constants';
import {
  Home,
  Users,
  Building,
  FileText,
  Settings,
  Shield,
  Menu,
  X,
  AlertCircle,
  Search,
  UserCheck,
  UserX,
  RefreshCw,
  User,
} from 'lucide-react';

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface User {
  uid: string;
  name: string;
  email?: string;
  walletAddress: string;
  userType: string;
  isVerified: boolean;
  createdAt: any;
  updatedAt: any;
}

export default function UsersPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && user) {
      if (!isAdmin) {
        router.push('/unauthorized');
      } else {
        setIsLoading(false);
      }
    }
  }, [authLoading, user, isAdmin, router]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || !isAdmin) return;

      try {
        setIsLoadingUsers(true);
        setError(null);

        // Get auth token
        const token = await getAuthToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        // Fetch users from API
        const response = await fetch('/api/admin/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setToastMessage({
          type: 'error',
          message: 'Failed to load users',
        });
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [user, isAdmin]);

  // Filter users when search term or filter changes
  useEffect(() => {
    let filtered = [...users];

    // Apply user type filter
    if (userTypeFilter !== 'all') {
      filtered = filtered.filter((user) => user.userType === userTypeFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          (user.name && user.name.toLowerCase().includes(term)) ||
          (user.email && user.email.toLowerCase().includes(term)) ||
          user.walletAddress.toLowerCase().includes(term)
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, userTypeFilter]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';

    try {
      // Handle Firestore Timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }

      // Handle string timestamp
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Loader fullScreen text="Loading admin dashboard..." size="large" />
      </div>
    );
  }

  return (
    <AuthGuard allowedUserTypes={['admin']}>
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
          } md:relative md:block md:w-64 bg-soft-sage border-r-4 border-deep-moss md:h-screen overflow-y-auto transition-all duration-300 ease-in-out`}
        >
          <div className="p-4">
            {/* Close button - only visible on mobile when sidebar is open */}
            <button
              onClick={toggleSidebar}
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
            <nav className="flex flex-col gap-3">
              <Link href="/admin-dashboard">
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                  <Home size={20} className="text-deep-moss" />
                  <span className="font-bold text-deep-moss">Dashboard</span>
                </div>
              </Link>

              <Link href="/admin-dashboard/users">
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-deep-moss bg-ivory shadow-brutal -translate-y-0.5 transition-all">
                  <Users size={20} className="text-deep-moss" />
                  <span className="font-bold text-deep-moss">Users</span>
                </div>
              </Link>

              <Link href="/admin-dashboard/organizations">
                <div className="flex items-center gap-3 px-4 py-3 border-2 border-transparent hover:bg-ivory hover:border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all">
                  <Building size={20} className="text-deep-moss" />
                  <span className="font-bold text-deep-moss">
                    Organizations
                  </span>
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
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <header className="bg-soft-sage p-4 border-b-4 border-deep-moss sticky top-0 z-20">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-black text-deep-moss mr-4">
                  User Management
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

          <main className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-deep-moss pb-4 mb-6 md:mb-8 gap-4">
                <h2 className="text-3xl md:text-4xl font-black text-deep-moss">
                  Users
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUserTypeFilter('all')}
                    className={`px-4 py-2 font-bold transition-all ${
                      userTypeFilter === 'all'
                        ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                        : 'hover:bg-soft-sage hover:border-2 hover:border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setUserTypeFilter('individual')}
                    className={`px-4 py-2 font-bold transition-all ${
                      userTypeFilter === 'individual'
                        ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                        : 'hover:bg-soft-sage hover:border-2 hover:border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                    }`}
                  >
                    Individuals
                  </button>
                  <button
                    onClick={() => setUserTypeFilter('organization')}
                    className={`px-4 py-2 font-bold transition-all ${
                      userTypeFilter === 'organization'
                        ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                        : 'hover:bg-soft-sage hover:border-2 hover:border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                    }`}
                  >
                    Organizations
                  </button>
                </div>
              </div>
            </div>

            <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-2xl font-bold text-deep-moss">User List</h3>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-2 pl-10 border-2 border-deep-moss"
                    />
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-deep-moss"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setUserTypeFilter('all');
                    }}
                    className="px-4 py-2 border-2 border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {isLoadingUsers ? (
                <div className="bg-ivory p-6 border-2 border-deep-moss text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-moss mx-auto mb-4"></div>
                  <p className="text-deep-moss">Loading users...</p>
                </div>
              ) : error ? (
                <div className="bg-ivory p-6 border-2 border-deep-moss text-center">
                  <AlertCircle
                    size={48}
                    className="mx-auto mb-4 text-red-600"
                  />
                  <p className="text-lg font-bold text-deep-moss">
                    Failed to load users
                  </p>
                  <p className="text-deep-moss mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-forest-green text-ivory font-bold border-2 border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="bg-ivory p-6 border-2 border-deep-moss text-center">
                  <Users size={48} className="mx-auto mb-4 text-deep-moss" />
                  <p className="text-lg font-bold text-deep-moss">
                    No users found
                  </p>
                  <p className="text-deep-moss">
                    {searchTerm || userTypeFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'There are no users in the system yet'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full bg-white border-2 border-deep-moss">
                    <thead>
                      <tr className="bg-soft-sage">
                        <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                          Name
                        </th>
                        <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                          Wallet Address
                        </th>
                        <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                          Type
                        </th>
                        <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                          Status
                        </th>
                        <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                          Created
                        </th>
                        <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.uid}
                          className="border-b border-deep-moss hover:bg-soft-sage/20"
                        >
                          <td className="p-3 text-deep-moss font-medium">
                            {user.name || 'Unnamed User'}
                          </td>
                          <td className="p-3 text-deep-moss">
                            <span className="font-mono text-sm">
                              {user.walletAddress.substring(0, 6)}...
                              {user.walletAddress.substring(
                                user.walletAddress.length - 4
                              )}
                            </span>
                          </td>
                          <td className="p-3 text-deep-moss">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.userType === 'organization'
                                  ? 'bg-blue-100 text-blue-800'
                                  : user.userType === 'admin'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {user.userType}
                            </span>
                          </td>
                          <td className="p-3">
                            {user.isVerified ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <UserCheck size={12} className="mr-1" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <UserX size={12} className="mr-1" />
                                Unverified
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-deep-moss">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="p-3">
                            <div className="flex space-x-2">
                              <button
                                className="bg-soft-sage text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                                title="View Details"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                                  <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
          duration={5000}
        />
      )}
    </AuthGuard>
  );
}
