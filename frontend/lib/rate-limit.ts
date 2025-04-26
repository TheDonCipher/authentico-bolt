/**
 * Rate limiting utility for Authentico
 * This library provides client-side rate limiting to prevent
 * excessive API calls and improve security.
 */

// Define rate limit types
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message: string;
}

export interface RateLimitResult {
  limited: boolean;
  message: string;
  remainingRequests: number;
  resetTime: number;
}

// Store request counts for each endpoint
const requestCounts: Map<string, number[]> = new Map();

// Rate limit configuration for different endpoints
const rateLimitConfig: Record<string, RateLimitConfig> = {
  '/api/auth/login': {
    maxRequests: 5,
    windowMs: 60000, // 1 minute
    message: 'Too many login attempts. Please try again later.'
  },
  '/api/auth/register': {
    maxRequests: 3,
    windowMs: 60000, // 1 minute
    message: 'Too many registration attempts. Please try again later.'
  },
  '/api/documents/upload': {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    message: 'Too many document uploads. Please try again later.'
  },
  '/api/verify': {
    maxRequests: 20,
    windowMs: 60000, // 1 minute
    message: 'Too many verification attempts. Please try again later.'
  },
  'default': {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    message: 'Too many requests. Please try again later.'
  }
};

/**
 * Check if a request should be rate limited
 * @param endpoint The API endpoint
 * @returns Rate limit result
 */
export const shouldRateLimit = (endpoint: string): RateLimitResult => {
  try {
    // Get rate limit configuration for endpoint
    const config = rateLimitConfig[endpoint] || rateLimitConfig['default'];
    const { maxRequests, windowMs, message } = config;
    
    // Get request history for this endpoint
    if (!requestCounts.has(endpoint)) {
      requestCounts.set(endpoint, []);
    }
    
    const requests = requestCounts.get(endpoint) || [];
    const now = Date.now();
    
    // Remove expired requests
    const windowStart = now - windowMs;
    const recentRequests = requests.filter(time => time > windowStart);
    
    // Update request history
    requestCounts.set(endpoint, recentRequests);
    
    // Check if rate limit is exceeded
    const limited = recentRequests.length >= maxRequests;
    
    // Calculate remaining requests and reset time
    const remainingRequests = Math.max(0, maxRequests - recentRequests.length);
    const oldestRequest = recentRequests.length > 0 ? Math.min(...recentRequests) : now;
    const resetTime = oldestRequest + windowMs;
    
    return {
      limited,
      message,
      remainingRequests,
      resetTime
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Default to not limiting in case of error
    return {
      limited: false,
      message: 'Rate limit check failed',
      remainingRequests: 1,
      resetTime: Date.now() + 60000
    };
  }
};

/**
 * Record a request for rate limiting
 * @param endpoint The API endpoint
 */
export const recordRequest = (endpoint: string): void => {
  try {
    // Get request history for this endpoint
    if (!requestCounts.has(endpoint)) {
      requestCounts.set(endpoint, []);
    }
    
    const requests = requestCounts.get(endpoint) || [];
    
    // Add current timestamp to request history
    requests.push(Date.now());
    
    // Update request history
    requestCounts.set(endpoint, requests);
  } catch (error) {
    console.error('Rate limit record error:', error);
  }
};

/**
 * Reset rate limit for an endpoint
 * @param endpoint The API endpoint
 */
export const resetRateLimit = (endpoint: string): void => {
  try {
    requestCounts.set(endpoint, []);
  } catch (error) {
    console.error('Rate limit reset error:', error);
  }
};

/**
 * Reset all rate limits
 */
export const resetAllRateLimits = (): void => {
  try {
    requestCounts.clear();
  } catch (error) {
    console.error('Rate limit reset all error:', error);
  }
};

/**
 * Create a rate-limited fetch function
 * @returns A fetch function that applies rate limiting
 */
export const createRateLimitedFetch = () => {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    try {
      // Extract endpoint from URL
      const urlObj = new URL(url, window.location.origin);
      const endpoint = urlObj.pathname;
      
      // Check rate limit
      const rateLimitResult = shouldRateLimit(endpoint);
      
      if (rateLimitResult.limited) {
        // If rate limited, throw an error
        const error = new Error(rateLimitResult.message);
        error.name = 'RateLimitError';
        throw error;
      }
      
      // Record the request
      recordRequest(endpoint);
      
      // Make the request
      return fetch(url, options);
    } catch (error) {
      console.error('Rate-limited fetch error:', error);
      throw error;
    }
  };
};

/**
 * Apply progressive delay for repeated attempts
 * @param attempts Number of attempts
 * @param baseDelayMs Base delay in milliseconds
 * @param maxDelayMs Maximum delay in milliseconds
 * @returns Delay in milliseconds
 */
export const getProgressiveDelay = (
  attempts: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 30000
): number => {
  try {
    // Calculate delay using exponential backoff
    const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempts));
    
    // Add some randomness to prevent timing attacks
    const jitter = Math.random() * 0.3 * delay;
    
    return Math.min(maxDelayMs, delay + jitter);
  } catch (error) {
    console.error('Progressive delay calculation error:', error);
    return baseDelayMs;
  }
};
