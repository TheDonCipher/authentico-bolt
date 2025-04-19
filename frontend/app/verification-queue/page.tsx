'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarNavigation from '../organization-dashboard/components/SidebarNavigation';
import { AuthGuard } from '../components/auth/AuthGuard';
import { OrganizationVerificationCheck } from '../components/auth/OrganizationVerificationCheck';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from '../components/ui/Loader';
import { Toast } from '../components/ui/Toast';
import { NotificationBell } from '../components/dashboard/NotificationBell';
import { ProfileCard } from '../components/dashboard/ProfileCard';
import { ContextSwitcher } from '../components/dashboard/ContextSwitcher';
import VerificationQueue from '../organization-dashboard/components/VerificationQueue';

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function VerificationQueuePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && user) {
      setIsLoading(false);
    }
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Loader fullScreen text="Loading verification queue..." size="large" />
      </div>
    );
  }

  return (
    <AuthGuard allowedUserTypes={['organization']}>
      <OrganizationVerificationCheck>
        <div className="relative flex flex-col md:flex-row min-h-screen bg-ivory">
          <SidebarNavigation />
          <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-deep-moss pb-4 mb-6 md:mb-8 gap-4">
                <div className="flex items-center">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-deep-moss mr-4">
                    Verification Queue
                  </h1>
                  <ContextSwitcher />
                </div>
                <div className="flex items-center gap-4">
                  <NotificationBell
                    count={notifications.length}
                    onClick={() => {
                      // Handle notifications
                    }}
                  />
                  <ProfileCard />
                </div>
              </div>

              <VerificationQueue />
            </div>
          </main>

          {toastMessage && (
            <Toast
              type={toastMessage.type}
              message={toastMessage.message}
              onClose={() => setToastMessage(null)}
              duration={5000}
            />
          )}
        </div>
      </OrganizationVerificationCheck>
    </AuthGuard>
  );
}
