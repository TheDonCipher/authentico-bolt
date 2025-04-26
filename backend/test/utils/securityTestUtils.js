/**
 * Security test utilities for Authentico backend testing
 */
const crypto = require('crypto');

/**
 * Generate a random document for testing
 * @param {number} size - Size of the document in bytes
 * @returns {Buffer} - Random document buffer
 */
const generateRandomDocument = (size = 1024) => {
  return crypto.randomBytes(size);
};

/**
 * Generate a valid SHA-256 hash for a buffer
 * @param {Buffer} buffer - Buffer to hash
 * @returns {string} - Hex-encoded SHA-256 hash
 */
const generateDocumentHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Create a mock request object for testing Express routes
 * @param {Object} options - Request options
 * @returns {Object} - Mock request object
 */
const createMockRequest = ({
  method = 'GET',
  headers = {},
  body = {},
  params = {},
  query = {},
  file = null,
  user = null,
} = {}) => {
  return {
    method,
    headers,
    body,
    params,
    query,
    file,
    user,
  };
};

/**
 * Create a mock response object for testing Express routes
 * @returns {Object} - Mock response object with jest spy functions
 */
const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Generate a mock JWT token for testing
 * @param {string} subject - Token subject (user ID)
 * @param {Object} claims - Additional claims
 * @returns {string} - Mock JWT token
 */
const generateMockToken = (subject, claims = {}) => {
  // This is a simplified mock token, not a real JWT
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(
    JSON.stringify({
      sub: subject,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...claims,
    })
  ).toString('base64');
  const signature = 'MOCK_SIGNATURE';
  return `${header}.${payload}.${signature}`;
};

/**
 * Test for common security headers in response
 * @param {Object} res - Express response object
 */
const expectSecurityHeaders = (res) => {
  expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
  expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
  expect(res.setHeader).toHaveBeenCalledWith('Content-Security-Policy', expect.any(String));
  expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
};

/**
 * Generate a valid AES-256 key for testing
 * @returns {Buffer} - 32-byte AES-256 key
 */
const generateAES256Key = () => {
  return crypto.randomBytes(32); // 256 bits = 32 bytes
};

module.exports = {
  generateRandomDocument,
  generateDocumentHash,
  createMockRequest,
  createMockResponse,
  generateMockToken,
  expectSecurityHeaders,
  generateAES256Key,
};
