import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/firebase-admin-server';
import axios from 'axios';

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    console.log(`Document verification API route called for document ${id}`);

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

    console.log(`Verifying document ${id} by user ${uid}`);

    // Parse the request body
    const body = await request.json();
    const { status, rejectionReason } = body;

    if (!status || !['Verified', 'Rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (status === 'Rejected' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Forward the request to the backend
    const response = await axios.post(
      `${API_URL}/documents/${id}/verify`,
      {
        status,
        rejectionReason,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('Verification response:', response.data);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error verifying document:', error);

    // Return appropriate error response
    const status = error.response?.status || 500;
    const errorMessage =
      error.response?.data?.error || 'Failed to verify document';

    return NextResponse.json(
      { error: errorMessage, details: error.response?.data?.details },
      { status }
    );
  }
}
