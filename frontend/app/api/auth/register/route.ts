import { NextResponse } from 'next/server';
import axios from 'axios';

// Get the backend API URL from environment variables
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', ''); // Assuming NEXT_PUBLIC_API_URL points to the backend's /api path

export async function POST(request: Request) {
  if (!BACKEND_API_URL) {
    console.error('Backend API URL is not configured.');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    // Forward the request to the backend registration endpoint
    const backendResponse = await axios.post(
      `${BACKEND_API_URL}/api/auth/register`, // Adjust endpoint if needed
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          // Forward any other relevant headers if necessary
        },
        // Ensure Axios throws errors for non-2xx responses
        validateStatus: (status) => status >= 200 && status < 300,
      }
    );

    // Return the response from the backend
    return NextResponse.json(backendResponse.data, {
      status: backendResponse.status,
    });
  } catch (error: any) {
    console.error('Error proxying registration request:', error);

    // Handle Axios errors specifically
    if (axios.isAxiosError(error) && error.response) {
      // Return the error response from the backend
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    }

    // Handle other errors (e.g., network issues, JSON parsing)
    return NextResponse.json(
      {
        error: 'PROXY_REQUEST_FAILED',
        message: 'Failed to forward registration request to the backend.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 } // Bad Gateway might be appropriate here
    );
  }
}
