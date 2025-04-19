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
