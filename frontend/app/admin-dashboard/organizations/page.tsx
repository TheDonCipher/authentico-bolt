'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { AuthGuard } from '../../components/auth/AuthGuard';
import { ProfileCard } from '../../components/dashboard/ProfileCard';
import { NotificationBell } from '../../components/dashboard/NotificationBell';
import { Loader } from '../../components/ui/Loader';
import { Toast } from '../../components/ui/Toast';
import Link from 'next/link';
import { SignOutButton } from '../../components/auth/SignOutButton';
import { getAuthToken } from '../../../lib/token-util';
import { API_ENDPOINTS } from '../../../lib/constants';
import axios from 'axios';
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
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Check,
} from 'lucide-react';
import OrganizationApplications from '../components/OrganizationApplications';

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface Organization {
  id: string;
  name: string;
  organizationName: string;
  contactEmail: string;
  walletAddress: string;
  status: string;
  verificationStatus: string;
  createdAt: any;
  updatedAt: any;
  industry?: string;
  website?: string;
  description?: string;
}

export default function OrganizationsPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [activeTab, setActiveTab] = useState<'organizations' | 'applications'>(
    'applications'
  );
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);

  // Fetch organizations
  useEffect(() => {
    if (!user || !isAdmin) return;

    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get auth token
        const token = await getAuthToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        // Fetch organizations from Firestore
        const response = await axios.get('/api/admin/organizations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrganizations(response.data);
        setFilteredOrgs(response.data);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setToastMessage({
          type: 'error',
          message: 'Failed to load organizations',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [user, isAdmin]);

  // Filter organizations when search term or filter changes
  useEffect(() => {
    if (!organizations.length) {
      setFilteredOrgs([]);
      return;
    }

    let filtered = [...organizations];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (org) =>
          org.verificationStatus === statusFilter || org.status === statusFilter
      );
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (org) =>
          (org.organizationName &&
            org.organizationName.toLowerCase().includes(search)) ||
          (org.name && org.name.toLowerCase().includes(search)) ||
          (org.contactEmail &&
            org.contactEmail.toLowerCase().includes(search)) ||
          (org.industry && org.industry.toLowerCase().includes(search))
      );
    }

    setFilteredOrgs(filtered);
  }, [organizations, statusFilter, searchTerm]);

  // Format date
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-900 border border-green-300">
            <CheckCircle className="inline-block mr-1" size={12} />
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300">
            <XCircle className="inline-block mr-1" size={12} />
            Rejected
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-900 border border-yellow-300">
            <Clock className="inline-block mr-1" size={12} />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-900 border border-gray-300">
            {status}
          </span>
        );
    }
  };

  // Handle organization verification
  const handleVerifyOrg = async (
    orgId: string,
    action: 'approve' | 'reject'
  ) => {
    try {
      setToastMessage({
        type: 'info',
        message: `Processing ${
          action === 'approve' ? 'approval' : 'rejection'
        }...`,
      });

      const token = await getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await axios.put(
        `${API_ENDPOINTS.ORGANIZATIONS.APPLICATIONS}/${orgId}`,
        {
          status: action === 'approve' ? 'approved' : 'rejected',
          notes:
            action === 'approve' ? 'Approved by admin' : 'Rejected by admin',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update local state
      setOrganizations((prevOrgs) =>
        prevOrgs.map((org) =>
          org.id === orgId
            ? { ...org, status: action === 'approve' ? 'verified' : 'rejected' }
            : org
        )
      );

      setToastMessage({
        type: 'success',
        message: `Organization ${
          action === 'approve' ? 'approved' : 'rejected'
        } successfully`,
      });
    } catch (error) {
      console.error(`Error ${action}ing organization:`, error);
      setToastMessage({
        type: 'error',
        message: `Failed to ${action} organization`,
      });
    }
  };

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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-deep-moss">
                    Organizations
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1 text-sm font-bold transition-all ${
                        statusFilter === 'all'
                          ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-brutal'
                          : 'bg-ivory border-2 border-deep-moss hover:bg-soft-sage'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatusFilter('verified')}
                      className={`px-3 py-1 text-sm font-bold transition-all ${
                        statusFilter === 'verified'
                          ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-brutal'
                          : 'bg-ivory border-2 border-deep-moss hover:bg-soft-sage'
                      }`}
                    >
                      Verified
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-3 py-1 text-sm font-bold transition-all ${
                        statusFilter === 'pending'
                          ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-brutal'
                          : 'bg-ivory border-2 border-deep-moss hover:bg-soft-sage'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setStatusFilter('rejected')}
                      className={`px-3 py-1 text-sm font-bold transition-all ${
                        statusFilter === 'rejected'
                          ? 'bg-forest-green text-ivory border-2 border-deep-moss shadow-brutal'
                          : 'bg-ivory border-2 border-deep-moss hover:bg-soft-sage'
                      }`}
                    >
                      Rejected
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search organizations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3 pl-10 border-2 border-deep-moss focus:outline-none"
                    />
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-deep-moss"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="bg-white p-6 border-2 border-deep-moss text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-moss mx-auto mb-4"></div>
                    <p className="text-deep-moss">Loading organizations...</p>
                  </div>
                ) : error ? (
                  <div className="bg-white p-6 border-2 border-deep-moss text-center">
                    <AlertCircle
                      size={48}
                      className="mx-auto mb-4 text-red-600"
                    />
                    <p className="text-lg font-bold text-deep-moss">
                      Failed to load organizations
                    </p>
                    <p className="text-deep-moss mb-4">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-forest-green text-ivory font-bold border-2 border-deep-moss hover:shadow-brutal hover:-translate-y-0.5 transition-all"
                    >
                      Retry
                    </button>
                  </div>
                ) : filteredOrgs.length === 0 ? (
                  <div className="bg-white p-6 border-2 border-deep-moss text-center">
                    <Building
                      size={48}
                      className="mx-auto mb-4 text-deep-moss"
                    />
                    <p className="text-lg font-bold text-deep-moss">
                      No organizations found
                    </p>
                    <p className="text-deep-moss">
                      {searchTerm || statusFilter !== 'all'
                        ? 'Try adjusting your search or filter criteria'
                        : 'There are no organizations in the system yet'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white border-2 border-deep-moss">
                      <thead>
                        <tr className="bg-soft-sage">
                          <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                            Organization
                          </th>
                          <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                            Contact Email
                          </th>
                          <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                            Industry
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
                        {filteredOrgs.map((org) => (
                          <tr
                            key={org.id}
                            className="border-b border-deep-moss hover:bg-soft-sage hover:bg-opacity-30"
                          >
                            <td className="p-3 text-deep-moss font-medium">
                              {org.organizationName ||
                                org.name ||
                                'Unnamed Organization'}
                            </td>
                            <td className="p-3 text-deep-moss">
                              {org.contactEmail || 'No email'}
                            </td>
                            <td className="p-3 text-deep-moss">
                              {org.industry || 'Not specified'}
                            </td>
                            <td className="p-3">
                              {getStatusBadge(
                                org.verificationStatus ||
                                  org.status ||
                                  'pending'
                              )}
                            </td>
                            <td className="p-3 text-deep-moss">
                              {formatDate(org.createdAt)}
                            </td>
                            <td className="p-3">
                              <div className="flex space-x-2">
                                <button
                                  className="bg-soft-sage text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                                  title="View Details"
                                  onClick={() => setViewingOrg(org)}
                                >
                                  <Eye size={16} />
                                </button>
                                {(org.verificationStatus === 'pending' ||
                                  org.status === 'pending') && (
                                  <>
                                    <button
                                      className="bg-green-100 text-green-900 p-2 border border-green-300 hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                                      title="Approve"
                                      onClick={() =>
                                        handleVerifyOrg(org.id, 'approve')
                                      }
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      className="bg-red-100 text-red-900 p-2 border border-red-300 hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                                      title="Reject"
                                      onClick={() =>
                                        handleVerifyOrg(org.id, 'reject')
                                      }
                                    >
                                      <X size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Organization Details Modal */}
                {viewingOrg && (
                  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 border-4 border-deep-moss max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-deep-moss">
                          {viewingOrg.organizationName ||
                            viewingOrg.name ||
                            'Organization Details'}
                          <span className="ml-3">
                            {getStatusBadge(
                              viewingOrg.verificationStatus ||
                                viewingOrg.status ||
                                'pending'
                            )}
                          </span>
                        </h3>
                        <button
                          onClick={() => setViewingOrg(null)}
                          className="bg-burnt-sienna bg-opacity-20 text-deep-moss p-2 border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white p-4 border-2 border-deep-moss">
                          <h4 className="font-bold mb-3 text-deep-moss">
                            Organization Information
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-bold text-gray-500">
                                Organization ID
                              </p>
                              <p className="font-mono">{viewingOrg.id}</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-500">
                                Organization Name
                              </p>
                              <p>
                                {viewingOrg.organizationName ||
                                  viewingOrg.name ||
                                  'Not specified'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-500">
                                Contact Email
                              </p>
                              <p>
                                {viewingOrg.contactEmail || 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-500">
                                Industry
                              </p>
                              <p>{viewingOrg.industry || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-500">
                                Website
                              </p>
                              <p>
                                {viewingOrg.website ? (
                                  <a
                                    href={viewingOrg.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-forest-green hover:underline"
                                  >
                                    {viewingOrg.website}
                                  </a>
                                ) : (
                                  'Not specified'
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-4 border-2 border-deep-moss">
                          <h4 className="font-bold mb-3 text-deep-moss">
                            Verification Information
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-bold text-gray-500">
                                Status
                              </p>
                              <p>
                                {getStatusBadge(
                                  viewingOrg.verificationStatus ||
                                    viewingOrg.status ||
                                    'pending'
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-500">
                                Wallet Address
                              </p>
                              <p className="font-mono">
                                {viewingOrg.walletAddress || 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-500">
                                Created At
                              </p>
                              <p>{formatDate(viewingOrg.createdAt)}</p>
                            </div>
                            {viewingOrg.updatedAt && (
                              <div>
                                <p className="text-sm font-bold text-gray-500">
                                  Updated At
                                </p>
                                <p>{formatDate(viewingOrg.updatedAt)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {viewingOrg.description && (
                        <div className="bg-white p-4 border-2 border-deep-moss mb-6">
                          <h4 className="font-bold mb-3 text-deep-moss">
                            Description
                          </h4>
                          <p className="text-deep-moss whitespace-pre-wrap">
                            {viewingOrg.description}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end space-x-3 mt-6">
                        {(viewingOrg.verificationStatus === 'pending' ||
                          viewingOrg.status === 'pending') && (
                          <>
                            <button
                              onClick={() => {
                                handleVerifyOrg(viewingOrg.id, 'approve');
                                setViewingOrg(null);
                              }}
                              className="bg-green-100 text-green-900 px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                handleVerifyOrg(viewingOrg.id, 'reject');
                                setViewingOrg(null);
                              }}
                              className="bg-red-100 text-red-900 px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setViewingOrg(null)}
                          className="bg-soft-sage text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
