import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../../../lib/firebase-admin-server';
import axios from 'axios';

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    console.log(`Get document API route called for document ${id}`);

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

    console.log(`Getting document ${id} for user ${uid}`);

    // Forward the request to the backend
    try {
      const response = await axios.get(`${API_URL}/documents/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Backend response:', response.data);

      return NextResponse.json(response.data);
    } catch (error: any) {
      console.error('Error forwarding get document to backend:', error.message);

      // If the backend is not available, create a mock response
      if (error.code === 'ECONNREFUSED' || !error.response) {
        console.log('Backend not available, creating mock response');

        // Get the document from Firestore
        const doc = await db.collection('documents').doc(id).get();

        if (!doc.exists) {
          return NextResponse.json(
            { error: 'Document not found' },
            { status: 404 }
          );
        }

        const documentData = doc.data();

        // Check if the document belongs to the user
        if (documentData?.uploadedBy !== uid) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({
          id: doc.id,
          ...documentData,
        });
      }

      // Return the error from the backend
      return NextResponse.json(
        { error: error.response?.data || 'Failed to get document' },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in get document API route:', error);
    return NextResponse.json({ error: 'Something broke!' }, { status: 500 });
  }
}
