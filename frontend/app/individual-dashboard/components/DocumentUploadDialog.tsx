'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { getAuthToken } from '../../../lib/token-util';
import {
  getVerifiedOrganizations,
  uploadDocument,
} from '../../../lib/api-client';
import { getDocumentTypeName } from '../../constants/documentTypes';

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DocumentUploadDialog = ({
  isOpen,
  onClose,
  onSuccess,
}: DocumentUploadDialogProps) => {
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('identity');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [verifyingOrgs, setVerifyingOrgs] = useState<any[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Reset form when dialog opens
    if (isOpen) {
      setDocumentName('');
      setDocumentType('identity');
      setSelectedFile(null);
      setSelectedOrganization('');
      setError(null);
      setUploadProgress(0);
      fetchVerifyingOrganizations();
    }
  }, [isOpen]);

  const fetchVerifyingOrganizations = async () => {
    try {
      // Use the getVerifiedOrganizations function from api-client
      // which handles token management internally
      const organizations = await getVerifiedOrganizations();

      // Only log in development environment
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetched ${organizations.length} verifying organizations`);
      }

      // Ensure we have unique organizations by ID
      const uniqueOrgs = [];
      const orgIds = new Set();

      organizations.forEach((org) => {
        if (!orgIds.has(org.id)) {
          orgIds.add(org.id);
          uniqueOrgs.push(org);
        }
      });

      // Only update state if we have new data
      if (
        uniqueOrgs.length !== verifyingOrgs.length ||
        uniqueOrgs.some((org) => !verifyingOrgs.find((o) => o.id === org.id))
      ) {
        setVerifyingOrgs(uniqueOrgs);

        // If there are organizations, select the first one by default
        if (uniqueOrgs.length > 0 && !selectedOrganization) {
          setSelectedOrganization(uniqueOrgs[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching verifying organizations:', error);
      setError('Failed to load verifying organizations. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        return;
      }

      setSelectedFile(file);
      setError(null);

      // Auto-fill document name from filename if empty
      if (!documentName) {
        const fileName = file.name.split('.')[0];
        setDocumentName(fileName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!documentName.trim()) {
      setError('Please enter a document name');
      return;
    }

    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!selectedOrganization) {
      setError('Please select a verifying organization');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create a new FormData object
      const formData = new FormData();

      // Add the file with proper name and type
      const fileExtension = selectedFile.name.split('.').pop() || '';
      const safeFileName = `${documentName.replace(
        /[^a-z0-9]/gi,
        '_'
      )}.${fileExtension}`;

      // Create a new File object with the correct name and type
      // Use the original file's content type or default to a safe type
      const fileType = selectedFile.type || 'application/octet-stream';
      const fileWithProperName = new File([selectedFile], safeFileName, {
        type: fileType,
      });

      // Append the file with the exact field name expected by the backend
      formData.append('document_file', fileWithProperName);

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `Attaching file: ${fileWithProperName.name} (${fileWithProperName.size} bytes, ${fileWithProperName.type})`
        );
      }

      // Append other form fields
      formData.append('documentName', documentName);
      formData.append('documentType', documentType);
      formData.append('verifyingOrgId', selectedOrganization);

      // Validate form data before sending
      if (!formData.has('document_file')) {
        throw new Error('File not properly attached to form data');
      }

      // Verify the file is accessible in the form data
      const fileEntry = formData.get('document_file');
      if (!(fileEntry instanceof File)) {
        throw new Error('File entry is not a valid File object');
      }

      // Verify file size is within limits
      if (fileEntry.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Verify file type is acceptable
      const acceptableTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
      ];
      if (!acceptableTypes.includes(fileEntry.type)) {
        console.warn(
          `File type ${fileEntry.type} may not be supported by the backend`
        );
      }

      // Log form data for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Form data entries:');
        for (const pair of formData.entries()) {
          console.log(
            `- ${pair[0]}: ${
              pair[1] instanceof File
                ? `File: ${pair[1].name} (${pair[1].size} bytes, ${pair[1].type})`
                : pair[1]
            }`
          );
        }
      }

      // Use the uploadDocument function from api-client.js which is specifically designed for file uploads
      const response = await uploadDocument(formData, (percentCompleted) => {
        setUploadProgress(percentCompleted);
      });

      // Ensure we maintain authentication state
      const currentUser = user;

      // Call success callback and close dialog
      onSuccess();
      onClose();

      // Verify authentication state is maintained
      if (!user && currentUser) {
        console.error('Authentication state lost after document upload');
        // Attempt to restore session
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Document upload error in component:', error.message);
      setError(
        error.response?.data?.message ||
          error.message ||
          'Failed to upload document. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-ivory border-4 border-deep-moss p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-deep-moss">Upload Document</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-soft-sage rounded-full"
            disabled={isUploading}
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-burnt-sienna bg-opacity-20 p-4 mb-4 border-2 border-deep-moss flex items-start">
            <AlertCircle
              className="text-burnt-sienna mr-2 flex-shrink-0 mt-1"
              size={18}
            />
            <p className="text-deep-moss">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="documentName"
              className="block font-bold mb-1 text-deep-moss"
            >
              Document Name *
            </label>
            <input
              type="text"
              id="documentName"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              className="w-full p-2 border-2 border-deep-moss focus:outline-none focus:border-forest-green"
              disabled={isUploading}
              required
            />
          </div>

          <div>
            <label
              htmlFor="documentType"
              className="block font-bold mb-1 text-deep-moss"
            >
              Document Type *
            </label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full p-2 border-2 border-deep-moss focus:outline-none focus:border-forest-green"
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
            <label
              htmlFor="verifyingOrg"
              className="block font-bold mb-1 text-deep-moss"
            >
              Verifying Organization *
            </label>
            <select
              id="verifyingOrg"
              value={selectedOrganization}
              onChange={(e) => setSelectedOrganization(e.target.value)}
              className="w-full p-2 border-2 border-deep-moss focus:outline-none focus:border-forest-green"
              disabled={isUploading}
              required
            >
              <option value="" disabled>
                Select an organization
              </option>
              {verifyingOrgs.length === 0 && (
                <option value="" disabled>
                  Loading organizations...
                </option>
              )}
              {verifyingOrgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="documentFile"
              className="block font-bold mb-1 text-deep-moss"
            >
              Document File *
            </label>
            <div className="border-2 border-dashed border-deep-moss p-4 text-center">
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
                className="cursor-pointer block p-4 hover:bg-soft-sage transition-colors"
              >
                {selectedFile ? (
                  <div className="text-deep-moss">
                    <p className="font-bold">{selectedFile.name}</p>
                    <p className="text-sm">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="text-deep-moss">
                    <Upload className="mx-auto mb-2" size={24} />
                    <p>Click to select a file or drag and drop</p>
                    <p className="text-sm mt-1">
                      Supported formats: PDF, JPG, PNG, DOC, DOCX
                    </p>
                    <p className="text-sm mt-1">Max size: 10MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {isUploading && (
            <div className="mt-4">
              <p className="text-deep-moss mb-1 font-bold">
                Uploading: {uploadProgress}%
              </p>
              <div className="w-full bg-soft-sage h-2 border border-deep-moss">
                <div
                  className="bg-forest-green h-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-deep-moss mt-1">
                {uploadProgress < 100
                  ? 'Uploading document...'
                  : 'Processing document...'}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-deep-moss hover:bg-soft-sage transition-colors font-bold"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-forest-green text-ivory border-2 border-deep-moss hover:shadow-[2px_2px_0px_0px_rgba(27,67,50,0.8)] transition-all font-bold"
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
