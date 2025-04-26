/**
 * Secure Document Routes for Authentico
 *
 * This module provides secure routes for document upload, retrieval, and management.
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../authMiddleware');
const { admin, adminDb } = require('../config');
const DocumentUploadService = require('../services/DocumentUploadService');
const documentUploadService = new DocumentUploadService();
const { secureFileUpload } = require('../middleware/fileUploadMiddleware');
const { isValidDocumentType } = require('../constants/documentTypes');
// Rate limiting middleware (simplified version)
const uploadRateLimiter = (req, res, next) => {
  // Simple rate limiting is disabled for now
  // TODO: Implement proper rate limiting
  next();
};

/**
 * Upload a document securely
 * POST /api/secure/documents/upload
 */
router.post(
  '/upload',
  verifyToken,
  uploadRateLimiter,
  secureFileUpload('document_file'),
  async (req, res) => {
    try {
      // Log the request for debugging
      console.log('Secure document upload request received');

      // Input validation
      if (!req.file) {
        return res.status(400).json({
          error: 'FILE_MISSING',
          message: 'No file uploaded. Please ensure you have selected a file.',
        });
      }

      // Validate document type
      const documentType = req.body.documentType;
      if (!documentType || !isValidDocumentType(documentType)) {
        return res.status(400).json({
          error: 'INVALID_DOCUMENT_TYPE',
          message:
            'Invalid document type. Please select a valid document type.',
        });
      }

      // Validate document name
      const documentName = req.body.documentName;
      if (!documentName || documentName.trim().length === 0) {
        return res.status(400).json({
          error: 'INVALID_DOCUMENT_NAME',
          message: 'Document name is required.',
        });
      }

      // Validate verifying organization
      const verifyingOrgId = req.body.verifyingOrgId;
      if (!verifyingOrgId) {
        return res.status(400).json({
          error: 'INVALID_ORGANIZATION',
          message: 'Verifying organization is required.',
        });
      }

      // Check if the organization exists and is verified
      const orgDoc = await adminDb
        .collection('users')
        .doc(verifyingOrgId)
        .get();
      if (!orgDoc.exists) {
        return res.status(400).json({
          error: 'ORGANIZATION_NOT_FOUND',
          message: 'Selected organization not found.',
        });
      }

      const orgData = orgDoc.data();
      if (!orgData.isVerified) {
        return res.status(400).json({
          error: 'ORGANIZATION_NOT_VERIFIED',
          message: 'Selected organization is not verified.',
        });
      }

      // Prepare metadata
      const metadata = {
        documentName,
        documentType,
        verifyingOrgId,
      };

      // Prepare user information
      const user = {
        uid: req.user.uid,
        walletAddress: req.user.walletAddress || '',
      };

      // Process and upload the document
      const result = await documentUploadService.uploadDocument(
        req.file,
        metadata,
        user
      );

      // Return success response
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in secure document upload route:', error);

      // Provide more detailed error information based on the error type
      if (error.message && error.message.includes('organization')) {
        return res.status(400).json({
          error: 'ORGANIZATION_ERROR',
          message: error.message,
        });
      } else if (error.message && error.message.includes('IPFS')) {
        return res.status(502).json({
          error: 'STORAGE_ERROR',
          message: 'Failed to store document in IPFS',
          details: error.message,
        });
      } else if (error.message && error.message.includes('encrypt')) {
        return res.status(500).json({
          error: 'ENCRYPTION_ERROR',
          message: 'Failed to encrypt document',
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: 'SERVER_ERROR',
          message: 'An unexpected error occurred during document upload',
          details:
            process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
      }
    }
  }
);

/**
 * Get a list of documents for the authenticated user
 * GET /api/secure/documents
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Query documents owned by the user
    const documentsSnapshot = await adminDb
      .collection('documents')
      .where('ownerUid', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const documents = [];
    documentsSnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null,
        updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate() : null,
      });
    });

    res.status(200).json({ documents });
  } catch (error) {
    console.error('Error fetching user documents:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to fetch documents',
    });
  }
});

module.exports = router;
