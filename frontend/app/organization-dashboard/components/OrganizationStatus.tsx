'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';
import { Toast } from '../../components/ui/Toast';
import Link from 'next/link';

interface OrganizationStatusProps {
  userId: string;
}

interface ApplicationData {
  id: string;
  orgName: string;
  contactEmail: string;
  website: string;
  phoneNumber?: string;
  industry?: string;
  registrationNumber?: string;
  foundedYear?: string;
  documentTypes?: string[];
  description?: string;
  address?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  updatedAt: Date | null;
  notes?: string;
}

const OrganizationStatus: React.FC<OrganizationStatusProps> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [formData, setFormData] = useState({
    orgName: '',
    contactEmail: '',
    website: '',
    description: '',
    address: '',
    phoneNumber: '',
    industry: '',
    registrationNumber: '',
    foundedYear: '',
    documentTypes: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchOrganizationStatus();
  }, [userId]);

  const fetchOrganizationStatus = async () => {
    try {
      setLoading(true);

      // Get Firebase ID token using the token utility
      const idToken = await getAuthToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // First, check if the user is already verified
      const userResponse = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const userData = userResponse.data;
      setIsVerified(userData.isVerified || false);

      // If not verified, check if there's a pending application
      if (!userData.isVerified) {
        try {
          // Try to fetch existing applications
          const applicationsResponse = await axios.get(
            '/api/organizations/application/status',
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            }
          );

          if (applicationsResponse.data) {
            // Format dates
            const appData = applicationsResponse.data;
            setApplication({
              ...appData,
              submittedAt: new Date(appData.submittedAt),
              updatedAt: appData.updatedAt ? new Date(appData.updatedAt) : null,
            });
          } else {
            setApplication(null);
          }
        } catch (appError) {
          // No application found, that's okay
          setApplication(null);
        }
      }
    } catch (err) {
      console.error('Error fetching organization status:', err);
      setError('Failed to load organization status');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      if (checked) {
        return { ...prev, documentTypes: [...prev.documentTypes, value] };
      } else {
        return {
          ...prev,
          documentTypes: prev.documentTypes.filter((type) => type !== value),
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      // Get Firebase ID token using the token utility
      const idToken = await getAuthToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // Submit application to backend
      const response = await axios.post('/api/organizations/apply', formData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      setToastMessage({
        type: 'success',
        message:
          'Application submitted successfully! We will review your application and get back to you soon.',
      });

      // Hide form and refresh status
      setShowApplicationForm(false);
      fetchOrganizationStatus();
    } catch (error) {
      console.error('Error submitting application:', error);
      setToastMessage({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to submit application',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-[#E8EDE1] border-4 border-[#556B2F] p-6 shadow-brutal">
        <div className="animate-pulse">
          <div className="h-8 bg-[#D2E3C8] w-1/3 mb-4"></div>
          <div className="h-24 bg-[#D2E3C8] w-full mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#E8EDE1] border-4 border-[#556B2F] p-6 shadow-brutal">
        <div className="flex items-center text-red-600 mb-4">
          <AlertTriangle className="mr-2" size={24} />
          <h2 className="text-xl font-bold">Error</h2>
        </div>
        <p className="text-[#2F4F4F]">{error}</p>
        <button
          onClick={fetchOrganizationStatus}
          className="mt-4 bg-[#698B69] text-white px-4 py-2 font-bold border-2 border-[#556B2F] hover:shadow-[2px_2px_0px_0px_rgba(85,107,47,1)] transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="bg-[#E8EDE1] border-4 border-[#556B2F] p-6 shadow-brutal">
        <div className="flex items-center mb-4">
          <div className="bg-[#698B69] text-white p-2 border-2 border-[#556B2F] mr-3">
            <Check className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#2F4F4F]">
              Verified Organization
            </h2>
            <div className="flex items-center mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-400">
                <Check className="mr-1" size={12} />
                Verified
              </span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border-2 border-green-200 p-4 mb-6">
          <p className="text-green-800 mb-2">
            Your organization has been verified. You can now verify documents
            submitted by users.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#D2E3C8] text-[#2F4F4F] border border-[#556B2F]">
              <Check className="mr-1" size={12} />
              Trusted Verifier
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#D2E3C8] text-[#2F4F4F] border border-[#556B2F]">
              <Check className="mr-1" size={12} />
              Blockchain Enabled
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => (window.location.href = '#verification-queue')}
            className="bg-[#698B69] text-white px-4 py-2 font-bold border-2 border-[#556B2F] hover:shadow-[2px_2px_0px_0px_rgba(85,107,47,1)] transition-all"
          >
            View Verification Queue
          </button>
        </div>
      </div>
    );
  }

  if (application) {
    return (
      <div className="bg-[#E8EDE1] border-4 border-[#556B2F] p-6 shadow-brutal">
        <h2 className="text-xl font-bold mb-4 text-[#2F4F4F]">
          Organization Verification Status
        </h2>

        {application.status === 'pending' && (
          <div className="bg-yellow-50 border-2 border-yellow-200 p-4 mb-6">
            <div className="flex items-center mb-2">
              <Clock className="mr-2 text-yellow-600" size={20} />
              <h3 className="font-bold text-yellow-800">
                Application Under Review
              </h3>
            </div>
            <p className="text-yellow-800 mb-2">
              Your application is currently being reviewed by our team. We'll
              notify you once a decision has been made.
            </p>
            <p className="text-sm text-yellow-700">
              Submitted on: {formatDate(application.submittedAt)}
            </p>
          </div>
        )}

        {application.status === 'rejected' && (
          <div className="bg-red-50 border-2 border-red-200 p-4 mb-6">
            <div className="flex items-center mb-2">
              <X className="mr-2 text-red-600" size={20} />
              <h3 className="font-bold text-red-800">Application Rejected</h3>
            </div>
            <p className="text-red-800 mb-2">
              Unfortunately, your application has been rejected.
            </p>
            {application.notes && (
              <div className="mb-2">
                <h4 className="font-bold text-red-800">Reason:</h4>
                <p className="text-red-800">{application.notes}</p>
              </div>
            )}
            <p className="text-sm text-red-700">
              Decision made on:{' '}
              {application.updatedAt
                ? formatDate(application.updatedAt)
                : 'Unknown'}
            </p>
            <button
              onClick={() => setShowApplicationForm(true)}
              className="mt-4 bg-[#698B69] text-white px-4 py-2 font-bold border-2 border-[#556B2F] hover:shadow-[2px_2px_0px_0px_rgba(85,107,47,1)] transition-all"
            >
              Submit New Application
            </button>
          </div>
        )}

        <div className="mt-4">
          <h3 className="font-bold mb-2 text-[#2F4F4F]">Application Details</h3>
          <div className="bg-white p-4 border-2 border-[#556B2F]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-bold text-gray-500">
                  Organization Name
                </p>
                <p>{application.orgName}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">Contact Email</p>
                <p>{application.contactEmail}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">Website</p>
                <p className="flex items-center">
                  <a
                    href={application.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    {application.website}
                    <ExternalLink size={14} className="ml-1" />
                  </a>
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500">Submitted On</p>
                <p>{formatDate(application.submittedAt)}</p>
              </div>

              {application.phoneNumber && (
                <div>
                  <p className="text-sm font-bold text-gray-500">
                    Phone Number
                  </p>
                  <p>{application.phoneNumber}</p>
                </div>
              )}

              {application.industry && (
                <div>
                  <p className="text-sm font-bold text-gray-500">Industry</p>
                  <p>{application.industry}</p>
                </div>
              )}

              {application.address && (
                <div>
                  <p className="text-sm font-bold text-gray-500">Address</p>
                  <p>{application.address}</p>
                </div>
              )}

              {application.documentTypes &&
                application.documentTypes.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm font-bold text-gray-500">
                      Document Types
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {application.documentTypes.map((type) => (
                        <span
                          key={type}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D2E3C8] text-[#2F4F4F] border border-[#556B2F]"
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {application.description && (
                <div className="col-span-2">
                  <p className="text-sm font-bold text-gray-500">Description</p>
                  <p>{application.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showApplicationForm) {
    return (
      <div className="bg-[#E8EDE1] border-4 border-[#556B2F] p-6 shadow-brutal">
        <h2 className="text-xl font-bold mb-4 text-[#2F4F4F]">
          Apply for Organization Verification
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#F5F7F2] border-2 border-[#556B2F] p-4 mb-4">
            <h3 className="text-lg font-bold mb-4 text-[#2F4F4F]">
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="orgName"
                  className="block font-bold mb-1 text-[#2F4F4F]"
                >
                  Organization Name *
                </label>
                <input
                  type="text"
                  id="orgName"
                  name="orgName"
                  value={formData.orgName}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contactEmail"
                    className="block font-bold mb-1 text-[#2F4F4F]"
                  >
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    required
                    className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="block font-bold mb-1 text-[#2F4F4F]"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="block font-bold mb-1 text-[#2F4F4F]"
                >
                  Website *
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#F5F7F2] border-2 border-[#556B2F] p-4 mb-4">
            <h3 className="text-lg font-bold mb-4 text-[#2F4F4F]">
              Organization Details
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="industry"
                    className="block font-bold mb-1 text-[#2F4F4F]"
                  >
                    Industry
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none"
                  >
                    <option value="">Select Industry</option>
                    <option value="education">Education</option>
                    <option value="government">Government</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="legal">Legal</option>
                    <option value="technology">Technology</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="foundedYear"
                    className="block font-bold mb-1 text-[#2F4F4F]"
                  >
                    Founded Year
                  </label>
                  <input
                    type="number"
                    id="foundedYear"
                    name="foundedYear"
                    value={formData.foundedYear}
                    onChange={handleChange}
                    min="1800"
                    max={new Date().getFullYear()}
                    className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="registrationNumber"
                  className="block font-bold mb-1 text-[#2F4F4F]"
                >
                  Registration/License Number
                </label>
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block font-bold mb-1 text-[#2F4F4F]"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block font-bold mb-1 text-[#2F4F4F]"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none"
                  placeholder="Tell us about your organization and why you should be verified..."
                />
              </div>
            </div>
          </div>

          <div className="bg-[#F5F7F2] border-2 border-[#556B2F] p-4 mb-4">
            <h3 className="text-lg font-bold mb-4 text-[#2F4F4F]">
              Document Verification Types
            </h3>
            <p className="mb-4 text-[#2F4F4F]">
              Select the types of documents your organization can verify:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="type-identity"
                  name="documentTypes"
                  value="identity"
                  checked={formData.documentTypes.includes('identity')}
                  onChange={handleCheckboxChange}
                  className="mr-2 h-5 w-5 border-2 border-[#556B2F]"
                />
                <label htmlFor="type-identity" className="text-[#2F4F4F]">
                  Identity Documents
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="type-education"
                  name="documentTypes"
                  value="education"
                  checked={formData.documentTypes.includes('education')}
                  onChange={handleCheckboxChange}
                  className="mr-2 h-5 w-5 border-2 border-[#556B2F]"
                />
                <label htmlFor="type-education" className="text-[#2F4F4F]">
                  Educational Certificates
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="type-employment"
                  name="documentTypes"
                  value="employment"
                  checked={formData.documentTypes.includes('employment')}
                  onChange={handleCheckboxChange}
                  className="mr-2 h-5 w-5 border-2 border-[#556B2F]"
                />
                <label htmlFor="type-employment" className="text-[#2F4F4F]">
                  Employment Documents
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="type-financial"
                  name="documentTypes"
                  value="financial"
                  checked={formData.documentTypes.includes('financial')}
                  onChange={handleCheckboxChange}
                  className="mr-2 h-5 w-5 border-2 border-[#556B2F]"
                />
                <label htmlFor="type-financial" className="text-[#2F4F4F]">
                  Financial Documents
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="type-legal"
                  name="documentTypes"
                  value="legal"
                  checked={formData.documentTypes.includes('legal')}
                  onChange={handleCheckboxChange}
                  className="mr-2 h-5 w-5 border-2 border-[#556B2F]"
                />
                <label htmlFor="type-legal" className="text-[#2F4F4F]">
                  Legal Documents
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="type-other"
                  name="documentTypes"
                  value="other"
                  checked={formData.documentTypes.includes('other')}
                  onChange={handleCheckboxChange}
                  className="mr-2 h-5 w-5 border-2 border-[#556B2F]"
                />
                <label htmlFor="type-other" className="text-[#2F4F4F]">
                  Other Documents
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setShowApplicationForm(false)}
              className="bg-[#E6B8AF] text-[#2F4F4F] px-4 py-2 font-bold border-2 border-[#556B2F] hover:shadow-[2px_2px_0px_0px_rgba(85,107,47,1)] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-[#698B69] text-white px-4 py-2 font-bold border-2 border-[#556B2F] hover:shadow-[2px_2px_0px_0px_rgba(85,107,47,1)] transition-all ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-[#E8EDE1] border-4 border-[#556B2F] p-6 shadow-brutal">
      <h2 className="text-xl font-bold mb-4 text-[#2F4F4F]">
        Organization Verification
      </h2>

      <div className="bg-blue-50 border-2 border-blue-200 p-4 mb-6">
        <p className="text-blue-800 mb-4">
          Your organization is not verified yet. Verified organizations can
          verify documents submitted by users. Apply for verification to unlock
          this feature.
        </p>
        <button
          onClick={() => setShowApplicationForm(true)}
          className="bg-[#698B69] text-white px-4 py-2 font-bold border-2 border-[#556B2F] hover:shadow-[2px_2px_0px_0px_rgba(85,107,47,1)] transition-all"
        >
          Apply for Verification
        </button>
      </div>

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast type={toastMessage.type} message={toastMessage.message} />
        </div>
      )}
    </div>
  );
};

export default OrganizationStatus;
