/**
 * Service Factory for Authentico
 * 
 * This factory provides methods for creating service instances with the
 * appropriate dependencies.
 */

import { auth } from '../firebase';
import secureApiClient from '../api/secure-api-client';
import { AuthService, IAuthService } from './auth-service';
import { DocumentService } from './document-service';
import { OrganizationService } from './organization-service';
import { NotificationService } from './notification-service';

/**
 * Service factory class
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  private authService: IAuthService;
  private documentService: DocumentService;
  private organizationService: OrganizationService;
  private notificationService: NotificationService;
  
  /**
   * Create a new service factory
   * @private
   */
  private constructor() {
    // Create service instances with dependencies
    this.authService = new AuthService(secureApiClient, auth);
    this.documentService = new DocumentService(secureApiClient);
    this.organizationService = new OrganizationService(secureApiClient);
    this.notificationService = new NotificationService(secureApiClient);
  }
  
  /**
   * Get the service factory instance
   * @returns The service factory instance
   */
  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    
    return ServiceFactory.instance;
  }
  
  /**
   * Get the authentication service
   * @returns The authentication service
   */
  public getAuthService(): IAuthService {
    return this.authService;
  }
  
  /**
   * Get the document service
   * @returns The document service
   */
  public getDocumentService(): DocumentService {
    return this.documentService;
  }
  
  /**
   * Get the organization service
   * @returns The organization service
   */
  public getOrganizationService(): OrganizationService {
    return this.organizationService;
  }
  
  /**
   * Get the notification service
   * @returns The notification service
   */
  public getNotificationService(): NotificationService {
    return this.notificationService;
  }
}

// Create and export service instances for convenience
export const authService = ServiceFactory.getInstance().getAuthService();
export const documentService = ServiceFactory.getInstance().getDocumentService();
export const organizationService = ServiceFactory.getInstance().getOrganizationService();
export const notificationService = ServiceFactory.getInstance().getNotificationService();
