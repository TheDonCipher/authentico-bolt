import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedUserTypes?: ('individual' | 'organization')[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  allowedUserTypes,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, redirect to login
      router.push('/');
    } else if (
      !loading &&
      user &&
      allowedUserTypes &&
      !allowedUserTypes.includes(user.userType)
    ) {
      // User is authenticated but not allowed to access this page
      if (user.userType === 'individual') {
        router.push('/individual-dashboard');
      } else {
        router.push('/organization-dashboard');
      }
    }
  }, [user, loading, router, allowedUserTypes]);

  if (loading) {
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

  if (allowedUserTypes && !allowedUserTypes.includes(user.userType)) {
    return null; // Will redirect in the useEffect
  }

  return <>{children}</>;
};
