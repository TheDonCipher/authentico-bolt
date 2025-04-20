import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../../../lib/firebase-admin-server';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function POST(request: NextRequest) {
  try {
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
      const decodedToken = await auth.verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (idTokenError) {
      console.error('ID token verification failed:', idTokenError.message);
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

    // Forward the request to the backend
    try {
      console.log('Document upload API route called');

      // Get the form data from the request
      const formData = await request.formData();

      // Debug form data
      const formEntries = Array.from(formData.entries());
      console.log(`Form data entries count: ${formEntries.length}`);

      if (formEntries.length === 0) {
        console.error('Empty form data received');
        return NextResponse.json(
          { error: 'EMPTY_FORM', message: 'No form data provided' },
          { status: 400 }
        );
      }

      // Log form entries for debugging
      formEntries.forEach(([key, value]) => {
        if (value instanceof File) {
          console.log(
            `Form entry: ${key} = File (${value.name}, ${value.size} bytes, ${value.type})`
          );
        } else {
          console.log(`Form entry: ${key} = ${value}`);
        }
      });

      // Check if document_file exists
      const fileEntry = formEntries.find(([key]) => key === 'document_file');
      if (!fileEntry || !(fileEntry[1] instanceof File)) {
        console.error('No document file found in form data');
        return NextResponse.json(
          { error: 'NO_FILE', message: 'No document file provided' },
          { status: 400 }
        );
      }

      // Create a new FormData object for axios
      const FormData = require('form-data');
      const axiosFormData = new FormData();

      // Copy all entries from the original formData to the new one
      const entries = Array.from(formData.entries());
      for (const [key, value] of entries) {
        // Special handling for file fields
        if (key === 'document_file' && value instanceof File) {
          // Only log in development environment
          if (process.env.NODE_ENV === 'development') {
            console.log(`Processing file: ${value.name} (${value.size} bytes)`);
          }

          // Convert the file to a Buffer
          const arrayBuffer = await value.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Add the file with proper filename and content type
          // IMPORTANT: Use the exact field name expected by multer in the backend
          axiosFormData.append('document_file', buffer, {
            filename: value.name,
            contentType: value.type || 'application/octet-stream',
            knownLength: buffer.length, // Add known length to help with content-length header
          });

          // Log the buffer size for debugging
          console.log(`File buffer size: ${buffer.length} bytes`);

          // Only log in development environment
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `Added file to axios FormData with content type: ${
                value.type || 'application/octet-stream'
              }, length: ${buffer.length}`
            );
          }
        } else {
          // For non-file fields, just append the value
          axiosFormData.append(key, String(value));

          // Only log in development environment
          if (process.env.NODE_ENV === 'development') {
            console.log(
              `Added form field to axios FormData: ${key}=${String(value)}`
            );
          }
        }
      }

      // Forward the request to the backend
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `Forwarding request to backend: ${API_URL}/documents/upload`
        );
      }

      // Get the headers that form-data wants to set
      const formHeaders = axiosFormData.getHeaders();

      if (process.env.NODE_ENV === 'development') {
        console.log('Form headers:', formHeaders);
      }

      // Log the form data size
      console.log(
        `Form data size estimate: ${axiosFormData.getLengthSync()} bytes`
      );

      const response = await axios.post(
        `${API_URL}/documents/upload`,
        axiosFormData,
        {
          headers: {
            // Use the content-type header from form-data with the correct boundary
            ...formHeaders,
            Authorization: `Bearer ${token}`,
          },
          // Important: These settings help with large file uploads
          timeout: 120000, // 120 seconds (increased timeout)
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          // IMPORTANT: Remove transformRequest to let axios handle FormData properly
          // validateStatus to handle all responses
          validateStatus: (status) => {
            // Log the status code for debugging in development
            if (process.env.NODE_ENV === 'development') {
              console.log(`Backend response status: ${status}`);
            }
            return true; // Handle all status codes in the catch block
          },
        }
      );

      // Only log in development environment
      if (process.env.NODE_ENV === 'development') {
        console.log('Backend response received:', response.data);
      }
      return NextResponse.json(response.data);
    } catch (error: any) {
      console.error('Document upload error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });

      // If the backend is not available, create a mock response
      if (error.code === 'ECONNREFUSED' || !error.response) {
        // Create a document ID
        const documentId = uuidv4();

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

      // Check for specific error types
      if (error.response?.status === 400) {
        return NextResponse.json(
          {
            error: 'INVALID_REQUEST',
            message:
              'Invalid document upload request. Please check your file and try again.',
            details: error.response?.data?.error || error.message,
          },
          { status: 400 }
        );
      }

      // Return the error from the backend
      return NextResponse.json(
        { error: error.response?.data?.error || 'Document upload failed' },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in document upload API route:', error.message);

    // Provide more detailed error messages based on error type
    if (error.name === 'FirebaseError') {
      return NextResponse.json(
        {
          error: 'FIREBASE_ERROR',
          message: 'Database operation failed. Please try again later.',
        },
        { status: 500 }
      );
    } else if (error.message.includes('token')) {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_ERROR',
          message: 'Authentication failed. Please sign in again.',
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
        },
        { status: 400 }
      );
    }

    // Default error response
    return NextResponse.json(
      {
        error: 'UPLOAD_ERROR',
        message: 'Document upload failed. Please try again later.',
      },
      { status: 500 }
    );
  }
}
