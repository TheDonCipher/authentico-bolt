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
const BlockchainService = require('../services/BlockchainService'); // Import the instance directly
const NotificationService = require('../services/NotificationService'); // Import the instance directly
const VerificationRequestService = require('../services/VerificationRequestService'); // Import the instance directly

// Instantiate other services
const encryptionService = new EncryptionService();
const storageService = new StorageService();

const {
  isValidDocumentType,
  getDocumentTypeName,
} = require('../constants/documentTypes');
const crypto = require('crypto');
const multer = require('multer');
const busboy = require('busboy');

// Configure multer storage with memory storage for better handling
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    fieldSize: 10 * 1024 * 1024, // 10MB field size limit
    fields: 20, // Maximum number of non-file fields
    parts: 30, // Maximum number of parts (fields + files)
  },
  fileFilter: (req, file, cb) => {
    // Log file details for debugging
    console.log(`Received file: ${file.originalname}, type: ${file.mimetype}`);

    // Accept only PDF, JPG, JPEG, and PNG files
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/png'
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Only PDF, JPG, JPEG, and PNG files are allowed. Received: ${file.mimetype}`
        )
      );
    }
  },
  // Add more robust error handling
  onError: function (err, next) {
    console.error('Multer error:', err);
    next(err);
  },
}); // 10MB limit

// Custom file parser for more robust handling
function parseMultipartForm(req, res, next) {
  // Only apply to multipart requests
  if (
    !req.headers['content-type'] ||
    !req.headers['content-type'].includes('multipart/form-data')
  ) {
    return next();
  }

  const bb = busboy({
    headers: req.headers,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1, // Only allow 1 file
      fields: 20,
    },
  });

  const fields = {};
  let fileBuffer = null;
  let fileName = '';
  let fileType = '';
  let fileError = null;

  bb.on('file', (name, file, info) => {
    const { filename, encoding, mimeType } = info;
    console.log(
      `Processing file: ${filename}, type: ${mimeType}, encoding: ${encoding}`
    );

    if (name !== 'document_file') {
      console.warn(
        `Unexpected file field name: ${name}, expected 'document_file'`
      );
    }

    // Check file type
    if (
      !['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(
        mimeType
      )
    ) {
      fileError = `Invalid file type: ${mimeType}. Only PDF, JPG, JPEG, and PNG files are allowed.`;
      file.resume(); // Drain the stream
      return;
    }

    const chunks = [];
    let fileSize = 0;

    file.on('data', (chunk) => {
      chunks.push(chunk);
      fileSize += chunk.length;

      // Check file size limit
      if (fileSize > 10 * 1024 * 1024) {
        fileError = 'File size exceeds the 10MB limit';
        file.resume(); // Drain the stream
      }
    });

    file.on('end', () => {
      if (!fileError) {
        fileBuffer = Buffer.concat(chunks);
        fileName = filename;
        fileType = mimeType;
        console.log(
          `File upload complete: ${filename}, size: ${fileSize} bytes`
        );
      }
    });
  });

  bb.on('field', (name, val) => {
    console.log(`Field: ${name} = ${val}`);
    fields[name] = val;
  });

  bb.on('close', () => {
    // If there was an error with the file
    if (fileError) {
      return res.status(400).json({
        error: 'FILE_ERROR',
        message: fileError,
      });
    }

    // If no file was uploaded
    if (!fileBuffer) {
      return res.status(400).json({
        error: 'FILE_MISSING',
        message:
          'No file was uploaded or the file field was not named "document_file"',
      });
    }

    // Add the parsed data to the request object
    req.body = fields;
    req.file = {
      buffer: fileBuffer,
      originalname: fileName,
      mimetype: fileType,
      size: fileBuffer.length,
    };

    next();
  });

  bb.on('error', (err) => {
    console.error('Busboy error:', err);
    res.status(400).json({
      error: 'UPLOAD_ERROR',
      message: `File upload error: ${err.message}`,
    });
  });

  req.pipe(bb);
}

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
router.post('/upload', verifyToken, parseMultipartForm, async (req, res) => {
  try {
    // Log the request headers for debugging
    console.log('Document upload request headers:', {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
    });

    // Input validation
    if (!req.file) {
      return res.status(400).json({
        error: 'FILE_MISSING',
        message: 'No file uploaded. Please ensure you have selected a file.',
      });
    }

    const { documentName, documentType, verifyingOrgId } = req.body;

    // Log the received form data for debugging
    console.log('Received form data:', {
      file: req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : null,
      documentName,
      documentType,
      verifyingOrgId,
    });

    if (!documentName || !documentType || !verifyingOrgId) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Missing required fields',
        details: {
          documentName: !documentName ? 'missing' : 'present',
          documentType: !documentType ? 'missing' : 'present',
          verifyingOrgId: !verifyingOrgId ? 'missing' : 'present',
        },
      });
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
    const encryptedFile = await EncryptionService.encryptFile(fileBuffer, dek);

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

        // Get the updated document data
        const updatedDocSnapshot = await docRef.get();
        const updatedDocData = updatedDocSnapshot.data();

        // Create a verification request
        const verificationRequestId =
          await VerificationRequestService.createVerificationRequest(
            docRef.id,
            updatedDocData
          );

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
 * Get direct view of a document (simplified view without decryption)
 * GET /api/documents/:documentId/direct-view
 */
router.get('/:documentId/direct-view', verifyToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log(
      `Direct document view requested for ID: ${documentId} by user: ${req.user.uid}`
    );

    // Get document from Firestore
    const docSnapshot = await documentsCollection.doc(documentId).get();

    if (!docSnapshot.exists) {
      console.log(`Document ${documentId} not found in Firestore`);
      return res.status(404).json({ error: 'Document not found' });
    }

    const docData = docSnapshot.data();
    console.log(
      `Document ${documentId} found. Owner: ${docData.ownerUid}, VerifyingOrg: ${docData.verifyingOrgId}`
    );

    // Check if user is authorized to access this document
    // Either the document owner or the verifying organization can access
    if (
      docData.ownerUid !== req.user.uid &&
      docData.verifyingOrgId !== req.user.uid
    ) {
      console.log(
        `User ${req.user.uid} not authorized to access document ${documentId}`
      );
      console.log(
        `Document owner: ${docData.ownerUid}, Verifying org: ${docData.verifyingOrgId}`
      );
      return res.status(403).json({
        error: 'Unauthorized access to document',
      });
    }

    console.log(
      `User ${req.user.uid} authorized to access document ${documentId}. Providing direct view.`
    );

    // Return basic document information
    res.json({
      id: docSnapshot.id,
      documentName: docData.documentName || 'Unnamed Document',
      documentType: docData.documentType || 'unknown',
      documentTypeName:
        docData.documentTypeName ||
        getDocumentTypeName(docData.documentType) ||
        'Unknown Type',
      status: docData.status || 'Unknown',
      ownerName: docData.ownerName || 'Unknown User',
      mimeType: docData.mimeType || 'application/octet-stream',
      // Include a placeholder for the document content
      decryptedFile: 'DOCUMENT_CONTENT_PLACEHOLDER',
      directView: true,
    });
  } catch (error) {
    console.error('Error in direct document view route:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

/**
 * Get secure document details for verification or viewing
 * GET /api/documents/:documentId/secure-details
 */
router.get('/:documentId/secure-details', verifyToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log(
      `Secure document details requested for ID: ${documentId} by user: ${req.user.uid}`
    );

    // Get document from Firestore
    const docSnapshot = await documentsCollection.doc(documentId).get();

    if (!docSnapshot.exists) {
      console.log(`Document ${documentId} not found in Firestore`);
      return res.status(404).json({ error: 'Document not found' });
    }

    const docData = docSnapshot.data();
    console.log(
      `Document ${documentId} found. Owner: ${docData.ownerUid}, VerifyingOrg: ${docData.verifyingOrgId}`
    );

    // Check if user is authorized to access this document
    // Either the document owner or the verifying organization can access
    if (
      docData.ownerUid !== req.user.uid &&
      docData.verifyingOrgId !== req.user.uid
    ) {
      console.log(
        `User ${req.user.uid} not authorized to access document ${documentId}`
      );
      console.log(
        `Document owner: ${docData.ownerUid}, Verifying org: ${docData.verifyingOrgId}`
      );
      return res.status(403).json({
        error: 'Unauthorized access to document',
      });
    }

    console.log(
      `User ${req.user.uid} authorized to access document ${documentId}. Proceeding with decryption.`
    );

    // For verifying organizations, check if they are verified
    if (
      docData.verifyingOrgId === req.user.uid &&
      docData.ownerUid !== req.user.uid
    ) {
      // Get organization data to check verification status
      const orgSnapshot = await usersCollection.doc(req.user.uid).get();

      if (!orgSnapshot.exists) {
        return res.status(403).json({
          error: 'Organization not found',
        });
      }

      const orgData = orgSnapshot.data();

      // Only verified organizations can view documents
      if (!orgData.isVerified) {
        return res.status(403).json({
          error: 'Only verified organizations can view documents',
        });
      }

      // Allow viewing documents in any status (verified, rejected, pending)
    }

    try {
      // Check if we have the required fields for decryption
      if (!docData.encryptedIpfsCid) {
        console.error(`Document ${documentId} is missing encryptedIpfsCid`);
        return res.status(400).json({
          error: 'Document is missing required encryption data',
          details: 'Missing IPFS CID',
        });
      }

      if (!docData.encryptedDek) {
        console.error(`Document ${documentId} is missing encryptedDek`);
        return res.status(400).json({
          error: 'Document is missing required encryption data',
          details: 'Missing encrypted DEK',
        });
      }

      console.log(
        `Retrieving encrypted file from IPFS with CID: ${docData.encryptedIpfsCid}`
      );

      // Get the encrypted file from IPFS
      const encryptedFile = await storageService.retrieveFromIPFS(
        docData.encryptedIpfsCid
      );

      console.log(
        `Successfully retrieved encrypted file from IPFS (${encryptedFile.length} bytes)`
      );

      // Decrypt the DEK
      console.log(`Decrypting DEK for document ${documentId}`);
      const encryptedDek = Buffer.from(docData.encryptedDek, 'base64');

      if (!process.env.MASTER_KEY_SECRET) {
        console.error('MASTER_KEY_SECRET environment variable is not set');
        return res.status(500).json({
          error: 'Server configuration error',
          details: 'Encryption key is not configured',
        });
      }

      const masterKey = crypto
        .createHash('sha256')
        .update(process.env.MASTER_KEY_SECRET)
        .digest();

      const dek = await encryptionService.decryptKey(encryptedDek, masterKey);
      console.log(`Successfully decrypted DEK (${dek.length} bytes)`);

      // Decrypt the file
      console.log(`Decrypting file content for document ${documentId}`);
      const decryptedFile = await encryptionService.decryptFile(
        encryptedFile,
        dek
      );
      console.log(
        `Successfully decrypted file (${decryptedFile.length} bytes)`
      );

      // Return the decrypted file and document details
      res.json({
        id: docSnapshot.id,
        documentName: docData.documentName || 'Unnamed Document',
        documentType: docData.documentType || 'unknown',
        documentTypeName:
          docData.documentTypeName ||
          getDocumentTypeName(docData.documentType) ||
          'Unknown Type',
        status: docData.status || 'Unknown',
        ownerName: docData.ownerName || 'Unknown User',
        decryptedFile: decryptedFile.toString('base64'),
        mimeType: docData.mimeType || 'application/octet-stream',
        fileSize: decryptedFile.length,
        decryptionSuccess: true,
      });
    } catch (decryptionError) {
      console.error(
        `Error decrypting document ${documentId}:`,
        decryptionError
      );

      // Return a more detailed error response
      return res.status(500).json({
        error: 'Document decryption failed',
        details: decryptionError.message,
        documentId: documentId,
        // Include basic document info that doesn't require decryption
        documentInfo: {
          id: docSnapshot.id,
          documentName: docData.documentName || 'Unnamed Document',
          documentType: docData.documentType || 'unknown',
          documentTypeName:
            docData.documentTypeName ||
            getDocumentTypeName(docData.documentType) ||
            'Unknown Type',
          status: docData.status || 'Unknown',
          ownerName: docData.ownerName || 'Unknown User',
          mimeType: docData.mimeType || 'application/octet-stream',
        },
      });
    }
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
    console.log('Received verification request body:', req.body);

    const validStatuses = ['verified', 'rejected', 'revoked'];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res
        .status(400)
        .json({ error: 'Invalid status value', validStatuses });
    }

    // Rejection reason is required for 'rejected' and 'revoked' statuses
    if (
      (status.toLowerCase() === 'rejected' ||
        status.toLowerCase() === 'revoked') &&
      !rejectionReason
    ) {
      return res.status(400).json({
        error: 'Rejection reason is required for rejected or revoked status',
      });
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
        error: 'Only the verifying organization can verify or revoke documents',
      });
    }

    // Check if document is in a valid state for the requested action
    const currentStatus = docData.status?.toLowerCase();
    const requestedStatus = status.toLowerCase();

    // Allow re-verification of documents in any status
    // This is a temporary fix to allow organizations to verify documents that were previously verified or rejected
    console.log(
      `Current document status: ${currentStatus}, Requested status: ${requestedStatus}`
    );

    // Only enforce status transitions for revocation
    if (requestedStatus === 'revoked' && currentStatus !== 'verified') {
      return res.status(400).json({
        error: `Document can only be revoked from 'Verified' status. Current status: ${docData.status}`,
      });
    }

    // Update document status in Firestore
    await documentsCollection.doc(documentId).update({
      status: `Updating Status to ${status}`, // Keep this for logging/intermediate state
      rejectionReason:
        status.toLowerCase() === 'rejected' ||
        status.toLowerCase() === 'revoked'
          ? rejectionReason
          : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update status on blockchain
    try {
      const blockchainResult = await BlockchainService.updateVerificationStatus(
        docData.tokenId,
        status, // Pass the requested status
        docData.orgWalletAddress
      );

      // Update document with blockchain confirmation and final status
      const updateData = {
        status: requestedStatus, // Set the final status
        verificationTransactionHash: blockchainResult.transactionHash,
        verificationBlockNumber: blockchainResult.blockNumber,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (requestedStatus === 'verified') {
        updateData.verifiedAt = admin.firestore.FieldValue.serverTimestamp();
      } else if (requestedStatus === 'rejected') {
        updateData.rejectedAt = admin.firestore.FieldValue.serverTimestamp();
      } else if (requestedStatus === 'revoked') {
        updateData.revokedAt = admin.firestore.FieldValue.serverTimestamp();
      }

      await documentsCollection.doc(documentId).update(updateData);

      // Update verification request status (if applicable)
      // Only update verification request if the document was pending verification
      if (currentStatus === 'pending verification') {
        await VerificationRequestService.updateVerificationRequestStatus(
          documentId,
          requestedStatus,
          requestedStatus === 'rejected' ? rejectionReason : null
        );
      }

      // Notify document owner (now handled by VerificationRequestService for initial verification/rejection)
      // Need to add notification for revocation separately if required.

      res.json({
        documentId,
        status: requestedStatus,
        message: `Document ${requestedStatus} successfully`,
        transactionHash: blockchainResult.transactionHash,
      });
    } catch (error) {
      console.error(`Error processing document ${requestedStatus}:`, error);
      // Update document to reflect blockchain failure
      await documentsCollection.doc(documentId).update({
        status: `${status} Failed`, // Indicate which action failed
        error: error.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Re-throw the error to be caught by the outer catch block
      throw error;
    }
  } catch (error) {
    console.error('Error handling document verification/revocation:', error);
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
