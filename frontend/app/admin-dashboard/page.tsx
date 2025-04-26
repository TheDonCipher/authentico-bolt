'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken } from '../../lib/token-util';
import { API_ENDPOINTS } from '../../lib/constants';
import { useAuth } from '../contexts/AuthContext';
import { AuthGuard } from '../components/auth/AuthGuard';
import { ProfileCard } from '../components/dashboard/ProfileCard';
import { NotificationBell } from '../components/dashboard/NotificationBell';
import { NeubrutalistLoading } from '../components/ui/NeubrutalistLoading';
import { Toast } from '../components/ui/Toast';
import { SignOutButton } from '../components/auth/SignOutButton';
import { VerificationAuditLog } from './components/VerificationAuditLog';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  getFirestore,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

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
  ExternalLink,
  Check,
  Eye,
  History,
  User,
} from 'lucide-react';

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    users: 0,
    documents: 0,
    organizations: 0,
    pendingOrganizations: 0,
    verifiedDocuments: 0,
    rejectedDocuments: 0,
    loading: true,
    error: null as string | null,
  });
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && user) {
      if (!isAdmin) {
        router.push('/unauthorized');
      } else {
        setIsLoading(false);

        // Set admin claims when the admin dashboard loads
        const setAdminClaims = async () => {
          try {
            console.log('Setting admin claims on dashboard load...');
            const token = await getAuthToken();
            if (!token) {
              throw new Error('Not authenticated');
            }

            const response = await fetch('/api/auth/set-admin-claims', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({}),
            });

            if (!response.ok) {
              throw new Error(
                `Failed to set admin claims: ${response.status} ${response.statusText}`
              );
            }

            const data = await response.json();
            console.log('Admin claims set successfully:', data);
          } catch (error) {
            console.error(
              'Error setting admin claims on dashboard load:',
              error
            );
          }
        };

        setAdminClaims();
      }
    }
  }, [authLoading, user, isAdmin, router]);

  // Fetch admin statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !isAdmin) return;

      try {
        setStats((prev) => ({ ...prev, loading: true, error: null }));
        const token = await getAuthToken();

        if (!token) {
          throw new Error('Not authenticated');
        }

        try {
          const response = await fetch(API_ENDPOINTS.ADMIN.STATS, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          });

          if (!response.ok) {
            throw new Error(
              `Failed to fetch admin statistics: ${response.status} ${response.statusText}`
            );
          }

          const data = await response.json();
          setStats({
            users: data.users || 0,
            documents: data.documents || 0,
            organizations: data.organizations || 0,
            pendingOrganizations: data.pendingOrganizations || 0,
            verifiedDocuments: data.verifiedDocuments || 0,
            rejectedDocuments: data.rejectedDocuments || 0,
            loading: false,
            error: null,
          });
        } catch (apiError) {
          console.error('API error, falling back to Firestore:', apiError);
          const db = getFirestore();

          // Fetch users count
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const users = usersSnapshot.size;

          // Fetch organizations and pending organizations
          const orgsQuery = query(
            collection(db, 'users'),
            where('userType', '==', 'organization')
          );
          const orgsSnapshot = await getDocs(orgsQuery);
          const organizations = orgsSnapshot.size;

          // Count pending organizations
          const pendingOrganizations = orgsSnapshot.docs.filter((doc) => {
            const data = doc.data();
            return (
              data.status === 'pending' || data.verificationStatus === 'pending'
            );
          }).length;

          // Fetch documents and their statuses
          const docsSnapshot = await getDocs(collection(db, 'documents'));
          const documents = docsSnapshot.size;

          // Count verified and rejected documents
          const docStatuses = docsSnapshot.docs.reduce(
            (acc, doc) => {
              const data = doc.data();
              const status = data.status?.toLowerCase();
              if (status === 'verified') acc.verified++;
              if (status === 'rejected') acc.rejected++;
              return acc;
            },
            { verified: 0, rejected: 0 }
          );

          setStats({
            users,
            documents,
            organizations,
            pendingOrganizations,
            verifiedDocuments: docStatuses.verified,
            rejectedDocuments: docStatuses.rejected,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error fetching admin statistics:', error);
        setStats((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    };

    fetchStats();
  }, [user, isAdmin]);

  // Fetch organization applications
  useEffect(() => {
    const fetchApplications = async () => {
      if (!user || !isAdmin) return;

      try {
        setLoadingApplications(true);

        // Get auth token
        const token = await getAuthToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        try {
          // Try to fetch applications from API first
          const response = await fetch(
            API_ENDPOINTS.ORGANIZATIONS.APPLICATIONS,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              cache: 'no-store',
            }
          );

          if (!response.ok) {
            console.error(
              'Failed to fetch organization applications from API:',
              await response.text()
            );
            throw new Error(
              `Failed to fetch organization applications: ${response.status} ${response.statusText}`
            );
          }

          const data = await response.json();
          console.log('Fetched organization applications from API:', data);

          // Filter for pending applications for the dashboard view
          const pendingApplications = data.filter(
            (app: { status: string }) => app.status === 'pending'
          );
          console.log('Pending applications:', pendingApplications.length);

          // Update stats with the correct count of pending organizations
          setStats((prev) => ({
            ...prev,
            pendingOrganizations: pendingApplications.length,
          }));

          setApplications(data);
        } catch (apiError) {
          console.error('API error, falling back to Firestore:', apiError);

          // Fallback to direct Firestore query - first try organizationApplications collection
          try {
            const applicationsRef = collection(db, 'organizationApplications');
            const applicationsQuery = query(
              applicationsRef,
              orderBy('submittedAt', 'desc')
            );

            const applicationsSnapshot = await getDocs(applicationsQuery);

            if (applicationsSnapshot.docs.length > 0) {
              const orgApplications = applicationsSnapshot.docs.map((doc) => {
                const data = doc.data();
                console.log(
                  'Organization application from Firestore:',
                  doc.id,
                  data
                );
                return {
                  id: doc.id,
                  orgName:
                    data.organizationName ||
                    data.orgName ||
                    'Unknown Organization',
                  contactEmail: data.contactEmail || data.email || '',
                  contactPerson: data.contactPerson || data.name || '',
                  website: data.website || '',
                  status: data.status || 'pending',
                  submittedAt:
                    data.submittedAt instanceof Timestamp
                      ? data.submittedAt.toDate()
                      : new Date(data.submittedAt || Date.now()),
                  description: data.description || '',
                  industry: data.industry || '',
                  organizationId: data.organizationId || '',
                };
              });

              // Filter for pending applications for the dashboard view
              const pendingApplications = orgApplications.filter(
                (app: { status: string }) => app.status === 'pending'
              );
              console.log(
                'Pending applications from organizationApplications:',
                pendingApplications.length
              );

              // Update stats with the correct count of pending organizations
              setStats((prev) => ({
                ...prev,
                pendingOrganizations: pendingApplications.length,
              }));

              console.log(
                'Fetched organization applications from organizationApplications collection:',
                orgApplications
              );
              setApplications(orgApplications);
              return;
            }
          } catch (firestoreError) {
            console.error(
              'Error querying organizationApplications collection:',
              firestoreError
            );
          }

          // Fallback to users collection if organizationApplications collection query failed or returned no results
          const usersRef = collection(db, 'users');
          const q = query(
            usersRef,
            where('userType', '==', 'organization'),
            orderBy('createdAt', 'desc')
          );

          const snapshot = await getDocs(q);
          const orgApplications = snapshot.docs.map((doc) => {
            const data = doc.data();
            console.log(
              'Organization data from users collection:',
              doc.id,
              data
            );
            return {
              id: doc.id,
              orgName:
                data.organizationName || data.orgName || 'Unknown Organization',
              contactEmail: data.contactEmail || data.email || '',
              contactPerson: data.contactPerson || data.name || '',
              website: data.website || '',
              status: data.verificationStatus || data.status || 'pending',
              submittedAt:
                data.createdAt instanceof Timestamp
                  ? data.createdAt.toDate()
                  : new Date(data.createdAt || Date.now()),
              description: data.description || '',
              industry: data.industry || '',
            };
          });

          // Filter for pending applications for the dashboard view
          const pendingApplications = orgApplications.filter(
            (app: { status: string }) => app.status === 'pending'
          );
          console.log(
            'Pending applications from users collection:',
            pendingApplications.length
          );

          // Update stats with the correct count of pending organizations
          setStats((prev) => ({
            ...prev,
            pendingOrganizations: pendingApplications.length,
          }));

          console.log(
            'Fetched organization applications from users collection:',
            orgApplications
          );
          setApplications(orgApplications);
        }
      } catch (error) {
        console.error('Error fetching organization applications:', error);
        setToastMessage({
          type: 'error',
          message: 'Failed to load organization applications',
        });
      } finally {
        setLoadingApplications(false);
      }
    };

    fetchApplications();
  }, [user, isAdmin]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Helper function to ensure admin claims are set before making API requests
  const ensureAdminClaims = async (): Promise<string | null> => {
    try {
      console.log('Ensuring admin claims are set...');
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Set admin claims
      const response = await fetch('/api/auth/set-admin-claims', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to set admin claims: ${response.status} ${response.statusText}`
        );
      }

      // Get a fresh token with the updated claims
      const freshToken = await getAuthToken();
      console.log('Admin claims set and fresh token obtained');
      return freshToken;
    } catch (error) {
      console.error('Error ensuring admin claims:', error);
      setToastMessage({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to set admin claims',
      });
      return null;
    }
  };

  // State to handle loading timeout
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Set a timeout to prevent infinite loading
  useEffect(() => {
    if (authLoading || isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 15000); // 15 seconds timeout

      return () => clearTimeout(timer);
    }
  }, [authLoading, isLoading]);

  if (authLoading || isLoading) {
    if (loadingTimeout) {
      return (
        <div className="min-h-screen bg-ivory text-deep-moss flex flex-col items-center justify-center p-4">
          <div className="bg-soft-sage border-4 border-deep-moss p-6 shadow-brutal max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4 text-deep-moss">
              Loading Taking Too Long
            </h2>
            <p className="mb-4">
              We're having trouble loading the admin dashboard. This could be
              due to network issues or authentication problems.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return (
      <NeubrutalistLoading
        message="Admin Dashboard"
        subMessage="Loading administrative controls..."
        fullScreen={true}
      />
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
          } md:relative md:block md:w-64 bg-soft-sage border-r-4 border-deep-moss h-auto md:min-h-screen md:h-full md:sticky md:top-0 overflow-y-auto transition-all duration-300 ease-in-out`}
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
                  <User size={20} className="text-deep-moss" />
                  <span className="font-bold text-deep-moss">
                    Individual Dashboard
                  </span>
                </div>
              </Link>
            </nav>

            {/* Sign Out Button */}
            <div className="mt-4 pt-6">
              <SignOutButton className="w-full px-4 py-3 border-2 border-deep-moss bg-burnt-sienna bg-opacity-20 text-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all" />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-y-auto pb-20 md:pb-0">
          <header className="bg-soft-sage p-4 border-b-4 border-deep-moss sticky top-0 z-20">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-black text-deep-moss mr-4">
                  Admin Dashboard
                </h1>
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full border border-red-300 text-sm font-medium">
                  <Shield size={16} className="inline-block mr-1" />
                  Admin
                </div>
                <button
                  onClick={async () => {
                    try {
                      const token = await getAuthToken();
                      if (!token) {
                        throw new Error('Not authenticated');
                      }

                      const response = await fetch(
                        '/api/auth/set-admin-claims',
                        {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({}),
                        }
                      );

                      if (!response.ok) {
                        throw new Error(
                          `Failed to set admin claims: ${response.status} ${response.statusText}`
                        );
                      }

                      const data = await response.json();
                      console.log('Admin claims set:', data);

                      setToastMessage({
                        type: 'success',
                        message:
                          'Admin claims set successfully. You may need to refresh the page.',
                      });
                    } catch (error) {
                      console.error('Error setting admin claims:', error);
                      setToastMessage({
                        type: 'error',
                        message:
                          error instanceof Error
                            ? error.message
                            : 'Failed to set admin claims',
                      });
                    }
                  }}
                  className="ml-4 bg-forest-green text-white px-3 py-1 text-sm font-medium border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                >
                  Set Admin Claims
                </button>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell count={0} onClick={() => {}} />
                <ProfileCard />
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto p-4 md:p-8 overflow-x-hidden pb-20 md:pb-8">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-deep-moss pb-4 mb-6 md:mb-8 gap-4">
                <h2 className="text-3xl md:text-4xl font-black text-deep-moss">
                  System Overview
                </h2>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-4 py-2 font-bold transition-all flex-1 sm:flex-none text-center ${
                      activeTab === 'dashboard'
                        ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                        : 'bg-ivory text-deep-moss border-2 border-deep-moss hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab('applications')}
                    className={`px-4 py-2 font-bold transition-all flex-1 sm:flex-none text-center ${
                      activeTab === 'applications'
                        ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                        : 'bg-ivory text-deep-moss border-2 border-deep-moss hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                    }`}
                  >
                    Org Applications
                  </button>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-4 py-2 font-bold transition-all flex-1 sm:flex-none text-center ${
                      activeTab === 'audit'
                        ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)]'
                        : 'bg-ivory text-deep-moss border-2 border-deep-moss hover:bg-soft-sage hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)]'
                    }`}
                  >
                    <History size={16} className="inline-block mr-1" />
                    Audit Log
                  </button>
                </div>
              </div>
            </div>

            {activeTab === 'dashboard' ? (
              <>
                <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-deep-moss">
                      Admin Controls
                    </h3>
                    <button
                      onClick={async () => {
                        try {
                          const token = await getAuthToken();
                          if (!token) {
                            throw new Error('Not authenticated');
                          }

                          const response = await fetch(
                            '/api/auth/set-admin-claims',
                            {
                              method: 'POST',
                              headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({}),
                            }
                          );

                          if (!response.ok) {
                            throw new Error(
                              `Failed to set admin claims: ${response.status} ${response.statusText}`
                            );
                          }

                          const data = await response.json();
                          console.log('Admin claims set:', data);

                          setToastMessage({
                            type: 'success',
                            message:
                              'Admin claims set successfully. You may need to refresh the page.',
                          });
                        } catch (error) {
                          console.error('Error setting admin claims:', error);
                          setToastMessage({
                            type: 'error',
                            message:
                              error instanceof Error
                                ? error.message
                                : 'Failed to set admin claims',
                          });
                        }
                      }}
                      className="bg-forest-green text-white px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                    >
                      Set Admin Claims
                    </button>
                  </div>

                  <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal mb-8">
                    <h3 className="text-2xl font-bold mb-4 text-deep-moss">
                      Platform Statistics
                    </h3>
                    {stats.error ? (
                      <div className="bg-ivory p-6 border-2 border-deep-moss text-center">
                        <AlertCircle
                          size={48}
                          className="mx-auto mb-4 text-red-600"
                        />
                        <p className="text-lg font-bold text-deep-moss">
                          Failed to load statistics
                        </p>
                        <p className="text-deep-moss">
                          Please try refreshing the page
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-ivory p-4 border-2 border-deep-moss">
                          <h4 className="font-bold text-deep-moss">
                            Total Users
                          </h4>
                          <p className="text-2xl font-bold text-forest-green">
                            {stats.users}
                          </p>
                        </div>
                        <div className="bg-ivory p-4 border-2 border-deep-moss">
                          <h4 className="font-bold text-deep-moss">
                            Total Documents
                          </h4>
                          <p className="text-2xl font-bold text-forest-green">
                            {stats.documents}
                          </p>
                        </div>
                        <div className="bg-ivory p-4 border-2 border-deep-moss">
                          <h4 className="font-bold text-deep-moss">
                            Organizations
                          </h4>
                          <p className="text-2xl font-bold text-forest-green">
                            {stats.organizations}
                          </p>
                        </div>
                        <div className="bg-ivory p-4 border-2 border-deep-moss">
                          <h4 className="font-bold text-deep-moss">
                            Pending Organizations
                          </h4>
                          <p className="text-2xl font-bold text-yellow-600">
                            {stats.pendingOrganizations}
                          </p>
                        </div>
                        <div className="bg-ivory p-4 border-2 border-deep-moss">
                          <h4 className="font-bold text-deep-moss">
                            Verified Documents
                          </h4>
                          <p className="text-2xl font-bold text-green-600">
                            {stats.verifiedDocuments}
                          </p>
                        </div>
                        <div className="bg-ivory p-4 border-2 border-deep-moss">
                          <h4 className="font-bold text-deep-moss">
                            Rejected Documents
                          </h4>
                          <p className="text-2xl font-bold text-red-600">
                            {stats.rejectedDocuments}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-deep-moss">
                      Pending Organization Applications
                    </h3>
                    <Link
                      href="/admin-dashboard/organizations"
                      className="bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                    >
                      View All
                    </Link>
                  </div>
                  <p className="text-deep-moss mb-4">
                    Review and manage pending organization verification
                    applications.
                  </p>

                  {loadingApplications ? (
                    <div className="bg-ivory p-4 border-2 border-deep-moss text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-moss mx-auto mb-2"></div>
                      <p className="text-deep-moss">Loading applications...</p>
                    </div>
                  ) : applications.filter((app) => app.status === 'pending')
                      .length > 0 ? (
                    <div className="bg-ivory p-4 border-2 border-deep-moss">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-deep-moss text-ivory">
                              <th className="p-2 text-left">Organization</th>
                              <th className="p-2 text-left">Email</th>
                              <th className="p-2 text-left">Submitted</th>
                              <th className="p-2 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {applications
                              .filter((app) => app.status === 'pending')
                              .slice(0, 5)
                              .map((app: any) => (
                                <tr
                                  key={app.id}
                                  className="border-b border-deep-moss hover:bg-soft-sage hover:bg-opacity-30"
                                >
                                  <td className="p-2 font-medium text-deep-moss">
                                    {app.orgName}
                                  </td>
                                  <td className="p-2 text-deep-moss">
                                    {app.contactEmail}
                                  </td>
                                  <td className="p-2 text-deep-moss">
                                    {new Date(
                                      app.submittedAt
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="p-2">
                                    <div className="flex gap-1">
                                      <button
                                        onClick={async () => {
                                          try {
                                            setToastMessage({
                                              type: 'info',
                                              message: 'Processing approval...',
                                            });

                                            // Get auth token
                                            const token = await getAuthToken();
                                            if (!token) {
                                              throw new Error(
                                                'Not authenticated'
                                              );
                                            }

                                            // Use the new direct admin endpoint
                                            const response = await fetch(
                                              `/api/admin/verify-organization`,
                                              {
                                                method: 'POST',
                                                headers: {
                                                  Authorization: `Bearer ${token}`,
                                                  'Content-Type':
                                                    'application/json',
                                                },
                                                body: JSON.stringify({
                                                  applicationId: app.id,
                                                  status: 'approved',
                                                  notes: 'Approved by admin',
                                                }),
                                              }
                                            );

                                            if (!response.ok) {
                                              throw new Error(
                                                `Failed to approve application: ${response.status} ${response.statusText}`
                                              );
                                            }

                                            const data = await response.json();
                                            console.log(
                                              'Approval response:',
                                              data
                                            );

                                            setToastMessage({
                                              type: 'success',
                                              message:
                                                'Organization approved successfully',
                                            });

                                            // Update local state
                                            setApplications(
                                              applications.map((a) =>
                                                a.id === app.id
                                                  ? { ...a, status: 'verified' }
                                                  : a
                                              )
                                            );

                                            // Update stats
                                            setStats((prev) => ({
                                              ...prev,
                                              pendingOrganizations:
                                                prev.pendingOrganizations - 1,
                                            }));
                                          } catch (error) {
                                            console.error(
                                              'Error approving organization:',
                                              error
                                            );
                                            setToastMessage({
                                              type: 'error',
                                              message:
                                                error instanceof Error
                                                  ? error.message
                                                  : 'Failed to approve organization',
                                            });
                                          }
                                        }}
                                        className="p-1 bg-green-100 text-green-800 rounded border border-green-300 hover:bg-green-200 flex items-center gap-1 min-w-[32px] justify-center"
                                        title="Approve"
                                      >
                                        <Check size={14} />
                                        <span className="text-xs font-medium">
                                          Approve
                                        </span>
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const notes = prompt(
                                            'Please provide a reason for rejection:'
                                          );
                                          if (notes === null) return; // User cancelled

                                          try {
                                            setToastMessage({
                                              type: 'info',
                                              message:
                                                'Processing rejection...',
                                            });

                                            // Get auth token
                                            const token = await getAuthToken();
                                            if (!token) {
                                              throw new Error(
                                                'Not authenticated'
                                              );
                                            }

                                            // Use the new direct admin endpoint
                                            const response = await fetch(
                                              `/api/admin/verify-organization`,
                                              {
                                                method: 'POST',
                                                headers: {
                                                  Authorization: `Bearer ${token}`,
                                                  'Content-Type':
                                                    'application/json',
                                                },
                                                body: JSON.stringify({
                                                  applicationId: app.id,
                                                  status: 'rejected',
                                                  notes:
                                                    notes ||
                                                    'Rejected by admin',
                                                }),
                                              }
                                            );

                                            if (!response.ok) {
                                              throw new Error(
                                                `Failed to reject application: ${response.status} ${response.statusText}`
                                              );
                                            }

                                            const data = await response.json();
                                            console.log(
                                              'Rejection response:',
                                              data
                                            );

                                            setToastMessage({
                                              type: 'success',
                                              message:
                                                'Organization rejected successfully',
                                            });

                                            // Update local state
                                            setApplications(
                                              applications.map((a) =>
                                                a.id === app.id
                                                  ? { ...a, status: 'rejected' }
                                                  : a
                                              )
                                            );

                                            // Update stats
                                            setStats((prev) => ({
                                              ...prev,
                                              pendingOrganizations:
                                                prev.pendingOrganizations - 1,
                                            }));
                                          } catch (error) {
                                            console.error(
                                              'Error rejecting organization:',
                                              error
                                            );
                                            setToastMessage({
                                              type: 'error',
                                              message:
                                                error instanceof Error
                                                  ? error.message
                                                  : 'Failed to reject organization',
                                            });
                                          }
                                        }}
                                        className="p-1 bg-red-100 text-red-800 rounded border border-red-300 hover:bg-red-200 flex items-center gap-1 min-w-[32px] justify-center"
                                        title="Reject"
                                      >
                                        <X size={14} />
                                        <span className="text-xs font-medium">
                                          Reject
                                        </span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setActiveTab('applications')}
                          className="inline-block bg-forest-green text-ivory px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                        >
                          Review All Applications
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-ivory p-4 border-2 border-deep-moss text-center">
                      <p className="text-lg font-bold text-deep-moss">
                        No pending organization applications
                      </p>
                      <p className="text-deep-moss">
                        When organizations apply for verification, they will
                        appear here.
                      </p>
                    </div>
                  )}
                </section>
              </>
            ) : activeTab === 'audit' ? (
              <VerificationAuditLog />
            ) : (
              <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
                <h3 className="text-2xl font-bold mb-4 text-deep-moss">
                  Organization Applications
                </h3>

                {loadingApplications ? (
                  <div className="bg-ivory p-4 border-2 border-deep-moss text-center">
                    <NeubrutalistLoading
                      message="Applications"
                      subMessage="Loading organization applications..."
                      showSeal={false}
                    />
                  </div>
                ) : applications.length > 0 ? (
                  <div className="bg-ivory p-4 border-2 border-deep-moss">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-deep-moss text-ivory">
                            <th className="p-2 text-left">Organization</th>
                            <th className="p-2 text-left">Email</th>
                            <th className="p-2 text-left">Website</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left">Submitted</th>
                            <th className="p-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.map((app: any) => (
                            <tr
                              key={app.id}
                              className="border-b border-deep-moss hover:bg-soft-sage hover:bg-opacity-30"
                            >
                              <td className="p-2 font-medium text-deep-moss">
                                {app.orgName}
                              </td>
                              <td className="p-2 text-deep-moss">
                                {app.contactEmail}
                              </td>
                              <td className="p-2 text-deep-moss">
                                {app.website ? (
                                  <a
                                    href={app.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-forest-green hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink size={12} />
                                    {
                                      app.website
                                        .replace(/^https?:\/\//, '')
                                        .split('/')[0]
                                    }
                                  </a>
                                ) : (
                                  'Not provided'
                                )}
                              </td>
                              <td className="p-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    app.status === 'approved' ||
                                    app.status === 'verified'
                                      ? 'bg-green-100 text-green-800'
                                      : app.status === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {app.status === 'verified'
                                    ? 'approved'
                                    : app.status}
                                </span>
                              </td>
                              <td className="p-2 text-deep-moss">
                                {new Date(app.submittedAt).toLocaleDateString()}
                              </td>
                              <td className="p-2">
                                <div className="flex gap-1">
                                  {app.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={async () => {
                                          try {
                                            setToastMessage({
                                              type: 'info',
                                              message: 'Processing approval...',
                                            });

                                            // Get auth token
                                            const token = await getAuthToken();
                                            if (!token) {
                                              throw new Error(
                                                'Not authenticated'
                                              );
                                            }

                                            // Use the new direct admin endpoint
                                            const response = await fetch(
                                              `/api/admin/verify-organization`,
                                              {
                                                method: 'POST',
                                                headers: {
                                                  Authorization: `Bearer ${token}`,
                                                  'Content-Type':
                                                    'application/json',
                                                },
                                                body: JSON.stringify({
                                                  applicationId: app.id,
                                                  status: 'approved',
                                                  notes: 'Approved by admin',
                                                }),
                                              }
                                            );

                                            if (!response.ok) {
                                              throw new Error(
                                                `Failed to approve application: ${response.status} ${response.statusText}`
                                              );
                                            }

                                            const data = await response.json();
                                            console.log(
                                              'Approval response:',
                                              data
                                            );

                                            setToastMessage({
                                              type: 'success',
                                              message:
                                                'Organization approved successfully',
                                            });

                                            // Update local state
                                            setApplications(
                                              applications.map((a) =>
                                                a.id === app.id
                                                  ? { ...a, status: 'verified' }
                                                  : a
                                              )
                                            );

                                            // Update stats
                                            setStats((prev) => ({
                                              ...prev,
                                              pendingOrganizations:
                                                prev.pendingOrganizations - 1,
                                            }));
                                          } catch (error) {
                                            console.error(
                                              'Error approving organization:',
                                              error
                                            );
                                            setToastMessage({
                                              type: 'error',
                                              message:
                                                error instanceof Error
                                                  ? error.message
                                                  : 'Failed to approve organization',
                                            });
                                          }
                                        }}
                                        className="p-2 bg-green-100 text-green-800 rounded border border-green-300 hover:bg-green-200 flex items-center gap-1 min-w-[32px] justify-center"
                                        title="Approve"
                                      >
                                        <Check size={14} />
                                        <span className="text-xs sm:text-sm font-medium">
                                          Approve
                                        </span>
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const notes = prompt(
                                            'Please provide a reason for rejection:'
                                          );
                                          if (notes === null) return; // User cancelled

                                          try {
                                            setToastMessage({
                                              type: 'info',
                                              message:
                                                'Processing rejection...',
                                            });

                                            // Get auth token
                                            const token = await getAuthToken();
                                            if (!token) {
                                              throw new Error(
                                                'Not authenticated'
                                              );
                                            }

                                            // Use the new direct admin endpoint
                                            const response = await fetch(
                                              `/api/admin/verify-organization`,
                                              {
                                                method: 'POST',
                                                headers: {
                                                  Authorization: `Bearer ${token}`,
                                                  'Content-Type':
                                                    'application/json',
                                                },
                                                body: JSON.stringify({
                                                  applicationId: app.id,
                                                  status: 'rejected',
                                                  notes:
                                                    notes ||
                                                    'Rejected by admin',
                                                }),
                                              }
                                            );

                                            if (!response.ok) {
                                              throw new Error(
                                                `Failed to reject application: ${response.status} ${response.statusText}`
                                              );
                                            }

                                            const data = await response.json();
                                            console.log(
                                              'Rejection response:',
                                              data
                                            );

                                            setToastMessage({
                                              type: 'success',
                                              message:
                                                'Organization rejected successfully',
                                            });

                                            // Update local state
                                            setApplications(
                                              applications.map((a) =>
                                                a.id === app.id
                                                  ? { ...a, status: 'rejected' }
                                                  : a
                                              )
                                            );

                                            // Update stats
                                            setStats((prev) => ({
                                              ...prev,
                                              pendingOrganizations:
                                                prev.pendingOrganizations - 1,
                                            }));
                                          } catch (error) {
                                            console.error(
                                              'Error rejecting organization:',
                                              error
                                            );
                                            setToastMessage({
                                              type: 'error',
                                              message:
                                                error instanceof Error
                                                  ? error.message
                                                  : 'Failed to reject organization',
                                            });
                                          }
                                        }}
                                        className="p-2 bg-red-100 text-red-800 rounded border border-red-300 hover:bg-red-200 flex items-center gap-1 min-w-[32px] justify-center"
                                        title="Reject"
                                      >
                                        <X size={14} />
                                        <span className="text-xs sm:text-sm font-medium">
                                          Reject
                                        </span>
                                      </button>
                                    </>
                                  )}

                                  {app.status === 'verified' ||
                                    (app.status === 'approved' && (
                                      <button
                                        onClick={async () => {
                                          const confirm = window.confirm(
                                            'Are you sure you want to revoke verification for this organization?'
                                          );
                                          if (!confirm) return;

                                          try {
                                            setToastMessage({
                                              type: 'info',
                                              message:
                                                'Processing revocation...',
                                            });

                                            // Get auth token
                                            const token = await getAuthToken();
                                            if (!token) {
                                              throw new Error(
                                                'Not authenticated'
                                              );
                                            }

                                            // Use the new direct admin endpoint
                                            const response = await fetch(
                                              `/api/admin/verify-organization`,
                                              {
                                                method: 'POST',
                                                headers: {
                                                  Authorization: `Bearer ${token}`,
                                                  'Content-Type':
                                                    'application/json',
                                                },
                                                body: JSON.stringify({
                                                  applicationId: app.id,
                                                  status: 'rejected',
                                                  notes:
                                                    'Verification revoked by admin',
                                                }),
                                              }
                                            );

                                            if (!response.ok) {
                                              throw new Error(
                                                `Failed to revoke verification: ${response.status} ${response.statusText}`
                                              );
                                            }

                                            const data = await response.json();
                                            console.log(
                                              'Revocation response:',
                                              data
                                            );

                                            setToastMessage({
                                              type: 'success',
                                              message:
                                                'Organization verification revoked successfully',
                                            });

                                            // Update local state
                                            setApplications(
                                              applications.map((a) =>
                                                a.id === app.id
                                                  ? { ...a, status: 'rejected' }
                                                  : a
                                              )
                                            );
                                          } catch (error) {
                                            console.error(
                                              'Error revoking verification:',
                                              error
                                            );
                                            setToastMessage({
                                              type: 'error',
                                              message:
                                                error instanceof Error
                                                  ? error.message
                                                  : 'Failed to revoke verification',
                                            });
                                          }
                                        }}
                                        className="p-2 bg-red-100 text-red-800 rounded border border-red-300 hover:bg-red-200 flex items-center gap-1 min-w-[32px] justify-center"
                                        title="Revoke Verification"
                                      >
                                        <X size={14} />
                                        <span className="text-xs sm:text-sm font-medium">
                                          Revoke
                                        </span>
                                      </button>
                                    ))}

                                  {app.status === 'rejected' && (
                                    <button
                                      onClick={async () => {
                                        try {
                                          setToastMessage({
                                            type: 'info',
                                            message: 'Processing approval...',
                                          });

                                          // Get auth token
                                          const token = await getAuthToken();
                                          if (!token) {
                                            throw new Error(
                                              'Not authenticated'
                                            );
                                          }

                                          // Use the new direct admin endpoint
                                          const response = await fetch(
                                            `/api/admin/verify-organization`,
                                            {
                                              method: 'POST',
                                              headers: {
                                                Authorization: `Bearer ${token}`,
                                                'Content-Type':
                                                  'application/json',
                                              },
                                              body: JSON.stringify({
                                                applicationId: app.id,
                                                status: 'approved',
                                                notes:
                                                  'Approved by admin after reconsideration',
                                              }),
                                            }
                                          );

                                          if (!response.ok) {
                                            throw new Error(
                                              `Failed to approve application: ${response.status} ${response.statusText}`
                                            );
                                          }

                                          const data = await response.json();
                                          console.log(
                                            'Approval response:',
                                            data
                                          );

                                          setToastMessage({
                                            type: 'success',
                                            message:
                                              'Organization approved successfully',
                                          });

                                          // Update local state
                                          setApplications(
                                            applications.map((a) =>
                                              a.id === app.id
                                                ? { ...a, status: 'verified' }
                                                : a
                                            )
                                          );
                                        } catch (error) {
                                          console.error(
                                            'Error approving organization:',
                                            error
                                          );
                                          setToastMessage({
                                            type: 'error',
                                            message:
                                              error instanceof Error
                                                ? error.message
                                                : 'Failed to approve organization',
                                          });
                                        }
                                      }}
                                      className="p-2 bg-green-100 text-green-800 rounded border border-green-300 hover:bg-green-200 flex items-center gap-1 min-w-[32px] justify-center"
                                      title="Approve"
                                    >
                                      <Check size={14} />
                                      <span className="text-xs sm:text-sm font-medium">
                                        Approve
                                      </span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      // Show application details
                                      alert(`
Organization: ${app.orgName}
Email: ${app.contactEmail}
Website: ${app.website || 'Not provided'}
Status: ${app.status}
Submitted: ${new Date(app.submittedAt).toLocaleDateString()}
Description: ${app.description || 'Not provided'}
                                      `);
                                    }}
                                    className="p-2 bg-blue-100 text-blue-800 rounded border border-blue-300 hover:bg-blue-200 flex items-center gap-1 min-w-[32px] justify-center"
                                    title="View Details"
                                  >
                                    <Eye size={14} />
                                    <span className="text-xs sm:text-sm font-medium">
                                      View
                                    </span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-ivory p-4 border-2 border-deep-moss text-center">
                    <p className="text-lg font-bold text-deep-moss">
                      No organization applications found
                    </p>
                    <p className="text-deep-moss">
                      When organizations apply for verification, they will
                      appear here.
                    </p>
                  </div>
                )}
              </section>
            )}
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
