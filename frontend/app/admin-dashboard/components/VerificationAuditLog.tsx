'use client';

import React, { useState, useEffect } from 'react';
import { Shield, X, Clock, AlertTriangle, Calendar, User } from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';
import { Toast } from '../../components/ui/Toast';
import { OrganizationVerificationStatus } from '../../types/user';
import { VerificationAuditLogEntry } from '../../types/organization';

export const VerificationAuditLog: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<VerificationAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const idToken = await getAuthToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      const response = await axios.get('/api/admin/audit-logs', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      setAuditLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError('Failed to load audit logs');
      setToastMessage({
        type: 'error',
        message: 'Failed to load audit logs',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: OrganizationVerificationStatus) => {
    switch (status) {
      case 'verified':
        return <Shield className="text-green-600" size={18} />;
      case 'rejected':
        return <X className="text-red-600" size={18} />;
      case 'pending':
        return <Clock className="text-yellow-600" size={18} />;
      case 'not_verified':
      default:
        return <AlertTriangle className="text-gray-600" size={18} />;
    }
  };

  const getStatusText = (status: OrganizationVerificationStatus) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      case 'not_verified':
      default:
        return 'Not Verified';
    }
  };

  const getStatusColor = (status: OrganizationVerificationStatus) => {
    switch (status) {
      case 'verified':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      case 'not_verified':
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
        <h2 className="text-2xl font-bold mb-4 text-deep-moss">
          Verification Audit Log
        </h2>
        <div className="animate-pulse">
          <div className="h-8 bg-[#D2E3C8] w-1/3 mb-4"></div>
          <div className="h-24 bg-[#D2E3C8] w-full mb-4"></div>
          <div className="h-24 bg-[#D2E3C8] w-full mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-deep-moss">
          Verification Audit Log
        </h2>
        <button
          onClick={fetchAuditLogs}
          className="px-3 py-1 bg-forest-green text-ivory border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all text-sm"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-burnt-sienna bg-opacity-20 p-4 mb-4 border-2 border-deep-moss">
          <p className="text-deep-moss">{error}</p>
        </div>
      )}

      {auditLogs.length === 0 ? (
        <div className="bg-white p-6 border-2 border-deep-moss text-center">
          <p className="text-lg font-bold text-deep-moss">No audit logs found</p>
          <p className="text-deep-moss">
            When organization verification statuses change, they will be recorded here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full border-collapse text-sm md:text-base">
            <thead>
              <tr className="bg-deep-moss text-ivory">
                <th className="p-2 text-left">Organization</th>
                <th className="p-2 text-left">Status Change</th>
                <th className="p-2 text-left hidden md:table-cell">Updated By</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left hidden sm:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-b border-deep-moss">
                  <td className="p-2 whitespace-nowrap">
                    {log.organizationName}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center space-x-1">
                      <span className={getStatusColor(log.oldStatus)}>
                        {getStatusText(log.oldStatus)}
                      </span>
                      <span className="mx-1">→</span>
                      <span className={getStatusColor(log.newStatus)}>
                        {getStatusText(log.newStatus)}
                      </span>
                      {getStatusIcon(log.newStatus)}
                    </div>
                  </td>
                  <td className="p-2 whitespace-nowrap hidden md:table-cell">
                    <div className="flex items-center">
                      <User className="mr-1" size={14} />
                      {log.updatedByName}
                    </div>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="mr-1" size={14} />
                      {log.updatedAt ? formatDate(log.updatedAt) : 'Unknown'}
                    </div>
                  </td>
                  <td className="p-2 hidden sm:table-cell">
                    <div className="max-w-xs truncate">
                      {log.notes || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};
