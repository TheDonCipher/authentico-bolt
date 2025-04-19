import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedUserTypes?: ('individual' | 'organization' | 'admin')[];
  requiredOrgId?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  allowedUserTypes,
  requiredOrgId,
}) => {
  const { user, loading, isAdmin } = useAuth();
  const { hasOrgAccess, isLoadingOrgs } = useOrganization();
  const router = useRouter();

  useEffect(() => {
    console.log('AuthGuard effect running');
    console.log(
      `Loading: ${loading}, User exists: ${!!user}, isLoadingOrgs: ${isLoadingOrgs}`
    );
    console.log(`Allowed user types: ${allowedUserTypes?.join(', ') || 'any'}`);
    console.log(`Required org ID: ${requiredOrgId || 'none'}`);

    if (!loading && !user) {
      // User is not authenticated, redirect to login
      console.log('User not authenticated, redirecting to home page');
      router.push('/');
      return;
    }

    // If still loading organizations, wait
    if (loading || isLoadingOrgs) {
      console.log('Still loading, waiting before making access decisions');
      return;
    }

    // Check user type permissions
    if (
      user &&
      allowedUserTypes &&
      !allowedUserTypes.includes(user.userType) &&
      !isAdmin // Admins can access any page
    ) {
      console.log(`User type ${user.userType} not allowed to access this page`);
      // User is authenticated but not allowed to access this page
      if (user.userType === 'individual') {
        console.log('Redirecting to individual dashboard');
        router.push(`/user/${user.uid}/dashboard`);
      } else if (user.userType === 'organization') {
        console.log('Redirecting to organization dashboard');
        router.push(`/org/${user.uid}/dashboard`);
      } else {
        console.log('Redirecting to unauthorized page');
        router.push('/unauthorized');
      }
      return;
    }

    // Check organization access if required
    if (user && requiredOrgId && !isAdmin) {
      console.log(`Checking organization access for org ID: ${requiredOrgId}`);
      if (!hasOrgAccess(requiredOrgId)) {
        console.log(
          'User does not have access to this organization, redirecting to unauthorized page'
        );
        router.push('/unauthorized');
        return;
      } else {
        console.log('User has access to this organization');
      }
    }
  }, [
    user,
    loading,
    isLoadingOrgs,
    router,
    allowedUserTypes,
    requiredOrgId,
    hasOrgAccess,
    isAdmin,
  ]);

  if (loading || isLoadingOrgs) {
    console.log('AuthGuard rendering loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={40} />
        <p className="ml-2 text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    console.log('AuthGuard rendering null - no user');
    return null; // Will redirect in the useEffect
  }

  if (
    allowedUserTypes &&
    !allowedUserTypes.includes(user.userType) &&
    !isAdmin
  ) {
    console.log('AuthGuard rendering null - user type not allowed');
    return null; // Will redirect in the useEffect
  }

  // Check organization access if required
  if (requiredOrgId && !hasOrgAccess(requiredOrgId) && !isAdmin) {
    console.log('AuthGuard rendering null - no org access');
    return null; // Will redirect in the useEffect
  }

  console.log('AuthGuard rendering children - access granted');

  return <>{children}</>;
};
