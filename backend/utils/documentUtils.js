/**
 * Document Utilities for Authentico
 * 
 * This module provides utilities for document operations.
 */

const crypto = require('crypto');

/**
 * Generate a document hash from a buffer
 * @param {Buffer} buffer - Document buffer
 * @returns {string} Document hash
 */
function generateDocumentHash(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Input must be a buffer');
  }
  
  // Create a SHA-256 hash of the document
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  
  // Return the hash with 0x prefix for blockchain compatibility
  return `0x${hash}`;
}

/**
 * Validate a document hash format
 * @param {string} hash - Document hash to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateDocumentHash(hash) {
  // Check if hash is a string
  if (typeof hash !== 'string') {
    return false;
  }
  
  // Check if hash has 0x prefix
  if (!hash.startsWith('0x')) {
    return false;
  }
  
  // Check if hash is the correct length (0x + 64 hex characters)
  if (hash.length !== 66) {
    return false;
  }
  
  // Check if hash contains only hex characters after 0x
  const hexRegex = /^0x[0-9a-fA-F]{64}$/;
  return hexRegex.test(hash);
}

/**
 * Generate a unique document ID
 * @returns {string} Unique document ID
 */
function generateDocumentId() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = {
  generateDocumentHash,
  validateDocumentHash,
  generateDocumentId,
};
