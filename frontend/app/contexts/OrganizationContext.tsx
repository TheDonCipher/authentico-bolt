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
      return userOrganizations.some((org) => org.orgId === orgId);
    },
    [userOrganizations]
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
    router.push('/individual-dashboard');
  }, [router]);

  // Function to switch to organization context
  const switchToOrganizationContext = useCallback(
    (orgId: string) => {
      if (hasOrgAccess(orgId)) {
        setActiveOrgId(orgId);
        router.push(`/org/${orgId}/dashboard`);
      } else {
        console.error(`User does not have access to organization ${orgId}`);
      }
    },
    [hasOrgAccess, router]
  );

  // Function to fetch user's organizations
  const fetchUserOrganizations = useCallback(async () => {
    if (!user) {
      setUserOrganizations([]);
      setIsLoadingOrgs(false);
      return;
    }

    try {
      setIsLoadingOrgs(true);

      // Query for organization memberships
      const membershipsQuery = query(
        collection(db, 'organizationMembers'),
        where('userId', '==', user.uid)
      );

      const membershipsSnapshot = await getDocs(membershipsQuery);
      const memberships: OrganizationMembership[] = [];

      // Process each membership
      for (const doc of membershipsSnapshot.docs) {
        const membershipData = doc.data();
        
        // Get organization details
        const orgDoc = await getDocs(
          query(
            collection(db, 'users'),
            where('userType', '==', 'organization'),
            where('__name__', '==', membershipData.orgId)
          )
        );

        if (!orgDoc.empty) {
          const orgData = orgDoc.docs[0].data();
          memberships.push({
            orgId: membershipData.orgId,
            orgName: orgData.name || 'Unknown Organization',
            role: membershipData.role || 'member',
            permissions: membershipData.permissions || [],
          });
        }
      }

      // If user is an organization, add their own organization
      if (user.userType === 'organization') {
        memberships.push({
          orgId: user.uid,
          orgName: user.name,
          role: 'owner',
          permissions: ['all'],
        });
      }

      setUserOrganizations(memberships);
    } catch (error) {
      console.error('Error fetching user organizations:', error);
    } finally {
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
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
