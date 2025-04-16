'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../../lib/firebase';
import { Toast } from '../../components/ui/Toast';
import Link from 'next/link';
import axios from 'axios';

const OrganizationApplicationPage = () => {
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
  const router = useRouter();
  const { user } = useAuth();

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

    if (!user) {
      setToastMessage({
        type: 'error',
        message: 'You must be logged in to apply',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get Firebase ID token
      const idToken = await auth.currentUser?.getIdToken();
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

      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/organization-dashboard');
      }, 3000);
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

  return (
    <div className="min-h-screen bg-[#F5F7F2] text-[#2F4F4F] flex flex-col font-archivo">
      {/* Header */}
      <header className="bg-[#E8EDE1] border-b-4 border-[#556B2F] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-2xl font-black text-[#2F4F4F] transform -rotate-2 bg-[#D2E3C8] p-2 border-4 border-[#556B2F] inline-block"
          >
            AUTHENTICO
          </Link>
          <nav>
            <Link
              href="/individual-dashboard"
              className="font-bold hover:underline"
            >
              Back to Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-3xl mx-auto bg-white border-4 border-[#556B2F] p-6 md:p-8 shadow-brutal">
          <h1 className="text-3xl font-black mb-6 text-[#2F4F4F]">
            Organization Application
          </h1>

          <p className="mb-6 text-[#2F4F4F]">
            Complete this form to apply as a verified organization on
            Authentico. Once approved, you'll be able to verify documents
            submitted by users.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#F5F7F2] border-2 border-[#556B2F] p-4 mb-4">
              <h2 className="text-xl font-bold mb-4 text-[#2F4F4F]">
                Basic Information
              </h2>
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
              <h2 className="text-xl font-bold mb-4 text-[#2F4F4F]">
                Organization Details
              </h2>
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
              <h2 className="text-xl font-bold mb-4 text-[#2F4F4F]">
                Document Verification Types
              </h2>
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

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-[#698B69] text-white p-3 font-bold border-4 border-[#556B2F] hover:shadow-[4px_4px_0px_0px_rgba(85,107,47,1)] transition-all ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
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

export default OrganizationApplicationPage;
