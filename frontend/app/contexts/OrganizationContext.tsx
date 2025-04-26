'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Define organization membership type
export interface OrganizationMembership {
  orgId: string;
  orgName: string;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
}

// Define the shape of the organization context
interface OrganizationContextType {
  activeOrgId: string | null;
  setActiveOrgId: (orgId: string | null) => void;
  userOrganizations: OrganizationMembership[];
  isLoadingOrgs: boolean;
  hasOrgAccess: (orgId: string) => boolean;
  getUserRoleInOrg: (orgId: string) => string | null;
  switchToIndividualContext: () => void;
  switchToOrganizationContext: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
}

// Create the organization context
const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

// Create the organization provider component
export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<
    OrganizationMembership[]
  >([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState<boolean>(true);

  // Function to check if user has access to a specific organization
  const hasOrgAccess = useCallback(
    (orgId: string) => {
      console.log(`Checking access to org ${orgId}`);
      console.log('Available organizations:', userOrganizations);

      // If user is an organization owner, they always have access to their own org
      if (user?.userType === 'organization' && user.uid === orgId) {
        console.log('User is the organization owner - access granted');
        return true;
      }

      const hasAccess = userOrganizations.some((org) => org.orgId === orgId);
      console.log(`Access to org ${orgId}: ${hasAccess}`);
      return hasAccess;
    },
    [userOrganizations, user]
  );

  // Function to get user's role in an organization
  const getUserRoleInOrg = useCallback(
    (orgId: string) => {
      const org = userOrganizations.find((org) => org.orgId === orgId);
      return org ? org.role : null;
    },
    [userOrganizations]
  );

  // Function to switch to individual context
  const switchToIndividualContext = useCallback(() => {
    setActiveOrgId(null);
    if (user) {
      router.push(`/user/${user.uid}/dashboard`);
    } else {
      router.push('/individual-dashboard'); // Fallback to demo page if no user
    }
  }, [router, user]);

  // Function to switch to organization context
  const switchToOrganizationContext = useCallback(
    (orgId: string) => {
      console.log(`Attempting to switch to organization context: ${orgId}`);

      // Special case for organization owners
      if (user?.userType === 'organization' && user.uid === orgId) {
        console.log('User is the organization owner - switching context');
        setActiveOrgId(orgId);
        router.push(`/org/${orgId}/dashboard`);
        return;
      }

      if (hasOrgAccess(orgId)) {
        console.log(
          `User has access to organization ${orgId} - switching context`
        );
        setActiveOrgId(orgId);
        router.push(`/org/${orgId}/dashboard`);
      } else {
        console.error(`User does not have access to organization ${orgId}`);
        // Redirect to unauthorized page
        router.push('/unauthorized');
      }
    },
    [hasOrgAccess, router, user]
  );

  // Function to fetch user's organizations
  const fetchUserOrganizations = useCallback(async () => {
    console.log('Fetching user organizations');
    if (!user) {
      console.log('No user, clearing organizations');
      setUserOrganizations([]);
      setIsLoadingOrgs(false);
      return;
    }

    console.log(
      `Fetching organizations for user: ${user.uid}, type: ${user.userType}`
    );

    try {
      setIsLoadingOrgs(true);

      // Set a safety timeout to ensure loading state doesn't get stuck
      const safetyTimeout = setTimeout(() => {
        console.log(
          'Safety timeout triggered in OrganizationContext - forcing loading state reset'
        );
        setIsLoadingOrgs(false);
      }, 8000);

      const memberships: OrganizationMembership[] = [];

      // Skip Firestore queries for now due to permissions issues
      // Instead, if user is an organization, just add their own organization
      if (user.userType === 'organization') {
        console.log(
          `User is an organization, adding self-membership: ${user.uid}`
        );
        memberships.push({
          orgId: user.uid,
          orgName: user.organizationName || user.name,
          role: 'owner',
          permissions: ['all'],
        });
      }

      console.log('Setting user organizations:', memberships);
      setUserOrganizations(memberships);
      clearTimeout(safetyTimeout);
      setIsLoadingOrgs(false);
    } catch (error) {
      console.error('Error fetching user organizations:', error);
      // Even if there's an error, ensure we add the organization's own membership
      if (user.userType === 'organization') {
        console.log(
          `Fallback: Adding organization's own membership: ${user.uid}`
        );
        setUserOrganizations([
          {
            orgId: user.uid,
            orgName: user.organizationName || user.name,
            role: 'owner',
            permissions: ['all'],
          },
        ]);
      }
      setIsLoadingOrgs(false);
    }
  }, [user]);

  // Refresh organizations function exposed to consumers
  const refreshOrganizations = useCallback(async () => {
    await fetchUserOrganizations();
  }, [fetchUserOrganizations]);

  // Fetch user's organizations when user changes
  useEffect(() => {
    fetchUserOrganizations();
  }, [fetchUserOrganizations]);

  // Reset active org when user changes
  useEffect(() => {
    if (!user) {
      setActiveOrgId(null);
    }
  }, [user]);

  // Provide the organization context
  return (
    <OrganizationContext.Provider
      value={{
        activeOrgId,
        setActiveOrgId,
        userOrganizations,
        isLoadingOrgs,
        hasOrgAccess,
        getUserRoleInOrg,
        switchToIndividualContext,
        switchToOrganizationContext,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

// Create a hook to use the organization context
export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      'useOrganization must be used within an OrganizationProvider'
    );
  }
  return context;
};
