'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, ExternalLink, Clock } from 'lucide-react';
import { auth } from '../../../lib/firebase';
import axios from 'axios';
import { Toast } from '../../components/ui/Toast';

interface OrgApplication {
  id: string;
  orgName: string;
  contactEmail: string;
  website: string;
  status: string;
  submittedAt: Date;
  updatedAt: Date | null;
}

const OrganizationApplications = () => {
  const [applications, setApplications] = useState<OrgApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  useEffect(() => {
    fetchApplications();
  }, []);
  
  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      // Get Firebase ID token
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.get('/api/organizations/applications', {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      
      // Format dates
      const formattedApps = response.data.map((app: any) => ({
        ...app,
        submittedAt: new Date(app.submittedAt),
        updatedAt: app.updatedAt ? new Date(app.updatedAt) : null
      }));
      
      setApplications(formattedApps);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to load organization applications'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const updateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      // Get Firebase ID token
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }
      
      await axios.put(`/api/organizations/applications/${applicationId}`, {
        status,
        notes: notes
      }, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      
      // Update local state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status } : app
      ));
      
      setSelectedApp(null);
      setNotes('');
      
      setToastMessage({
        type: 'success',
        message: `Organization application ${status} successfully`
      });
      
      // Refresh applications after a short delay
      setTimeout(() => {
        fetchApplications();
      }, 2000);
      
    } catch (error) {
      console.error('Error updating application status:', error);
      setToastMessage({
        type: 'error',
        message: `Failed to ${status} organization application`
      });
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="inline-block mr-1" size={12} />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="inline-block mr-1" size={12} />
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="inline-block mr-1" size={12} />
            Pending
          </span>
        );
    }
  };
  
  if (loading) {
    return (
      <div className="bg-[#E8EDE1] border-4 border-[#556B2F] p-6 shadow-brutal">
        <div className="animate-pulse">
          <div className="h-8 bg-[#D2E3C8] w-1/3 mb-6"></div>
          <div className="h-6 bg-[#D2E3C8] w-full mb-4"></div>
          <div className="h-6 bg-[#D2E3C8] w-full mb-4"></div>
          <div className="h-6 bg-[#D2E3C8] w-full mb-4"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-[#E8EDE1] border-4 border-[#556B2F] p-6 shadow-brutal">
      <h2 className="text-3xl font-black mb-6 text-[#2F4F4F]">Organization Applications</h2>
      
      {applications.length === 0 ? (
        <div className="bg-white p-6 border-2 border-[#556B2F] text-center">
          <Clock size={48} className="mx-auto mb-4 text-[#556B2F]" />
          <p className="text-lg font-bold text-[#2F4F4F]">No applications found</p>
          <p className="text-[#2F4F4F]">When organizations apply for verification, they will appear here.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full bg-white border-2 border-[#556B2F]">
              <thead>
                <tr className="bg-[#D2E3C8]">
                  <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">Organization</th>
                  <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">Email</th>
                  <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">Website</th>
                  <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">Status</th>
                  <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">Submitted</th>
                  <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-[#556B2F] hover:bg-[#F5F7F2]">
                    <td className="p-3 text-[#2F4F4F] font-medium">{app.orgName}</td>
                    <td className="p-3 text-[#2F4F4F]">{app.contactEmail}</td>
                    <td className="p-3 text-[#2F4F4F]">
                      <a 
                        href={app.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        {app.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        <ExternalLink size={14} className="ml-1" />
                      </a>
                    </td>
                    <td className="p-3">{getStatusBadge(app.status)}</td>
                    <td className="p-3 text-[#2F4F4F]">{formatDate(app.submittedAt)}</td>
                    <td className="p-3">
                      {app.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateApplicationStatus(app.id, 'approved')}
                            className="bg-[#698B69] text-white p-2 border border-[#556B2F] hover:shadow-[1px_1px_0px_0px_rgba(85,107,47,1)] transition-all"
                            title="Approve Application"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setSelectedApp(app.id)}
                            className="bg-[#E6B8AF] text-[#2F4F4F] p-2 border border-[#556B2F] hover:shadow-[1px_1px_0px_0px_rgba(85,107,47,1)] transition-all"
                            title="Reject Application"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Rejection Dialog */}
          {selectedApp && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white p-6 border-4 border-[#556B2F] max-w-md w-full">
                <h3 className="text-xl font-bold mb-4 text-[#2F4F4F]">Reject Organization Application</h3>
                <p className="mb-4 text-[#2F4F4F]">Please provide a reason for rejection:</p>
                
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none mb-4"
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
                    className="bg-[#D2E3C8] text-[#2F4F4F] px-4 py-2 font-bold border-2 border-[#556B2F] hover:shadow-[2px_2px_0px_0px_rgba(85,107,47,1)] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateApplicationStatus(selectedApp, 'rejected')}
                    className="bg-[#E6B8AF] text-[#2F4F4F] px-4 py-2 font-bold border-2 border-[#556B2F] hover:shadow-[2px_2px_0px_0px_rgba(85,107,47,1)] transition-all"
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
          <Toast type={toastMessage.type} message={toastMessage.message} />
        </div>
      )}
    </div>
  );
};

export default OrganizationApplications;
