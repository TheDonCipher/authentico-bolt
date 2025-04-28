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

        // Check if we already have a CSRF token in cookies
        const existingToken = document.cookie
          .split(';')
          .some((cookie) => cookie.trim().startsWith('XSRF-TOKEN='));

        if (existingToken) {
          console.log(
            'CSRF token already exists in cookies, skipping initialization'
          );
          return;
        }

        // Try to fetch a CSRF token from the server first with a timeout
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          // Add cache-busting parameter to prevent caching issues
          const cacheBuster = `?_=${Date.now()}`;
          const csrfResponse = await fetch(
            `/api/auth/csrf-token${cacheBuster}`,
            {
              method: 'GET',
              credentials: 'include',
              signal: controller.signal,
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                Pragma: 'no-cache',
                Expires: '0',
              },
            }
          );

          clearTimeout(timeoutId);

          if (csrfResponse.ok) {
            const data = await csrfResponse.json();
            console.log(
              `Successfully fetched CSRF token from ${data.source || 'server'}`
            );

            // Wait a moment for cookies to be properly set
            await new Promise((resolve) => setTimeout(resolve, 300));

            // Verify the token was actually set in cookies
            const tokenSet = document.cookie
              .split(';')
              .some((cookie) => cookie.trim().startsWith('XSRF-TOKEN='));

            if (!tokenSet) {
              console.warn(
                'CSRF token not found in cookies after fetch, generating client-side token'
              );
              const token = initCsrfProtection();
              console.log(
                'Generated client-side CSRF token:',
                token ? 'Success' : 'Failed'
              );
            }

            // Check if we need to show a backend connectivity warning
            if (data.source === 'client-side') {
              console.warn(
                'Backend API server appears to be offline. Using client-side CSRF token generation.'
              );
            }
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

          // Check if this was a timeout/abort error
          if (error.name === 'AbortError') {
            console.warn(
              'CSRF token request timed out. Backend may be offline.'
            );
          }

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
