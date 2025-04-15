/**
 * documentRoutes.js
 * API routes for document operations
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../authMiddleware');
const { admin, db, USER_COLLECTION } = require('../config');
const EncryptionService = require('../services/EncryptionService');
const StorageService = require('../services/StorageService');
const BlockchainService = require('../services/BlockchainService');
const NotificationService = require('../services/NotificationService');
const crypto = require('crypto');
const multer = require('multer');
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Collection references
const documentsCollection = db.collection('documents');
const usersCollection = db.collection(USER_COLLECTION);

/**
 * Upload and process a document
 * POST /api/documents/upload
 */
router.post(
  '/upload',
  verifyToken,
  upload.single('document_file'),
  async (req, res) => {
    try {
      // Input validation
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { documentName, documentType, verifyingOrgId } = req.body;

      if (!documentName || !documentType || !verifyingOrgId) {
        return res.status(400).json({ error: 'Missing required fields' });
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
      res
        .status(500)
        .json({ error: 'Document upload failed', details: error.message });
    }
  }
);

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
    res
      .status(500)
      .json({
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
      return res
        .status(403)
        .json({
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
      status: docData.status,
      ownerName: docData.ownerName,
      decryptedFile: decryptedFile.toString('base64'),
      mimeType: docData.mimeType,
    });
  } catch (error) {
    console.error('Error getting secure document details:', error);
    res
      .status(500)
      .json({
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
      return res
        .status(403)
        .json({
          error: 'Only the verifying organization can verify documents',
        });
    }

    // Check if document is in a verifiable state
    if (docData.status !== 'Pending Verification') {
      return res
        .status(400)
        .json({
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
