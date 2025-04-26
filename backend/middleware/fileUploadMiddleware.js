/**
 * File Upload Middleware for Authentico
 * 
 * This middleware handles secure file uploads with validation, sanitization,
 * and protection against common file upload vulnerabilities.
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { promisify } = require('util');
const fileUploadSecurity = require('../utils/fileUploadSecurity');

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

// Configure multer storage
const storage = multer.memoryStorage(); // Store files in memory for processing

// Create multer upload instance with security settings
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE, // 10MB max file size
    files: 1, // Only allow one file per request
  },
  fileFilter: (req, file, cb) => {
    // Log file details for debugging
    console.log(`Received file: ${file.originalname}, type: ${file.mimetype}`);

    // Check if the file type is allowed
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Only PDF, JPG, JPEG, and PNG files are allowed. Received: ${file.mimetype}`
        )
      );
    }
  },
});

/**
 * Middleware to handle file uploads with enhanced security
 * @param {string} fieldName - The name of the file field in the form
 * @returns {Function} Express middleware function
 */
const secureFileUpload = (fieldName = 'document_file') => {
  return async (req, res, next) => {
    try {
      // Use multer to handle the file upload
      const uploadMiddleware = upload.single(fieldName);
      
      uploadMiddleware(req, res, async (err) => {
        if (err) {
          // Handle multer errors
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(413).json({
                error: 'FILE_TOO_LARGE',
                message: `File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
              });
            }
            return res.status(400).json({
              error: 'FILE_UPLOAD_ERROR',
              message: `File upload error: ${err.message}`,
            });
          }
          
          // Handle other errors
          return res.status(400).json({
            error: 'UPLOAD_ERROR',
            message: err.message,
          });
        }
        
        // Check if a file was uploaded
        if (!req.file) {
          return res.status(400).json({
            error: 'FILE_MISSING',
            message: 'No file was uploaded',
          });
        }
        
        try {
          // Perform additional security checks on the file
          const fileValidation = fileUploadSecurity.validateFileUpload(req.file);
          
          if (!fileValidation.valid) {
            return res.status(400).json({
              error: 'FILE_VALIDATION_ERROR',
              message: fileValidation.error,
            });
          }
          
          // Add sanitized and secure file names to the request
          req.file.sanitizedName = fileValidation.sanitizedName;
          req.file.secureFileName = fileValidation.secureFileName;
          
          // Check for malicious content signatures
          const isSafe = await fileUploadSecurity.scanForMaliciousContent(req.file.buffer);
          if (!isSafe) {
            return res.status(400).json({
              error: 'SECURITY_THREAT',
              message: 'The file contains potentially malicious content',
            });
          }
          
          // Calculate file hash for integrity verification
          req.file.hash = crypto
            .createHash('sha256')
            .update(req.file.buffer)
            .digest('hex');
          
          // Proceed to the next middleware
          next();
        } catch (validationError) {
          console.error('File validation error:', validationError);
          return res.status(400).json({
            error: 'FILE_VALIDATION_ERROR',
            message: validationError.message,
          });
        }
      });
    } catch (error) {
      console.error('Unexpected error in file upload middleware:', error);
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: 'An unexpected error occurred during file upload',
      });
    }
  };
};

module.exports = {
  secureFileUpload,
};
