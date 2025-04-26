'use client';

import { useEffect } from 'react';
import { initCsrfProtection } from '../../../lib/csrf-protection';

/**
 * Client-side CSRF initialization component
 * This component initializes CSRF protection when the application loads
 */
export default function CsrfInitializer() {
  useEffect(() => {
    // Initialize CSRF protection on the client side
    const initCsrf = async () => {
      try {
        console.log('Initializing CSRF protection from CsrfInitializer...');
        // Try to fetch a CSRF token from the server first
        try {
          const csrfResponse = await fetch('/api/auth/csrf-token', {
            method: 'GET',
            credentials: 'include',
          });

          if (csrfResponse.ok) {
            console.log('Successfully fetched CSRF token from server');
          } else {
            console.warn(
              'Failed to fetch CSRF token from server, falling back to client-side generation'
            );
            // Fall back to client-side token generation
            const token = initCsrfProtection();
            console.log(
              'Generated client-side CSRF token:',
              token ? 'Success' : 'Failed'
            );
          }
        } catch (error) {
          console.error('Error fetching CSRF token from server:', error);
          // Fall back to client-side token generation
          const token = initCsrfProtection();
          console.log(
            'Generated client-side CSRF token after error:',
            token ? 'Success' : 'Failed'
          );
        }
      } catch (error) {
        console.error('Error initializing CSRF protection:', error);
      }
    };

    initCsrf();
  }, []);

  return null;
}
