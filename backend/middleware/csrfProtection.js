/**
 * CSRF Protection Middleware for Authentico
 * 
 * This middleware implements CSRF protection for the Authentico application.
 * It generates CSRF tokens for new sessions and validates tokens for POST, PUT, DELETE requests.
 */

const crypto = require('crypto');

// Constants
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const CSRF_BODY_FIELD = '_csrf';

/**
 * Generate a secure random token for CSRF protection
 * @returns {string} A secure random token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Compare two strings in constant time to prevent timing attacks
 * @param {string} a - First string to compare
 * @param {string} b - Second string to compare
 * @returns {boolean} True if strings match, false otherwise
 */
function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  // If lengths are different, return false but still do the comparison
  // to prevent timing attacks based on string length
  const result = a.length === b.length;
  
  // Perform constant-time comparison
  let mismatch = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    // Use 0 for index beyond string length
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }
  
  return result && mismatch === 0;
}

/**
 * Middleware to generate CSRF tokens for new sessions
 */
function csrfTokenGenerator(req, res, next) {
  // Generate a token if one doesn't exist
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }
  
  // Set the token as a cookie
  res.cookie(CSRF_COOKIE_NAME, req.session.csrfToken, {
    httpOnly: false, // Allow JavaScript to read the cookie
    secure: process.env.NODE_ENV === 'production', // Secure in production
    sameSite: 'strict',
  });
  
  next();
}

/**
 * Middleware to validate CSRF tokens for state-changing requests
 */
function csrfTokenValidator(req, res, next) {
  // Skip validation for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Get the token from the request
  const tokenFromHeader = req.headers[CSRF_HEADER_NAME.toLowerCase()];
  const tokenFromBody = req.body && req.body[CSRF_BODY_FIELD];
  const token = tokenFromHeader || tokenFromBody;
  
  // Get the expected token from the session
  const expectedToken = req.session && req.session.csrfToken;
  
  // Validate the token
  if (!token || !expectedToken || !constantTimeCompare(token, expectedToken)) {
    return res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Invalid or missing CSRF token',
    });
  }
  
  next();
}

module.exports = {
  csrfTokenGenerator,
  csrfTokenValidator,
  generateToken,
  constantTimeCompare,
};
