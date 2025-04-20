import { NextRequest, NextResponse } from 'next/server';

// Define protected routes patterns
const individualProtectedRoutes = ['/individual-dashboard']; // Individual dashboard
const organizationProtectedRoutes = ['/organization-dashboard']; // Organization dashboard
const userSpecificRoutes = [
  '/user/:userId/dashboard',
  '/user/:userId/documents',
  '/user/:userId/settings',
];
const orgSpecificRoutes = [
  '/org/:orgId/dashboard',
  '/org/:orgId/documents',
  '/org/:orgId/settings',
  '/org/:orgId/verification',
];
const adminProtectedRoutes = [
  '/admin-dashboard',
  '/admin-dashboard/organizations',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from cookies
  const authToken = request.cookies.get('authToken')?.value;
  const userDataCookie = request.cookies.get('userData')?.value;

  console.log(`Middleware processing path: ${pathname}`);
  console.log(`Auth token exists: ${!!authToken}`);
  console.log(`User data cookie exists: ${!!userDataCookie}`);

  // Parse user data if available
  let userData: {
    userType?: string;
    uid?: string;
    walletAddress?: string;
  } | null = null;
  try {
    if (userDataCookie) {
      userData = JSON.parse(userDataCookie);
      console.log(
        `User data parsed: userType=${userData?.userType}, uid=${userData?.uid}`
      );
    }
  } catch (error) {
    console.error('Error parsing user data cookie:', error);
  }

  // Check if user is authenticated
  const isAuthenticated = !!authToken && !!userData;
  console.log(`User is authenticated: ${isAuthenticated}`);

  // Function to check if a path matches a pattern with parameters
  const matchesPattern = (path: string, pattern: string) => {
    const pathParts = path.split('/').filter(Boolean);
    const patternParts = pattern.split('/').filter(Boolean);

    if (pathParts.length !== patternParts.length) return false;

    return patternParts.every((part, index) => {
      // If pattern part starts with :, it's a parameter
      if (part.startsWith(':')) return true;
      return part === pathParts[index];
    });
  };

  // Check if the current path is a protected route
  const isIndividualProtected = individualProtectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isOrganizationProtected = organizationProtectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isUserSpecificRoute = userSpecificRoutes.some((pattern) =>
    matchesPattern(pathname, pattern)
  );

  const isOrgSpecificRoute = orgSpecificRoutes.some((pattern) =>
    matchesPattern(pathname, pattern)
  );

  const isAdminProtected = adminProtectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Extract orgId from path if it's an org-specific route
  let orgId: string | null = null;
  if (isOrgSpecificRoute) {
    const pathParts = pathname.split('/');
    const orgIdIndex = pathParts.findIndex((part) => part === 'org') + 1;
    if (orgIdIndex > 0 && orgIdIndex < pathParts.length) {
      orgId = pathParts[orgIdIndex];
    }
  }

  // Extract userId from path if it's a user-specific route
  let pathUserId: string | null = null;
  if (isUserSpecificRoute) {
    const pathParts = pathname.split('/');
    const userIdIndex = pathParts.findIndex((part) => part === 'user') + 1;
    if (userIdIndex > 0 && userIdIndex < pathParts.length) {
      pathUserId = pathParts[userIdIndex];
    }
  }

  // Redirect logic
  if (!isAuthenticated) {
    // If not authenticated and trying to access protected route, redirect to login
    if (
      isUserSpecificRoute ||
      isOrgSpecificRoute ||
      isAdminProtected ||
      isIndividualProtected ||
      isOrganizationProtected
    ) {
      console.log('Redirecting unauthenticated user to home page');
      return NextResponse.redirect(new URL('/', request.url));
    }
  } else {
    // User is authenticated, check for proper authorization
    const userType = userData?.userType;
    const userId = userData?.uid;

    // Check if user is admin for admin routes
    const isAdmin =
      userType === 'admin' ||
      (userData?.walletAddress &&
        userData.walletAddress.toLowerCase() ===
          (
            process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ||
            '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c'
          ).toLowerCase());

    if (isAdminProtected && !isAdmin) {
      // Redirect non-admins to 403 page
      console.log('Redirecting non-admin user from admin dashboard');
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // For individual dashboard, check if user is individual or admin
    if (isIndividualProtected && userType !== 'individual' && !isAdmin) {
      console.log('Redirecting non-individual user from individual dashboard');
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // For organization dashboard, check if user is organization or admin
    if (isOrganizationProtected && userType !== 'organization' && !isAdmin) {
      console.log(
        'Redirecting non-organization user from organization dashboard'
      );
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Check for user-specific route access
    if (isUserSpecificRoute && pathUserId) {
      // For user-specific routes, check if the user is accessing their own dashboard
      if (userType === 'individual' && userId === pathUserId) {
        // Individual user accessing their own dashboard - allow
        return NextResponse.next();
      } else if (isAdmin) {
        // Admins can access any user dashboard
        return NextResponse.next();
      } else {
        // Unauthorized access
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // Check for org-specific route access
    if (isOrgSpecificRoute && orgId) {
      // For org-specific routes, we need to check if the user has access to this org
      // This would typically involve checking a membership collection in Firestore
      // For now, we'll implement a simple check: organization owners can access their own org
      console.log(
        `Checking org access: userType=${userType}, userId=${userId}, orgId=${orgId}, isAdmin=${isAdmin}`
      );

      if (userType === 'organization' && userId === orgId) {
        // Organization owner accessing their own org - allow
        console.log(
          'Organization owner accessing their own org - allowing access'
        );
        return NextResponse.next();
      } else if (isAdmin) {
        // Admins can access any org
        console.log('Admin accessing org - allowing access');
        return NextResponse.next();
      } else {
        // For other users, we would check membership here
        // For now, redirect to unauthorized page
        // In a real implementation, this would check a membership collection
        console.log(
          'Unauthorized org access - redirecting to unauthorized page'
        );
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    '/individual-dashboard/:path*',
    '/organization-dashboard/:path*',
    '/admin-dashboard/:path*',
    '/user/:path*',
    '/org/:path*',
    '/api/auth/:path*',
    '/api/documents/:path*',
    '/api/organizations/:path*',
  ],
};
