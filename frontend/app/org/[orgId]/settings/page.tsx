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
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import {
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  Briefcase,
  Save,
} from 'lucide-react';

interface ToastMessage {
  type: 'success' | 'error' | 'warning';
  message: string;
}

interface OrganizationData {
  orgName: string;
  organizationName: string;
  contactEmail: string;
  applicationEmail: string;
  contactPhone: string;
  website: string;
  address: string;
  contactPerson: string;
  industry: string;
  description: string;
  status: string;
  documentTypes: string[];
}

export default function SettingsPage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { hasOrgAccess, isLoadingOrgs } = useOrganization();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
  const [orgData, setOrgData] = useState<OrganizationData>({
    orgName: '',
    organizationName: '',
    contactEmail: '',
    applicationEmail: '',
    contactPhone: '',
    website: '',
    address: '',
    contactPerson: '',
    industry: '',
    description: '',
    status: '',
    documentTypes: [],
  });
  const [documentType, setDocumentType] = useState('');

  const orgId = params?.orgId as string;

  // Fetch organization data
  useEffect(() => {
    const fetchOrgData = async () => {
      if (!orgId) return;

      try {
        setIsLoading(true);

        // First, get the organization user data
        const orgDoc = await getDoc(doc(db, 'users', orgId));

        if (orgDoc.exists()) {
          const userData = orgDoc.data();

          // Now, try to get the organization application data which might have more details
          let applicationData: Record<string, any> = {};
          try {
            const appQuery = query(
              collection(db, 'organizationApplications'),
              where('orgId', '==', orgId)
            );
            const appDocs = await getDocs(appQuery);

            if (!appDocs.empty) {
              applicationData = appDocs.docs[0].data() as Record<string, any>;
            }
          } catch (appError) {
            console.error('Error fetching organization application:', appError);
            // Continue with user data only
          }

          // Determine the verification status
          let verificationStatus = 'not_verified';
          if (userData.verificationStatus) {
            verificationStatus = userData.verificationStatus;
          } else if (userData.status) {
            verificationStatus = userData.status;
          } else if (userData.isVerified === true) {
            verificationStatus = 'verified';
          }

          // Merge the data, prioritizing application data for certain fields
          setOrgData({
            orgName: userData.orgName || userData.name || '',
            organizationName:
              userData.organizationName ||
              applicationData.organizationName ||
              '',
            contactEmail: userData.contactEmail || '',
            applicationEmail:
              applicationData.email || userData.applicationEmail || '',
            contactPhone: userData.contactPhone || userData.phoneNumber || '',
            website: userData.website || '',
            address: userData.address || '',
            contactPerson: userData.contactPerson || '',
            industry: userData.industry || '',
            description: userData.description || '',
            status: verificationStatus,
            documentTypes: userData.documentTypes || [],
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

    fetchOrgData();
  }, [orgId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setOrgData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddDocumentType = () => {
    if (documentType.trim() === '') return;

    if (!orgData.documentTypes.includes(documentType)) {
      setOrgData((prev) => ({
        ...prev,
        documentTypes: [...prev.documentTypes, documentType],
      }));
    }

    setDocumentType('');
  };

  const handleRemoveDocumentType = (type: string) => {
    setOrgData((prev) => ({
      ...prev,
      documentTypes: prev.documentTypes.filter((t) => t !== type),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgId) return;

    try {
      setIsSaving(true);

      // Don't allow changing status or application email through settings
      const { status, applicationEmail, ...updateData } = orgData;

      await updateDoc(doc(db, 'users', orgId), {
        ...updateData,
        updatedAt: new Date(),
      });

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

  // Loading state
  if (authLoading || isLoadingOrgs || isLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Loader
          fullScreen
          text="Loading organization settings..."
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
              Organization Settings
            </h1>
            <ContextSwitcher />
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell count={0} onClick={() => {}} />
            <ProfileCard />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 pb-20 md:pb-8">
        <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal mb-8">
          <h2 className="text-3xl font-black mb-6 text-deep-moss">
            Organization Profile
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-deep-moss font-bold text-lg">
                  <Building size={18} className="mr-2" />
                  Organization Name
                </label>
                <input
                  type="text"
                  name="orgName"
                  value={orgData.orgName}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none text-deep-moss font-medium"
                  placeholder="Enter organization name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-deep-moss font-bold text-lg">
                  <Mail size={18} className="mr-2" />
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={orgData.contactEmail}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none text-deep-moss font-medium"
                  placeholder="Enter contact email"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-deep-moss font-bold text-lg">
                  <Mail size={18} className="mr-2" />
                  Application Email (Read-only)
                </label>
                <input
                  type="email"
                  value={orgData.applicationEmail}
                  className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none text-deep-moss font-medium opacity-75"
                  placeholder="No application email"
                  disabled
                />
                <p className="text-xs text-deep-moss font-medium mt-1">
                  This email was provided during organization verification and
                  cannot be changed.
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-deep-moss font-bold text-lg">
                  <Phone size={18} className="mr-2" />
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={orgData.contactPhone}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none text-deep-moss font-medium"
                  placeholder="Enter contact phone"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-deep-moss font-bold text-lg">
                  <Globe size={18} className="mr-2" />
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={orgData.website}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none text-deep-moss font-medium"
                  placeholder="Enter website URL"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-deep-moss font-bold text-lg">
                  <MapPin size={18} className="mr-2" />
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={orgData.address}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none text-deep-moss font-medium"
                  placeholder="Enter address"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-deep-moss font-bold text-lg">
                  <User size={18} className="mr-2" />
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={orgData.contactPerson}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none text-deep-moss font-medium"
                  placeholder="Enter contact person name"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-deep-moss font-bold text-lg">
                  <Briefcase size={18} className="mr-2" />
                  Industry
                </label>
                <input
                  type="text"
                  name="industry"
                  value={orgData.industry}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none text-deep-moss font-medium"
                  placeholder="Enter industry"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-deep-moss font-bold text-lg">
                Organization Description
              </label>
              <textarea
                name="description"
                value={orgData.description}
                onChange={handleInputChange}
                className="w-full p-3 border-2 border-deep-moss bg-ivory focus:outline-none text-deep-moss font-medium min-h-[120px]"
                placeholder="Enter organization description"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-deep-moss font-bold text-lg">
                Document Types
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {orgData.documentTypes.map((type) => (
                  <div
                    key={type}
                    className="bg-ivory px-3 py-1 border-2 border-deep-moss flex items-center gap-2"
                  >
                    <span className="text-deep-moss font-medium">{type}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocumentType(type)}
                      className="text-deep-moss font-bold hover:text-red-700"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="flex-grow p-3 border-2 border-deep-moss bg-ivory focus:outline-none text-deep-moss font-medium"
                  placeholder="Add document type"
                />
                <button
                  type="button"
                  onClick={handleAddDocumentType}
                  className="px-4 py-2 bg-forest-green text-ivory font-bold border-2 border-deep-moss hover:shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] transition-all"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-deep-moss font-medium mt-1">
                Document types your organization can verify (e.g., "Diploma",
                "Certificate", "License")
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-forest-green text-ivory font-bold border-2 border-deep-moss shadow-[4px_4px_0px_0px_rgba(27,67,50,0.8)] hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-ivory border-t-transparent rounded-full"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-soft-sage border-2 md:border-4 border-deep-moss p-4 md:p-6 shadow-brutal">
          <h2 className="text-3xl font-black mb-6 text-deep-moss">
            Verification Status
          </h2>

          <div
            className={`p-4 border-2 border-deep-moss ${
              orgData.status === 'verified'
                ? 'bg-green-100'
                : orgData.status === 'pending'
                ? 'bg-yellow-100'
                : 'bg-red-100'
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-4 h-4 rounded-full mr-2 ${
                  orgData.status === 'verified'
                    ? 'bg-green-500'
                    : orgData.status === 'pending'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              ></div>
              <h3 className="font-bold text-xl text-deep-moss">
                {orgData.status === 'verified'
                  ? 'Verified Organization'
                  : orgData.status === 'pending'
                  ? 'Verification Pending'
                  : 'Not Verified'}
              </h3>
            </div>

            <p className="mt-2 text-deep-moss font-medium">
              {orgData.status === 'verified'
                ? 'Your organization is verified and can verify documents.'
                : orgData.status === 'pending'
                ? 'Your verification application is being reviewed. You will be notified when it is approved or rejected.'
                : 'Your organization needs to be verified to verify documents. Please apply for verification from the dashboard.'}
            </p>
          </div>
        </section>
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
