/**
 * verificationRoutes.js
 * API routes for public document verification
 */

const express = require('express');
const router = express.Router();
const { admin, adminDb, USER_COLLECTION } = require('../config');
const BlockchainService = require('../services/BlockchainService');

// Collection references - use adminDb for server-side operations
const documentsCollection = adminDb.collection('documents');

/**
 * Get public verification details for a document
 * GET /api/verify/:documentId
 * Public endpoint - no authentication required
 */
router.get('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;

    // Get document from Firestore
    const docSnapshot = await documentsCollection.doc(documentId).get();

    if (!docSnapshot.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const docData = docSnapshot.data();

    // Check if document has been submitted to blockchain
    if (!docData.tokenId) {
      return res.status(400).json({ 
        error: 'Document has not been anchored on the blockchain yet',
        status: docData.status
      });
    }

    // Optional: Verify on-chain status
    let onChainStatus = null;
    try {
      const blockchainDetails = await BlockchainService.getDocumentDetails(docData.tokenId);
      onChainStatus = blockchainDetails.status;
    } catch (blockchainError) {
      console.warn('Could not verify on-chain status:', blockchainError);
      // Continue with Firestore data if blockchain verification fails
    }

    // Return only public verification details
    res.json({
      id: docSnapshot.id,
      documentName: docData.documentName,
      documentType: docData.documentType,
      documentTypeName: docData.documentTypeName,
      status: onChainStatus || docData.status, // Use on-chain status if available
      createdAt: docData.createdAt.toDate(),
      updatedAt: docData.updatedAt ? docData.updatedAt.toDate() : null,
      verifiedAt: docData.verifiedAt ? docData.verifiedAt.toDate() : null,
      ownerName: docData.ownerName,
      verifyingOrgName: docData.verifyingOrgName,
      transactionHash: docData.transactionHash,
      verificationTransactionHash: docData.verificationTransactionHash,
      tokenId: docData.tokenId,
      originalDocHash: docData.originalDocHash,
      // Do NOT include: encryptedIpfsCid, encryptedDek, ownerUid, verifyingOrgId
    });
  } catch (error) {
    console.error('Error getting document verification details:', error);
    res.status(500).json({
      error: 'Failed to get document verification details',
      details: error.message,
    });
  }
});

module.exports = router;
