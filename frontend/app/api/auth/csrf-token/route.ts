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
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    // Forward the request to the backend to get a CSRF token
    console.log(
      `Forwarding CSRF token request to: ${baseUrl}/api/auth/csrf-token`
    );
    const backendResponse = await axios.get(`${baseUrl}/api/auth/csrf-token`, {
      withCredentials: true, // Include cookies in the request
    });

    // Get the CSRF token cookie from the backend response
    const cookies = backendResponse.headers['set-cookie'];

    // Create a response with the CSRF token
    const response = NextResponse.json(
      { success: true },
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
    console.error('Error getting CSRF token:', error);

    // Handle Axios errors specifically
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Return the error response from the backend
        console.error(
          'Backend response error:',
          error.response.status,
          error.response.data
        );
        return NextResponse.json(error.response.data, {
          status: error.response.status,
          headers: corsHeaders,
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from backend:', error.message);
        return NextResponse.json(
          {
            error: 'BACKEND_NO_RESPONSE',
            message: 'No response received from the backend server.',
            details: error.message,
          },
          { status: 504, headers: corsHeaders } // Gateway Timeout
        );
      }
    }

    // Handle other errors (e.g., network issues, JSON parsing)
    console.error('Other error type:', error.message);
    return NextResponse.json(
      {
        error: 'PROXY_REQUEST_FAILED',
        message: 'Failed to get CSRF token from the backend.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502, headers: corsHeaders } // Bad Gateway might be appropriate here
    );
  }
}
