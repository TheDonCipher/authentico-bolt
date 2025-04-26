'use client';

import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  Clock,
  AlertTriangle,
  ExternalLink,
  Shield,
} from 'lucide-react';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';
import { Toast } from '../../components/ui/Toast';
import { NeubrutalistLoading } from '../../components/ui/NeubrutalistLoading';
import Link from 'next/link';
import { OrganizationVerificationStatus } from '../../types/user';
import {
  OrganizationApplication,
  DOCUMENT_TYPES,
} from '../../types/organization';

interface OrganizationStatusProps {
  userId: string;
}

// Using the OrganizationApplication interface from types

const OrganizationStatus: React.FC<OrganizationStatusProps> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] =
    useState<OrganizationApplication | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<OrganizationVerificationStatus>('not_verified');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
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

      // Get user data to check verification status
      const userResponse = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const userData = userResponse.data;

      // Set verification status from user data
      if (userData.verificationStatus) {
        setVerificationStatus(userData.verificationStatus);
      } else if (userData.isVerified) {
        // For backward compatibility
        setVerificationStatus('verified');
      } else {
        setVerificationStatus('not_verified');
      }

      // Set rejection reason if available
      if (userData.verificationRejectionReason) {
        setRejectionReason(userData.verificationRejectionReason);
      }

      // If not verified or rejected, check if there's a pending application
      if (verificationStatus !== 'verified') {
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

  // Sanitize input to prevent XSS attacks
  const sanitizeInput = (value: string): string => {
    // Basic sanitization - remove HTML tags and trim
    return value.replace(/<[^>]*>?/gm, '').trim();
  };

  // Validate URL format
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Special handling for website URL
    if (name === 'website') {
      // Only update if it's a valid URL or empty (to allow user to type)
      if (value === '' || isValidUrl(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      // For other fields, sanitize the input
      const sanitizedValue = sanitizeInput(value);
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    }
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

    // Validate form data
    if (!formData.orgName || !formData.contactEmail || !formData.website) {
      setToastMessage({
        type: 'error',
        message: 'Please fill in all required fields',
      });
      return;
    }

    // Validate website URL
    if (!isValidUrl(formData.website)) {
      setToastMessage({
        type: 'error',
        message: 'Please enter a valid website URL (e.g., https://example.com)',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      setToastMessage({
        type: 'error',
        message: 'Please enter a valid email address',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get Firebase ID token using the token utility
      const idToken = await getAuthToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // Final sanitization of all form data
      const sanitizedFormData = {
        ...formData,
        orgName: sanitizeInput(formData.orgName),
        contactEmail: sanitizeInput(formData.contactEmail),
        website: formData.website, // Already validated as URL
        description: sanitizeInput(formData.description),
        address: sanitizeInput(formData.address),
        phoneNumber: sanitizeInput(formData.phoneNumber),
        registrationNumber: sanitizeInput(formData.registrationNumber),
      };

      // Submit application to backend
      const response = await axios.post(
        '/api/organizations/apply',
        sanitizedFormData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

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
        <NeubrutalistLoading
          message="Organization Status"
          subMessage="Loading your organization status..."
        />
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

  if (verificationStatus === 'verified') {
    return (
      <div className="bg-[#E8EDE1] border-4 border-[#556B2F] p-6 shadow-brutal relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('/images/pattern-stamp.svg')] bg-repeat"></div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center mb-6 relative">
          <div className="bg-[#698B69] text-white p-3 border-4 border-[#556B2F] mr-4 mb-4 md:mb-0 transform -rotate-3 shadow-brutal">
            <div className="flex items-center">
              <Shield className="text-white mr-2" size={28} />
              <span className="font-black text-lg">VERIFIED</span>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#2F4F4F]">
              Verified Organization
            </h2>
            <p className="text-[#2F4F4F] mt-1">
              Your organization has been verified and can now verify documents
              on the Authentico platform.
            </p>
          </div>

          {/* Large stamp in background */}
          <div className="absolute right-0 top-0 transform translate-x-1/4 -translate-y-1/4 opacity-10">
            <div className="w-40 h-40 rounded-full border-8 border-[#556B2F]">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-black text-[#556B2F]">
                    VERIFIED
                  </div>
                  <div className="text-sm text-[#556B2F]">AUTHENTICO</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border-2 border-green-200 p-5 mb-6 rounded-sm">
          <h3 className="font-bold text-green-800 mb-3 text-lg flex items-center">
            <Check className="mr-2" size={20} />
            Verification Benefits
          </h3>
          <ul className="space-y-2 text-green-800">
            <li className="flex items-start">
              <Check className="mr-2 mt-1 flex-shrink-0" size={16} />
              <span>Verify documents submitted by users</span>
            </li>
            <li className="flex items-start">
              <Check className="mr-2 mt-1 flex-shrink-0" size={16} />
              <span>
                Appear in the verified organizations list for document uploads
              </span>
            </li>
            <li className="flex items-start">
              <Check className="mr-2 mt-1 flex-shrink-0" size={16} />
              <span>Display verification badge on your profile</span>
            </li>
            <li className="flex items-start">
              <Check className="mr-2 mt-1 flex-shrink-0" size={16} />
              <span>Anchor verifications on the blockchain</span>
            </li>
          </ul>
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-green-200">
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-[#D2E3C8] text-[#2F4F4F] border border-[#556B2F]">
              <Check className="mr-1" size={12} />
              Trusted Verifier
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-[#D2E3C8] text-[#2F4F4F] border border-[#556B2F]">
              <Check className="mr-1" size={12} />
              Blockchain Enabled
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-[#D2E3C8] text-[#2F4F4F] border border-[#556B2F]">
              <Check className="mr-1" size={12} />
              Official Verification Partner
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => (window.location.href = '#verification-queue')}
            className="bg-[#698B69] text-white px-5 py-3 font-bold border-2 border-[#556B2F] hover:shadow-[2px_2px_0px_0px_rgba(85,107,47,1)] transition-all"
          >
            View Verification Queue
          </button>
        </div>
      </div>
    );
  }

  // Show application status if there's a pending or rejected application
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
                  className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none bg-white text-[#2F4F4F]"
                  placeholder="Enter your organization name"
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
                    className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none bg-white text-[#2F4F4F]"
                    placeholder="email@example.com"
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
                    className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none bg-white text-[#2F4F4F]"
                    placeholder="+1 (123) 456-7890"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="block font-bold mb-1 text-[#2F4F4F]"
                >
                  Website *{' '}
                  <span className="text-xs font-normal">
                    (must include http:// or https://)
                  </span>
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none bg-white text-[#2F4F4F]"
                  placeholder="https://example.com"
                  pattern="https?://.*"
                />
                {formData.website && !isValidUrl(formData.website) && (
                  <p className="text-red-500 text-sm mt-1">
                    Please enter a valid URL including http:// or https://
                  </p>
                )}
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
                    className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none bg-white text-[#2F4F4F]"
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
                    className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none bg-white text-[#2F4F4F]"
                    placeholder="Enter founding year"
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
                  className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none bg-white text-[#2F4F4F]"
                  placeholder="Enter registration or license number"
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
                  className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none bg-white text-[#2F4F4F]"
                  placeholder="Enter your organization's address"
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
                  className="w-full p-3 border-2 border-[#556B2F] focus:border-[#698B69] focus:outline-none bg-white text-[#2F4F4F]"
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
              {DOCUMENT_TYPES.map((type) => (
                <div key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`type-${type}`}
                    name="documentTypes"
                    value={type}
                    checked={formData.documentTypes.includes(type)}
                    onChange={handleCheckboxChange}
                    className="mr-2 h-5 w-5 border-2 border-[#556B2F] accent-[#556B2F] bg-white"
                  />
                  <label htmlFor={`type-${type}`} className="text-[#2F4F4F]">
                    {type.charAt(0).toUpperCase() + type.slice(1)} Documents
                  </label>
                </div>
              ))}
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

  // Default state - not verified and no application
  return (
    <div className="bg-[#E8EDE1] border-4 border-[#556B2F] p-6 shadow-brutal">
      <h2 className="text-xl font-bold mb-4 text-[#2F4F4F]">
        Organization Verification
      </h2>

      {verificationStatus === 'rejected' ? (
        <div className="bg-red-50 border-2 border-red-200 p-4 mb-6">
          <div className="flex items-center mb-2">
            <X className="mr-2 text-red-600" size={20} />
            <h3 className="font-bold text-red-800">Verification Rejected</h3>
          </div>
          <p className="text-red-800 mb-2">
            Your organization verification has been rejected.
          </p>
          {rejectionReason && (
            <div className="mb-2">
              <h4 className="font-bold text-red-800">Reason:</h4>
              <p className="text-red-800">{rejectionReason}</p>
            </div>
          )}
          <button
            onClick={() => setShowApplicationForm(true)}
            className="mt-4 bg-[#698B69] text-white px-4 py-2 font-bold border-2 border-[#556B2F] hover:shadow-[2px_2px_0px_0px_rgba(85,107,47,1)] transition-all"
          >
            Submit New Application
          </button>
        </div>
      ) : (
        <div className="bg-blue-50 border-2 border-blue-200 p-4 mb-6">
          <p className="text-blue-800 mb-4">
            Your organization is not verified yet. Verified organizations can
            verify documents submitted by users. Apply for verification to
            unlock this feature.
          </p>
          <button
            onClick={() => setShowApplicationForm(true)}
            className="bg-[#698B69] text-white px-4 py-2 font-bold border-2 border-[#556B2F] hover:shadow-[2px_2px_0px_0px_rgba(85,107,47,1)] transition-all"
          >
            Apply for Verification
          </button>
        </div>
      )}

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

export default OrganizationStatus;
