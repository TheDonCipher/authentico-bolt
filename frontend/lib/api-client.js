/**
 * API Client with automatic token management
 */
import axios from 'axios';
import { getAuthToken } from './token-util';

// Create a custom axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000, // 30 seconds
  // Don't set default Content-Type to allow axios to set the correct one based on the request
  // This is especially important for multipart/form-data requests
});

// Add a request interceptor to automatically add the auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get the auth token
    const token = await getAuthToken();

    // If we have a token, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an expired token and we haven't already tried to refresh it
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to get a fresh token
        const token = await getAuthToken();

        if (token) {
          // Update the request with the new token
          originalRequest.headers.Authorization = `Bearer ${token}`;

          // Retry the request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Upload a document with progress tracking
 * @param {FormData} formData - The form data with the document and metadata
 * @param {Function} onProgress - Callback function for upload progress
 * @returns {Promise<Object>} - The response data
 */
export const uploadDocument = async (formData, onProgress) => {
  try {
    // Only log in development environment
    if (process.env.NODE_ENV === 'development') {
      console.log('FormData entries:');
      for (const pair of formData.entries()) {
        console.log(
          `- ${pair[0]}: ${
            pair[1] instanceof File
              ? `File: ${pair[1].name} (${pair[1].size} bytes)`
              : pair[1]
          }`
        );
      }
    }

    // Validate form data
    if (!formData.has('document_file')) {
      throw new Error('Missing document file in form data');
    }

    // Use the getAuthToken function which handles token retrieval
    const token = await getAuthToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    // Create a new FormData object to ensure proper formatting
    const cleanFormData = new FormData();

    // Copy all entries from the original formData to the new one
    for (const [key, value] of formData.entries()) {
      // Make sure we're using the exact field name expected by the backend
      if (key === 'document_file' && value instanceof File) {
        // Ensure the file has a name and type
        // Create a new File object with proper name and type to ensure consistency
        const fileType = value.type || 'application/octet-stream';
        const fileName = value.name || 'document.pdf';

        // Log file details for debugging
        console.log(
          `Processing file: ${fileName} (${value.size} bytes, ${fileType})`
        );

        try {
          cleanFormData.append('document_file', value, fileName);
        } catch (fileError) {
          console.error('Error appending file to FormData:', fileError);
          throw new Error(`Failed to process file: ${fileError.message}`);
        }
      } else {
        try {
          // Convert empty strings to default values for required fields
          if (key === 'documentType' && (!value || value === '')) {
            cleanFormData.append(key, 'identity');
          } else if (key === 'documentName' && (!value || value === '')) {
            cleanFormData.append(key, 'Unnamed Document');
          } else {
            cleanFormData.append(key, value);
          }
        } catch (fieldError) {
          console.error(
            `Error appending field ${key} to FormData:`,
            fieldError
          );
          throw new Error(
            `Failed to process field ${key}: ${fieldError.message}`
          );
        }
      }
    }

    // Create headers with only the Authorization header
    // Let Axios automatically set the Content-Type for FormData
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    // Upload the document
    // Use axios directly instead of apiClient to avoid any middleware interference
    const response = await axios.post('/api/documents/upload', cleanFormData, {
      headers,
      // Important: These settings help with large file uploads
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      // Don't set transformRequest - let axios handle FormData properly
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          if (process.env.NODE_ENV === 'development') {
            console.log(`Upload progress: ${percentCompleted}%`);
          }
          onProgress(percentCompleted);
        }
      },
      // Set a longer timeout for uploads
      timeout: 120000, // 120 seconds (increased timeout)
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Document upload API response:', response.data);
    }
    return response.data;
  } catch (error) {
    // Enhanced error logging
    if (error.response) {
      console.error(
        `Document upload failed with status: ${error.response.status}`,
        error.response.data
      );
    } else {
      console.error('Document upload error:', error.message || 'Unknown error');
    }
    throw error;
  }
};

/**
 * Get user documents
 * @returns {Promise<Array>} - The user's documents
 */
export const getUserDocuments = async () => {
  try {
    const response = await apiClient.get('/documents');
    return response.data;
  } catch (error) {
    console.error('Error fetching user documents:', error);
    throw error;
  }
};

/**
 * Get document details
 * @param {string} documentId - The document ID
 * @returns {Promise<Object>} - The document details
 */
export const getDocumentDetails = async (documentId) => {
  try {
    const response = await apiClient.get(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching document ${documentId}:`, error);
    throw error;
  }
};

/**
 * Get all document types
 * @returns {Promise<Array>} - Array of document types
 */
export const getDocumentTypes = async () => {
  try {
    const response = await apiClient.get('/documents/types');
    return response.data;
  } catch (error) {
    console.error('Error fetching document types:', error);
    throw error;
  }
};

/**
 * Get verified organizations
 * @returns {Promise<Array>} - Array of verified organizations
 */
export const getVerifiedOrganizations = async () => {
  try {
    // Use the apiClient which already handles token management
    const response = await apiClient.get('/organizations/verified');

    if (!Array.isArray(response.data)) {
      return [];
    }

    // Log the number of verified organizations found
    console.log(`Found ${response.data.length} verified organizations`);

    // Validate and sanitize each organization object
    const validatedOrgs = response.data
      .map((org) => {
        // Ensure each organization has required fields
        if (!org.id) {
          return null;
        }

        // Ensure name is present, use a default if not
        if (!org.name) {
          org.name = 'Unnamed Organization';
        }

        return {
          id: org.id,
          name: org.name,
          website: org.website || null,
          description: org.description || null,
          verificationBadge: org.verificationBadge || false,
          documentTypes: Array.isArray(org.documentTypes)
            ? org.documentTypes
            : [],
          industry: org.industry || null,
          phoneNumber: org.phoneNumber || null,
        };
      })
      .filter((org) => org !== null); // Remove any null entries

    return validatedOrgs;
  } catch (error) {
    // In development, return fallback data
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          id: 'org1',
          name: 'Example Organization 1',
          website: 'https://example.org',
          description: 'Example verified organization for testing',
          verificationBadge: true,
          documentTypes: ['identity', 'education'],
          industry: 'Education',
        },
        {
          id: 'org2',
          name: 'Example Organization 2',
          website: 'https://example2.org',
          description: 'Another example organization',
          verificationBadge: true,
          documentTypes: ['financial', 'legal'],
          industry: 'Financial Services',
        },
      ];
    }

    throw error;
  }
};

export default apiClient;
