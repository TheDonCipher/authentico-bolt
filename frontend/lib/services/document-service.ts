/**
 * Document Service for Authentico
 * 
 * This service provides methods for managing documents, including uploading,
 * retrieving, verifying, and sharing documents.
 */

import { IApiClient } from '../api/api-interfaces';

/**
 * Document service implementation
 */
export class DocumentService {
  private apiClient: IApiClient;
  
  /**
   * Create a new document service
   * @param apiClient API client to use for making requests
   */
  constructor(apiClient: IApiClient) {
    this.apiClient = apiClient;
  }
  
  /**
   * Upload a document
   * @param formData Form data containing the document and metadata
   * @param onUploadProgress Progress callback
   * @returns Promise with the response data
   */
  async uploadDocument(
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<any> {
    return this.apiClient.uploadFile('/documents/upload', formData, onUploadProgress);
  }
  
  /**
   * Get a document by ID
   * @param documentId ID of the document to retrieve
   * @returns Promise with the document data
   */
  async getDocumentById(documentId: string): Promise<any> {
    return this.apiClient.get(`/documents/${documentId}`);
  }
  
  /**
   * Get all documents for the current user
   * @param page Page number
   * @param limit Number of documents per page
   * @returns Promise with the documents data
   */
  async getUserDocuments(page: number = 1, limit: number = 10): Promise<any> {
    return this.apiClient.get('/documents/user', {
      params: { page, limit },
    });
  }
  
  /**
   * Get all documents for an organization
   * @param organizationId ID of the organization
   * @param page Page number
   * @param limit Number of documents per page
   * @returns Promise with the documents data
   */
  async getOrganizationDocuments(
    organizationId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    return this.apiClient.get(`/documents/organization/${organizationId}`, {
      params: { page, limit },
    });
  }
  
  /**
   * Verify a document
   * @param documentId ID of the document to verify
   * @param comment Verification comment
   * @returns Promise with the response data
   */
  async verifyDocument(documentId: string, comment?: string): Promise<any> {
    return this.apiClient.put(`/documents/${documentId}/verify`, {
      comment,
    });
  }
  
  /**
   * Reject a document
   * @param documentId ID of the document to reject
   * @param reason Rejection reason
   * @returns Promise with the response data
   */
  async rejectDocument(documentId: string, reason: string): Promise<any> {
    return this.apiClient.put(`/documents/${documentId}/reject`, {
      reason,
    });
  }
  
  /**
   * Generate a share link for a document
   * @param documentId ID of the document to share
   * @param expirationDays Number of days until the link expires
   * @returns Promise with the response data
   */
  async generateShareLink(documentId: string, expirationDays: number = 7): Promise<any> {
    return this.apiClient.post(`/documents/${documentId}/share`, {
      expirationDays,
    });
  }
  
  /**
   * Get a document by share token
   * @param shareToken Share token
   * @returns Promise with the document data
   */
  async getDocumentByShareToken(shareToken: string): Promise<any> {
    return this.apiClient.get(`/documents/share/${shareToken}`);
  }
  
  /**
   * Delete a document
   * @param documentId ID of the document to delete
   * @returns Promise with the response data
   */
  async deleteDocument(documentId: string): Promise<any> {
    return this.apiClient.delete(`/documents/${documentId}`);
  }
}
