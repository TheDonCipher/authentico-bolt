'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { Loader } from '../../../components/ui/Loader';
import { Toast } from '../../../components/ui/Toast';
import { NotificationBell } from '../../../components/dashboard/NotificationBell';
import { ProfileCard } from '../../../components/dashboard/ProfileCard';
import { ContextSwitcher } from '../../../components/dashboard/ContextSwitcher';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { Bell, Check, X, FileText, Clock, AlertTriangle } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: any;
  type?: string;
}

interface ToastMessage {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export default function NotificationsPage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { hasOrgAccess, isLoadingOrgs } = useOrganization();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

  const orgId = params?.orgId as string;

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!orgId) return;

      try {
        setIsLoading(true);
        
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', orgId),
          orderBy('createdAt', 'desc')
        );

        const notificationsSnapshot = await getDocs(notificationsQuery);
        const notificationsList = notificationsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || 'Notification',
            message: data.message || '',
            read: data.read || false,
            createdAt: data.createdAt instanceof Timestamp 
              ? data.createdAt.toDate() 
              : new Date(),
            data: data.data || data.metadata || {},
            type: data.type || 'general',
          };
        });

        setNotifications(notificationsList);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setToastMessage({
          type: 'error',
          message: 'Failed to load notifications',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [orgId]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });

      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to update notification',
      });
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notification => !notification.read);
      
      if (unreadNotifications.length === 0) {
        return;
      }

      const updatePromises = unreadNotifications.map(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      });

      await Promise.all(updatePromises);

      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );

      setToastMessage({
        type: 'success',
        message: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to update notifications',
      });
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (notification: Notification) => {
    if (notification.type === 'document_verification') {
      return <FileText size={24} className="text-forest-green" />;
    } else if (notification.type === 'organization_verification') {
      if (notification.data?.status === 'verified') {
        return <Check size={24} className="text-forest-green" />;
      } else if (notification.data?.status === 'rejected') {
        return <X size={24} className="text-burnt-sienna" />;
      } else {
        return <Clock size={24} className="text-amber-500" />;
      }
    } else if (notification.title?.toLowerCase().includes('verification')) {
      return <Check size={24} className="text-forest-green" />;
    } else if (notification.title?.toLowerCase().includes('rejected')) {
      return <X size={24} className="text-burnt-sienna" />;
    } else if (notification.title?.toLowerCase().includes('pending')) {
      return <Clock size={24} className="text-amber-500" />;
    } else if (notification.title?.toLowerCase().includes('warning') || notification.title?.toLowerCase().includes('error')) {
      return <AlertTriangle size={24} className="text-burnt-sienna" />;
    } else {
      return <Bell size={24} className="text-deep-moss" />;
    }
  };

  // Loading state
  if (authLoading || isLoadingOrgs || isLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Loader
          fullScreen
          text="Loading notifications..."
          size="large"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory w-full">
      <header className="bg-soft-sage p-4 border-b-4 border-deep-moss sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-black text-deep-moss mr-4">
              Notifications
            </h1>
            <ContextSwitcher />
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell count={notifications.filter(n => !n.read).length} onClick={() => {}} />
            <ProfileCard />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 pb-20 md:pb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-deep-moss">Your Notifications</h2>
          {notifications.some(notification => !notification.read) && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-forest-green text-ivory font-bold border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-soft-sage border-2 md:border-4 border-deep-moss p-8 shadow-brutal text-center">
            <Bell size={48} className="mx-auto mb-4 text-deep-moss opacity-50" />
            <h3 className="text-xl font-bold text-deep-moss mb-2">No Notifications</h3>
            <p className="text-deep-moss">You don't have any notifications at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`bg-soft-sage border-2 border-deep-moss p-4 shadow-brutal transition-all ${
                  notification.read ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-deep-moss">{notification.title}</h3>
                      <div className="text-sm text-gray-600">
                        {notification.createdAt.toLocaleDateString()} {notification.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <p className="text-deep-moss mt-1">{notification.message}</p>
                    
                    {notification.data?.documentId && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">Document ID: {notification.data.documentId}</span>
                      </div>
                    )}
                    
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="mt-2 px-3 py-1 bg-ivory text-deep-moss text-sm font-medium border border-deep-moss hover:bg-forest-green hover:text-ivory transition-colors"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
