/**
 * documentRoutes.js
 * API routes for document operations
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../authMiddleware');
const { admin, adminDb, USER_COLLECTION } = require('../config');
const EncryptionService = require('../services/EncryptionService');
const StorageService = require('../services/StorageService');
const BlockchainService = require('../services/BlockchainService');
const NotificationService = require('../services/NotificationService');
const {
  isValidDocumentType,
  getDocumentTypeName,
} = require('../constants/documentTypes');
const crypto = require('crypto');
const multer = require('multer');
// Configure multer storage with memory storage for better handling
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only PDF, JPG, JPEG, and PNG files
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/png'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
    }
  },
}); // 10MB limit

// Collection references - use adminDb for server-side operations
const documentsCollection = adminDb.collection('documents');
const usersCollection = adminDb.collection(USER_COLLECTION);

/**
 * Get all document types - public endpoint, no authentication required
 * GET /api/documents/types
 */
router.get('/types', async (req, res) => {
  try {
    const documentTypes =
      require('../constants/documentTypes').getAllDocumentTypes();
    res.json(documentTypes);
  } catch (error) {
    console.error('Error getting document types:', error);
    res.status(500).json({
      error: 'Failed to get document types',
      details: error.message,
    });
  }
});

/**
 * Upload and process a document
 * POST /api/documents/upload
 */
router.post('/upload', verifyToken, (req, res) => {
  console.log('Document upload request received');
  console.log('Headers:', req.headers);

  // Use multer middleware manually to better handle errors
  const uploadMiddleware = upload.single('document_file');

  uploadMiddleware(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      console.error('Request headers:', req.headers);

      // Log more details about the request
      console.error('Content-Type:', req.headers['content-type']);
      console.error('Content-Length:', req.headers['content-length']);
      console.error('Request method:', req.method);
      console.error('Request URL:', req.originalUrl);
      console.error(
        'Authorization header present:',
        !!req.headers['authorization']
      );
      console.error('Request body:', req.body);
      console.error('Request files:', req.files);

      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'FILE_TOO_LARGE',
          message: 'The uploaded file exceeds the size limit (10MB)',
        });
      }

      // Check for specific multer errors
      if (err.message === 'Unexpected end of form') {
        return res.status(400).json({
          error: 'INCOMPLETE_FORM_DATA',
          message:
            'The form data was incomplete or malformed. Please ensure all required fields are provided.',
          details:
            'This error often occurs when the Content-Type header is incorrect or when the form data is truncated.',
        });
      }

      return res.status(400).json({
        error: 'FILE_UPLOAD_ERROR',
        message: `File upload error: ${err.message}`,
        details: err.stack || 'No additional details available',
      });
    }

    // Continue with the rest of the handler
    try {
      // Input validation
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { documentName, documentType, verifyingOrgId } = req.body;

      if (!documentName || !documentType || !verifyingOrgId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate document type
      if (!isValidDocumentType(documentType)) {
        return res.status(400).json({
          error: 'INVALID_DOCUMENT_TYPE',
          message: `Invalid document type: ${documentType}`,
          validTypes: require('../constants/documentTypes')
            .getAllDocumentTypes()
            .map((type) => ({ id: type.id, name: type.name })),
        });
      }

      // Get user information
      const userSnapshot = await usersCollection.doc(req.user.uid).get();
      if (!userSnapshot.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userData = userSnapshot.data();
      const userWalletAddress = userData.walletAddress;

      if (!userWalletAddress) {
        return res.status(400).json({ error: 'User wallet address not found' });
      }

      // Get organization information
      const orgSnapshot = await usersCollection.doc(verifyingOrgId).get();
      if (!orgSnapshot.exists) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      const orgData = orgSnapshot.data();
      const orgWalletAddress = orgData.walletAddress;

      if (!orgWalletAddress) {
        return res
          .status(400)
          .json({ error: 'Organization wallet address not found' });
      }

      // Process the file
      const fileBuffer = req.file.buffer;

      // Calculate hash of original document
      const originalDocHash = EncryptionService.calculateHash(fileBuffer);

      // Generate a data encryption key (DEK)
      const dek = await EncryptionService.generateKey();

      // In a production environment, this would use a KMS service
      // For this implementation, we'll use a master key derived from an environment variable
      const masterKey = crypto
        .createHash('sha256')
        .update(process.env.MASTER_KEY_SECRET)
        .digest();

      // Encrypt the DEK with the master key
      const encryptedDek = await EncryptionService.encryptKey(dek, masterKey);

      // Encrypt the file with the DEK
      const encryptedFile = await EncryptionService.encryptFile(
        fileBuffer,
        dek
      );

      // Upload encrypted file to IPFS
      const ipfsResponse = await StorageService.uploadToIPFS(
        encryptedFile,
        `${Date.now()}-${req.file.originalname}`,
        { documentType }
      );

      const encryptedIpfsCid = ipfsResponse.IpfsHash;

      // Store document metadata in Firestore
      const docRef = await documentsCollection.add({
        ownerUid: req.user.uid,
        ownerName: userData.name || 'Unknown',
        verifyingOrgId,
        verifyingOrgName: orgData.name || 'Unknown',
        documentName,
        documentType,
        documentTypeName: getDocumentTypeName(documentType),
        originalDocHash,
        encryptedIpfsCid,
        encryptedDek: encryptedDek.toString('base64'),
        status: 'Pending Blockchain Submission',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        userWalletAddress,
        orgWalletAddress,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      // Trigger asynchronous blockchain anchoring
      // In a production environment, this would use a queue or a separate Cloud Function
      setTimeout(async () => {
        try {
          // Update status to "Submitting to Blockchain"
          await docRef.update({
            status: 'Submitting to Blockchain',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Register document on blockchain
          const blockchainResult = await BlockchainService.registerDocument(
            originalDocHash,
            userWalletAddress,
            orgWalletAddress,
            documentType,
            encryptedIpfsCid
          );

          // Update document with blockchain information
          await docRef.update({
            status: 'Pending Verification',
            transactionHash: blockchainResult.transactionHash,
            blockNumber: blockchainResult.blockNumber,
            tokenId: blockchainResult.tokenId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Notify organization about pending verification
          await NotificationService.notifyPendingVerification(
            verifyingOrgId,
            orgData.email,
            docRef.id,
            documentName,
            userData.name || 'A user'
          );
        } catch (error) {
          console.error('Error in blockchain anchoring:', error);

          // Update document status to reflect failure
          await docRef.update({
            status: 'Blockchain Failed',
            error: error.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }, 0);

      // Return success response immediately
      res.status(201).json({
        documentId: docRef.id,
        status: 'Pending Blockchain Submission',
        message:
          'Document uploaded successfully and queued for blockchain submission',
      });
    } catch (error) {
      console.error('Error uploading document:', error);

      // Provide more detailed error information based on the error type
      if (error.name === 'MulterError') {
        // Handle multer-specific errors
        return res.status(400).json({
          error: 'FILE_UPLOAD_ERROR',
          message: `File upload error: ${error.message}`,
          details: error.field || 'document_file',
        });
      } else if (error.code === 'LIMIT_FILE_SIZE') {
        // Handle file size limit errors
        return res.status(413).json({
          error: 'FILE_TOO_LARGE',
          message: 'The uploaded file exceeds the size limit (10MB)',
          details: error.message,
        });
      } else if (error.message && error.message.includes('IPFS')) {
        // Handle IPFS storage errors
        return res.status(502).json({
          error: 'STORAGE_ERROR',
          message: 'Failed to store document in IPFS',
          details: error.message,
        });
      } else if (error.message && error.message.includes('Firebase')) {
        // Handle Firestore errors
        return res.status(500).json({
          error: 'DATABASE_ERROR',
          message: 'Failed to store document metadata',
          details: error.message,
        });
      }

      // Default error response
      res.status(500).json({
        error: 'DOCUMENT_UPLOAD_FAILED',
        message: 'Document upload failed due to an unexpected error',
        details: error.message,
      });
    }
  });
});

/**
 * Get document details
 * GET /api/documents/:documentId
 */
router.get('/:documentId', verifyToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    // Get document from Firestore
    const docSnapshot = await documentsCollection.doc(documentId).get();

    if (!docSnapshot.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const docData = docSnapshot.data();

    // Check if user is authorized to access this document
    if (
      docData.ownerUid !== req.user.uid &&
      docData.verifyingOrgId !== req.user.uid
    ) {
      return res.status(403).json({ error: 'Unauthorized access to document' });
    }

    // Return document details (excluding sensitive fields)
    res.json({
      id: docSnapshot.id,
      documentName: docData.documentName,
      documentType: docData.documentType,
      documentTypeName:
        docData.documentTypeName || getDocumentTypeName(docData.documentType),
      status: docData.status,
      createdAt: docData.createdAt.toDate(),
      updatedAt: docData.updatedAt ? docData.updatedAt.toDate() : null,
      ownerName: docData.ownerName,
      verifyingOrgName: docData.verifyingOrgName,
      transactionHash: docData.transactionHash,
      tokenId: docData.tokenId,
      originalDocHash: docData.originalDocHash,
    });
  } catch (error) {
    console.error('Error getting document details:', error);
    res.status(500).json({
      error: 'Failed to get document details',
      details: error.message,
    });
  }
});

/**
 * Get secure document details for verification
 * GET /api/documents/:documentId/secure-details
 */
router.get('/:documentId/secure-details', verifyToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    // Get document from Firestore
    const docSnapshot = await documentsCollection.doc(documentId).get();

    if (!docSnapshot.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const docData = docSnapshot.data();

    // Check if user is the verifying organization
    if (docData.verifyingOrgId !== req.user.uid) {
      return res.status(403).json({
        error: 'Only the verifying organization can access secure details',
      });
    }

    // Get the encrypted file from IPFS
    const encryptedFile = await StorageService.retrieveFromIPFS(
      docData.encryptedIpfsCid
    );

    // Decrypt the DEK
    const encryptedDek = Buffer.from(docData.encryptedDek, 'base64');
    const masterKey = crypto
      .createHash('sha256')
      .update(process.env.MASTER_KEY_SECRET)
      .digest();
    const dek = await EncryptionService.decryptKey(encryptedDek, masterKey);

    // Decrypt the file
    const decryptedFile = await EncryptionService.decryptFile(
      encryptedFile,
      dek
    );

    // Return the decrypted file and document details
    res.json({
      id: docSnapshot.id,
      documentName: docData.documentName,
      documentType: docData.documentType,
      documentTypeName:
        docData.documentTypeName || getDocumentTypeName(docData.documentType),
      status: docData.status,
      ownerName: docData.ownerName,
      decryptedFile: decryptedFile.toString('base64'),
      mimeType: docData.mimeType,
    });
  } catch (error) {
    console.error('Error getting secure document details:', error);
    res.status(500).json({
      error: 'Failed to get secure document details',
      details: error.message,
    });
  }
});

/**
 * Verify or reject a document
 * POST /api/documents/:documentId/verify
 */
router.post('/:documentId/verify', verifyToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status || !['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (status === 'Rejected' && !rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Get document from Firestore
    const docSnapshot = await documentsCollection.doc(documentId).get();

    if (!docSnapshot.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const docData = docSnapshot.data();

    // Check if user is the verifying organization
    if (docData.verifyingOrgId !== req.user.uid) {
      return res.status(403).json({
        error: 'Only the verifying organization can verify documents',
      });
    }

    // Check if document is in a verifiable state
    if (docData.status !== 'Pending Verification') {
      return res.status(400).json({
        error: `Document cannot be verified in status: ${docData.status}`,
      });
    }

    // Update document status in Firestore
    await documentsCollection.doc(documentId).update({
      status: `Updating Status to ${status}`,
      rejectionReason: status === 'Rejected' ? rejectionReason : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update status on blockchain
    try {
      const blockchainResult = await BlockchainService.updateVerificationStatus(
        docData.tokenId,
        status,
        docData.orgWalletAddress
      );

      // Update document with blockchain confirmation
      await documentsCollection.doc(documentId).update({
        status,
        verificationTransactionHash: blockchainResult.transactionHash,
        verificationBlockNumber: blockchainResult.blockNumber,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Notify document owner
      const ownerSnapshot = await usersCollection.doc(docData.ownerUid).get();
      if (ownerSnapshot.exists) {
        const ownerData = ownerSnapshot.data();
        await NotificationService.notifyDocumentStatusChange(
          docData.ownerUid,
          ownerData.email,
          documentId,
          docData.documentName,
          status
        );
      }

      res.json({
        documentId,
        status,
        message: `Document ${status.toLowerCase()} successfully`,
        transactionHash: blockchainResult.transactionHash,
      });
    } catch (error) {
      // Update document to reflect blockchain failure
      await documentsCollection.doc(documentId).update({
        status: 'Verification Failed',
        error: error.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      throw error;
    }
  } catch (error) {
    console.error('Error verifying document:', error);
    res
      .status(500)
      .json({ error: 'Document verification failed', details: error.message });
  }
});

/**
 * Get all documents for the current user
 * GET /api/documents
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    let query;

    // Get user information to determine role
    const userSnapshot = await usersCollection.doc(req.user.uid).get();

    if (!userSnapshot.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userSnapshot.data();

    // Different queries based on user type
    if (userData.userType === 'individual') {
      // For individuals, get documents they own
      query = documentsCollection.where('ownerUid', '==', req.user.uid);
    } else if (userData.userType === 'organization') {
      // For organizations, get documents they are verifying
      query = documentsCollection.where('verifyingOrgId', '==', req.user.uid);
    } else {
      return res.status(403).json({ error: 'Invalid user type' });
    }

    // Execute query
    const snapshot = await query.orderBy('createdAt', 'desc').get();

    // Format results
    const documents = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        documentName: data.documentName,
        documentType: data.documentType,
        documentTypeName:
          data.documentTypeName || getDocumentTypeName(data.documentType),
        status: data.status,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
        ownerName: data.ownerName,
        verifyingOrgName: data.verifyingOrgName,
        transactionHash: data.transactionHash,
        tokenId: data.tokenId,
      };
    });

    res.json(documents);
  } catch (error) {
    console.error('Error getting documents:', error);
    res
      .status(500)
      .json({ error: 'Failed to get documents', details: error.message });
  }
});

module.exports = router;
