/**
 * Direct Upload Utility for Authentico
 * 
 * This utility provides a direct file upload function that bypasses the Next.js API route
 * and sends the file directly to the backend API. This helps avoid CSRF token issues
 * that can occur when proxying through the Next.js API routes.
 */

import axios from 'axios';

// Get the backend API URL from environment variables
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

/**
 * Upload a document directly to the backend API
 * @param formData The form data with the document and metadata
 * @param token The authentication token
 * @param onProgress Optional progress callback
 * @returns Promise with the response data
 */
export const directUploadDocument = async (
  formData: FormData,
  token: string,
  onProgress?: (progress: number) => void
): Promise<any> => {
  try {
    console.log('Starting direct upload to backend API...');
    console.log(`Using backend API URL: ${BACKEND_API_URL}`);
    
    // Log form data for debugging
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
    
    // Get CSRF token from cookie
    const getCsrfToken = () => {
      try {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'XSRF-TOKEN') {
            return decodeURIComponent(value);
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
    console.log('CSRF token for direct upload:', csrfToken ? 'Found' : 'Not found');
    
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
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.error('Failed to fetch new CSRF token:', await csrfResponse.text());
        }
      } catch (csrfError) {
        console.error('Error fetching CSRF token:', csrfError);
      }
    }
    
    // Add CSRF token to form data
    const updatedCsrfToken = getCsrfToken();
    if (updatedCsrfToken) {
      formData.append('_csrf', updatedCsrfToken);
      console.log('Added CSRF token to form data');
    }
    
    // Create headers with authentication and CSRF token
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };
    
    // Add CSRF token to headers if available
    if (updatedCsrfToken) {
      headers['X-XSRF-TOKEN'] = updatedCsrfToken;
      headers['x-xsrf-token'] = updatedCsrfToken;
    }
    
    // Make the request directly to the backend API
    const response = await axios.post(
      `${BACKEND_API_URL}/documents/upload`,
      formData,
      {
        headers,
        withCredentials: true, // Include cookies in the request
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      }
    );
    
    console.log('Direct upload successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Direct upload error:', error);
    
    // Check if the error is related to CSRF token validation
    if (error.response?.data?.error === 'CSRF token validation failed') {
      console.log('CSRF token validation failed, trying to refresh token...');
      
      try {
        // Fetch a new CSRF token
        const csrfResponse = await fetch('/api/auth/csrf-token', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (csrfResponse.ok) {
          console.log('Successfully refreshed CSRF token, retrying upload...');
          
          // Wait a moment for the cookie to be set
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Get the new CSRF token
          const newCsrfToken = (() => {
            try {
              const cookies = document.cookie.split(';');
              for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'XSRF-TOKEN') {
                  return decodeURIComponent(value);
                }
              }
              return null;
            } catch (error) {
              console.error('Error getting new CSRF token from cookie:', error);
              return null;
            }
          })();
          
          if (newCsrfToken) {
            // Add CSRF token to form data
            formData.append('_csrf', newCsrfToken);
            
            // Create headers with authentication and CSRF token
            const headers: Record<string, string> = {
              'Authorization': `Bearer ${token}`,
              'X-XSRF-TOKEN': newCsrfToken,
              'x-xsrf-token': newCsrfToken,
            };
            
            // Retry the request
            const retryResponse = await axios.post(
              `${BACKEND_API_URL}/documents/upload`,
              formData,
              {
                headers,
                withCredentials: true,
                onUploadProgress: (progressEvent) => {
                  if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round(
                      (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted);
                  }
                },
              }
            );
            
            console.log('Retry upload successful:', retryResponse.data);
            return retryResponse.data;
          }
        }
      } catch (retryError) {
        console.error('Error retrying upload after CSRF token refresh:', retryError);
      }
    }
    
    // Rethrow the original error if retry fails
    throw error;
  }
};
