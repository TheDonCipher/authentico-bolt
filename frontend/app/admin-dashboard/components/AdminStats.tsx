'use client';

import React, { useState, useEffect } from 'react';
import { Users, FileText, Building2, Clock } from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';

interface StatsData {
  totalUsers: number;
  totalDocuments: number;
  totalOrganizations: number;
  pendingApplications: number;
}

const AdminStats = () => {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalDocuments: 0,
    totalOrganizations: 0,
    pendingApplications: 0,
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

        // In a real implementation, you would fetch actual stats from your backend
        // For now, we'll use placeholder data

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Set placeholder stats
        setStats({
          totalUsers: 24,
          totalDocuments: 87,
          totalOrganizations: 5,
          pendingApplications: 3,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-[#E8EDE1] p-6 border-4 border-[#556B2F] shadow-brutal">
        <div className="flex items-center mb-2">
          <Users className="mr-2 text-[#556B2F]" size={20} />
          <h3 className="font-bold text-xl text-[#2F4F4F]">Total Users</h3>
        </div>
        <p className="text-4xl font-black text-[#556B2F]">{stats.totalUsers}</p>
      </div>

      <div className="bg-[#E8EDE1] p-6 border-4 border-[#556B2F] shadow-brutal">
        <div className="flex items-center mb-2">
          <FileText className="mr-2 text-[#556B2F]" size={20} />
          <h3 className="font-bold text-xl text-[#2F4F4F]">Documents</h3>
        </div>
        <p className="text-4xl font-black text-[#556B2F]">
          {stats.totalDocuments}
        </p>
      </div>

      <div className="bg-[#E8EDE1] p-6 border-4 border-[#556B2F] shadow-brutal">
        <div className="flex items-center mb-2">
          <Building2 className="mr-2 text-[#556B2F]" size={20} />
          <h3 className="font-bold text-xl text-[#2F4F4F]">Organizations</h3>
        </div>
        <p className="text-4xl font-black text-[#556B2F]">
          {stats.totalOrganizations}
        </p>
      </div>

      <div className="bg-[#E8EDE1] p-6 border-4 border-[#556B2F] shadow-brutal">
        <div className="flex items-center mb-2">
          <Clock className="mr-2 text-[#556B2F]" size={20} />
          <h3 className="font-bold text-xl text-[#2F4F4F]">Pending Apps</h3>
        </div>
        <p className="text-4xl font-black text-[#556B2F]">
          {stats.pendingApplications}
        </p>
      </div>
    </div>
  );
};

export default AdminStats;
