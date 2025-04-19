import { NextRequest, NextResponse } from 'next/server';

// Define protected routes patterns
const individualProtectedRoutes = ['/individual-dashboard'];
const organizationProtectedRoutes = ['/organization-dashboard'];
const orgSpecificRoutes = ['/org/:orgId/dashboard', '/org/:orgId/documents', '/org/:orgId/settings'];
const adminProtectedRoutes = ['/admin-dashboard'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get auth token from cookies
  const authToken = request.cookies.get('authToken')?.value;
  const userDataCookie = request.cookies.get('userData')?.value;
  
  // Parse user data if available
  let userData = null;
  try {
    if (userDataCookie) {
      userData = JSON.parse(userDataCookie);
    }
  } catch (error) {
    console.error('Error parsing user data cookie:', error);
  }
  
  // Check if user is authenticated
  const isAuthenticated = !!authToken && !!userData;
  
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
  const isIndividualProtected = individualProtectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  const isOrganizationProtected = organizationProtectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  const isOrgSpecificRoute = orgSpecificRoutes.some(pattern => 
    matchesPattern(pathname, pattern)
  );
  
  const isAdminProtected = adminProtectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Extract orgId from path if it's an org-specific route
  let orgId = null;
  if (isOrgSpecificRoute) {
    const pathParts = pathname.split('/');
    const orgIdIndex = pathParts.findIndex(part => part === 'org') + 1;
    if (orgIdIndex > 0 && orgIdIndex < pathParts.length) {
      orgId = pathParts[orgIdIndex];
    }
  }
  
  // Redirect logic
  if (!isAuthenticated) {
    // If not authenticated and trying to access protected route, redirect to login
    if (isIndividualProtected || isOrganizationProtected || isOrgSpecificRoute || isAdminProtected) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  } else {
    // User is authenticated, check for proper authorization
    const userType = userData?.userType;
    const userId = userData?.uid;
    
    // Check if user is admin for admin routes
    const isAdmin = userType === 'admin' || 
      (userData?.walletAddress && 
       userData.walletAddress.toLowerCase() === 
       (process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c').toLowerCase());
    
    if (isAdminProtected && !isAdmin) {
      // Redirect non-admins to 403 page
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    // Check for individual dashboard access
    if (isIndividualProtected && userType !== 'individual' && !isAdmin) {
      // Redirect to appropriate dashboard based on user type
      if (userType === 'organization') {
        return NextResponse.redirect(new URL('/organization-dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
    
    // Check for organization dashboard access
    if (isOrganizationProtected && userType !== 'organization' && !isAdmin) {
      // Redirect to appropriate dashboard based on user type
      if (userType === 'individual') {
        return NextResponse.redirect(new URL('/individual-dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
    
    // Check for org-specific route access
    if (isOrgSpecificRoute && orgId) {
      // For org-specific routes, we need to check if the user has access to this org
      // This would typically involve checking a membership collection in Firestore
      // For now, we'll implement a simple check: organization owners can access their own org
      if (userType === 'organization' && userId === orgId) {
        // Organization owner accessing their own org - allow
        return NextResponse.next();
      } else if (isAdmin) {
        // Admins can access any org
        return NextResponse.next();
      } else {
        // For other users, we would check membership here
        // For now, redirect to unauthorized page
        // In a real implementation, this would check a membership collection
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
    '/org/:path*',
    '/api/auth/:path*',
    '/api/documents/:path*',
    '/api/organizations/:path*',
  ],
};
