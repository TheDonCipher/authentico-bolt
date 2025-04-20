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

    // Try to get the document from Firestore first
    try {
      // Get the document from Firestore
      const doc = await db.collection('documents').doc(id).get();

      if (!doc.exists) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      const documentData = doc.data();
      console.log('Document data from Firestore:', documentData);
      console.log(`User ID: ${uid}`);

      // Check if the document belongs to the user or if the user is the verifying organization
      // Support both uploadedBy and ownerUid fields for backward compatibility
      const isOwner =
        documentData?.uploadedBy?.toLowerCase() === uid.toLowerCase() ||
        documentData?.ownerUid?.toLowerCase() === uid.toLowerCase();
      const isVerifyingOrg =
        documentData?.verifyingOrgId?.toLowerCase() === uid.toLowerCase();
      const isAdmin =
        uid.toLowerCase() ===
        '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c'.toLowerCase();

      console.log(
        `Access check - isOwner: ${isOwner}, isVerifyingOrg: ${isVerifyingOrg}, isAdmin: ${isAdmin}`
      );

      // Log more details for debugging
      console.log(`Document owner: ${documentData?.ownerUid}`);
      console.log(`Document verifying org: ${documentData?.verifyingOrgId}`);
      console.log(`Current user: ${uid}`);

      if (!isOwner && !isVerifyingOrg && !isAdmin) {
        console.log(
          'Access denied: User is not owner, verifying org, or admin'
        );
        return NextResponse.json(
          {
            error: 'Unauthorized',
            details: 'You do not have permission to access this document',
          },
          { status: 403 }
        );
      }

      console.log('Document found in Firestore, returning data');

      // Try to forward the request to the backend
      try {
        const response = await axios.get(`${API_URL}/documents/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Backend response:', response.data);

        return NextResponse.json(response.data);
      } catch (backendError: any) {
        console.error(
          'Error forwarding get document to backend:',
          backendError.message
        );
        console.log('Falling back to Firestore data');

        // Return the Firestore data as fallback
        return NextResponse.json({
          id: doc.id,
          ...documentData,
        });
      }
    } catch (firestoreError: any) {
      console.error(
        'Error getting document from Firestore:',
        firestoreError.message
      );

      // Try the backend as a fallback
      try {
        const response = await axios.get(`${API_URL}/documents/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Backend response after Firestore failure:', response.data);

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
          },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Error in get document API route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
