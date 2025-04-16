/**
 * API Client with automatic token management
 */
import axios from 'axios';
import { getAuthToken } from './token-util';
import { auth } from './firebase';

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
    // Get the auth token directly - ensure we have a fresh ID token
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Force refresh to get a fresh ID token
    const token = await currentUser.getIdToken(true);

    // Create headers with only the Authorization header
    // Let Axios automatically set the Content-Type for FormData
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    // Upload the document
    // Use axios directly instead of apiClient to avoid any middleware interference
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || '/api'}/documents/upload`,
      formData,
      {
        headers,
        // Important: These settings help with large file uploads
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        // Don't transform the request data
        transformRequest: [(data) => data],
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 100)
            );
            onProgress(percentCompleted);
          }
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Document upload error:', error);
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
    console.log('Fetching verified organizations...');

    // Use the apiClient which already handles token management
    const response = await apiClient.get('/organizations/verified');

    console.log('API response data:', response.data);

    if (!Array.isArray(response.data)) {
      console.warn('Response is not an array:', response.data);
      return [];
    }

    // Validate and sanitize each organization object
    const validatedOrgs = response.data
      .map((org) => {
        // Ensure each organization has required fields
        if (!org.id) {
          console.warn('Organization missing ID:', org);
          return null;
        }

        // Ensure name is present, use a default if not
        if (!org.name) {
          console.warn(`Organization ${org.id} missing name:`, org);
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

    console.log('Validated organizations:', validatedOrgs);
    return validatedOrgs;
  } catch (error) {
    console.error('Error fetching verified organizations:', error);

    // In development, return fallback data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using fallback organization data in development');
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
