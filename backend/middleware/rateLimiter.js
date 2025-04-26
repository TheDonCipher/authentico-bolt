/**
 * Rate limiting middleware for Authentico backend
 * Implements rate limiting to protect against brute force and DoS attacks
 */
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Rate limit configurations for different endpoints
const rateLimitConfigs = {
  // Authentication endpoints
  '/api/auth/login': {
    points: 5, // 5 requests
    duration: 60, // per 60 seconds
    blockDuration: 300, // Block for 5 minutes if exceeded
    message: 'Too many login attempts. Please try again later.',
  },
  '/api/auth/register': {
    points: 3, // 3 requests
    duration: 60, // per 60 seconds
    blockDuration: 600, // Block for 10 minutes if exceeded
    message: 'Too many registration attempts. Please try again later.',
  },
  
  // Document endpoints
  '/api/documents/upload': {
    points: 10, // 10 requests
    duration: 60, // per 60 seconds
    blockDuration: 300, // Block for 5 minutes if exceeded
    message: 'Too many document uploads. Please try again later.',
  },
  '/api/documents/verify': {
    points: 20, // 20 requests
    duration: 60, // per 60 seconds
    blockDuration: 300, // Block for 5 minutes if exceeded
    message: 'Too many verification attempts. Please try again later.',
  },
  
  // Organization endpoints
  '/api/organizations/apply': {
    points: 3, // 3 requests
    duration: 60, // per 60 seconds
    blockDuration: 600, // Block for 10 minutes if exceeded
    message: 'Too many organization applications. Please try again later.',
  },
  
  // Default rate limit for all other endpoints
  'default': {
    points: 100, // 100 requests
    duration: 60, // per 60 seconds
    blockDuration: 300, // Block for 5 minutes if exceeded
    message: 'Too many requests. Please try again later.',
  },
};

// Create rate limiters for each endpoint
const rateLimiters = {};
Object.keys(rateLimitConfigs).forEach(endpoint => {
  const config = rateLimitConfigs[endpoint];
  rateLimiters[endpoint] = new RateLimiterMemory({
    points: config.points,
    duration: config.duration,
    blockDuration: config.blockDuration,
    keyPrefix: `rl:${endpoint}`,
  });
});

/**
 * Rate limiting middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const rateLimiter = async (req, res, next) => {
  try {
    // Get the endpoint path
    const endpoint = req.path;
    
    // Find the appropriate rate limiter
    let limiter = rateLimiters[endpoint];
    if (!limiter) {
      // Use default rate limiter if no specific one exists
      limiter = rateLimiters['default'];
    }
    
    // Get the rate limit config
    const config = rateLimitConfigs[endpoint] || rateLimitConfigs['default'];
    
    // Use IP as the rate limiting key
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    
    // Try to consume a point
    await limiter.consume(key);
    
    // If successful, proceed to the next middleware
    next();
  } catch (error) {
    // Rate limit exceeded
    if (error.remainingPoints !== undefined) {
      // This is a rate limiter error
      const endpoint = req.path;
      const config = rateLimitConfigs[endpoint] || rateLimitConfigs['default'];
      
      // Set retry-after header
      res.setHeader('Retry-After', Math.ceil(error.msBeforeNext / 1000));
      
      // Return rate limit error
      return res.status(429).json({
        error: 'Too many requests',
        message: config.message,
        retryAfter: Math.ceil(error.msBeforeNext / 1000),
      });
    } else {
      // This is an unexpected error
      console.error('Rate limiter error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request.',
      });
    }
  }
};

module.exports = {
  rateLimiter,
  rateLimiters, // Export for testing
  rateLimitConfigs, // Export for testing
};
