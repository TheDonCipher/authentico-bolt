/**
 * Secure Document Upload Hook
 *
 * This hook provides a secure way to upload documents with progress tracking,
 * error handling, and validation.
 */

import { useState, useCallback } from 'react';
import { getAuthToken } from '../token-util';
import axios from 'axios';
import { validateFileType, validateFileSize } from '../validation-util';
import { getTokenFromCookie } from '../csrf-protection';

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface UploadOptions {
  onProgress?: (progress: number) => void;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
  documentId: string | null;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Hook for secure document upload
 * @returns Object with upload function and state
 */
export function useSecureDocumentUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
    documentId: null,
  });

  /**
   * Validate file before upload
   * @param file File to validate
   * @returns Validation result
   */
  const validateFile = useCallback((file: File): ValidationResult => {
    // Check if file exists
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    // Validate file size
    if (!validateFileSize(file)) {
      return {
        valid: false,
        error: `File size exceeds 10MB limit. Current size: ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB`,
      };
    }

    // Validate file type
    if (!validateFileType(file)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload PDF, JPEG, or PNG files only.',
      };
    }

    return { valid: true };
  }, []);

  /**
   * Upload a document securely
   * @param file File to upload
   * @param documentName Name of the document
   * @param documentType Type of the document
   * @param verifyingOrgId ID of the verifying organization
   * @param options Upload options
   */
  const uploadDocument = useCallback(
    async (
      file: File,
      documentName: string,
      documentType: string,
      verifyingOrgId: string,
      options?: UploadOptions
    ) => {
      try {
        // Reset state
        setUploadState({
          isUploading: true,
          progress: 0,
          error: null,
          success: false,
          documentId: null,
        });

        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
          setUploadState((prev) => ({
            ...prev,
            isUploading: false,
            error: validation.error || 'Invalid file',
          }));

          if (options?.onError) {
            options.onError(new Error(validation.error || 'Invalid file'));
          }

          return;
        }

        // Validate other inputs
        if (!documentName || documentName.trim() === '') {
          setUploadState((prev) => ({
            ...prev,
            isUploading: false,
            error: 'Document name is required',
          }));

          if (options?.onError) {
            options.onError(new Error('Document name is required'));
          }

          return;
        }

        if (!documentType) {
          setUploadState((prev) => ({
            ...prev,
            isUploading: false,
            error: 'Document type is required',
          }));

          if (options?.onError) {
            options.onError(new Error('Document type is required'));
          }

          return;
        }

        if (!verifyingOrgId) {
          setUploadState((prev) => ({
            ...prev,
            isUploading: false,
            error: 'Verifying organization is required',
          }));

          if (options?.onError) {
            options.onError(new Error('Verifying organization is required'));
          }

          return;
        }

        // Get auth token
        const token = await getAuthToken();
        if (!token) {
          setUploadState((prev) => ({
            ...prev,
            isUploading: false,
            error: 'Authentication failed. Please sign in again.',
          }));

          if (options?.onError) {
            options.onError(new Error('Authentication failed'));
          }

          return;
        }

        // Create form data
        const formData = new FormData();
        formData.append('document_file', file);
        formData.append('documentName', documentName);
        formData.append('documentType', documentType);
        formData.append('verifyingOrgId', verifyingOrgId);

        // Get CSRF token from cookie
        const csrfToken = getTokenFromCookie();

        // If no CSRF token is found, try to fetch a new one
        if (!csrfToken) {
          console.log('No CSRF token found, fetching a new one...');
          try {
            // Try to fetch a new CSRF token
            const csrfResponse = await fetch('/api/auth/csrf-token', {
              method: 'GET',
              credentials: 'include', // Include cookies in the request
            });

            if (csrfResponse.ok) {
              console.log('Successfully fetched new CSRF token');

              // Wait a moment for the cookie to be set
              await new Promise((resolve) => setTimeout(resolve, 500));
            } else {
              console.error(
                'Failed to fetch new CSRF token:',
                await csrfResponse.text()
              );
            }
          } catch (csrfError) {
            console.error('Error fetching CSRF token:', csrfError);
          }
        }

        // Get the updated CSRF token
        const updatedCsrfToken = getTokenFromCookie();

        // Add CSRF token to form data as a fallback
        if (updatedCsrfToken) {
          formData.append('_csrf', updatedCsrfToken);
        }

        // Upload document
        const response = await axios.post(
          `${API_URL}/secure/documents/upload`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
              'X-XSRF-TOKEN': updatedCsrfToken || '', // Add CSRF token to headers
            },
            withCredentials: true,
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );

                setUploadState((prev) => ({
                  ...prev,
                  progress: percentCompleted,
                }));

                if (options?.onProgress) {
                  options.onProgress(percentCompleted);
                }
              }
            },
          }
        );

        // Handle success
        setUploadState({
          isUploading: false,
          progress: 100,
          error: null,
          success: true,
          documentId: response.data.documentId || null,
        });

        if (options?.onSuccess) {
          options.onSuccess(response.data);
        }

        return response.data;
      } catch (error: any) {
        console.error('Document upload error:', error);

        // Check if the error is related to CSRF token validation
        if (error.response?.data?.error === 'CSRF token validation failed') {
          console.log(
            'CSRF token validation failed, trying to refresh token...'
          );

          try {
            // Fetch a new CSRF token
            const csrfResponse = await fetch('/api/auth/csrf-token', {
              method: 'GET',
              credentials: 'include',
            });

            if (csrfResponse.ok) {
              console.log(
                'Successfully refreshed CSRF token, retrying upload...'
              );

              // Wait a moment for the cookie to be set
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Get the new CSRF token
              const newCsrfToken = getTokenFromCookie();

              if (newCsrfToken) {
                // Get a fresh auth token
                const retryToken = await getAuthToken();
                if (!retryToken) {
                  throw new Error('Authentication failed during retry');
                }

                // Create a new form data for retry
                const retryFormData = new FormData();
                retryFormData.append('document_file', file);
                retryFormData.append('documentName', documentName);
                retryFormData.append('documentType', documentType);
                retryFormData.append('verifyingOrgId', verifyingOrgId);
                retryFormData.append('_csrf', newCsrfToken);

                // Retry the request
                try {
                  const retryResponse = await axios.post(
                    `${API_URL}/secure/documents/upload`,
                    retryFormData,
                    {
                      headers: {
                        Authorization: `Bearer ${retryToken}`,
                        'Content-Type': 'multipart/form-data',
                        'X-XSRF-TOKEN': newCsrfToken,
                      },
                      withCredentials: true,
                      onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                          const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                          );

                          setUploadState((prev) => ({
                            ...prev,
                            progress: percentCompleted,
                          }));

                          if (options?.onProgress) {
                            options.onProgress(percentCompleted);
                          }
                        }
                      },
                    }
                  );

                  // Handle success
                  setUploadState({
                    isUploading: false,
                    progress: 100,
                    error: null,
                    success: true,
                    documentId: retryResponse.data.documentId || null,
                  });

                  if (options?.onSuccess) {
                    options.onSuccess(retryResponse.data);
                  }

                  return retryResponse.data;
                } catch (retryError) {
                  // If retry fails, handle the error normally
                  console.error('Retry upload failed:', retryError);
                  throw retryError;
                }
              }
            }
          } catch (csrfError) {
            console.error('Error refreshing CSRF token:', csrfError);
          }
        }

        // Extract error message
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'An error occurred during document upload';

        // Update state
        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          error: errorMessage,
          success: false,
        }));

        if (options?.onError) {
          options.onError(new Error(errorMessage));
        }
      }
    },
    [validateFile]
  );

  return {
    uploadDocument,
    ...uploadState,
    resetUploadState: () =>
      setUploadState({
        isUploading: false,
        progress: 0,
        error: null,
        success: false,
        documentId: null,
      }),
  };
}

export default useSecureDocumentUpload;
