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
    if (!loading && !user) {
      // User is not authenticated, redirect to login
      router.push('/');
      return;
    }

    // If still loading organizations, wait
    if (loading || isLoadingOrgs) return;

    // Check user type permissions
    if (
      user &&
      allowedUserTypes &&
      !allowedUserTypes.includes(user.userType) &&
      !isAdmin // Admins can access any page
    ) {
      // User is authenticated but not allowed to access this page
      if (user.userType === 'individual') {
        router.push('/individual-dashboard');
      } else if (user.userType === 'organization') {
        router.push('/organization-dashboard');
      } else {
        router.push('/unauthorized');
      }
      return;
    }

    // Check organization access if required
    if (user && requiredOrgId && !isAdmin) {
      if (!hasOrgAccess(requiredOrgId)) {
        router.push('/unauthorized');
        return;
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={40} />
        <p className="ml-2 text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  if (
    allowedUserTypes &&
    !allowedUserTypes.includes(user.userType) &&
    !isAdmin
  ) {
    return null; // Will redirect in the useEffect
  }

  // Check organization access if required
  if (requiredOrgId && !hasOrgAccess(requiredOrgId) && !isAdmin) {
    return null; // Will redirect in the useEffect
  }

  return <>{children}</>;
};
