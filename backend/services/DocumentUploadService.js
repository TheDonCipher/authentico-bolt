/**
 * DocumentUploadService.js
 * Handles secure document upload, encryption, and storage
 */

const crypto = require('crypto');
const { admin, adminDb } = require('../config');
const EncryptionService = require('./EncryptionService');
const StorageService = require('./StorageService');
const BlockchainService = require('./BlockchainService');
const NotificationService = require('./NotificationService');
const VerificationRequestService = require('./VerificationRequestService');

// Initialize services
const encryptionService = new EncryptionService();
const storageService = new StorageService();
// Note: BlockchainService is already a singleton instance
// Note: NotificationService is already a singleton instance
// Note: VerificationRequestService is already a singleton instance

class DocumentUploadService {
  constructor() {
    console.log('DocumentUploadService initialized');
    this.documentsCollection = adminDb.collection('documents');
    this.usersCollection = adminDb.collection('users');
  }

  /**
   * Process and upload a document securely
   * @param {Object} file - The file object from multer
   * @param {Object} metadata - Document metadata
   * @param {string} metadata.documentName - Name of the document
   * @param {string} metadata.documentType - Type of the document
   * @param {string} metadata.verifyingOrgId - ID of the verifying organization
   * @param {Object} user - User information
   * @param {string} user.uid - User ID
   * @param {string} user.walletAddress - User's wallet address
   * @returns {Promise<Object>} Upload result with document ID
   */
  async uploadDocument(file, metadata, user) {
    try {
      console.log('Document upload requested:', {
        fileName: file.originalname,
        documentName: metadata.documentName,
        documentType: metadata.documentType,
        verifyingOrgId: metadata.verifyingOrgId,
        userUid: user.uid,
        userWalletAddress: user.walletAddress,
      });

      // Validate inputs
      if (!file || !file.buffer) {
        throw new Error('Invalid file object');
      }

      if (
        !metadata ||
        !metadata.documentName ||
        !metadata.documentType ||
        !metadata.verifyingOrgId
      ) {
        throw new Error('Invalid document metadata');
      }

      if (!user || !user.uid) {
        throw new Error('Invalid user information');
      }

      // Get user information
      const userSnapshot = await this.usersCollection.doc(user.uid).get();
      if (!userSnapshot.exists) {
        throw new Error('User not found');
      }
      const userData = userSnapshot.data();
      const userWalletAddress =
        user.walletAddress || userData.walletAddress || '';

      // Get organization information
      const orgSnapshot = await this.usersCollection
        .doc(metadata.verifyingOrgId)
        .get();
      if (!orgSnapshot.exists) {
        throw new Error('Organization not found');
      }
      const orgData = orgSnapshot.data();
      const orgWalletAddress = orgData.walletAddress || '';

      // Process the file
      const fileBuffer = file.buffer;

      // Calculate hash of original document
      const originalDocHash = encryptionService.calculateHash(fileBuffer);

      // Generate a data encryption key (DEK)
      const dek = await encryptionService.generateKey();

      // In a production environment, this would use a KMS service
      // For this implementation, we'll use a master key derived from an environment variable
      const masterKey = crypto
        .createHash('sha256')
        .update(process.env.MASTER_KEY_SECRET)
        .digest();

      // Encrypt the DEK with the master key
      const encryptedDek = await encryptionService.encryptKey(dek, masterKey);

      // Encrypt the file with the DEK
      const encryptedFile = await encryptionService.encryptFile(
        fileBuffer,
        dek
      );

      // Upload encrypted file to IPFS
      const ipfsResponse = await storageService.uploadToIPFS(
        encryptedFile,
        `${Date.now()}-${file.originalname}`,
        { documentType: metadata.documentType }
      );

      const encryptedIpfsCid = ipfsResponse.IpfsHash;

      // Store document metadata in Firestore
      const docRef = await this.documentsCollection.add({
        ownerUid: user.uid,
        ownerName: userData.name || 'Unknown',
        verifyingOrgId: metadata.verifyingOrgId,
        verifyingOrgName: orgData.name || 'Unknown',
        documentName: metadata.documentName,
        documentType: metadata.documentType,
        documentTypeName: this.getDocumentTypeName(metadata.documentType),
        originalDocHash,
        encryptedIpfsCid,
        encryptedDek: encryptedDek.toString('base64'),
        status: 'Pending Blockchain Submission',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        userWalletAddress,
        orgWalletAddress,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      console.log('Document stored in Firestore with ID:', docRef.id);
      console.log('Document uploaded to IPFS with CID:', encryptedIpfsCid);

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
            metadata.documentType,
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
            metadata.verifyingOrgId,
            orgData.email,
            docRef.id,
            metadata.documentName,
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

      return {
        documentId: docRef.id,
        status: 'Pending Blockchain Submission',
        message:
          'Document uploaded successfully and queued for blockchain submission',
      };
    } catch (error) {
      console.error('Error in DocumentUploadService.uploadDocument:', error);
      throw error;
    }
  }

  /**
   * Create a notification for the verifying organization
   * @param {string} userId - User ID who uploaded the document
   * @param {string} orgId - Organization ID to notify
   * @param {string} documentId - Document ID
   * @param {string} documentName - Document name
   * @returns {Promise<void>}
   */
  async createVerificationNotification(
    userId,
    orgId,
    documentId,
    documentName
  ) {
    console.log('Creating verification notification:', {
      userId,
      orgId,
      documentId,
      documentName,
    });
    // In development mode, we just log the notification
  }

  /**
   * Get document type name from type code
   * @param {string} typeCode - Document type code
   * @returns {string} Document type name
   */
  getDocumentTypeName(typeCode) {
    const documentTypes = {
      identity: 'Identity Document',
      financial: 'Financial Document',
      educational: 'Educational Certificate',
      medical: 'Medical Record',
      legal: 'Legal Document',
      property: 'Property Document',
      other: 'Other Document',
    };

    return documentTypes[typeCode] || 'Unknown Document Type';
  }
}

module.exports = DocumentUploadService;
