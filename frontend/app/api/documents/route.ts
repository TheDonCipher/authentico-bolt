import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin-server';
import axios from 'axios';

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function GET(request: NextRequest) {
  try {
    console.log('Get documents API route called');

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

    console.log(`Getting documents for user ${uid}`);

    // Forward the request to the backend
    try {
      const response = await axios.get(`${API_URL}/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Backend response:', response.data);

      return NextResponse.json(response.data);
    } catch (error: any) {
      console.error(
        'Error forwarding get documents to backend:',
        error.message
      );

      // If the backend is not available, create a mock response
      if (error.code === 'ECONNREFUSED' || !error.response) {
        console.log('Backend not available, creating mock response');

        // Get documents from Firestore
        const snapshot = await db
          .collection('documents')
          .where('uploadedBy', '==', uid)
          .get();

        const documents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return NextResponse.json(documents);
      }

      // Return the error from the backend
      return NextResponse.json(
        { error: error.response?.data || 'Failed to get documents' },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in get documents API route:', error);
    return NextResponse.json({ error: 'Something broke!' }, { status: 500 });
  }
}
