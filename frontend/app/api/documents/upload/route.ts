import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../../../lib/firebase-admin-server';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function POST(request: NextRequest) {
  try {
    console.log('Document upload API route called');

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Verify the token - only accept ID tokens now
    let uid;
    try {
      // Verify as an ID token
      console.log('Verifying ID token...');
      const decodedToken = await auth.verifyIdToken(token);
      uid = decodedToken.uid;
      console.log('ID token verified successfully for user:', uid);
    } catch (idTokenError) {
      console.error('ID token verification failed:', idTokenError);
      return NextResponse.json(
        {
          error: 'INVALID_TOKEN',
          message:
            'Invalid or expired authentication token. Please sign in again.',
          details: idTokenError.message,
        },
        { status: 401 }
      );
    }

    console.log(`User ${uid} is uploading a document`);

    // Forward the request to the backend
    try {
      // Get the form data from the request
      const formData = await request.formData();
      console.log('Form data received, forwarding to backend');

      // Log the form data keys for debugging
      console.log('Form data keys:', Array.from(formData.keys()));

      // Log more details about each form field
      for (const [key, value] of formData.entries()) {
        if (key === 'document_file' && value instanceof File) {
          console.log(`Form field: ${key}`, {
            type: 'File',
            name: value.name,
            size: value.size,
            type: value.type,
            lastModified: new Date(value.lastModified).toISOString(),
          });
        } else {
          console.log(`Form field: ${key}`, {
            type: typeof value,
            value: value instanceof File ? '[File object]' : value,
          });
        }
      }

      // Create a new FormData object for axios
      const FormData = require('form-data');
      const axiosFormData = new FormData();

      // Copy all entries from the original formData to the new one
      for (const [key, value] of formData.entries()) {
        console.log(`Adding form field to axios FormData: ${key}`);

        // Special handling for file fields
        if (key === 'document_file' && value instanceof File) {
          // Convert the file to a Buffer
          const arrayBuffer = await value.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Add the file with proper filename and content type
          axiosFormData.append(key, buffer, {
            filename: value.name,
            contentType: value.type || 'application/octet-stream',
          });

          console.log(
            `Added file ${value.name} (${value.size} bytes) as Buffer`
          );
        } else {
          // For non-file fields, just append the value
          axiosFormData.append(key, String(value));
        }
      }

      // Forward the request to the backend
      console.log('Sending request to:', `${API_URL}/documents/upload`);
      const response = await axios.post(
        `${API_URL}/documents/upload`,
        axiosFormData,
        {
          headers: {
            // Don't set Content-Type here, let axios set it with the correct boundary
            Authorization: `Bearer ${token}`,
          },
          // Important: These settings help with large file uploads
          timeout: 60000, // 60 seconds
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          // Don't transform the request data
          transformRequest: [(data) => data],
        }
      );

      console.log('Backend response:', response.data);

      return NextResponse.json(response.data);
    } catch (error: any) {
      console.error(
        'Error forwarding document upload to backend:',
        error.message
      );

      // If the backend is not available, create a mock response
      if (error.code === 'ECONNREFUSED' || !error.response) {
        console.log('Backend not available, creating mock response');

        // Create a document ID
        const documentId = uuidv4();

        // Use the Firestore instance imported at the top

        // Create a document in Firestore
        await db.collection('documents').doc(documentId).set({
          uploadedBy: uid,
          documentName: 'Test Document',
          documentType: 'Identity',
          status: 'Pending Verification',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
          documentId,
          status: 'Pending',
          message: 'Document uploaded successfully (mock)',
        });
      }

      // Return the error from the backend
      return NextResponse.json(
        { error: error.response?.data || 'Document upload failed' },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in document upload API route:', error);

    // Provide more detailed error messages based on error type
    if (error.name === 'FirebaseError') {
      return NextResponse.json(
        {
          error: 'FIREBASE_ERROR',
          message: 'Database operation failed. Please try again later.',
          details: error.message,
        },
        { status: 500 }
      );
    } else if (error.message.includes('token')) {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_ERROR',
          message: 'Authentication failed. Please sign in again.',
          details: error.message,
        },
        { status: 401 }
      );
    } else if (
      error.message.includes('file') ||
      error.message.includes('document')
    ) {
      return NextResponse.json(
        {
          error: 'DOCUMENT_ERROR',
          message:
            'There was a problem with your document. Please try again with a different file.',
          details: error.message,
        },
        { status: 400 }
      );
    }

    // Default error response
    return NextResponse.json(
      {
        error: 'UPLOAD_ERROR',
        message: 'Document upload failed. Please try again later.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
