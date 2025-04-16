import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/firebase-admin-server';
import axios from 'axios';

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Get secure document details API route called for document ${params.id}`);

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

    console.log(`Getting secure document details for ${params.id} for user ${uid}`);

    // Forward the request to the backend
    try {
      const response = await axios.get(`${API_URL}/documents/${params.id}/secure-details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Backend secure document details response received');

      return NextResponse.json(response.data);
    } catch (error: any) {
      console.error('Error forwarding secure document details request to backend:', error.message);

      // Return the error from the backend
      return NextResponse.json(
        { 
          error: error.response?.data?.error || 'Failed to get secure document details',
          details: error.response?.data?.details || error.message
        },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in secure document details API route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
