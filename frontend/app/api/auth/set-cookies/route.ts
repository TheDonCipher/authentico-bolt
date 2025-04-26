import { NextRequest, NextResponse } from 'next/server';
import {
  setAuthCookie,
  setUserDataCookie,
} from '../../../../lib/auth-cookies-server';

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
    console.log('CSRF token from set-cookies request:', csrfToken);

    // Safely parse the request body
    let requestBody;
    try {
      const text = await request.text();
      console.log('Request body text:', text);

      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: 'Empty request body' },
          { status: 400, headers: corsHeaders }
        );
      }

      requestBody = JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { token, userData } = requestBody;

    if (!token || !userData) {
      return NextResponse.json(
        { error: 'Token and user data are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create a response object with CORS headers
    const response = NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    );

    // Set auth token cookie
    await setAuthCookie(token);

    // Set user data cookie for middleware
    await setUserDataCookie(userData);

    return response;
  } catch (error: any) {
    console.error('Error setting cookies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set cookies' },
      { status: 500, headers: corsHeaders }
    );
  }
}
