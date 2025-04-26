'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { NeubrutalistLoading } from '../../../components/ui/NeubrutalistLoading';
import { Toast } from '../../../components/ui/Toast';
import { NotificationBell } from '../../../components/dashboard/NotificationBell';
import { ProfileCard } from '../../../components/dashboard/ProfileCard';
import { ContextSwitcher } from '../../../components/dashboard/ContextSwitcher';
import DocumentReception from '../../../organization-dashboard/components/DocumentReception';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

interface ToastMessage {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export default function DocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hasOrgAccess, isLoadingOrgs } = useOrganization();
  const [orgName, setOrgName] = useState('Organization');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  const orgId = params?.orgId as string;

  useEffect(() => {
    const checkAccessAndLoadData = async () => {
      try {
        // Wait for auth and organization data to load
        if (authLoading || isLoadingOrgs) return;

        // Check if user has access to this organization
        if (!user) {
          router.push('/login');
          return;
        }

        if (!hasOrgAccess(orgId)) {
          console.log('User does not have access to this organization');
          router.push('/unauthorized');
          return;
        }

        // Fetch organization details
        const orgRef = doc(db, 'users', orgId);
        const orgDoc = await getDoc(orgRef);

        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          setOrgName(
            orgData.organizationName || orgData.name || 'Organization'
          );
        }

        // Set up notification listener
        const notificationsRef = collection(db, 'notifications');
        const notificationQuery = query(
          notificationsRef,
          where('userId', '==', orgId),
          where('read', '==', false)
        );

        const unsubscribe = onSnapshot(notificationQuery, (snapshot) => {
          setNotificationCount(snapshot.docs.length);
        });

        // Set loading to false when everything is loaded
        setIsLoading(false);

        // Clean up listener on unmount
        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading organization data:', error);
        setToastMessage({
          type: 'error',
          message: 'Failed to load organization data',
        });
        setIsLoading(false);
      }
    };

    checkAccessAndLoadData();
  }, [user, orgId, authLoading, isLoadingOrgs, hasOrgAccess, router]);

  // Handle notification click
  const handleNotificationClick = () => {
    router.push(`/org/${orgId}/notifications`);
  };

  // Loading state
  if (authLoading || isLoadingOrgs || isLoading) {
    return (
      <NeubrutalistLoading
        message="Organization Documents"
        subMessage="Loading document reception..."
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-ivory w-full">
      <header className="bg-soft-sage p-4 border-b-4 border-deep-moss sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-black text-deep-moss mr-4">
              {orgName} - Document Reception
            </h1>
            <ContextSwitcher />
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell
              count={notificationCount}
              onClick={handleNotificationClick}
            />
            <ProfileCard />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 pb-20 md:pb-8">
        <DocumentReception
          orgId={orgId}
          onVerificationStatusChange={() => {
            // Refresh or update state if needed after verification status changes
            setToastMessage({
              type: 'success',
              message: 'Document status updated successfully',
            });
          }}
        />
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
  );
}
