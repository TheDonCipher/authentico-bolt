import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '../../../../lib/auth-cookies-server';

// CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, x-xsrf-token, Cookie',
  'Access-Control-Allow-Credentials': 'true',
};

// Handle OPTIONS requests (preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Get CSRF token from request headers
    const csrfToken = request.headers.get('x-xsrf-token');
    console.log('CSRF token from clear-cookies request:', csrfToken);
    // Create a response object with CORS headers
    const response = NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    );

    // Clear auth cookies
    await clearAuthCookies();

    return response;
  } catch (error: any) {
    console.error('Error clearing cookies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear cookies' },
      { status: 500, headers: corsHeaders }
    );
  }
}
