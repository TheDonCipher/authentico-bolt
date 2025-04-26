'use client';

import React, { useState, useEffect } from 'react';
import { Users, FileText, Building2, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';
import { API_ENDPOINTS } from '../../../lib/constants';

interface StatsData {
  totalUsers: number;
  totalDocuments: number;
  totalOrganizations: number;
  pendingApplications: number;
  verifiedOrganizations: number;
  verifiedDocuments: number;
  rejectedDocuments: number;
}

const AdminStats = () => {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalDocuments: 0,
    totalOrganizations: 0,
    pendingApplications: 0,
    verifiedOrganizations: 0,
    verifiedDocuments: 0,
    rejectedDocuments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Get Firebase ID token using the token utility
        const idToken = await getAuthToken();
        if (!idToken) {
          throw new Error('Not authenticated');
        }

        // Fetch actual stats from the backend
        const response = await axios.get(API_ENDPOINTS.ADMIN.STATS, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        const data = response.data;
        console.log('Admin stats data:', data);

        // Map the API response to our stats interface
        setStats({
          totalUsers: data.users || 0,
          totalDocuments: data.documents || 0,
          totalOrganizations: data.organizations || 0,
          pendingApplications: data.pendingOrganizations || 0,
          verifiedOrganizations: data.verifiedOrganizations || 0,
          verifiedDocuments: data.verifiedDocuments || 0,
          rejectedDocuments: data.rejectedDocuments || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);

        // Set fallback stats for development
        if (process.env.NODE_ENV === 'development') {
          setStats({
            totalUsers: 24,
            totalDocuments: 87,
            totalOrganizations: 5,
            pendingApplications: 3,
            verifiedOrganizations: 2,
            verifiedDocuments: 45,
            rejectedDocuments: 12,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-[#E8EDE1] p-6 border-4 border-[#556B2F] shadow-brutal"
          >
            <div className="animate-pulse">
              <div className="h-8 bg-[#D2E3C8] w-1/3 mb-2"></div>
              <div className="h-10 bg-[#D2E3C8] w-1/4 mt-2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      <div className="bg-[#E8EDE1] p-4 md:p-6 border-2 md:border-4 border-[#556B2F] shadow-brutal">
        <div className="flex items-center mb-2">
          <Users className="mr-2 text-[#556B2F]" size={20} />
          <h3 className="font-bold text-lg md:text-xl text-[#2F4F4F]">
            Total Users
          </h3>
        </div>
        <p className="text-3xl md:text-4xl font-black text-[#556B2F]">
          {stats.totalUsers}
        </p>
      </div>

      <div className="bg-[#E8EDE1] p-4 md:p-6 border-2 md:border-4 border-[#556B2F] shadow-brutal">
        <div className="flex items-center mb-2">
          <FileText className="mr-2 text-[#556B2F]" size={20} />
          <h3 className="font-bold text-lg md:text-xl text-[#2F4F4F]">
            Documents
          </h3>
        </div>
        <p className="text-3xl md:text-4xl font-black text-[#556B2F]">
          {stats.totalDocuments}
        </p>
      </div>

      <div className="bg-[#E8EDE1] p-4 md:p-6 border-2 md:border-4 border-[#556B2F] shadow-brutal">
        <div className="flex items-center mb-2">
          <Building2 className="mr-2 text-[#556B2F]" size={20} />
          <h3 className="font-bold text-lg md:text-xl text-[#2F4F4F]">
            Organizations
          </h3>
        </div>
        <p className="text-3xl md:text-4xl font-black text-[#556B2F]">
          {stats.totalOrganizations}
        </p>
      </div>

      <div className="bg-[#E8EDE1] p-4 md:p-6 border-2 md:border-4 border-[#556B2F] shadow-brutal">
        <div className="flex items-center mb-2">
          <Clock className="mr-2 text-[#556B2F]" size={20} />
          <h3 className="font-bold text-lg md:text-xl text-[#2F4F4F]">
            Pending Apps
          </h3>
        </div>
        <p className="text-3xl md:text-4xl font-black text-[#556B2F]">
          {stats.pendingApplications}
        </p>
      </div>

      <div className="bg-[#E8EDE1] p-4 md:p-6 border-2 md:border-4 border-[#556B2F] shadow-brutal">
        <div className="flex items-center mb-2">
          <CheckCircle className="mr-2 text-[#556B2F]" size={20} />
          <h3 className="font-bold text-lg md:text-xl text-[#2F4F4F]">
            Verified Orgs
          </h3>
        </div>
        <p className="text-3xl md:text-4xl font-black text-[#556B2F]">
          {stats.verifiedOrganizations}
        </p>
      </div>

      <div className="bg-[#E8EDE1] p-4 md:p-6 border-2 md:border-4 border-[#556B2F] shadow-brutal">
        <div className="flex items-center mb-2">
          <CheckCircle className="mr-2 text-green-600" size={20} />
          <h3 className="font-bold text-lg md:text-xl text-[#2F4F4F]">
            Verified Docs
          </h3>
        </div>
        <p className="text-3xl md:text-4xl font-black text-green-600">
          {stats.verifiedDocuments}
        </p>
      </div>

      <div className="bg-[#E8EDE1] p-4 md:p-6 border-2 md:border-4 border-[#556B2F] shadow-brutal">
        <div className="flex items-center mb-2">
          <FileText className="mr-2 text-red-600" size={20} />
          <h3 className="font-bold text-lg md:text-xl text-[#2F4F4F]">
            Rejected Docs
          </h3>
        </div>
        <p className="text-3xl md:text-4xl font-black text-red-600">
          {stats.rejectedDocuments}
        </p>
      </div>
    </div>
  );
};

export default AdminStats;
