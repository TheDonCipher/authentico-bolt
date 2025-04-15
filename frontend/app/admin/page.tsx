'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useActiveAccount } from 'thirdweb/react';
import { Toast } from '../components/ui/Toast';
import { auth } from '../../lib/firebase';
import axios from 'axios';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/Tabs';
import OrganizationApplications from './components/OrganizationApplications';
import UserManagement from './components/UserManagement';
import AdminStats from './components/AdminStats';

// Admin wallet address
const ADMIN_WALLET_ADDRESS = '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c';

const AdminDashboard = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const router = useRouter();
  const account = useActiveAccount();

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        setIsLoading(true);

        // Check if wallet is connected
        if (!account) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        // Get wallet address from Thirdweb account
        const address = account.address;

        // Check if address matches admin address
        if (address.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          setToastMessage({
            type: 'error',
            message:
              'Unauthorized access. This page is restricted to admin users only.',
          });

          // Redirect after a delay
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      } catch (error) {
        console.error('Error checking authorization:', error);
        setIsAuthorized(false);
        setToastMessage({
          type: 'error',
          message: 'Failed to verify admin status',
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [account, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7F2] flex items-center justify-center">
        <div className="bg-white p-8 border-4 border-[#556B2F] shadow-brutal">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-64 bg-gray-200 mb-4"></div>
            <div className="h-4 w-48 bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F5F7F2] flex items-center justify-center">
        <div className="bg-white p-8 border-4 border-[#556B2F] shadow-brutal text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="mb-6">
            You do not have permission to access this page.
          </p>
          <Link
            href="/"
            className="bg-[#698B69] text-white px-4 py-2 font-bold border-2 border-[#556B2F]"
          >
            Return Home
          </Link>
        </div>

        {/* Toast Notifications */}
        {toastMessage && (
          <div className="fixed bottom-4 right-4 z-50">
            <Toast type={toastMessage.type} message={toastMessage.message} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F2] text-[#2F4F4F] flex flex-col font-archivo">
      {/* Header */}
      <header className="bg-[#E8EDE1] border-b-4 border-[#556B2F] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-black text-[#2F4F4F] transform -rotate-2 bg-[#D2E3C8] p-2 border-4 border-[#556B2F] inline-block mr-4"
            >
              AUTHENTICO
            </Link>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full border border-green-300 text-sm font-medium">
              Admin
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <AdminStats />

          <div className="mt-8">
            <Tabs defaultValue="applications" className="w-full">
              <TabsList className="bg-[#E8EDE1] border-2 border-[#556B2F] p-1">
                <TabsTrigger
                  value="applications"
                  className="data-[state=active]:bg-[#D2E3C8] data-[state=active]:border-2 data-[state=active]:border-[#556B2F] data-[state=active]:shadow-[2px_2px_0px_0px_rgba(85,107,47,1)]"
                >
                  Organization Applications
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-[#D2E3C8] data-[state=active]:border-2 data-[state=active]:border-[#556B2F] data-[state=active]:shadow-[2px_2px_0px_0px_rgba(85,107,47,1)]"
                >
                  User Management
                </TabsTrigger>
              </TabsList>

              <TabsContent value="applications" className="mt-4">
                <OrganizationApplications />
              </TabsContent>

              <TabsContent value="users" className="mt-4">
                <UserManagement />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast type={toastMessage.type} message={toastMessage.message} />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
