import { User } from '../app/types/user';

/**
 * Determines the appropriate dashboard URL based on user type and context
 * @param user The authenticated user
 * @param activeContext The active context (individual or organization)
 * @param activeOrgId The active organization ID (if in organization context)
 * @returns The URL to redirect to
 */
export function getDashboardUrl(
  user: User | null,
  activeContext: 'individual' | 'organization' | null,
  activeOrgId: string | null
): string {
  if (!user) {
    return '/';
  }

  // If user has an active context, respect that
  if (activeContext === 'individual') {
    return '/individual-dashboard';
  }

  if (activeContext === 'organization' && activeOrgId) {
    return `/org/${activeOrgId}/dashboard`;
  }

  // Otherwise, use user type as default
  if (user.userType === 'individual') {
    return '/individual-dashboard';
  }

  if (user.userType === 'organization') {
    return '/organization-dashboard';
  }

  if (user.userType === 'admin') {
    return '/admin-dashboard';
  }

  // Fallback to home page
  return '/';
}

/**
 * Redirects the user to the appropriate dashboard
 * @param router The Next.js router
 * @param user The authenticated user
 * @param activeContext The active context (individual or organization)
 * @param activeOrgId The active organization ID (if in organization context)
 */
export function redirectToDashboard(
  router: any,
  user: User | null,
  activeContext: 'individual' | 'organization' | null,
  activeOrgId: string | null
): void {
  const url = getDashboardUrl(user, activeContext, activeOrgId);
  router.push(url);
}
