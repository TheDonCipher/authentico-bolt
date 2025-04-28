'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Backend Status Indicator Component
 * 
 * This component checks if the backend API is available and displays a warning
 * message if it's not. It's designed to be non-blocking and provide useful
 * information to users when the backend is down.
 */
export default function BackendStatusIndicator() {
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        // Try to fetch the health endpoint with a short timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('/api/health', {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          // Check if the backend is reported as healthy
          if (data.services?.backend === true) {
            setBackendStatus('online');
          } else {
            console.warn('Backend reported as unhealthy in health check');
            setBackendStatus('offline');
            setIsVisible(true);
          }
        } else {
          console.warn('Health check endpoint returned error');
          setBackendStatus('offline');
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error checking backend status:', error);
        
        // Only show the warning if we're confident the backend is down
        if (error.name === 'AbortError' || error.message?.includes('network')) {
          setBackendStatus('offline');
          setIsVisible(true);
        }
      }
    };

    // Check backend status on component mount
    checkBackendStatus();

    // Set up periodic checks
    const intervalId = setInterval(checkBackendStatus, 60000); // Check every minute

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Don't render anything if backend is online or status is unknown
  if (backendStatus !== 'offline' || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-4 text-amber-800 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="font-semibold text-sm">Backend API Unavailable</h3>
        <p className="text-xs mt-1">
          The backend API server appears to be offline. Some features like authentication and data 
          synchronization may not work properly. We're using fallback mechanisms where possible.
        </p>
        <div className="flex justify-end mt-2">
          <button 
            onClick={() => setIsVisible(false)}
            className="text-xs text-amber-600 hover:text-amber-800"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
