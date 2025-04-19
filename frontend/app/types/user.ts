/**
 * Organization verification status
 */
export type OrganizationVerificationStatus =
  | 'not_verified'
  | 'pending'
  | 'verified'
  | 'rejected';

/**
 * User interface representing an authenticated user
 */
export interface User {
  uid: string;
  walletAddress: string;
  userType: 'individual' | 'organization' | 'admin';
  name: string;
  organizationName?: string;
  isVerified?: boolean;
  verificationStatus?: OrganizationVerificationStatus;
  verificationRejectionReason?: string;
  verificationUpdatedAt?: string;
  verificationUpdatedBy?: string;
  email?: string;
}

/**
 * Organization membership interface
 */
export interface OrganizationMembership {
  orgId: string;
  orgName: string;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
}
