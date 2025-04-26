/**
 * Input validation middleware for Authentico backend
 * Implements validation and sanitization for common input types
 */

/**
 * Validate wallet address format
 * @param {string} walletAddress - Ethereum wallet address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidWalletAddress = (walletAddress) => {
  if (!walletAddress) return false;
  
  // Validate wallet address format (0x followed by 40 hex characters)
  const walletAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return walletAddressRegex.test(walletAddress);
};

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidEmail = (email) => {
  if (!email) return false;
  
  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate document type
 * @param {string} documentType - Document type to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidDocumentType = (documentType) => {
  if (!documentType) return false;
  
  // Validate document type
  const validDocumentTypes = ['identity', 'financial', 'educational', 'medical', 'legal'];
  return validDocumentTypes.includes(documentType);
};

/**
 * Sanitize string input to prevent XSS and injection attacks
 * @param {string} input - String to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  // Replace HTML tags and special characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\\/g, '&#92;');
};

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  // Handle objects
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Middleware to sanitize request inputs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sanitizeInputs = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize request query
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize request params
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    next(); // Continue even if sanitization fails
  }
};

/**
 * Middleware to validate wallet address
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateWalletAddress = (req, res, next) => {
  const walletAddress = req.body.walletAddress || req.query.walletAddress || req.params.walletAddress;
  
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }
  
  if (!isValidWalletAddress(walletAddress)) {
    return res.status(400).json({ error: 'Invalid wallet address format' });
  }
  
  next();
};

/**
 * Middleware to validate email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateEmail = (req, res, next) => {
  const email = req.body.email || req.query.email || req.params.email;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  next();
};

/**
 * Middleware to validate document type
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateDocumentType = (req, res, next) => {
  const documentType = req.body.documentType || req.query.documentType || req.params.documentType;
  
  if (!documentType) {
    return res.status(400).json({ error: 'Document type is required' });
  }
  
  if (!isValidDocumentType(documentType)) {
    return res.status(400).json({ error: 'Invalid document type' });
  }
  
  next();
};

module.exports = {
  sanitizeInputs,
  validateWalletAddress,
  validateEmail,
  validateDocumentType,
  isValidWalletAddress,
  isValidEmail,
  isValidDocumentType,
  sanitizeString,
  sanitizeObject,
};
