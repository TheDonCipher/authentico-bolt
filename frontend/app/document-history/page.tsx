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
import DocumentsList from '../document-history/components/DocumentsList';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function DocumentHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && user) {
      setIsLoading(false);
      fetchDocuments();
    }
  }, [authLoading, user]);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const documentsRef = collection(db, 'documents');
      const q = query(
        documentsRef,
        where('verifyingOrgId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || 'Unnamed Document',
        type: doc.data().documentType || 'Unknown',
        status: doc.data().status || 'pending',
        sender: doc.data().ownerName || doc.data().ownerUid,
        receivedDate: doc.data().createdAt
          ? new Date(doc.data().createdAt.toDate()).toLocaleDateString()
          : 'Unknown',
        fileSize: doc.data().fileSize || 'Unknown',
      }));

      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to load documents',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter documents based on search term and status filter
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      searchTerm === '' ||
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Loader fullScreen text="Loading document history..." size="large" />
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
                    Document History
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

              <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <h2 className="text-2xl md:text-3xl font-black text-deep-moss">
                    All Documents
                  </h2>
                  <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Search documents..."
                      className="px-4 py-2 border-2 border-deep-moss bg-ivory focus:outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                      className="px-4 py-2 border-2 border-deep-moss bg-ivory text-deep-moss focus:outline-none"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                <DocumentsList documents={filteredDocuments} />
              </section>
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
