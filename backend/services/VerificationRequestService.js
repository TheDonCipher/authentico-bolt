/**
 * VerificationRequestService.js
 * Handles creation and management of verification requests
 */

const { admin, adminDb } = require('../config');
const NotificationService = require('./NotificationService');

class VerificationRequestService {
  /**
   * Create a verification request for a document
   * @param {string} documentId - The document ID
   * @param {Object} documentData - The document data
   * @returns {string} The verification request ID
   */
  async createVerificationRequest(documentId, documentData) {
    try {
      // Create a verification request in Firestore
      const verificationRequestRef = adminDb.collection('verificationRequests').doc();

      await verificationRequestRef.set({
        documentId: documentId,
        documentName: documentData.documentName || 'Unnamed Document',
        documentType: documentData.documentType || 'Unknown Type',
        documentTypeName: documentData.documentTypeName || 'Unknown Type',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ownerId: documentData.ownerUid,
        ownerName: documentData.ownerName || 'Unknown User',
        verifyingOrgId: documentData.verifyingOrgId,
        verifyingOrgName: documentData.verifyingOrgName || 'Unknown Organization',
        originalDocHash: documentData.originalDocHash,
        tokenId: documentData.tokenId,
        transactionHash: documentData.transactionHash,
      });

      console.log(`Created verification request ${verificationRequestRef.id} for document ${documentId}`);
      
      return verificationRequestRef.id;
    } catch (error) {
      console.error('Error creating verification request:', error);
      throw error;
    }
  }

  /**
   * Update a verification request status
   * @param {string} documentId - The document ID
   * @param {string} status - The new status ('verified' or 'rejected')
   * @param {string} rejectionReason - Optional rejection reason
   * @returns {boolean} Success status
   */
  async updateVerificationRequestStatus(documentId, status, rejectionReason = null) {
    try {
      // Find the verification request for this document
      const requestsSnapshot = await adminDb
        .collection('verificationRequests')
        .where('documentId', '==', documentId)
        .limit(1)
        .get();

      if (requestsSnapshot.empty) {
        console.log(`No verification request found for document ${documentId}`);
        return false;
      }

      const requestDoc = requestsSnapshot.docs[0];
      const requestData = requestDoc.data();

      // Update the verification request
      await requestDoc.ref.update({
        status: status.toLowerCase(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        rejectionReason: status.toLowerCase() === 'rejected' ? rejectionReason : null,
      });

      console.log(`Updated verification request ${requestDoc.id} status to ${status}`);

      // Send notification to document owner
      try {
        const userSnapshot = await adminDb.collection('users').doc(requestData.ownerId).get();
        if (userSnapshot.exists) {
          const userData = userSnapshot.data();
          
          // Create notification for document owner
          await NotificationService.sendInAppNotification(
            requestData.ownerId,
            `Document ${status}`,
            `Your document "${requestData.documentName}" has been ${status.toLowerCase()} by ${requestData.verifyingOrgName}.`,
            {
              documentId: documentId,
              status: status,
              verificationRequestId: requestDoc.id,
            }
          );
          
          // Send email if user has email
          if (userData.email) {
            await NotificationService.sendEmailNotification(
              userData.email,
              `Document ${status}`,
              `Your document "${requestData.documentName}" has been ${status.toLowerCase()} by ${requestData.verifyingOrgName}.`,
              `
                <h2>Document ${status}</h2>
                <p>Your document "${requestData.documentName}" has been ${status.toLowerCase()} by ${requestData.verifyingOrgName}.</p>
                <p>Please check your dashboard for more details.</p>
              `
            );
          }
        }
      } catch (notificationError) {
        console.error('Error sending notification to document owner:', notificationError);
        // Continue with the process even if notification fails
      }

      return true;
    } catch (error) {
      console.error('Error updating verification request status:', error);
      throw error;
    }
  }
}

module.exports = new VerificationRequestService();
