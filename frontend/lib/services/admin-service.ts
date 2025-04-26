/**
 * Admin Service
 *
 * This service handles admin-specific operations for the Authentico application.
 */

import { SecureApiClient } from '../api/secure-api-client';
import { IUser } from './auth-service';

/**
 * Organization interface
 */
export interface IOrganization {
  id: string;
  name: string;
  description?: string;
  website?: string;
  isVerified: boolean;
  verificationStatus?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Document interface
 */
export interface IDocument {
  id: string;
  name: string;
  type: string;
  status: string;
  ownerId: string;
  verifyingOrgId?: string;
  ipfsHash?: string;
  transactionHash?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Application interface
 */
export interface Application {
  id: string;
  organizationId: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: string[];
  notes: string;
  createdAt: string;
  organization?: IOrganization;
}

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: any;
  timestamp: string;
  user?: IUser;
}

/**
 * Platform statistics interface
 */
export interface PlatformStatistics {
  totalUsers: number;
  totalOrganizations: number;
  totalDocuments: number;
  verifiedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  verifiedOrganizations: number;
  pendingOrganizations: number;
  rejectedOrganizations: number;
  documentsPerDay: { date: string; count: number }[];
  usersPerDay: { date: string; count: number }[];
}

/**
 * Admin service class
 */
export class AdminService {
  private apiClient: SecureApiClient;

  /**
   * Create a new admin service
   * @param apiClient Secure API client
   */
  constructor(apiClient: SecureApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get platform statistics
   * @returns Platform statistics
   */
  async getPlatformStatistics(): Promise<PlatformStatistics> {
    try {
      const response = await this.apiClient.get('/admin/statistics');
      return response.data;
    } catch (error) {
      console.error('Error getting platform statistics:', error);
      throw error;
    }
  }

  /**
   * Get all users
   * @param page Page number
   * @param limit Number of users per page
   * @returns List of users
   */
  async getUsers(
    page: number = 1,
    limit: number = 10
  ): Promise<{ users: IUser[]; total: number }> {
    try {
      const response = await this.apiClient.get(
        `/admin/users?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Get all organizations
   * @param page Page number
   * @param limit Number of organizations per page
   * @returns List of organizations
   */
  async getOrganizations(
    page: number = 1,
    limit: number = 10
  ): Promise<{ organizations: IOrganization[]; total: number }> {
    try {
      const response = await this.apiClient.get(
        `/admin/organizations?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting organizations:', error);
      throw error;
    }
  }

  /**
   * Get all documents
   * @param page Page number
   * @param limit Number of documents per page
   * @returns List of documents
   */
  async getDocuments(
    page: number = 1,
    limit: number = 10
  ): Promise<{ documents: IDocument[]; total: number }> {
    try {
      const response = await this.apiClient.get(
        `/admin/documents?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  /**
   * Get pending applications
   * @returns List of pending applications
   */
  async getPendingApplications(): Promise<Application[]> {
    try {
      const response = await this.apiClient.get(
        '/admin/applications?status=pending'
      );
      return response.data.applications || [];
    } catch (error) {
      console.error('Error getting pending applications:', error);
      throw error;
    }
  }

  /**
   * Get audit logs
   * @param page Page number
   * @param limit Number of logs per page
   * @returns List of audit logs
   */
  async getAuditLogs(
    page: number = 1,
    limit: number = 10
  ): Promise<{ logs: AuditLogEntry[]; total: number }> {
    try {
      const response = await this.apiClient.get(
        `/admin/audit-logs?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Disable a user
   * @param userId User ID
   * @param reason Reason for disabling
   * @returns Success response
   */
  async disableUser(
    userId: string,
    reason: string
  ): Promise<{ success: boolean }> {
    try {
      const response = await this.apiClient.put(
        `/admin/users/${userId}/disable`,
        { reason }
      );
      return response.data;
    } catch (error) {
      console.error('Error disabling user:', error);
      throw error;
    }
  }

  /**
   * Enable a user
   * @param userId User ID
   * @returns Success response
   */
  async enableUser(userId: string): Promise<{ success: boolean }> {
    try {
      const response = await this.apiClient.put(
        `/admin/users/${userId}/enable`
      );
      return response.data;
    } catch (error) {
      console.error('Error enabling user:', error);
      throw error;
    }
  }

  /**
   * Disable an organization
   * @param organizationId Organization ID
   * @param reason Reason for disabling
   * @returns Success response
   */
  async disableOrganization(
    organizationId: string,
    reason: string
  ): Promise<{ success: boolean }> {
    try {
      const response = await this.apiClient.put(
        `/admin/organizations/${organizationId}/disable`,
        { reason }
      );
      return response.data;
    } catch (error) {
      console.error('Error disabling organization:', error);
      throw error;
    }
  }

  /**
   * Enable an organization
   * @param organizationId Organization ID
   * @returns Success response
   */
  async enableOrganization(
    organizationId: string
  ): Promise<{ success: boolean }> {
    try {
      const response = await this.apiClient.put(
        `/admin/organizations/${organizationId}/enable`
      );
      return response.data;
    } catch (error) {
      console.error('Error enabling organization:', error);
      throw error;
    }
  }
}
