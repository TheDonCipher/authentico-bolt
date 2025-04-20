import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/firebase-admin-server';
import axios from 'axios';
import { getFirestore } from 'firebase-admin/firestore';

// CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests (preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    console.log(`Fallback document view API route called for document ${id}`);

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

    console.log(`Getting fallback document view for ${id} for user ${uid}`);

    // Get the document from Firestore
    const db = getFirestore();
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

    // Return basic document information
    return NextResponse.json({
      id: docSnapshot.id,
      documentName: docData.documentName,
      documentType: docData.documentType,
      documentTypeName: docData.documentTypeName,
      status: docData.status,
      ownerName: docData.ownerName,
      message: "This is a fallback view. The document content couldn't be retrieved from the backend.",
      fallback: true
    });
  } catch (error: any) {
    console.error('Error in fallback document view API route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
