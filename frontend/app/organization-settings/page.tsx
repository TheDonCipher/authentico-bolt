'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarNavigation from '../organization-dashboard/components/SidebarNavigation';
import { AuthGuard } from '../components/auth/AuthGuard';
import { useAuth } from '../contexts/AuthContext';
import { NeubrutalistLoading } from '../components/ui/NeubrutalistLoading';
import { Toast } from '../components/ui/Toast';
import { NotificationBell } from '../components/dashboard/NotificationBell';
import { ProfileCard } from '../components/dashboard/ProfileCard';
import { ContextSwitcher } from '../components/dashboard/ContextSwitcher';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  Briefcase,
} from 'lucide-react';

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface OrganizationData {
  orgName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  address: string;
  contactPerson: string;
  industry: string;
  description: string;
  status: string;
}

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [orgData, setOrgData] = useState<OrganizationData>({
    orgName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    address: '',
    contactPerson: '',
    industry: '',
    description: '',
    status: '',
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchOrganizationData();
    }
  }, [authLoading, user]);

  const fetchOrganizationData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const orgDoc = await getDoc(doc(db, 'users', user.uid));

      if (orgDoc.exists()) {
        const data = orgDoc.data();
        setOrgData({
          orgName: data.orgName || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          website: data.website || '',
          address: data.address || '',
          contactPerson: data.contactPerson || '',
          industry: data.industry || '',
          description: data.description || '',
          status: data.status || 'unverified',
        });
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to load organization data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setOrgData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setIsSaving(true);

      // Don't allow changing status through settings
      const { status, ...updateData } = orgData;

      await updateDoc(doc(db, 'users', user.uid), updateData);

      setToastMessage({
        type: 'success',
        message: 'Organization settings updated successfully',
      });
    } catch (error) {
      console.error('Error updating organization settings:', error);
      setToastMessage({
        type: 'error',
        message: 'Failed to update organization settings',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <NeubrutalistLoading
        message="Organization Settings"
        subMessage="Loading your organization settings..."
        fullScreen={true}
      />
    );
  }

  return (
    <AuthGuard allowedUserTypes={['organization']}>
      <div className="relative flex flex-col md:flex-row min-h-screen bg-ivory">
        <SidebarNavigation />
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-deep-moss pb-4 mb-6 md:mb-8 gap-4">
              <div className="flex items-center">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-deep-moss mr-4">
                  Organization Settings
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
              <h2 className="text-2xl md:text-3xl font-black mb-6 text-deep-moss">
                Organization Profile
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center text-deep-moss font-bold">
                      <Building size={18} className="mr-2" />
                      Organization Name
                    </label>
                    <input
                      type="text"
                      name="orgName"
                      value={orgData.orgName}
                      onChange={handleInputChange}
                      className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none"
                      placeholder="Enter organization name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-deep-moss font-bold">
                      <Mail size={18} className="mr-2" />
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={orgData.contactEmail}
                      onChange={handleInputChange}
                      className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none"
                      placeholder="Enter contact email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-deep-moss font-bold">
                      <Phone size={18} className="mr-2" />
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={orgData.contactPhone}
                      onChange={handleInputChange}
                      className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none"
                      placeholder="Enter contact phone"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-deep-moss font-bold">
                      <Globe size={18} className="mr-2" />
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={orgData.website}
                      onChange={handleInputChange}
                      className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none"
                      placeholder="Enter website URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-deep-moss font-bold">
                      <MapPin size={18} className="mr-2" />
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={orgData.address}
                      onChange={handleInputChange}
                      className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none"
                      placeholder="Enter address"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-deep-moss font-bold">
                      <User size={18} className="mr-2" />
                      Contact Person
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={orgData.contactPerson}
                      onChange={handleInputChange}
                      className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none"
                      placeholder="Enter contact person name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-deep-moss font-bold">
                      <Briefcase size={18} className="mr-2" />
                      Industry
                    </label>
                    <input
                      type="text"
                      name="industry"
                      value={orgData.industry}
                      onChange={handleInputChange}
                      className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none"
                      placeholder="Enter industry"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-deep-moss font-bold">
                    Organization Description
                  </label>
                  <textarea
                    name="description"
                    value={orgData.description}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none min-h-[120px]"
                    placeholder="Enter organization description"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-forest-green text-ivory px-6 py-3 font-bold border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
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
    </AuthGuard>
  );
}
