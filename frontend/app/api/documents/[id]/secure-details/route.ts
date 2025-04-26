import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/firebase-admin-server';
import axios from 'axios';

// Get the API URL from environment variables
// Ensure proper formatting of the API URL
let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Remove trailing slash if present
if (API_URL.endsWith('/')) {
  API_URL = API_URL.slice(0, -1);
}

// Ensure the URL ends with /api
if (!API_URL.endsWith('/api')) {
  API_URL = `${API_URL}/api`;
}

// For local development, ensure we're using the correct URL
if (process.env.NODE_ENV === 'development') {
  API_URL = 'http://localhost:8080/api';
}

console.log('Using API URL for document secure-details:', API_URL);
console.log('Node environment:', process.env.NODE_ENV);
console.log('Vercel environment:', process.env.VERCEL_ENV || 'Not on Vercel');

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

      console.log(
        `Document ${id} found in Firestore, proceeding to backend request`
      );

      // Forward the request to the backend
      try {
        // Construct the backend URL correctly
        const backendUrl = `${API_URL}/documents/${id}/secure-details`;
        console.log(`Making request to backend: ${backendUrl}`);

        // Add a custom header to indicate this is a direct API call
        const headers = {
          Authorization: `Bearer ${token}`,
          'x-request-source': 'nextjs-api',
          'x-document-id': id,
          'x-user-id': uid,
        };

        console.log('Request headers:', headers);

        const response = await axios.get(backendUrl, {
          headers,
          timeout: 20000, // 20 second timeout
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

        // Create a fallback response with document metadata
        console.log('Creating fallback response with document metadata');

        // Get document metadata from Firestore
        const mimeType = docData.mimeType || 'application/octet-stream';
        const documentName = docData.documentName || 'Document';

        // Create a placeholder based on the document type
        let placeholderData = '';

        if (mimeType === 'application/pdf') {
          // Create a minimal valid PDF
          placeholderData =
            'JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDEgMCBSIC9MYXN0TW9kaWZpZWQgKEQ6MjAyMzAxMDEwMDAwMDArMDAnMDAnKQovUmVzb3VyY2VzIDIgMCBSIC9NZWRpYUJveCBbMCAwIDU5NSA4NDJdIC9Dcm9wQm94IFswIDAgNTk1IDg0Ml0gL0JsZWVkQm94IFswIDAgNTk1IDg0Ml0KL0NvbnRlbnRzIDYgMCBSIC9Sb3RhdGUgMCA+PgplbmRvYmoKNiAwIG9iago8PCAvTGVuZ3RoIDc3IC9GaWx0ZXIgL0ZsYXRlRGVjb2RlID4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAw1DMwsdQzNFrFpWBmYGZqZGJgYKZnqGRmYGRmYGxkbmJpZGJpZmJmYWlkZmwJFHO1sDTVMzRcxQUAzXUPJgplbmRzdHJlYW0KZW5kb2JqCjEgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFs1IDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDEgMCBSIC9NZXRhZGF0YSA0IDAgUiA+PgplbmRvYmoKNCAwIG9iago8PCAvTGVuZ3RoIDIzIC9UeXBlIC9NZXRhZGF0YSAvU3VidHlwZSAvWE1MID4+CnN0cmVhbQo8P3hwYWNrZXQgYmVnaW49Iu+7vyI/Pgo8P3hwYWNrZXQgZW5kPSJ3Ij8+CmVuZHN0cmVhbQplbmRvYmoKMiAwIG9iago8PCAvUHJvY1NldCBbL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSV0gPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDI4MSAwMDAwMCBuIAowMDAwMDAwNDQwIDAwMDAwIG4gCjAwMDAwMDAzNDAgMDAwMDAgbiAKMDAwMDAwMDM5OSAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAxNDQgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA3IC9Sb290IDMgMCBSIC9JbmZvIDIgMCBSID4+CnN0YXJ0eHJlZgo1MDEKJSVFT0YK';
        } else if (mimeType.startsWith('image/')) {
          // For images, use a placeholder image
          placeholderData =
            'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAABjUExURUdwTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHqUlBYAAAAgdFJOUwAQIDBAUGBwgI+fr7/P3+8gMEBQYHCAj5+vv8/f7y9hWVIAAAGwSURBVHja7d3LbsIwFEXRm1BSniWlpdDy+P9PpGKUdoDkPvbV3p8QWfKJldiOUhQAAAAAAAAAAAAAAAAAAAAAAAAAAADYqHbVN/10aBbbuWuaYTqN/Xj4XbvqxrE/rR+b5nDo+nH1gHbVDcNqbLtFM/XrBnTb5jOm7XoB7XH+YtodVwroP5av+tMqAe2h/2bsDuUDuv3yzX5XOqBdLt/tywb0y/cO+5IBu+X7h13BgG65fO9QLKD/uPzHvlDA7vPyH7tCAfvl8r1DoYD98r1DoYD98r1DoYDd8r1DoYBu+d6hUMBh+d6hUMBx+d6hUMBp+d6hUMB5+d6hUMBl+d6hUMB1+d6hUMBt+d6hUMB9+d6hUMBj+d6hUMBz+d6hUMB/y/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOhQJey/cOAAAAAAAAAAAAAAAAAAAAAAAAAAAA8Oe9AYiaJ1FsXZZLAAAAAElFTkSuQmCC';
        } else {
          // For other types, use a generic placeholder
          placeholderData =
            'VGhpcyBpcyBhIHBsYWNlaG9sZGVyIGZvciB0aGUgZG9jdW1lbnQgY29udGVudC4gVGhlIGFjdHVhbCBkb2N1bWVudCBjYW4gYmUgdmlld2VkIGluIHRoZSBhZG1pbiBkYXNoYm9hcmQu';
        }

        return NextResponse.json({
          id: id,
          documentName: documentName,
          documentType: docData.documentType || 'Unknown',
          documentTypeName: docData.documentTypeName || 'Unknown Type',
          status: docData.status || 'Unknown',
          ownerName: docData.ownerName || 'Unknown',
          mimeType: mimeType,
          decryptedFile: placeholderData,
          fallback: true,
          message: 'Using fallback document view due to backend API error',
        });
      }
    } catch (firestoreError: any) {
      console.error('Error checking document in Firestore:', firestoreError);

      // Try the direct view as a fallback
      try {
        console.log('Falling back to direct document view');

        // Return basic document information from Firestore
        return NextResponse.json({
          id: id,
          documentName: 'Unnamed Document',
          documentType: 'Unknown',
          documentTypeName: 'Unknown Type',
          status: 'Unknown',
          ownerName: 'Unknown',
          mimeType: 'application/octet-stream',
          fallback: true,
          message: 'Unable to retrieve document content. Using fallback view.',
        });
      } catch (fallbackError: any) {
        console.error('Fallback also failed:', fallbackError.message);

        // Try the backend as a last resort
        try {
          console.log('Trying direct backend request as last resort');
          // Construct the backend URL correctly
          const backendUrl = `${API_URL}/documents/${id}/secure-details`;
          console.log(`Making last resort request to backend: ${backendUrl}`);

          const response = await axios.get(backendUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
              'x-request-source': 'nextjs-api-fallback',
              'x-document-id': id,
              'x-user-id': uid,
            },
            timeout: 20000, // 20 second timeout
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
