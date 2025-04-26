/**
 * API Client with automatic token management, CSRF protection, and rate limiting
 */
import { getAuthToken } from './token-util';
import secureApiClient from './secure-api-client';
import { createError, handleError } from './error-handler';
import {
  validateDocumentUpload,
  validateFileType,
  validateFileSize,
} from './validation-util';

// Cache for verified organizations
let organizationsCache = {
  regular: {
    data: [],
    timestamp: 0,
  },
  admin: {
    data: [],
    timestamp: 0,
  },
};

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Get cached organizations
 * @param {boolean} isAdmin - Whether to get admin organizations
 * @returns {Array|null} - Cached organizations or null if cache is expired
 */
function getCachedOrganizations(isAdmin = false) {
  const cacheKey = isAdmin ? 'admin' : 'regular';
  const cache = organizationsCache[cacheKey];

  // Check if cache is valid
  if (
    cache.data.length > 0 &&
    Date.now() - cache.timestamp < CACHE_EXPIRATION
  ) {
    return cache.data;
  }

  return null;
}

/**
 * Cache organizations
 * @param {Array} organizations - Organizations to cache
 * @param {boolean} isAdmin - Whether these are admin organizations
 */
function cacheOrganizations(organizations, isAdmin = false) {
  if (!organizations || !Array.isArray(organizations)) {
    console.warn('Attempted to cache invalid organizations data');
    return;
  }

  const cacheKey = isAdmin ? 'admin' : 'regular';

  organizationsCache[cacheKey] = {
    data: organizations,
    timestamp: Date.now(),
  };

  console.log(`Cached ${organizations.length} ${cacheKey} organizations`);
}

/**
 * Upload a document with progress tracking
 * @param {FormData} formData - The form data with the document and metadata
 * @param {Function} onProgress - Callback function for upload progress
 * @param {Object} customHeaders - Optional custom headers to include in the request
 * @returns {Promise<Object>} - The response data
 */
export const uploadDocument = async (
  formData,
  onProgress,
  customHeaders = {}
) => {
  try {
    // Only log in development environment
    if (process.env.NODE_ENV === 'development') {
      console.log('FormData entries:');
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

    // Get the file from the form data
    const file = formData.get('document_file');
    const documentName = formData.get('documentName');
    const documentType = formData.get('documentType');
    const verifyingOrgId = formData.get('verifyingOrgId');

    // Validate form data
    if (!file || !(file instanceof File)) {
      throw createError(
        'VALIDATION_ERROR',
        'Missing document file in form data'
      );
    }

    // Validate file size and type
    if (!validateFileSize(file)) {
      throw createError('FILE_TOO_LARGE', 'File size exceeds 10MB limit');
    }

    if (!validateFileType(file)) {
      throw createError(
        'INVALID_FILE_TYPE',
        'Invalid file type. Please upload PDF, JPEG, or PNG files only.'
      );
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
          throw createError(
            'DOCUMENT_UPLOAD_FAILED',
            `Failed to process file: ${fileError.message}`
          );
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
          throw createError(
            'VALIDATION_ERROR',
            `Failed to process field ${key}: ${fieldError.message}`
          );
        }
      }
    }

    // Get CSRF token from cookie
    const getCsrfToken = () => {
      try {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'XSRF-TOKEN') {
            return value;
          }
        }
        return null;
      } catch (error) {
        console.error('Error getting CSRF token from cookie:', error);
        return null;
      }
    };

    // Get the CSRF token
    const csrfToken = getCsrfToken();
    console.log(
      'CSRF token for document upload:',
      csrfToken ? 'Found' : 'Not found'
    );

    // Add CSRF token to form data as a fallback
    if (csrfToken) {
      cleanFormData.append('_csrf', csrfToken);
      console.log('Added CSRF token to form data');

      // Add to custom headers if not already present
      if (!customHeaders['X-XSRF-TOKEN'] && !customHeaders['x-xsrf-token']) {
        customHeaders['X-XSRF-TOKEN'] = csrfToken;
        customHeaders['x-xsrf-token'] = csrfToken;
        console.log('Added CSRF token to custom headers');
      }
    }

    // If no CSRF token is found, try to refresh it
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

          // Try to get the token again
          const newCsrfToken = getCsrfToken();
          if (newCsrfToken) {
            console.log('Successfully retrieved new CSRF token after fetch');
            cleanFormData.append('_csrf', newCsrfToken);
            console.log('Added new CSRF token to form data');

            // Add to custom headers
            customHeaders['X-XSRF-TOKEN'] = newCsrfToken;
            customHeaders['x-xsrf-token'] = newCsrfToken;
            console.log('Added new CSRF token to custom headers');
          }
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

    // Use the secure API client to upload the file with explicit CSRF token
    console.log('Using custom headers for upload:', customHeaders);
    const response = await secureApiClient.uploadFile(
      '/api/documents/upload',
      cleanFormData,
      onProgress,
      customHeaders
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('Document upload API response:', response);
    }
    return response;
  } catch (error) {
    // Enhanced error handling
    console.error('Document upload error:', error);
    handleError(error, 'Document Upload');
    throw error;
  }
};

/**
 * Get user documents
 * @returns {Promise<Array>} - The user's documents
 */
export const getUserDocuments = async () => {
  try {
    return await secureApiClient.get('/api/documents');
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
    // Validate document ID
    if (!documentId || typeof documentId !== 'string') {
      throw createError('VALIDATION_ERROR', 'Invalid document ID');
    }

    return await secureApiClient.get(`/api/documents/${documentId}`);
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
    return await secureApiClient.get('/api/documents/types');
  } catch (error) {
    console.error('Error fetching document types:', error);
    throw error;
  }
};

/**
 * Get verified organizations
 * @param {boolean} isAdmin - Whether to use the admin endpoint
 * @param {boolean} useDirectFirestore - Whether to bypass API and use Firestore directly
 * @returns {Promise<Array>} - Array of verified organizations
 */
export const getVerifiedOrganizations = async (
  isAdmin = false,
  useDirectFirestore = false
) => {
  try {
    console.log('Fetching verified organizations...');

    // Always check for cached organizations first
    const cachedOrgs = getCachedOrganizations(isAdmin);
    if (cachedOrgs && cachedOrgs.length > 0 && !useDirectFirestore) {
      console.log(`Using ${cachedOrgs.length} cached organizations`);
      return cachedOrgs;
    }

    // Prioritize API endpoints over direct Firestore access to maintain authentication state
    // Only use direct Firestore as a last resort or if explicitly requested
    if (!useDirectFirestore) {
      // Determine which endpoint to use based on user role
      const endpoint = isAdmin
        ? '/api/admin/verified-organizations'
        : '/api/organizations/verified';

      console.log(
        `Using endpoint: ${endpoint} for ${isAdmin ? 'admin' : 'regular'} user`
      );

      try {
        // Ensure we have a valid CSRF token before making the request
        try {
          // Fetch a fresh CSRF token
          console.log(
            'Fetching fresh CSRF token before organization request...'
          );
          const csrfResponse = await fetch('/api/auth/csrf-token', {
            method: 'GET',
            credentials: 'include', // Include cookies in the request
          });

          if (!csrfResponse.ok) {
            console.warn(
              'Failed to fetch fresh CSRF token before organization request, proceeding anyway'
            );
          } else {
            console.log(
              'Successfully fetched fresh CSRF token before organization request'
            );
            // Wait a moment for the cookie to be set
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        } catch (csrfError) {
          console.warn(
            'Error fetching CSRF token before organization request:',
            csrfError
          );
          // Continue with the request anyway
        }

        // Use the secure API client with explicit headers and increased timeout
        const response = await secureApiClient.get(endpoint, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 20000, // 20 second timeout for better reliability
        });

        // Handle different response formats
        let organizationsData = [];

        if (Array.isArray(response)) {
          organizationsData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          organizationsData = response.data;
        } else if (response && typeof response === 'object') {
          // Try to extract data if it's an object but not in the expected format
          organizationsData = response;
        }

        console.log(
          `Found ${organizationsData.length} verified organizations from API endpoint`
        );

        // Process and cache the results
        const processedOrgs = processOrganizationData(organizationsData);

        // Only cache if we have data
        if (processedOrgs && processedOrgs.length > 0) {
          cacheOrganizations(processedOrgs, isAdmin);
          console.log(
            `Cached ${processedOrgs.length} organizations for future use`
          );
        }

        return processedOrgs;
      } catch (apiError) {
        console.error('Error with API endpoint:', apiError);

        // Check if it's a network error
        const isNetworkError =
          apiError.isNetworkError ||
          (apiError.message &&
            (apiError.message.includes('Network Error') ||
              apiError.message.includes('network') ||
              apiError.message.includes('timeout') ||
              !navigator.onLine));

        if (isNetworkError) {
          console.warn(
            'Network error detected, falling back to cached data or Firestore'
          );
        } else {
          console.error('API error details:', apiError.message);

          if (apiError.response) {
            console.error('API response error:', {
              status: apiError.response.status,
              data: apiError.response.data,
            });
          }
        }

        // If API fails and we're not explicitly asked to use Firestore, try cached data again
        // before falling back to Firestore
        if (cachedOrgs && cachedOrgs.length > 0) {
          console.log(
            `Using ${cachedOrgs.length} cached organizations after API failure`
          );
          return cachedOrgs;
        }

        // If we have no cached data, try one more time with a different approach
        console.log(
          'No cached data available, trying direct Firestore access as fallback'
        );
        // Force Firestore access for the fallback
        useDirectFirestore = true;
      }
    }

    // If we get here, either useDirectFirestore is true or API calls failed
    // and we don't have cached data
    console.log('Using direct Firestore query for organizations...');

    try {
      // Try to get a fresh auth token before accessing Firestore directly
      // This helps maintain the authentication state
      const token = await getAuthToken();
      if (!token) {
        console.warn('No auth token available for Firestore query');
      }

      const orgs = await getVerifiedOrganizationsFromFirestore();

      // Cache the results
      cacheOrganizations(orgs, isAdmin);
      return orgs;
    } catch (firestoreError) {
      console.error('Error with Firestore query:', firestoreError);

      // Return empty array instead of throwing to improve user experience
      console.warn('Returning empty array due to error fetching organizations');
      return [];
    }
  } catch (error) {
    console.error('Error fetching verified organizations:', error);

    // Return empty array as a last resort
    return [];
  }
};

/**
 * Get verified organizations directly from Firestore
 * @returns {Promise<Array>} - Array of verified organizations
 */
async function getVerifiedOrganizationsFromFirestore() {
  try {
    // First, ensure we have a valid auth token to maintain authentication state
    const token = await getAuthToken();
    if (!token) {
      console.warn(
        'No auth token available for Firestore query, this may cause authentication issues'
      );
    }

    // Import Firestore directly
    const { db } = await import('./firebase');
    const { collection, query, where, getDocs, or, and } = await import(
      'firebase/firestore'
    );

    // Ensure we have a valid CSRF token before accessing Firestore directly
    try {
      // Fetch a fresh CSRF token
      console.log('Fetching fresh CSRF token before Firestore query...');
      const csrfResponse = await fetch('/api/auth/csrf-token', {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
      });

      if (!csrfResponse.ok) {
        console.warn(
          'Failed to fetch fresh CSRF token before Firestore query, proceeding anyway'
        );
      } else {
        console.log(
          'Successfully fetched fresh CSRF token before Firestore query'
        );
        // Wait a moment for the cookie to be set
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch (csrfError) {
      console.warn(
        'Error fetching CSRF token before Firestore query:',
        csrfError
      );
      // Continue with the query anyway
    }

    // Query for verified organizations
    const usersRef = collection(db, 'users');

    // Create a more efficient query that combines both conditions
    // This will fetch organizations that are either:
    // 1. Have verificationStatus='verified'
    // 2. Have isVerified=true
    // 3. Have status='verified'
    // All must be of userType='organization'
    try {
      // Try the combined query first (requires Firestore composite indexes)
      const combinedQuery = query(
        usersRef,
        where('userType', '==', 'organization'),
        or(
          where('verificationStatus', '==', 'verified'),
          where('isVerified', '==', true),
          where('status', '==', 'verified')
        )
      );

      console.log(
        'Executing combined Firestore query for verified organizations'
      );
      const combinedSnapshot = await getDocs(combinedQuery);
      console.log(
        `Found ${combinedSnapshot.size} verified organizations with combined query`
      );

      // Process the results
      const verifiedOrgs = [];
      const verifiedOrgIds = new Set();

      combinedSnapshot.forEach((doc) => {
        if (!verifiedOrgIds.has(doc.id)) {
          verifiedOrgIds.add(doc.id);
          verifiedOrgs.push(processFirestoreOrgData(doc));
        }
      });

      if (verifiedOrgs.length > 0) {
        console.log(
          'Successfully fetched',
          verifiedOrgs.length,
          'organizations from Firestore with combined query'
        );
        return verifiedOrgs;
      }
    } catch (combinedQueryError) {
      // If the combined query fails (e.g., missing index), fall back to separate queries
      console.warn(
        'Combined query failed, falling back to separate queries:',
        combinedQueryError.message
      );
    }

    // Fall back to separate queries if combined query fails or returns no results
    // Query for organizations with verificationStatus=verified
    const verifiedWithStatusQuery = query(
      usersRef,
      where('userType', '==', 'organization'),
      where('verificationStatus', '==', 'verified')
    );

    const verifiedWithStatusSnapshot = await getDocs(verifiedWithStatusQuery);
    console.log(
      `Found ${verifiedWithStatusSnapshot.size} organizations with verificationStatus=verified`
    );

    // Query for organizations with isVerified=true
    const verifiedWithLegacyQuery = query(
      usersRef,
      where('userType', '==', 'organization'),
      where('isVerified', '==', true)
    );

    const verifiedWithLegacySnapshot = await getDocs(verifiedWithLegacyQuery);
    console.log(
      `Found ${verifiedWithLegacySnapshot.size} organizations with isVerified=true`
    );

    // Query for organizations with status=verified
    const verifiedWithStatusFieldQuery = query(
      usersRef,
      where('userType', '==', 'organization'),
      where('status', '==', 'verified')
    );

    const verifiedWithStatusFieldSnapshot = await getDocs(
      verifiedWithStatusFieldQuery
    );
    console.log(
      `Found ${verifiedWithStatusFieldSnapshot.size} organizations with status=verified`
    );

    // Combine the results, ensuring no duplicates
    const verifiedOrgIds = new Set();
    const verifiedOrgs = [];

    // Process the results from all queries
    [
      verifiedWithStatusSnapshot,
      verifiedWithLegacySnapshot,
      verifiedWithStatusFieldSnapshot,
    ].forEach((snapshot) => {
      snapshot.forEach((doc) => {
        if (!verifiedOrgIds.has(doc.id)) {
          verifiedOrgIds.add(doc.id);
          verifiedOrgs.push(processFirestoreOrgData(doc));
        }
      });
    });

    if (verifiedOrgs.length > 0) {
      console.log(
        'Successfully fetched',
        verifiedOrgs.length,
        'organizations from Firestore with separate queries'
      );
      return verifiedOrgs;
    } else {
      console.warn('No verified organizations found in direct Firestore query');
      return [];
    }
  } catch (error) {
    console.error('Error in direct Firestore query:', error);
    throw error;
  }
}

/**
 * Process a Firestore organization document into a standardized format
 * @param {FirestoreDocumentSnapshot} doc - Firestore document snapshot
 * @returns {Object} - Processed organization data
 */
function processFirestoreOrgData(doc) {
  const data = doc.data();
  // Extract organization details if present
  const orgDetails = data.orgDetails || {};

  return {
    id: doc.id,
    name:
      data.name ||
      data.organizationName ||
      orgDetails.name ||
      'Unnamed Organization',
    organizationName:
      data.organizationName ||
      data.name ||
      orgDetails.name ||
      'Unnamed Organization',
    website: data.website || orgDetails.website || null,
    description: data.description || orgDetails.description || null,
    verificationBadge:
      data.verificationBadge || data.status === 'verified' || false,
    documentTypes: Array.isArray(data.documentTypes)
      ? data.documentTypes
      : Array.isArray(orgDetails.documentTypes)
      ? orgDetails.documentTypes
      : [],
    industry: data.industry || orgDetails.industry || null,
    phoneNumber: data.phoneNumber || orgDetails.phoneNumber || null,
    email: data.email || orgDetails.email || null,
    status: data.status || 'verified',
    verificationStatus: data.verificationStatus || 'verified',
    isVerified: true,
    createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : null,
    updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : null,
    verifiedAt: data.verifiedAt
      ? new Date(data.verifiedAt.seconds * 1000)
      : null,
  };
}

/**
 * Helper function to process and normalize organization data
 * @param {Array} orgs - Raw organization data
 * @returns {Array} - Processed organization data
 */
function processOrganizationData(orgs) {
  if (!Array.isArray(orgs)) {
    console.warn('processOrganizationData received non-array input:', orgs);
    return [];
  }

  // Track unique organization IDs to prevent duplicates
  const uniqueOrgIds = new Set();
  const uniqueOrgs = [];
  const skippedOrgs = { duplicates: 0, invalid: 0, notVerified: 0 };

  // Validate and sanitize each organization object
  orgs.forEach((org) => {
    if (!org || typeof org !== 'object') {
      console.warn('Invalid organization entry:', org);
      skippedOrgs.invalid++;
      return;
    }

    // Ensure each organization has required fields
    if (!org.id) {
      console.warn('Organization missing ID:', org);
      skippedOrgs.invalid++;
      return;
    }

    // Skip if we've already processed this organization
    if (uniqueOrgIds.has(org.id)) {
      console.log(`Skipping duplicate organization with ID: ${org.id}`);
      skippedOrgs.duplicates++;
      return;
    }

    // Check if the organization is verified using any of the verification fields
    const isVerified = Boolean(
      org.isVerified ||
        org.status === 'verified' ||
        org.verificationStatus === 'verified'
    );

    // Skip non-verified organizations
    if (!isVerified) {
      console.log(`Skipping non-verified organization with ID: ${org.id}`);
      skippedOrgs.notVerified++;
      return;
    }

    // Add to set of processed IDs
    uniqueOrgIds.add(org.id);

    // Extract organization details if present
    const orgDetails = org.orgDetails || {};

    // Normalize the organization data
    uniqueOrgs.push({
      id: org.id,
      name:
        org.name ||
        org.organizationName ||
        orgDetails.name ||
        'Unnamed Organization',
      organizationName:
        org.organizationName ||
        org.name ||
        orgDetails.name ||
        'Unnamed Organization',
      website: org.website || orgDetails.website || null,
      description: org.description || orgDetails.description || null,
      verificationBadge:
        org.verificationBadge || org.status === 'verified' || false,
      documentTypes: Array.isArray(org.documentTypes)
        ? org.documentTypes
        : Array.isArray(orgDetails.documentTypes)
        ? orgDetails.documentTypes
        : [],
      industry: org.industry || orgDetails.industry || null,
      phoneNumber: org.phoneNumber || orgDetails.phoneNumber || null,
      email: org.email || orgDetails.email || null,
      status: 'verified', // Always set to verified since we filtered for verified orgs
      verificationStatus: 'verified', // Always set to verified since we filtered for verified orgs
      isVerified: true, // Always set to true since we filtered for verified orgs
      createdAt: org.createdAt || null,
      updatedAt: org.updatedAt || null,
      verifiedAt: org.verifiedAt || null,
    });
  });

  console.log(
    `Processed ${uniqueOrgs.length} unique verified organizations from ${orgs.length} total`
  );
  console.log(`Skipped organizations: ${JSON.stringify(skippedOrgs)}`);

  return uniqueOrgs;
}

// Additional secure API functions

/**
 * Share a document with another user
 * @param {string} documentId - The document ID
 * @param {string} recipientEmail - The recipient's email
 * @returns {Promise<Object>} - The response data
 */
export const shareDocument = async (documentId, recipientEmail) => {
  try {
    // Validate inputs
    if (!documentId || typeof documentId !== 'string') {
      throw createError('VALIDATION_ERROR', 'Invalid document ID');
    }

    if (!recipientEmail || typeof recipientEmail !== 'string') {
      throw createError('VALIDATION_ERROR', 'Invalid recipient email');
    }

    return await secureApiClient.post(`/api/documents/${documentId}/share`, {
      recipientEmail,
    });
  } catch (error) {
    console.error(`Error sharing document ${documentId}:`, error);
    throw error;
  }
};

/**
 * Verify a document (for organization users)
 * @param {string} documentId - The document ID
 * @param {boolean} approved - Whether the document is approved
 * @param {string} rejectionReason - Reason for rejection (if not approved)
 * @returns {Promise<Object>} - The response data
 */
export const verifyDocument = async (
  documentId,
  approved,
  rejectionReason = ''
) => {
  try {
    // Validate inputs
    if (!documentId || typeof documentId !== 'string') {
      throw createError('VALIDATION_ERROR', 'Invalid document ID');
    }

    return await secureApiClient.post(`/api/documents/${documentId}/verify`, {
      approved,
      rejectionReason: !approved ? rejectionReason : '',
    });
  } catch (error) {
    console.error(`Error verifying document ${documentId}:`, error);
    throw error;
  }
};

export default secureApiClient;
