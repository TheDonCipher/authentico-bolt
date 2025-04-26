'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getVerifiedOrganizations } from '../../../lib/api-client';
import useSecureDocumentUpload from '../../../lib/hooks/useSecureDocumentUpload';
import { useToast } from '../../components/ui/ToastProvider';

interface SecureDocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const documentTypes = [
  { id: 'identity', name: 'Identity Document' },
  { id: 'financial', name: 'Financial Document' },
  { id: 'educational', name: 'Educational Certificate' },
  { id: 'medical', name: 'Medical Record' },
  { id: 'legal', name: 'Legal Document' },
  { id: 'property', name: 'Property Document' },
  { id: 'other', name: 'Other Document' },
];

export const SecureDocumentUpload: React.FC<SecureDocumentUploadProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Form state
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('identity');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [verifyingOrgs, setVerifyingOrgs] = useState<any[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState('');
  
  // Secure upload hook
  const {
    uploadDocument,
    isUploading,
    progress,
    error,
    success,
    documentId,
    resetUploadState,
  } = useSecureDocumentUpload();

  // Fetch verified organizations on component mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const orgs = await getVerifiedOrganizations();
        setVerifyingOrgs(orgs);
        
        // Set default organization if available
        if (orgs.length > 0 && !selectedOrganization) {
          setSelectedOrganization(orgs[0].id);
        }
      } catch (error) {
        console.error('Error fetching verified organizations:', error);
        showToast({
          type: 'error',
          message: 'Failed to load verified organizations',
        });
      }
    };

    if (isOpen) {
      fetchOrganizations();
    }
  }, [isOpen, selectedOrganization, showToast]);

  // Reset form when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      setDocumentName('');
      setDocumentType('identity');
      setSelectedFile(null);
      setSelectedOrganization('');
      resetUploadState();
    }
  }, [isOpen, resetUploadState]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
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
    
    if (!selectedFile) {
      showToast({
        type: 'error',
        message: 'Please select a file to upload',
      });
      return;
    }
    
    try {
      await uploadDocument(
        selectedFile,
        documentName,
        documentType,
        selectedOrganization,
        {
          onProgress: (progress) => {
            console.log(`Upload progress: ${progress}%`);
          },
          onSuccess: (data) => {
            showToast({
              type: 'success',
              message: 'Document uploaded successfully!',
            });
            onSuccess();
          },
          onError: (error) => {
            showToast({
              type: 'error',
              message: error.message,
            });
          },
        }
      );
    } catch (error) {
      console.error('Error in document upload:', error);
    }
  };

  // If dialog is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-ivory border-4 border-deep-moss p-6 max-w-md w-full max-h-[90vh] overflow-y-auto rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-deep-moss">Secure Document Upload</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-soft-sage rounded-full"
            disabled={isUploading}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded flex items-start">
            <AlertCircle className="mr-2 flex-shrink-0 mt-1" size={16} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-bold mb-2">Upload Successful!</h3>
            <p className="mb-4">Your document has been securely uploaded and is pending verification.</p>
            <p className="text-sm text-gray-600 mb-6">Document ID: {documentId}</p>
            <button
              onClick={onClose}
              className="bg-deep-moss text-white py-2 px-4 rounded hover:bg-opacity-90 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="documentName" className="block font-bold mb-1 text-deep-moss">
                Document Name *
              </label>
              <input
                type="text"
                id="documentName"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                className="w-full p-2 border-2 border-deep-moss rounded"
                disabled={isUploading}
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="documentType" className="block font-bold mb-1 text-deep-moss">
                Document Type *
              </label>
              <select
                id="documentType"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full p-2 border-2 border-deep-moss rounded"
                disabled={isUploading}
                required
              >
                {documentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="verifyingOrg" className="block font-bold mb-1 text-deep-moss">
                Verifying Organization *
              </label>
              <select
                id="verifyingOrg"
                value={selectedOrganization}
                onChange={(e) => setSelectedOrganization(e.target.value)}
                className="w-full p-2 border-2 border-deep-moss rounded"
                disabled={isUploading || verifyingOrgs.length === 0}
                required
              >
                {verifyingOrgs.length === 0 ? (
                  <option value="">No verified organizations available</option>
                ) : (
                  <>
                    <option value="">Select an organization</option>
                    {verifyingOrgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {verifyingOrgs.length === 0 && (
                <p className="text-sm text-red-600 mt-1">
                  No verified organizations available. Please try again later.
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="documentFile" className="block font-bold mb-1 text-deep-moss">
                Document File *
              </label>
              <div className="border-2 border-dashed border-deep-moss p-4 text-center">
                <input
                  type="file"
                  id="documentFile"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label
                  htmlFor="documentFile"
                  className="cursor-pointer block p-4 hover:bg-soft-sage transition-colors"
                >
                  {selectedFile ? (
                    <div className="text-deep-moss">
                      <FileText className="mx-auto mb-2" size={24} />
                      <p className="font-bold">{selectedFile.name}</p>
                      <p className="text-sm">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-deep-moss">
                      <Upload className="mx-auto mb-2" size={24} />
                      <p>Click to select a file or drag and drop</p>
                      <p className="text-sm mt-1">PDF, JPEG, or PNG (max 10MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {isUploading && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-deep-moss h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-center mt-1">{progress}% Uploaded</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border-2 border-deep-moss text-deep-moss rounded hover:bg-soft-sage transition-colors"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-deep-moss text-white rounded hover:bg-opacity-90 transition-colors flex items-center"
                disabled={isUploading || !selectedFile || !selectedOrganization}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2" size={16} />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SecureDocumentUpload;
