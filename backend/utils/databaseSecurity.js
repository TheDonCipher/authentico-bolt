/**
 * Database Security Utilities for Authentico
 * 
 * This module provides security utilities for database operations.
 */

const { admin } = require('../config');

/**
 * Sanitize user input to prevent NoSQL injection
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Remove NoSQL injection characters
  return input
    .replace(/\$/g, '')
    .replace(/\./g, '')
    .replace(/\{/g, '')
    .replace(/\}/g, '')
    .replace(/\[/g, '')
    .replace(/\]/g, '');
}

/**
 * Create a parameterized query for Firestore
 * @param {string} collectionName - Collection to query
 * @param {Object} conditions - Query conditions
 * @returns {Object} Firestore query
 */
function createParameterizedQuery(collectionName, conditions = {}) {
  let query = admin.firestore().collection(collectionName);
  
  // Add conditions to the query
  Object.entries(conditions).forEach(([field, value]) => {
    // Sanitize field name
    const sanitizedField = sanitizeInput(field);
    
    // Add condition to query
    if (typeof value === 'object' && value !== null) {
      // Handle complex conditions (>, <, >=, <=, ==, !=)
      Object.entries(value).forEach(([operator, operand]) => {
        if (['>', '<', '>=', '<=', '==', '!='].includes(operator)) {
          query = query.where(sanitizedField, operator, operand);
        }
      });
    } else {
      // Simple equality condition
      query = query.where(sanitizedField, '==', value);
    }
  });
  
  return query;
}

/**
 * Apply field-level security to document data
 * @param {Object} data - Document data
 * @param {Array<string>} allowedFields - Fields that are allowed to be returned
 * @returns {Object} Filtered document data
 */
function applyFieldSecurity(data, allowedFields) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const filteredData = {};
  
  // Only include allowed fields
  allowedFields.forEach(field => {
    if (data.hasOwnProperty(field)) {
      filteredData[field] = data[field];
    }
  });
  
  return filteredData;
}

/**
 * Check if user has access to a document
 * @param {Object} user - User object
 * @param {Object} document - Document to check access for
 * @returns {boolean} True if user has access, false otherwise
 */
function hasDocumentAccess(user, document) {
  if (!user || !document) {
    return false;
  }
  
  // Admin has access to all documents
  if (user.userType === 'admin' || user.admin === true) {
    return true;
  }
  
  // User has access to their own documents
  if (user.uid === document.userId || user.uid === document.uid) {
    return true;
  }
  
  // Organization has access to documents they verified
  if (user.userType === 'organization' && 
      user.isVerified === true && 
      document.verifyingOrganization === user.uid) {
    return true;
  }
  
  // Default: no access
  return false;
}

/**
 * Execute a transaction for multi-document updates
 * @param {Function} updateFunction - Function to execute in transaction
 * @returns {Promise} Transaction result
 */
async function executeTransaction(updateFunction) {
  const db = admin.firestore();
  
  try {
    return await db.runTransaction(async (transaction) => {
      return await updateFunction(transaction);
    });
  } catch (error) {
    console.error('Transaction failed:', error);
    throw new Error('Database transaction failed');
  }
}

module.exports = {
  sanitizeInput,
  createParameterizedQuery,
  applyFieldSecurity,
  hasDocumentAccess,
  executeTransaction,
};
