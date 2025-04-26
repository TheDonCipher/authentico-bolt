/**
 * Session management utility for Authentico
 * This library provides secure session management with proper
 * expiration, validation, and activity tracking.
 */

import * as secureStorage from './secure-storage';

// Define session types
export interface SessionInfo {
  id: string;
  userId: string;
  userType: string;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  deviceInfo: DeviceInfo;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language?: string;
  screenSize?: string;
}

// Session configuration
const SESSION_CONFIG = {
  sessionDuration: 3600000, // 1 hour
  sessionKey: 'authentico_session',
  cookieName: 'sessionId',
  maxSessionsPerUser: 5,
};

/**
 * Generate a unique session ID
 * @returns A unique session ID
 */
const generateSessionId = (): string => {
  try {
    // Use crypto.randomUUID() if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback for older browsers
    return (
      'session_' +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  } catch (error) {
    console.error('Error generating session ID:', error);
    // Simple fallback
    return (
      'session_' +
      Date.now() +
      '_' +
      Math.random().toString(36).substring(2, 15)
    );
  }
};

/**
 * Get device information for the current session
 * @returns Device information object
 */
const getDeviceInfo = (): DeviceInfo => {
  try {
    const deviceInfo: DeviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    };

    // Add optional information if available
    if (navigator.language) {
      deviceInfo.language = navigator.language;
    }

    if (window.screen) {
      deviceInfo.screenSize = `${window.screen.width}x${window.screen.height}`;
    }

    return deviceInfo;
  } catch (error) {
    console.error('Error getting device info:', error);
    // Return minimal device info if error occurs
    return {
      userAgent: 'unknown',
      platform: 'unknown',
    };
  }
};

/**
 * Create a new session
 * @param user User information
 * @returns The created session or null if creation fails
 */
export const createSession = (user: any): SessionInfo | null => {
  try {
    if (!user || !user.uid) {
      console.error('Cannot create session: Invalid user data');
      return null;
    }

    // Generate session ID
    const sessionId = generateSessionId();

    // Get current timestamp
    const now = Date.now();

    // Create session object
    const session: SessionInfo = {
      id: sessionId,
      userId: user.uid,
      userType: user.userType || 'individual',
      createdAt: now,
      lastActivityAt: now,
      expiresAt: now + SESSION_CONFIG.sessionDuration,
      deviceInfo: getDeviceInfo(),
    };

    // Store session in secure storage
    const stored = secureStorage.setItem(SESSION_CONFIG.sessionKey, session);

    if (!stored) {
      console.error('Failed to store session in secure storage');
      return null;
    }

    // Set session cookie for server-side access
    document.cookie = `${
      SESSION_CONFIG.cookieName
    }=${sessionId}; path=/; secure; samesite=strict; max-age=${
      SESSION_CONFIG.sessionDuration / 1000
    }`;

    console.log('Session created successfully:', sessionId);
    return session;
  } catch (error) {
    console.error('Session creation error:', error);
    return null;
  }
};

/**
 * Get the current session
 * @returns The current session or null if no valid session exists
 */
export const getSession = async (): Promise<SessionInfo | null> => {
  try {
    // Retrieve session from secure storage
    const session = await secureStorage.getItem(SESSION_CONFIG.sessionKey);

    if (!session) {
      return null;
    }

    // Check if session has expired
    if (session.expiresAt < Date.now()) {
      // Remove expired session
      invalidateSession();
      return null;
    }

    return session as SessionInfo;
  } catch (error) {
    console.error('Session retrieval error:', error);
    return null;
  }
};

/**
 * Update session activity
 * @returns True if update was successful, false otherwise
 */
export const updateSessionActivity = async (): Promise<boolean> => {
  try {
    // Get current session
    const session = await getSession();

    if (!session) {
      return false;
    }

    // Update last activity time and expiration
    const now = Date.now();
    session.lastActivityAt = now;
    session.expiresAt = now + SESSION_CONFIG.sessionDuration;

    // Update session in secure storage
    const updated = secureStorage.setItem(SESSION_CONFIG.sessionKey, session);

    if (!updated) {
      console.error('Failed to update session activity');
      return false;
    }

    // Update session cookie
    document.cookie = `${SESSION_CONFIG.cookieName}=${
      session.id
    }; path=/; secure; samesite=strict; max-age=${
      SESSION_CONFIG.sessionDuration / 1000
    }`;

    return true;
  } catch (error) {
    console.error('Session activity update error:', error);
    return false;
  }
};

/**
 * Check if session is valid
 * @returns True if session is valid, false otherwise
 */
export const isSessionValid = async (): Promise<boolean> => {
  try {
    const session = await getSession();
    return !!session;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};

/**
 * Invalidate the current session
 * @returns True if invalidation was successful, false otherwise
 */
export const invalidateSession = (): boolean => {
  try {
    // Remove session from secure storage
    secureStorage.removeItem(SESSION_CONFIG.sessionKey);

    // Remove session cookie
    document.cookie = `${SESSION_CONFIG.cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`;

    console.log('Session invalidated successfully');
    return true;
  } catch (error) {
    console.error('Session invalidation error:', error);
    return false;
  }
};

/**
 * Set up session activity tracking
 * This updates the session activity periodically to keep it alive
 * @param intervalMs Interval in milliseconds to update session activity
 * @returns Interval ID for clearing the interval if needed
 */
export const setupSessionTracking = (intervalMs: number = 60000): number => {
  try {
    // Update session activity immediately
    updateSessionActivity().catch((err) =>
      console.error('Error updating session activity:', err)
    );

    // Set up interval to update session activity
    const intervalId = window.setInterval(async () => {
      try {
        const valid = await isSessionValid();
        if (valid) {
          await updateSessionActivity();
        } else {
          // If session is no longer valid, clear the interval
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Session tracking error:', error);
      }
    }, intervalMs);

    return intervalId;
  } catch (error) {
    console.error('Session tracking setup error:', error);
    return 0;
  }
};

/**
 * Log session events for debugging and security monitoring
 * @param event Event name
 * @param details Event details
 */
export const logSessionEvent = async (
  event: string,
  details?: any
): Promise<void> => {
  try {
    const session = await getSession();
    const sessionId = session?.id || 'no-session';

    console.log(`Session Event [${sessionId}] ${event}:`, details || {});

    // In a production environment, this would send the event to a logging service
  } catch (error) {
    console.error('Session event logging error:', error);
  }
};
