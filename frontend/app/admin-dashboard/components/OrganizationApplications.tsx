'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, ExternalLink, Clock } from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';
import { Toast } from '../../components/ui/Toast';

interface OrgApplication {
  id: string;
  orgName: string;
  contactEmail: string;
  website: string;
  phoneNumber?: string;
  industry?: string;
  registrationNumber?: string;
  foundedYear?: string;
  documentTypes?: string[];
  description?: string;
  address?: string;
  status: string;
  submittedAt: Date;
  updatedAt: Date | null;
  notes?: string;
}

const OrganizationApplications = () => {
  const [applications, setApplications] = useState<OrgApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    OrgApplication[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [viewingApp, setViewingApp] = useState<OrgApplication | null>(null);
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  // Filter applications when status filter or search term changes
  useEffect(() => {
    if (!applications.length) {
      setFilteredApplications([]);
      return;
    }

    let filtered = [...applications];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.orgName.toLowerCase().includes(search) ||
          app.contactEmail.toLowerCase().includes(search) ||
          (app.industry && app.industry.toLowerCase().includes(search))
      );
    }

    setFilteredApplications(filtered);
  }, [applications, statusFilter, searchTerm]);

  const fetchApplications = async () => {
    try {
      setLoading(true);

      // Get Firebase ID token using the token utility
      const idToken = await getAuthToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      const response = await axios.get('/api/organizations/applications', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      // Format dates
      const formattedApps = response.data.map((app: any) => ({
        ...app,
        submittedAt: new Date(app.submittedAt),
        updatedAt: app.updatedAt ? new Date(app.updatedAt) : null,
      }));

      setApplications(formattedApps);
      setFilteredApplications(formattedApps);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to load organization applications',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (
    applicationId: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      // Get Firebase ID token using the token utility
      const idToken = await getAuthToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      await axios.put(
        `/api/organizations/applications/${applicationId}`,
        {
          status,
          notes: notes,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      // Update local state
      setApplications(
        applications.map((app) =>
          app.id === applicationId ? { ...app, status } : app
        )
      );

      setSelectedApp(null);
      setNotes('');

      setToastMessage({
        type: 'success',
        message: `Organization application ${status} successfully`,
      });

      // Refresh applications after a short delay
      setTimeout(() => {
        fetchApplications();
      }, 2000);
    } catch (error) {
      console.error('Error updating application status:', error);
      setToastMessage({
        type: 'error',
        message: `Failed to ${status} organization application`,
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
            <Check className="inline-block mr-1" size={12} />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
            <X className="inline-block mr-1" size={12} />
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
            <Clock className="inline-block mr-1" size={12} />
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-soft-sage border-4 border-deep-moss p-6 shadow-brutal">
        <div className="animate-pulse">
          <div className="h-8 bg-ivory w-1/3 mb-6"></div>
          <div className="h-6 bg-ivory w-full mb-4"></div>
          <div className="h-6 bg-ivory w-full mb-4"></div>
          <div className="h-6 bg-ivory w-full mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-soft-sage border-4 border-deep-moss p-6 shadow-brutal">
      <h2 className="text-3xl font-black mb-4 text-deep-moss">
        Organization Applications
      </h2>

      {/* Filter controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or industry..."
              className="w-full p-3 pl-10 border-2 border-deep-moss focus:border-forest-green focus:outline-none"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-3 text-gray-400"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>
        <div className="md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-3 border-2 border-deep-moss focus:border-forest-green focus:outline-none"
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div
          className={`p-3 border-2 ${
            statusFilter === 'all'
              ? 'bg-soft-sage border-deep-moss'
              : 'bg-ivory border-gray-200'
          } cursor-pointer hover:shadow-brutal transition-all`}
          onClick={() => setStatusFilter('all')}
        >
          <div className="text-sm font-medium text-gray-600">All</div>
          <div className="text-2xl font-bold text-deep-moss">
            {applications.length}
          </div>
        </div>
        <div
          className={`p-3 border-2 ${
            statusFilter === 'pending'
              ? 'bg-soft-sage border-deep-moss'
              : 'bg-ivory border-gray-200'
          } cursor-pointer hover:shadow-brutal transition-all`}
          onClick={() => setStatusFilter('pending')}
        >
          <div className="text-sm font-medium text-yellow-600">Pending</div>
          <div className="text-2xl font-bold text-deep-moss">
            {applications.filter((app) => app.status === 'pending').length}
          </div>
        </div>
        <div
          className={`p-3 border-2 ${
            statusFilter === 'approved'
              ? 'bg-soft-sage border-deep-moss'
              : 'bg-ivory border-gray-200'
          } cursor-pointer hover:shadow-brutal transition-all`}
          onClick={() => setStatusFilter('approved')}
        >
          <div className="text-sm font-medium text-green-600">Approved</div>
          <div className="text-2xl font-bold text-deep-moss">
            {applications.filter((app) => app.status === 'approved').length}
          </div>
        </div>
        <div
          className={`p-3 border-2 ${
            statusFilter === 'rejected'
              ? 'bg-soft-sage border-deep-moss'
              : 'bg-ivory border-gray-200'
          } cursor-pointer hover:shadow-brutal transition-all`}
          onClick={() => setStatusFilter('rejected')}
        >
          <div className="text-sm font-medium text-red-600">Rejected</div>
          <div className="text-2xl font-bold text-deep-moss">
            {applications.filter((app) => app.status === 'rejected').length}
          </div>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white p-6 border-2 border-deep-moss text-center">
          <Clock size={48} className="mx-auto mb-4 text-deep-moss" />
          <p className="text-lg font-bold text-deep-moss">
            No applications found
          </p>
          <p className="text-deep-moss">
            When organizations apply for verification, they will appear here.
          </p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white p-6 border-2 border-deep-moss text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-4 text-deep-moss"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <p className="text-lg font-bold text-deep-moss">
            No matching applications
          </p>
          <p className="text-deep-moss">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full bg-white border-2 border-deep-moss">
              <thead>
                <tr className="bg-soft-sage">
                  <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                    Organization
                  </th>
                  <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                    Email
                  </th>
                  <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                    Industry
                  </th>
                  <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                    Status
                  </th>
                  <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                    Submitted
                  </th>
                  <th className="p-3 text-left font-bold text-deep-moss border-b-2 border-deep-moss">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-deep-moss hover:bg-soft-sage hover:bg-opacity-30 cursor-pointer"
                    onClick={() => setViewingApp(app)}
                  >
                    <td className="p-3 text-deep-moss font-medium">
                      {app.orgName}
                    </td>
                    <td className="p-3 text-deep-moss">{app.contactEmail}</td>
                    <td className="p-3 text-deep-moss">
                      {app.industry || 'Not specified'}
                    </td>
                    <td className="p-3">{getStatusBadge(app.status)}</td>
                    <td className="p-3 text-deep-moss">
                      {formatDate(app.submittedAt)}
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setViewingApp(app)}
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
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() =>
                                updateApplicationStatus(app.id, 'approved')
                              }
                              className="bg-forest-green text-white p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                              title="Approve Application"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setSelectedApp(app.id)}
                              className="bg-burnt-sienna bg-opacity-20 text-deep-moss p-2 border border-deep-moss hover:shadow-[1px_1px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                              title="Reject Application"
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

          {/* Application Details Dialog */}
          {viewingApp && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white p-6 border-4 border-deep-moss max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-deep-moss">
                    {viewingApp.orgName}
                    <span className="ml-3">
                      {getStatusBadge(viewingApp.status)}
                    </span>
                  </h3>
                  <button
                    onClick={() => setViewingApp(null)}
                    className="bg-burnt-sienna bg-opacity-20 text-deep-moss p-2 border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white p-4 border-2 border-deep-moss">
                    <h4 className="font-bold mb-3 text-deep-moss">
                      Contact Information
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-bold text-gray-500">Email</p>
                        <p>{viewingApp.contactEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-500">Phone</p>
                        <p>{viewingApp.phoneNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-500">
                          Website
                        </p>
                        <p className="flex items-center">
                          <a
                            href={viewingApp.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            {viewingApp.website}
                            <ExternalLink size={14} className="ml-1" />
                          </a>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-500">
                          Address
                        </p>
                        <p>{viewingApp.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 border-2 border-deep-moss">
                    <h4 className="font-bold mb-3 text-deep-moss">
                      Organization Details
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-bold text-gray-500">
                          Industry
                        </p>
                        <p>{viewingApp.industry || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-500">
                          Registration/License Number
                        </p>
                        <p>{viewingApp.registrationNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-500">
                          Founded Year
                        </p>
                        <p>{viewingApp.foundedYear || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-500">
                          Application Date
                        </p>
                        <p>{formatDate(viewingApp.submittedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold mb-3 text-deep-moss">Description</h4>
                  <div className="bg-white p-4 border-2 border-deep-moss">
                    <p>{viewingApp.description || 'No description provided'}</p>
                  </div>
                </div>

                {viewingApp.documentTypes &&
                  viewingApp.documentTypes.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-bold mb-3 text-deep-moss">
                        Document Types
                      </h4>
                      <div className="bg-white p-4 border-2 border-deep-moss">
                        <div className="flex flex-wrap gap-2">
                          {viewingApp.documentTypes.map((type) => (
                            <span
                              key={type}
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-soft-sage text-deep-moss border border-deep-moss"
                            >
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                {viewingApp.notes && (
                  <div className="mb-6">
                    <h4 className="font-bold mb-3 text-deep-moss">Notes</h4>
                    <div className="bg-white p-4 border-2 border-deep-moss">
                      <p>{viewingApp.notes}</p>
                    </div>
                  </div>
                )}

                {viewingApp.status === 'pending' && (
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        updateApplicationStatus(viewingApp.id, 'approved');
                        setViewingApp(null);
                      }}
                      className="bg-forest-green text-white px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                    >
                      Approve Application
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApp(viewingApp.id);
                        setViewingApp(null);
                      }}
                      className="bg-burnt-sienna bg-opacity-20 text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                    >
                      Reject Application
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection Dialog */}
          {selectedApp && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white p-6 border-4 border-deep-moss max-w-md w-full">
                <h3 className="text-xl font-bold mb-4 text-deep-moss">
                  Reject Organization Application
                </h3>
                <p className="mb-4 text-deep-moss">
                  Please provide a reason for rejection:
                </p>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border-2 border-deep-moss focus:border-forest-green focus:outline-none mb-4"
                  rows={4}
                  placeholder="Enter rejection reason..."
                  required
                />

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setSelectedApp(null);
                      setNotes('');
                    }}
                    className="bg-soft-sage text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      updateApplicationStatus(selectedApp, 'rejected')
                    }
                    className="bg-burnt-sienna bg-opacity-20 text-deep-moss px-4 py-2 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                    disabled={!notes}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast
            type={toastMessage.type}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
            duration={5000}
          />
        </div>
      )}
    </div>
  );
};

export default OrganizationApplications;
