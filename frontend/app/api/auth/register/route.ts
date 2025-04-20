import { NextResponse } from 'next/server';
import axios from 'axios';

// Get the backend API URL from environment variables
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL;
// Remove '/api' from the end if it exists to avoid duplication
const baseUrl = BACKEND_API_URL?.endsWith('/api')
  ? BACKEND_API_URL
  : BACKEND_API_URL;

// CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests (preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  if (!BACKEND_API_URL) {
    console.error('Backend API URL is not configured.');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();

    // Forward the request to the backend registration endpoint
    console.log(`Forwarding registration request to: ${baseUrl}/auth/register`);
    const backendResponse = await axios.post(
      `${baseUrl}/auth/register`, // Adjust endpoint if needed
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          // Forward any other relevant headers if necessary
        },
        // Ensure Axios throws errors for non-2xx responses
        validateStatus: (status) => status >= 200 && status < 300,
        timeout: 10000, // 10 second timeout
      }
    );

    // Return the response from the backend with CORS headers
    return NextResponse.json(backendResponse.data, {
      status: backendResponse.status,
      headers: corsHeaders,
    });
  } catch (error: any) {
    console.error('Error proxying registration request:', error);

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
        message: 'Failed to forward registration request to the backend.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502, headers: corsHeaders } // Bad Gateway might be appropriate here
    );
  }
}
