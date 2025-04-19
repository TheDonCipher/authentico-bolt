/**
 * NotificationService.js
 * Handles notifications for document status updates and organization verification
 */

const { admin, adminDb, USER_COLLECTION } = require('../config');

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
      const notificationRef = adminDb.collection('notifications').doc();

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

  /**
   * Notify an organization about their verification status change
   * @param {string} orgId - The organization's Firebase user ID
   * @param {string} orgEmail - The organization's email address
   * @param {string} orgName - The organization name
   * @param {string} status - The new verification status ('approved' or 'rejected')
   * @param {string} notes - Optional notes/reason (especially for rejection)
   * @returns {Object} Notification IDs
   */
  async notifyOrganizationVerificationStatus(
    orgId,
    orgEmail,
    orgName,
    status,
    notes = ''
  ) {
    try {
      const title = `Organization Verification ${
        status.charAt(0).toUpperCase() + status.slice(1)
      }`;
      const message =
        status === 'approved'
          ? `Your organization ${orgName} has been verified! You can now verify documents.`
          : `Your organization verification was rejected. Reason: ${
              notes || 'No reason provided'
            }`;

      const data = { status, orgName };

      // Send in-app notification
      const notificationId = await this.sendInAppNotification(
        orgId,
        title,
        message,
        data
      );

      // Send email notification
      const emailSubject = `Organization Verification ${
        status.charAt(0).toUpperCase() + status.slice(1)
      }`;
      const emailText =
        status === 'approved'
          ? `Your organization ${orgName} has been verified! You can now verify documents submitted by users.`
          : `Your organization ${orgName} verification was rejected. Reason: ${
              notes || 'No reason provided'
            }`;

      const emailHtml =
        status === 'approved'
          ? `
          <h2>Organization Verification Approved</h2>
          <p>Congratulations! Your organization <strong>${orgName}</strong> has been verified.</p>
          <p>You can now verify documents submitted by users through the Authentico platform.</p>
          <p>Visit your <a href="${
            process.env.FRONTEND_URL || 'http://localhost:3000'
          }/organization-dashboard">Organization Dashboard</a> to get started.</p>
        `
          : `
          <h2>Organization Verification Rejected</h2>
          <p>We regret to inform you that your organization <strong>${orgName}</strong> verification request has been rejected.</p>
          <p><strong>Reason:</strong> ${notes || 'No reason provided'}</p>
          <p>You may submit a new application with the required corrections.</p>
        `;

      const emailSent = await this.sendEmailNotification(
        orgEmail,
        emailSubject,
        emailText,
        emailHtml
      );

      return { notificationId, emailSent };
    } catch (error) {
      console.error('Error notifying organization verification status:', error);
      throw error;
    }
  }

  /**
   * Notify admins about a new organization verification application
   * @param {string} orgName - The organization name
   * @param {string} applicationId - The application ID
   * @returns {boolean} Success status
   */
  async notifyAdminsNewApplication(orgName, applicationId) {
    try {
      // Get admin users
      const adminsSnapshot = await adminDb
        .collection(USER_COLLECTION)
        .where('userType', '==', 'admin')
        .get();

      if (adminsSnapshot.empty) {
        console.log('No admin users found to notify');
        return false;
      }

      const title = 'New Organization Verification Request';
      const message = `${orgName} has applied for organization verification.`;
      const data = { applicationId };

      // Notify each admin
      for (const adminDoc of adminsSnapshot.docs) {
        await this.sendInAppNotification(adminDoc.id, title, message, data);

        // If admin has email, send email notification
        const adminData = adminDoc.data();
        if (adminData.email) {
          await this.sendEmailNotification(
            adminData.email,
            title,
            message,
            `
              <h2>New Organization Verification Request</h2>
              <p>${orgName} has applied for organization verification.</p>
              <p>Please review this application in the <a href="${
                process.env.FRONTEND_URL || 'http://localhost:3000'
              }/admin">Admin Dashboard</a>.</p>
            `
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Error notifying admins about new application:', error);
      return false;
    }
  }
}

module.exports = new NotificationService();
