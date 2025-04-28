import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';

// Get the backend API URL from environment variables
let BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Remove trailing slash if present
if (BACKEND_API_URL.endsWith('/')) {
  BACKEND_API_URL = BACKEND_API_URL.slice(0, -1);
}

// Ensure the URL has the correct format
const baseUrl = BACKEND_API_URL.endsWith('/api')
  ? BACKEND_API_URL.slice(0, -4) // Remove '/api' to avoid duplication
  : BACKEND_API_URL;

// For local development, ensure we're using the correct URL
if (process.env.NODE_ENV === 'development') {
  console.log('Using development API URL: http://localhost:8080');
}

// CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin':
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://authentico-demov2.vercel.app',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-XSRF-TOKEN, x-xsrf-token, Cookie',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Expose-Headers': 'Set-Cookie',
};

// Handle OPTIONS requests (preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  if (!BACKEND_API_URL) {
    console.error('Backend API URL is not configured.');
    return generateClientSideToken(corsHeaders);
  }

  try {
    // Forward the request to the backend to get a CSRF token
    console.log(
      `Forwarding CSRF token request to: ${baseUrl}/api/auth/csrf-token`
    );

    // Set a shorter timeout for the backend request to fail faster
    const backendResponse = await axios.get(`${baseUrl}/api/auth/csrf-token`, {
      withCredentials: true, // Include cookies in the request
      timeout: 5000, // 5 second timeout to fail faster if backend is down
    });

    // Get the CSRF token cookie from the backend response
    const cookies = backendResponse.headers['set-cookie'];

    // Create a response with the CSRF token
    const response = NextResponse.json(
      { success: true, source: 'backend' },
      {
        status: backendResponse.status,
        headers: corsHeaders,
      }
    );

    // Forward the cookies from the backend to the frontend
    if (cookies && cookies.length > 0) {
      for (const cookie of cookies) {
        response.headers.append('Set-Cookie', cookie);
      }
    }

    return response;
  } catch (error: any) {
    console.error('Error getting CSRF token from backend:', error);

    // For any error, generate a client-side token instead
    return generateClientSideToken(corsHeaders);
  }
}

/**
 * Generate a client-side CSRF token when the backend is unavailable
 * @param corsHeaders CORS headers to include in the response
 * @returns Response with a client-side generated CSRF token
 */
function generateClientSideToken(corsHeaders: Record<string, string>) {
  console.log('Generating client-side CSRF token as fallback');

  // Generate a secure random token
  const token = crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36);

  // Create a response with the client-side token
  const response = NextResponse.json(
    {
      success: true,
      source: 'client-side',
      message:
        'Using client-side token generation because backend is unavailable',
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );

  // Set the token in a cookie with domain settings appropriate for deployment
  const cookieOptions =
    process.env.NODE_ENV === 'development'
      ? `Path=/; Secure; SameSite=Lax; Max-Age=3600`
      : `Path=/; Secure; SameSite=None; Max-Age=3600`;

  response.headers.append(
    'Set-Cookie',
    `XSRF-TOKEN=${token}; ${cookieOptions}`
  );

  return response;
}
