/**
 * Organization Service for Authentico
 * 
 * This service provides methods for managing organizations, including creating,
 * retrieving, updating, and deleting organizations.
 */

import { IApiClient } from '../api/api-interfaces';

/**
 * Organization service implementation
 */
export class OrganizationService {
  private apiClient: IApiClient;
  
  /**
   * Create a new organization service
   * @param apiClient API client to use for making requests
   */
  constructor(apiClient: IApiClient) {
    this.apiClient = apiClient;
  }
  
  /**
   * Get an organization by ID
   * @param organizationId ID of the organization to retrieve
   * @returns Promise with the organization data
   */
  async getOrganizationById(organizationId: string): Promise<any> {
    return this.apiClient.get(`/organizations/${organizationId}`);
  }
  
  /**
   * Get all organizations
   * @param page Page number
   * @param limit Number of organizations per page
   * @returns Promise with the organizations data
   */
  async getAllOrganizations(page: number = 1, limit: number = 10): Promise<any> {
    return this.apiClient.get('/organizations', {
      params: { page, limit },
    });
  }
  
  /**
   * Create a new organization
   * @param organizationData Organization data
   * @returns Promise with the created organization data
   */
  async createOrganization(organizationData: any): Promise<any> {
    return this.apiClient.post('/organizations', organizationData);
  }
  
  /**
   * Update an organization
   * @param organizationId ID of the organization to update
   * @param organizationData Organization data to update
   * @returns Promise with the updated organization data
   */
  async updateOrganization(organizationId: string, organizationData: any): Promise<any> {
    return this.apiClient.put(`/organizations/${organizationId}`, organizationData);
  }
  
  /**
   * Delete an organization
   * @param organizationId ID of the organization to delete
   * @returns Promise with the response data
   */
  async deleteOrganization(organizationId: string): Promise<any> {
    return this.apiClient.delete(`/organizations/${organizationId}`);
  }
  
  /**
   * Apply for organization verification
   * @param organizationId ID of the organization to apply for verification
   * @param applicationData Application data
   * @returns Promise with the response data
   */
  async applyForVerification(organizationId: string, applicationData: any): Promise<any> {
    return this.apiClient.post(`/organizations/${organizationId}/apply`, applicationData);
  }
  
  /**
   * Get verification applications
   * @param page Page number
   * @param limit Number of applications per page
   * @returns Promise with the applications data
   */
  async getVerificationApplications(page: number = 1, limit: number = 10): Promise<any> {
    return this.apiClient.get('/organizations/applications', {
      params: { page, limit },
    });
  }
  
  /**
   * Approve a verification application
   * @param applicationId ID of the application to approve
   * @param comment Approval comment
   * @returns Promise with the response data
   */
  async approveVerificationApplication(applicationId: string, comment?: string): Promise<any> {
    return this.apiClient.put(`/organizations/applications/${applicationId}/approve`, {
      comment,
    });
  }
  
  /**
   * Reject a verification application
   * @param applicationId ID of the application to reject
   * @param reason Rejection reason
   * @returns Promise with the response data
   */
  async rejectVerificationApplication(applicationId: string, reason: string): Promise<any> {
    return this.apiClient.put(`/organizations/applications/${applicationId}/reject`, {
      reason,
    });
  }
}
