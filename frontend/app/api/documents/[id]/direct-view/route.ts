import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/firebase-admin-server';
import axios from 'axios';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

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
    console.log(`Direct document view API route called for document ${id}`);

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

    console.log(`Getting direct document view for ${id} for user ${uid}`);

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

    if (!docData) {
      console.error(`Document ${id} data is undefined`);
      return NextResponse.json(
        { error: 'Document data not found' },
        { status: 404 }
      );
    }

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
      documentName: docData.documentName || 'Unnamed Document',
      documentType: docData.documentType || 'unknown',
      documentTypeName: docData.documentTypeName || 'Unknown Type',
      status: docData.status || 'Unknown',
      ownerName: docData.ownerName || 'Unknown User',
      mimeType: docData.mimeType || 'application/octet-stream',
      // Include a placeholder for the document content
      decryptedFile: 'DOCUMENT_CONTENT_PLACEHOLDER',
      directView: true,
    });
  } catch (error: any) {
    console.error('Error in direct document view API route:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
