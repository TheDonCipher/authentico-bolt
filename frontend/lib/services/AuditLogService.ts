import { db } from '../firebase-admin-server.js';
import { FieldValue } from 'firebase-admin/firestore';
import { OrganizationVerificationStatus } from '../../app/types/user';

/**
 * Service for creating and managing audit logs
 */
export class AuditLogService {
  /**
   * Log a verification status change
   * @param organizationId The ID of the organization
   * @param oldStatus The previous verification status
   * @param newStatus The new verification status
   * @param updatedBy The ID of the user who made the change
   * @param notes Optional notes about the change
   * @returns The ID of the created audit log entry
   */
  static async logVerificationStatusChange(
    organizationId: string,
    oldStatus: OrganizationVerificationStatus,
    newStatus: OrganizationVerificationStatus,
    updatedBy: string,
    notes?: string
  ): Promise<string> {
    try {
      console.log(
        `Creating audit log for organization ${organizationId} status change from ${oldStatus} to ${newStatus}`
      );

      // Get organization name
      let organizationName = 'Unknown Organization';
      try {
        const orgDoc = await db.collection('users').doc(organizationId).get();
        if (orgDoc.exists) {
          const orgData = orgDoc.data();
          organizationName =
            orgData?.organizationName ||
            orgData?.name ||
            'Unknown Organization';
        } else {
          console.warn(
            `Organization with ID ${organizationId} not found when creating audit log`
          );
        }
      } catch (orgError) {
        console.error(`Error getting organization data: ${orgError.message}`);
        // Continue with default organization name
      }

      // Get updater name
      let updaterName = 'Unknown User';
      try {
        const updaterDoc = await db.collection('users').doc(updatedBy).get();
        if (updaterDoc.exists) {
          const updaterData = updaterDoc.data();
          updaterName = updaterData?.name || 'Unknown User';
        } else {
          console.warn(
            `User with ID ${updatedBy} not found when creating audit log`
          );
        }
      } catch (userError) {
        console.error(`Error getting updater data: ${userError.message}`);
        // Continue with default updater name
      }

      // Create audit log entry
      const auditLogRef = await db.collection('verificationAuditLogs').add({
        organizationId,
        organizationName,
        oldStatus,
        newStatus,
        updatedBy,
        updatedByName: updaterName,
        updatedAt: FieldValue.serverTimestamp(),
        notes: notes || null,
      });

      console.log(`Successfully created audit log with ID ${auditLogRef.id}`);

      return auditLogRef.id;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for an organization
   * @param organizationId The ID of the organization
   * @returns Array of audit log entries
   */
  static async getOrganizationAuditLogs(organizationId: string) {
    try {
      const snapshot = await db
        .collection('verificationAuditLogs')
        .where('organizationId', '==', organizationId)
        .orderBy('updatedAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate() : null,
      }));
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Get all audit logs (admin only)
   * @returns Array of all audit log entries
   */
  static async getAllAuditLogs() {
    try {
      const snapshot = await db
        .collection('verificationAuditLogs')
        .orderBy('updatedAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate() : null,
      }));
    } catch (error) {
      console.error('Error getting all audit logs:', error);
      throw error;
    }
  }
}
