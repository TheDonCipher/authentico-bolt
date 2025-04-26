'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import useSecureDocumentUpload from '../../../lib/hooks/useSecureDocumentUpload';
import { isAdmin } from '../../../lib/authorization-util';
import { getVerifiedOrganizations } from '../../../lib/api-client';
import { Document } from '../../models/Document';
import {
  validateFileType,
  validateFileSize,
} from '../../../lib/validation-util';
import { useToast } from '../../components/ui/ToastProvider';

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  documentToReupload?: Document | null; // Optional document to re-upload
}

export const DocumentUploadDialog = ({
  isOpen,
  onClose,
  onSuccess,
  documentToReupload = null,
}: DocumentUploadDialogProps) => {
  // Form state
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('identity');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Organization state
  const [verifyingOrgs, setVerifyingOrgs] = useState<any[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [orgLoadError, setOrgLoadError] = useState<string | null>(null);

  // Upload hook
  const {
    uploadDocument,
    isUploading,
    progress: uploadProgress,
    error,
    resetUploadState,
  } = useSecureDocumentUpload();

  // Auth and toast
  const { user } = useAuth();
  const { showToast } = useToast();

  // Check if user is admin
  const isAdminUser = user ? isAdmin(user) : false;

  // Refs to prevent infinite loops
  const hasInitializedRef = useRef(false);
  const hasSetOrgRef = useRef(false);
  const hasSetInitialOrgRef = useRef(false); // For backward compatibility

  // Initialize form when dialog opens
  useEffect(() => {
    if (!isOpen) {
      // Reset flags when dialog closes
      hasInitializedRef.current = false;
      hasSetOrgRef.current = false;
      return;
    }

    // Skip if already initialized
    if (hasInitializedRef.current) return;

    // Mark as initialized
    hasInitializedRef.current = true;

    // Reset form state
    resetUploadState();
    setSelectedFile(null);

    // Set initial form values
    if (documentToReupload) {
      setDocumentName(documentToReupload.documentName || '');
      setDocumentType(documentToReupload.documentType || 'identity');
    } else {
      setDocumentName('');
      setDocumentType('identity');
    }

    // Fetch organizations
    const fetchOrganizations = async () => {
      try {
        setIsLoadingOrgs(true);
        setOrgLoadError(null);

        console.log('Fetching organizations...');
        const organizations = await getVerifiedOrganizations(
          isAdminUser,
          false
        );

        if (organizations && organizations.length > 0) {
          console.log(
            `Successfully fetched ${organizations.length} organizations`
          );

          // Process and deduplicate organizations
          const uniqueOrgs: any[] = [];
          const orgIds = new Set();

          organizations.forEach((org) => {
            if (!orgIds.has(org.id)) {
              orgIds.add(org.id);
              uniqueOrgs.push(org);
            }
          });

          // Sort alphabetically by organization name
          uniqueOrgs.sort((a, b) =>
            (a.organizationName || a.name).localeCompare(
              b.organizationName || b.name
            )
          );

          // Update state
          setVerifyingOrgs(uniqueOrgs);

          // Set initial selected organization
          if (!hasSetOrgRef.current) {
            if (documentToReupload?.verifyingOrgId) {
              setSelectedOrganization(documentToReupload.verifyingOrgId);
            } else if (uniqueOrgs.length > 0) {
              setSelectedOrganization(uniqueOrgs[0].id);
            }
            hasSetOrgRef.current = true;
          }
        } else {
          console.warn('No organizations returned from API');
          setVerifyingOrgs([]);
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
        setOrgLoadError('Failed to load organizations. Please try refreshing.');
        setVerifyingOrgs([]);
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, [isOpen, documentToReupload, isAdminUser, resetUploadState]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size
      if (!validateFileSize(file)) {
        showToast({
          type: 'error',
          message: 'File size exceeds 10MB limit',
        });
        return;
      }

      // Validate file type
      if (!validateFileType(file)) {
        showToast({
          type: 'error',
          message:
            'Invalid file type. Please upload PDF, JPEG, or PNG files only.',
        });
        return;
      }

      setSelectedFile(file);
      resetUploadState();

      // Auto-fill document name from filename if empty
      if (!documentName) {
        const fileName = file.name.split('.')[0];
        setDocumentName(fileName);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!selectedFile) {
      showToast({
        type: 'error',
        message: 'Please select a file to upload',
      });
      return;
    }

    if (!selectedOrganization) {
      showToast({
        type: 'error',
        message: 'Please select an organization',
      });
      return;
    }

    try {
      // Use the secure document upload hook
      await uploadDocument(
        selectedFile,
        documentName,
        documentType,
        selectedOrganization,
        {
          onProgress: (progress) => {
            console.log(`Upload progress: ${progress}%`);
          },
          onSuccess: () => {
            showToast({
              type: 'success',
              message: 'Document uploaded successfully!',
            });
            onSuccess();
            onClose();
          },
          onError: (error) => {
            showToast({
              type: 'error',
              message: error.message,
              duration: 7000, // Show longer for errors
            });
          },
        }
      );
    } catch (error: any) {
      console.error('Error in document upload:', error);
      // Error handling is already done in the hook
    }
  };

  // Handle refreshing the organization list
  const handleRefreshOrgs = async () => {
    if (isLoadingOrgs) return;

    setIsLoadingOrgs(true);
    setOrgLoadError(null);

    try {
      showToast({
        type: 'success',
        message: 'Refreshing organization list...',
        duration: 2000,
      });

      // Fetch fresh CSRF token
      try {
        console.log(
          'Fetching fresh CSRF token before refreshing organizations...'
        );
        await fetch('/api/auth/csrf-token', {
          method: 'GET',
          credentials: 'include',
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (csrfError) {
        console.warn('Error fetching CSRF token:', csrfError);
      }

      // Fetch organizations
      const organizations = await getVerifiedOrganizations(isAdminUser, false);

      if (organizations && organizations.length > 0) {
        // Process and deduplicate organizations
        const uniqueOrgs: any[] = [];
        const orgIds = new Set();

        organizations.forEach((org) => {
          if (!orgIds.has(org.id)) {
            orgIds.add(org.id);
            uniqueOrgs.push(org);
          }
        });

        // Sort alphabetically by organization name
        uniqueOrgs.sort((a, b) =>
          (a.organizationName || a.name).localeCompare(
            b.organizationName || b.name
          )
        );

        // Update state
        setVerifyingOrgs(uniqueOrgs);

        showToast({
          type: 'success',
          message: `Successfully loaded ${uniqueOrgs.length} organizations`,
          duration: 2000,
        });
      } else {
        setVerifyingOrgs([]);
        showToast({
          type: 'error',
          message: 'No verified organizations available',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error refreshing organizations:', error);
      setOrgLoadError('Failed to load organizations. Please try again.');
      showToast({
        type: 'error',
        message: 'Failed to refresh organizations',
        duration: 3000,
      });
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  // Don't render anything if dialog is closed
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 xs:p-3 sm:p-4">
      <div className="bg-ivory border-2 xs:border-3 sm:border-4 border-deep-moss p-3 xs:p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3 xs:mb-4">
          <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-deep-moss">
            {documentToReupload ? (
              <span className="flex items-center">
                <RefreshCw
                  size={16}
                  className="xs:w-5 xs:h-5 sm:w-6 sm:h-6 mr-1 xs:mr-2"
                />
                Re-upload Document
              </span>
            ) : (
              'Upload Document'
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-soft-sage rounded-full"
            disabled={isUploading}
          >
            <X size={20} className="xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-burnt-sienna bg-opacity-20 p-3 xs:p-4 mb-3 xs:mb-4 border-2 border-deep-moss flex items-start">
            <AlertCircle
              className="text-burnt-sienna mr-2 flex-shrink-0 mt-0.5 xs:mt-1 xs:w-4 xs:h-4 sm:w-5 sm:h-5"
              size={16}
              width="16"
              height="16"
            />
            <p className="text-deep-moss text-xs xs:text-sm">{error}</p>
          </div>
        )}

        {documentToReupload && documentToReupload?.status === 'Rejected' && (
          <div className="bg-soft-sage bg-opacity-50 p-3 xs:p-4 mb-3 xs:mb-4 border-2 border-deep-moss">
            <h3 className="font-bold text-deep-moss mb-1 xs:mb-2 text-sm xs:text-base">
              Re-uploading Rejected Document
            </h3>
            <p className="text-deep-moss text-xs xs:text-sm mb-1 xs:mb-2">
              Your document was rejected. Please make the necessary corrections
              before re-uploading.
            </p>
            {documentToReupload?.rejectionReason && (
              <div className="mt-1 xs:mt-2 p-1.5 xs:p-2 bg-ivory border border-deep-moss">
                <p className="text-xs xs:text-sm font-medium text-deep-moss">
                  Rejection reason:
                </p>
                <p className="text-xs xs:text-sm text-deep-moss">
                  {documentToReupload?.rejectionReason}
                </p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 xs:space-y-4">
          <div>
            <label
              htmlFor="documentName"
              className="block font-bold mb-1 text-deep-moss text-sm xs:text-base"
            >
              Document Name *
            </label>
            <input
              type="text"
              id="documentName"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              className="w-full p-1.5 xs:p-2 border-2 border-deep-moss focus:outline-none focus:border-forest-green text-sm xs:text-base"
              disabled={isUploading}
              required
            />
          </div>

          <div>
            <label
              htmlFor="documentType"
              className="block font-bold mb-1 text-deep-moss text-sm xs:text-base"
            >
              Document Type *
            </label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full p-1.5 xs:p-2 border-2 border-deep-moss focus:outline-none focus:border-forest-green text-sm xs:text-base"
              disabled={isUploading}
              required
            >
              <option value="identity">Identity Document</option>
              <option value="education">Educational Certificate</option>
              <option value="financial">Financial Document</option>
              <option value="medical">Medical Record</option>
              <option value="legal">Legal Document</option>
              <option value="property">Property Document</option>
              <option value="employment">Employment Document</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="verifyingOrg"
                className="block font-bold text-deep-moss text-sm xs:text-base"
              >
                Verifying Organization *
              </label>
              <button
                type="button"
                onClick={handleRefreshOrgs}
                className="text-deep-moss hover:text-forest-green flex items-center text-xs xs:text-sm"
                disabled={isUploading || isLoadingOrgs}
              >
                <RefreshCw
                  size={12}
                  className={`mr-0.5 xs:mr-1 xs:w-3.5 xs:h-3.5 ${
                    isLoadingOrgs ? 'animate-spin' : ''
                  }`}
                />
                {isLoadingOrgs ? 'Refreshing...' : 'Refresh List'}
              </button>
            </div>
            <div className="relative">
              <select
                id="verifyingOrg"
                value={selectedOrganization}
                onChange={(e) => {
                  // Only update if the value actually changed
                  const value = e.target.value;
                  if (value !== selectedOrganization) {
                    setSelectedOrganization(value);
                    // The ref will be updated in the useEffect

                    // Mark that we've manually set the organization
                    hasSetInitialOrgRef.current = true;
                  }
                }}
                className={`w-full p-1.5 xs:p-2 border-2 text-sm xs:text-base ${
                  orgLoadError ? 'border-burnt-sienna' : 'border-deep-moss'
                } focus:outline-none focus:border-forest-green`}
                disabled={isUploading || isLoadingOrgs}
                required
              >
                <option value="" disabled>
                  {isLoadingOrgs
                    ? 'Loading organizations...'
                    : 'Select an organization'}
                </option>
                {!isLoadingOrgs && verifyingOrgs.length === 0 && (
                  <option value="" disabled>
                    {orgLoadError
                      ? 'Error loading organizations'
                      : 'No organizations available'}
                  </option>
                )}
                {verifyingOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.organizationName || org.name}{' '}
                    {org.verificationBadge ? '✓' : ''}
                  </option>
                ))}
              </select>
              {isLoadingOrgs && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="w-3 h-3 xs:w-4 xs:h-4 border-2 border-forest-green border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div className="flex flex-col xs:flex-row justify-between items-start mt-1">
              <p className="text-xs xs:text-sm text-deep-moss mb-1 xs:mb-0">
                Only verified organizations (✓) can verify your documents.
              </p>
              <div className="text-xs xs:text-sm">
                {isLoadingOrgs ? (
                  <span className="text-amber-600">Loading...</span>
                ) : orgLoadError ? (
                  <span className="text-burnt-sienna">{orgLoadError}</span>
                ) : verifyingOrgs.length > 0 ? (
                  <span className="text-forest-green">
                    {verifyingOrgs.length} organizations
                  </span>
                ) : (
                  <span className="text-amber-600">No organizations found</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="documentFile"
              className="block font-bold mb-1 text-deep-moss text-sm xs:text-base"
            >
              Document File *
            </label>
            <div className="border-2 border-dashed border-deep-moss p-2 xs:p-3 sm:p-4 text-center">
              <input
                type="file"
                id="documentFile"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <label
                htmlFor="documentFile"
                className="cursor-pointer block p-2 xs:p-3 sm:p-4 hover:bg-soft-sage transition-colors"
              >
                {selectedFile ? (
                  <div className="text-deep-moss">
                    <p className="font-bold text-sm xs:text-base">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs xs:text-sm">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="text-deep-moss">
                    <Upload className="mx-auto mb-1 xs:mb-2" size={20} />
                    <p className="text-sm xs:text-base">
                      Click to select a file or drag and drop
                    </p>
                    <p className="text-xs xs:text-sm mt-0.5 xs:mt-1">
                      Supported formats: PDF, JPG, PNG
                    </p>
                    <p className="text-xs xs:text-sm mt-0.5 xs:mt-1">
                      Max size: 10MB
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {isUploading && (
            <div className="mt-3 xs:mt-4">
              <p className="text-deep-moss mb-1 font-bold text-sm xs:text-base">
                Uploading: {uploadProgress}%
              </p>
              <div className="w-full bg-soft-sage h-3 xs:h-4 border-2 border-deep-moss relative overflow-hidden">
                <div
                  className="bg-forest-green h-full transition-all duration-300 ease-out flex items-center justify-center"
                  style={{ width: `${uploadProgress}%` }}
                >
                  {uploadProgress > 30 && (
                    <span className="text-[10px] xs:text-xs text-ivory font-bold">
                      {uploadProgress}%
                    </span>
                  )}
                </div>
                {/* Animated document icon */}
                {uploadProgress < 100 && (
                  <div
                    className="absolute top-0 h-full aspect-square bg-forest-green border-r-2 border-deep-moss flex items-center justify-center animate-pulse"
                    style={{
                      left: `${Math.min(Math.max(uploadProgress - 5, 0), 95)}%`,
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-ivory xs:w-3 xs:h-3"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs xs:text-sm text-deep-moss mt-1 xs:mt-2 font-medium">
                {uploadProgress < 30
                  ? 'Starting upload...'
                  : uploadProgress < 90
                  ? 'Uploading document to secure storage...'
                  : uploadProgress < 100
                  ? 'Almost there...'
                  : 'Processing document and creating blockchain record...'}
              </p>
              <p className="text-[10px] xs:text-xs text-deep-moss mt-0.5 xs:mt-1 italic">
                {uploadProgress === 100 &&
                  'This may take a moment as we securely anchor your document on the blockchain.'}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 xs:space-x-3 pt-3 xs:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 border-2 border-deep-moss hover:bg-soft-sage transition-colors font-bold text-xs xs:text-sm sm:text-base min-h-[36px]"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 bg-forest-green text-ivory border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all font-bold text-xs xs:text-sm sm:text-base min-h-[36px]"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
