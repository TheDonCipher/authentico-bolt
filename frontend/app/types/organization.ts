import { OrganizationVerificationStatus } from './user';

/**
 * Organization application interface
 */
export interface OrganizationApplication {
  id: string;
  orgName: string;
  contactEmail: string;
  website: string;
  description?: string;
  address?: string;
  phoneNumber?: string;
  industry?: string;
  registrationNumber?: string;
  foundedYear?: string;
  documentTypes?: string[];
  status: OrganizationVerificationStatus;
  submittedBy: string;
  submittedAt: Date;
  updatedAt?: Date;
  updatedBy?: string;
  notes?: string;
  organizationId?: string;
}

/**
 * Organization verification audit log entry
 */
export interface VerificationAuditLogEntry {
  id: string;
  organizationId: string;
  organizationName: string;
  oldStatus: OrganizationVerificationStatus;
  newStatus: OrganizationVerificationStatus;
  updatedBy: string;
  updatedByName: string;
  updatedAt: Date;
  notes?: string;
}

/**
 * Document types that organizations can verify
 */
export const DOCUMENT_TYPES = [
  'identity',
  'education',
  'financial',
  'legal',
  'medical',
  'employment',
  'other'
];
