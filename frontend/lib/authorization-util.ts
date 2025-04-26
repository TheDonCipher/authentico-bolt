/**
 * Authorization utility for Authentico
 * This library provides role-based access control and permission checking
 * for secure resource access.
 */

// Define authorization types
export interface Resource {
  type: string;
  id: string;
  ownerId?: string;
  sharedWith?: string[];
  [key: string]: any;
}

export interface User {
  uid: string;
  userType: string;
  walletAddress?: string;
  organizationId?: string;
  [key: string]: any;
}

export interface TokenClaims {
  sub?: string;
  role?: string;
  iss?: string;
  aud?: string;
  exp?: number;
  [key: string]: any;
}

/**
 * Check if a user has permission for a specific action on a resource
 * @param user The user object
 * @param action The action to perform (e.g., 'view', 'edit', 'delete')
 * @param resource The resource to access
 * @returns True if the user has permission, false otherwise
 */
export const hasPermission = (
  user: User | null | undefined,
  action: string,
  resource: Resource
): boolean => {
  try {
    if (!user) {
      console.warn('Permission check failed: No user provided');
      return false;
    }

    // Get admin wallet address from environment variable
    const adminWalletAddress =
      process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ||
      '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c';

    // Admin has all permissions
    if (
      user.userType === 'admin' ||
      (user.walletAddress &&
        user.walletAddress.toLowerCase() === adminWalletAddress.toLowerCase())
    ) {
      return true;
    }

    // Organization users can only access their own organization
    if (user.userType === 'organization' && resource.type === 'organization') {
      return user.uid === resource.id || user.organizationId === resource.id;
    }

    // Organization users can access documents they are verifying
    if (
      user.userType === 'organization' &&
      resource.type === 'document' &&
      action === 'view'
    ) {
      return (
        resource.verifyingOrgId === user.uid ||
        resource.verifyingOrgId === user.organizationId
      );
    }

    // Individual users can access their own documents
    if (user.userType === 'individual' && resource.type === 'document') {
      // For viewing, check if user is owner or document is shared with them
      if (action === 'view') {
        return (
          (resource.ownerId !== undefined && resource.ownerId === user.uid) ||
          (resource.sharedWith !== undefined &&
            resource.sharedWith.includes(user.uid))
        );
      }

      // For editing or deleting, user must be the owner
      if (action === 'edit' || action === 'delete') {
        return resource.ownerId === user.uid;
      }
    }

    console.warn(
      `Permission denied: User ${user.uid} cannot ${action} ${resource.type} ${resource.id}`
    );
    return false;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};

/**
 * Check if a user can access a specific route
 * @param user The user object
 * @param route The route to access
 * @returns True if the user can access the route, false otherwise
 */
export const canAccessRoute = (
  user: User | null | undefined,
  route: string
): boolean => {
  try {
    // Public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/about',
      '/verify',
      '/demo',
    ];

    // Check if route is public
    if (
      publicRoutes.some(
        (publicRoute) =>
          route === publicRoute || route.startsWith(`${publicRoute}/`)
      )
    ) {
      return true;
    }

    // All other routes require authentication
    if (!user) {
      console.warn(`Route access denied: No user authenticated for ${route}`);
      return false;
    }

    // Get admin wallet address from environment variable
    const adminWalletAddress =
      process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ||
      '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c';

    // Admin can access all routes
    if (
      user.userType === 'admin' ||
      (user.walletAddress &&
        user.walletAddress.toLowerCase() === adminWalletAddress.toLowerCase())
    ) {
      return true;
    }

    // Organization routes
    if (
      route.startsWith('/organization-dashboard') ||
      route.startsWith('/org/')
    ) {
      return user.userType === 'organization';
    }

    // Individual routes
    if (
      route.startsWith('/individual-dashboard') ||
      route.startsWith('/user/')
    ) {
      return user.userType === 'individual';
    }

    // Admin-only routes
    if (route.startsWith('/admin')) {
      return (
        (user.userType !== undefined && user.userType === 'admin') ||
        (user.walletAddress !== undefined &&
          user.walletAddress.toLowerCase() === adminWalletAddress.toLowerCase())
      );
    }

    // User-specific routes
    if (route.includes('/user/') && user.userType === 'individual') {
      const routeUserId = route.split('/user/')[1]?.split('/')[0];
      return routeUserId === user.uid;
    }

    // Organization-specific routes
    if (route.includes('/org/') && user.userType === 'organization') {
      const routeOrgId = route.split('/org/')[1]?.split('/')[0];
      return routeOrgId === user.uid || routeOrgId === user.organizationId;
    }

    // Default to denying access for unknown routes
    console.warn(
      `Route access denied: User ${user.uid} cannot access ${route}`
    );
    return false;
  } catch (error) {
    console.error('Route access check error:', error);
    return false;
  }
};

/**
 * Validate JWT token claims
 * @param token The token object with claims
 * @param expectedClaims The expected claims to validate against
 * @returns True if the token claims are valid, false otherwise
 */
export const validateTokenClaims = (
  token: { claims: TokenClaims } | null | undefined,
  expectedClaims: TokenClaims
): boolean => {
  try {
    if (!token || !token.claims) {
      console.warn('Token validation failed: No token or claims provided');
      return false;
    }

    // Check required claims
    for (const [key, value] of Object.entries(expectedClaims)) {
      if (token.claims[key] !== value) {
        console.warn(
          `Token validation failed: Expected ${key}=${value}, got ${token.claims[key]}`
        );
        return false;
      }
    }

    // Check token expiration
    if (token.claims.exp && token.claims.exp < Date.now() / 1000) {
      console.warn('Token validation failed: Token has expired');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

/**
 * Check if a user is an admin
 * @param user The user object
 * @returns True if the user is an admin, false otherwise
 */
export const isAdmin = (user: User | null | undefined): boolean => {
  try {
    if (!user) {
      return false;
    }

    // Get admin wallet address from environment variable
    const adminWalletAddress =
      process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ||
      '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c';

    return (
      (user.userType !== undefined && user.userType === 'admin') ||
      (user.walletAddress !== undefined &&
        user.walletAddress.toLowerCase() === adminWalletAddress.toLowerCase())
    );
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
};

/**
 * Log authorization decisions for debugging and security monitoring
 * @param user The user object
 * @param action The action being performed
 * @param resource The resource being accessed
 * @param allowed Whether the action was allowed
 */
export const logAuthorizationDecision = (
  user: User | null | undefined,
  action: string,
  resource: Resource | string,
  allowed: boolean
): void => {
  try {
    const resourceType = typeof resource === 'string' ? 'route' : resource.type;
    const resourceId = typeof resource === 'string' ? resource : resource.id;

    console.log(
      `Authorization Decision: User ${user?.uid || 'anonymous'} ${
        allowed ? 'allowed' : 'denied'
      } to ${action} ${resourceType} ${resourceId}`
    );

    // In a production environment, this would send the event to a logging service
  } catch (error) {
    console.error('Authorization logging error:', error);
  }
};
