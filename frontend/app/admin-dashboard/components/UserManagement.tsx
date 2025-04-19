'use client';

import React, { useState, useEffect } from 'react';
import { User, UserCheck, UserX, Mail, Search } from 'lucide-react';
import { auth } from '../../../lib/firebase';
import axios from 'axios';
import { Toast } from '../../components/ui/Toast';

interface UserData {
  id: string;
  name: string;
  email: string;
  userType: string;
  isVerified: boolean;
  createdAt: Date;
  walletAddress: string | null;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Get Firebase ID token
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // In a real implementation, you would fetch actual users from your backend
      // For now, we'll use placeholder data

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Set placeholder users
      const mockUsers: UserData[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          userType: 'individual',
          isVerified: true,
          createdAt: new Date('2023-01-15'),
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          userType: 'individual',
          isVerified: true,
          createdAt: new Date('2023-02-20'),
          walletAddress: '0x2345678901abcdef2345678901abcdef23456789',
        },
        {
          id: '3',
          name: 'Acme Corporation',
          email: 'info@acme.com',
          userType: 'organization',
          isVerified: true,
          createdAt: new Date('2023-03-10'),
          walletAddress: '0x3456789012abcdef3456789012abcdef34567890',
        },
        {
          id: '4',
          name: 'Global Certifiers',
          email: 'contact@globalcert.com',
          userType: 'organization',
          isVerified: true,
          createdAt: new Date('2023-04-05'),
          walletAddress: '0x4567890123abcdef4567890123abcdef45678901',
        },
        {
          id: '5',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          userType: 'individual',
          isVerified: false,
          createdAt: new Date('2023-05-12'),
          walletAddress: null,
        },
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to load users',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserVerification = async (
    userId: string,
    currentStatus: boolean
  ) => {
    try {
      // Get Firebase ID token
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // In a real implementation, you would call your backend API
      // For now, we'll just update the local state

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update local state
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, isVerified: !currentStatus } : user
        )
      );

      setToastMessage({
        type: 'success',
        message: `User ${
          currentStatus ? 'unverified' : 'verified'
        } successfully`,
      });
    } catch (error) {
      console.error('Error updating user verification status:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to update user verification status',
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.walletAddress &&
        user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'organization':
        return <UserCheck className="text-blue-600" size={18} />;
      case 'individual':
      default:
        return <User className="text-green-600" size={18} />;
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
      <h2 className="text-3xl font-black mb-6 text-[#2F4F4F]">
        User Management
      </h2>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by name, email, or wallet address..."
            className="w-full p-3 pl-10 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none"
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white border-2 border-[#556B2F]">
          <thead>
            <tr className="bg-[#D2E3C8]">
              <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">
                User
              </th>
              <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">
                Type
              </th>
              <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">
                Status
              </th>
              <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">
                Joined
              </th>
              <th className="p-3 text-left font-bold text-[#2F4F4F] border-b-2 border-[#556B2F]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[#2F4F4F]">
                  No users found matching your search criteria
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[#556B2F] hover:bg-[#F5F7F2]"
                >
                  <td className="p-3">
                    <div>
                      <p className="font-medium text-[#2F4F4F]">{user.name}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail size={14} className="mr-1" />
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center">
                      {getUserTypeIcon(user.userType)}
                      <span className="ml-1 capitalize">{user.userType}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    {user.isVerified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-[#2F4F4F]">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() =>
                        toggleUserVerification(user.id, user.isVerified)
                      }
                      className={`p-2 border border-[#556B2F] hover:shadow-[1px_1px_0px_0px_rgba(85,107,47,1)] transition-all ${
                        user.isVerified
                          ? 'bg-[#E6B8AF] text-[#2F4F4F]'
                          : 'bg-[#698B69] text-white'
                      }`}
                      title={user.isVerified ? 'Unverify User' : 'Verify User'}
                    >
                      {user.isVerified ? (
                        <UserX size={16} />
                      ) : (
                        <UserCheck size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

export default UserManagement;
