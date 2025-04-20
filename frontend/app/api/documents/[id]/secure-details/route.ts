import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/firebase-admin-server';
import axios from 'axios';

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    console.log(
      `Get secure document details API route called for document ${id}`
    );

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    console.log(`Getting secure document details for ${id} for user ${uid}`);
    console.log('User token claims:', decodedToken);

    // Forward the request to the backend
    try {
      console.log(
        `Making request to backend: ${API_URL}/documents/${id}/secure-details`
      );

      const response = await axios.get(
        `${API_URL}/documents/${id}/secure-details`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Backend secure document details response received');
      console.log('Response status:', response.status);
      console.log('Response data keys:', Object.keys(response.data));

      return NextResponse.json(response.data);
    } catch (error: any) {
      console.error(
        'Error forwarding secure document details request to backend:',
        error.message
      );

      // Log more detailed error information
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received, request was:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      console.error('Error config:', error.config);

      // Return the error from the backend
      return NextResponse.json(
        {
          error:
            error.response?.data?.error ||
            'Failed to get secure document details',
          details: error.response?.data?.details || error.message,
        },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in secure document details API route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
