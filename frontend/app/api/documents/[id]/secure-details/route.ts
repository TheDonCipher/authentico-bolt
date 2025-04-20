import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/firebase-admin-server';
import axios from 'axios';

// Get the API URL from environment variables
// Remove '/api' from the end if it exists to avoid duplication
let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
if (API_URL.endsWith('/api')) {
  API_URL = API_URL;
} else {
  API_URL = `${API_URL}/api`;
}
console.log('Using API URL for document secure-details:', API_URL);

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

    // Try to get the document from Firestore first to verify it exists
    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore();

    try {
      // Check if document exists in Firestore
      const docRef = db.collection('documents').doc(id);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        console.error(`Document ${id} not found in Firestore`);
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      const docData = docSnapshot.data();

      // Check if user has permission to access this document
      if (docData.ownerUid !== uid && docData.verifyingOrgId !== uid) {
        console.error(`User ${uid} not authorized to access document ${id}`);
        return NextResponse.json(
          { error: 'You do not have permission to access this document' },
          { status: 403 }
        );
      }

      console.log(
        `Document ${id} found in Firestore, proceeding to backend request`
      );

      // Forward the request to the backend
      try {
        // Construct the backend URL correctly
        const backendUrl = `${API_URL}/documents/${id}/secure-details`;
        console.log(`Making request to backend: ${backendUrl}`);

        const response = await axios.get(backendUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000, // 15 second timeout
        });

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
    } catch (firestoreError: any) {
      console.error('Error checking document in Firestore:', firestoreError);

      // Try the backend as a fallback
      try {
        console.log('Falling back to direct backend request');
        // Construct the backend URL correctly
        const backendUrl = `${API_URL}/documents/${id}/secure-details`;
        console.log(`Making fallback request to backend: ${backendUrl}`);

        const response = await axios.get(backendUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000, // 15 second timeout
        });

        return NextResponse.json(response.data);
      } catch (backendError: any) {
        console.error(
          'Both Firestore and backend failed:',
          backendError.message
        );
        return NextResponse.json(
          {
            error:
              'Failed to retrieve document from both Firestore and backend',
            details: backendError.message,
          },
          { status: 500 }
        );
      }
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
