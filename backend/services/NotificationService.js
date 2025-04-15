/**
 * NotificationService.js
 * Handles notifications for document status updates
 */

const { admin, db, USER_COLLECTION } = require('../config');

class NotificationService {
  /**
   * Send an in-app notification to a user
   * @param {string} userId - The Firebase user ID to notify
   * @param {string} title - The notification title
   * @param {string} message - The notification message
   * @param {Object} data - Additional data for the notification
   * @returns {string} The notification ID
   */
  async sendInAppNotification(userId, title, message, data = {}) {
    try {
      const notificationRef = db.collection('notifications').doc();

      await notificationRef.set({
        userId,
        title,
        message,
        data,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`In-app notification sent to user ${userId}`);
      return notificationRef.id;
    } catch (error) {
      console.error('Error sending in-app notification:', error);
      throw error;
    }
  }

  /**
   * Send an email notification to a user
   * @param {string} email - The recipient email address
   * @param {string} subject - The email subject
   * @param {string} text - The plain text email body
   * @param {string} html - The HTML email body
   * @returns {boolean} Success status
   */
  async sendEmailNotification(email, subject, text, html) {
    try {
      // In a production environment, this would use a proper email service
      // like SendGrid, Mailgun, or AWS SES
      console.log(`Email notification would be sent to ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);

      // Return true to simulate successful sending
      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  }

  /**
   * Notify a user about a document status change
   * @param {string} userId - The Firebase user ID to notify
   * @param {string} email - The user's email address
   * @param {string} documentId - The document ID
   * @param {string} documentName - The document name
   * @param {string} status - The new document status
   * @returns {Object} Notification IDs
   */
  async notifyDocumentStatusChange(
    userId,
    email,
    documentId,
    documentName,
    status
  ) {
    try {
      const title = `Document Status Update`;
      const message = `Your document "${documentName}" is now ${status}.`;
      const data = { documentId, status };

      // Send in-app notification
      const notificationId = await this.sendInAppNotification(
        userId,
        title,
        message,
        data
      );

      // Send email notification
      const emailSubject = `Document Status Update - ${status}`;
      const emailText = `Your document "${documentName}" is now ${status}. Please check your dashboard for more details.`;
      const emailHtml = `
        <h2>Document Status Update</h2>
        <p>Your document "${documentName}" is now <strong>${status}</strong>.</p>
        <p>Please check your dashboard for more details.</p>
      `;

      const emailSent = await this.sendEmailNotification(
        email,
        emailSubject,
        emailText,
        emailHtml
      );

      return { notificationId, emailSent };
    } catch (error) {
      console.error('Error notifying document status change:', error);
      throw error;
    }
  }

  /**
   * Notify an organization about a pending verification
   * @param {string} orgId - The organization's Firebase user ID
   * @param {string} orgEmail - The organization's email address
   * @param {string} documentId - The document ID
   * @param {string} documentName - The document name
   * @param {string} requesterName - The name of the user requesting verification
   * @returns {Object} Notification IDs
   */
  async notifyPendingVerification(
    orgId,
    orgEmail,
    documentId,
    documentName,
    requesterName
  ) {
    try {
      const title = `New Verification Request`;
      const message = `${requesterName} has requested verification for document "${documentName}".`;
      const data = { documentId };

      // Send in-app notification
      const notificationId = await this.sendInAppNotification(
        orgId,
        title,
        message,
        data
      );

      // Send email notification
      const emailSubject = `New Verification Request`;
      const emailText = `${requesterName} has requested verification for document "${documentName}". Please check your verification queue.`;
      const emailHtml = `
        <h2>New Verification Request</h2>
        <p>${requesterName} has requested verification for document "${documentName}".</p>
        <p>Please check your verification queue.</p>
      `;

      const emailSent = await this.sendEmailNotification(
        orgEmail,
        emailSubject,
        emailText,
        emailHtml
      );

      return { notificationId, emailSent };
    } catch (error) {
      console.error('Error notifying pending verification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
