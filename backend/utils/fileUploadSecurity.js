/**
 * File Upload Security Utilities for Authentico
 *
 * This module provides security utilities for file uploads.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

// File type validation regex patterns
const FILE_TYPE_SIGNATURES = {
  'application/pdf': /^%PDF-\d\.\d/,
  'image/jpeg': /^\xFF\xD8\xFF/,
  'image/png': /^\x89PNG\r\n\x1a\n/,
};

// Malicious content signatures (hex patterns)
const MALICIOUS_SIGNATURES = [
  '4D5A', // PE executable
  '7F454C46', // ELF
  '504B0304', // ZIP (could contain malicious files)
  '526172211A0700', // RAR
  '1F8B08', // GZIP
  '3C3F7068', // PHP
  '3C68746D6C', // HTML
  '3C736372697074', // JavaScript
];

/**
 * Validate file type using MIME type
 * @param {string} mimeType - MIME type to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateFileType(mimeType) {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validate file size
 * @param {number} fileSize - File size in bytes
 * @returns {boolean} True if valid, false otherwise
 */
function validateFileSize(fileSize) {
  return fileSize > 0 && fileSize <= MAX_FILE_SIZE;
}

/**
 * Sanitize file name to prevent path traversal attacks
 * @param {string} fileName - Original file name
 * @returns {string} Sanitized file name
 */
function sanitizeFileName(fileName) {
  // Get the base name without directory traversal
  const baseName = path.basename(fileName);

  // Remove special characters
  return baseName.replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/\.{2,}/g, '.'); // Prevent multiple dots
}

/**
 * Generate a secure random file name
 * @param {string} originalName - Original file name
 * @returns {string} Secure random file name with original extension
 */
function generateSecureFileName(originalName) {
  const ext = path.extname(originalName);
  const randomName = crypto.randomBytes(16).toString('hex');
  return `${randomName}${ext}`;
}

/**
 * Detect malicious content in file
 * @param {Buffer} fileBuffer - File content as buffer
 * @returns {boolean} True if malicious content detected, false otherwise
 */
function detectMaliciousContent(fileBuffer) {
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    return true; // Treat invalid input as malicious
  }

  // Convert first 20 bytes to hex for signature checking
  const fileHeader = fileBuffer.slice(0, 20).toString('hex').toUpperCase();

  // Check for malicious signatures
  return MALICIOUS_SIGNATURES.some((signature) =>
    fileHeader.includes(signature)
  );
}

/**
 * Scan file for malicious content
 * @param {Buffer} fileBuffer - File content as buffer
 * @returns {Promise<boolean>} True if file is safe, false if malicious
 */
async function scanForMaliciousContent(fileBuffer) {
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    return false; // Treat invalid input as unsafe
  }

  // Check for malicious signatures
  const isMalicious = detectMaliciousContent(fileBuffer);
  if (isMalicious) {
    return false;
  }

  // Additional security checks can be added here
  // For example, virus scanning, content analysis, etc.

  return true; // File passed all security checks
}

/**
 * Verify file content matches claimed MIME type
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} claimedMimeType - MIME type claimed by the client
 * @returns {boolean} True if content matches claimed type, false otherwise
 */
function verifyFileContentType(fileBuffer, claimedMimeType) {
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    return false;
  }

  // Get the signature pattern for the claimed MIME type
  const signaturePattern = FILE_TYPE_SIGNATURES[claimedMimeType];
  if (!signaturePattern) {
    // If we don't have a signature pattern for this MIME type, default to true
    // but log a warning
    console.warn(
      `No signature pattern available for MIME type: ${claimedMimeType}`
    );
    return true;
  }

  // Convert the first few bytes to a string for regex testing
  const fileHeader = fileBuffer.slice(0, 8).toString('binary');

  // Test the file header against the signature pattern
  return signaturePattern.test(fileHeader);
}

/**
 * Clean up temporary file
 * @param {string} filePath - Path to temporary file
 * @returns {Promise<void>}
 */
async function cleanupTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error(`Failed to clean up temp file ${filePath}:`, error);
  }
}

/**
 * Validate file upload
 * @param {Object} file - File object from multer or express-fileupload
 * @returns {Object} Validation result
 */
function validateFileUpload(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Validate file type
  if (!validateFileType(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type: ${
        file.mimetype
      }. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  // Validate file size
  if (!validateFileSize(file.size)) {
    return {
      valid: false,
      error: `File size exceeds limit of ${
        MAX_FILE_SIZE / (1024 * 1024)
      }MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    };
  }

  // Verify file has content
  if (!file.buffer || file.buffer.length === 0) {
    return { valid: false, error: 'File has no content' };
  }

  // Sanitize file name
  const sanitizedName = sanitizeFileName(file.originalname || file.name);

  // Generate secure file name
  const secureFileName = generateSecureFileName(sanitizedName);

  return {
    valid: true,
    sanitizedName,
    secureFileName,
  };
}

/**
 * Comprehensive file validation
 * @param {Object} file - File object from multer or express-fileupload
 * @returns {Promise<Object>} Validation result with detailed information
 */
async function validateFileComprehensive(file) {
  // Basic validation
  const basicValidation = validateFileUpload(file);
  if (!basicValidation.valid) {
    return basicValidation;
  }

  // Verify file content matches claimed MIME type
  const contentTypeValid = verifyFileContentType(file.buffer, file.mimetype);
  if (!contentTypeValid) {
    return {
      valid: false,
      error:
        'File content does not match claimed MIME type. Possible file type spoofing detected.',
    };
  }

  // Scan for malicious content
  const isSafe = await scanForMaliciousContent(file.buffer);
  if (!isSafe) {
    return {
      valid: false,
      error: 'File contains potentially malicious content',
    };
  }

  // Calculate file hash for integrity verification
  const fileHash = crypto
    .createHash('sha256')
    .update(file.buffer)
    .digest('hex');

  return {
    valid: true,
    sanitizedName: basicValidation.sanitizedName,
    secureFileName: basicValidation.secureFileName,
    fileHash,
    fileSize: file.size,
    mimeType: file.mimetype,
  };
}

module.exports = {
  validateFileType,
  validateFileSize,
  sanitizeFileName,
  generateSecureFileName,
  detectMaliciousContent,
  scanForMaliciousContent,
  verifyFileContentType,
  cleanupTempFile,
  validateFileUpload,
  validateFileComprehensive,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
};
