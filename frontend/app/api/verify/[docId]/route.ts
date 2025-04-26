import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ docId: string }> }
) {
  const { docId } = await context.params;
  try {
    console.log(`[Verify API] Verifying document with ID: ${docId}`);
    console.log(`[Verify API] Using API URL: ${API_URL}`);

    // Construct the backend URL
    const backendUrl = `${API_URL}/verify/${docId}`;
    console.log(`[Verify API] Making request to backend: ${backendUrl}`);

    // Forward the request to the backend with timeout and additional headers
    const response = await axios.get(backendUrl, {
      timeout: 15000, // 15 second timeout
      headers: {
        'x-request-source': 'nextjs-api',
        'x-document-id': docId,
      },
    });

    console.log(
      `[Verify API] Verification response status: ${response.status}`
    );
    console.log('[Verify API] Verification response data:', response.data);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('[Verify API] Error verifying document:', error);

    // Log more detailed error information
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(
        '[Verify API] Error response status:',
        error.response.status
      );
      console.error('[Verify API] Error response data:', error.response.data);
      console.error(
        '[Verify API] Error response headers:',
        error.response.headers
      );
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[Verify API] No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[Verify API] Request setup error:', error.message);
    }
    console.error('[Verify API] Error config:', error.config);

    // Return appropriate error response
    const status = error.response?.status || 500;
    const errorMessage =
      error.response?.data?.error || 'Failed to verify document';

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.response?.data?.details,
        message: error.message,
        apiUrl: API_URL, // Include the API URL in the error response for debugging
      },
      { status }
    );
  }
}
