import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { docId: string } }
) {
  try {
    console.log(`Verifying document with ID: ${params.docId}`);

    // Forward the request to the backend
    const response = await axios.get(`${API_URL}/verify/${params.docId}`);
    
    console.log('Verification response:', response.data);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error verifying document:', error);
    
    // Return appropriate error response
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || 'Failed to verify document';
    
    return NextResponse.json(
      { error: errorMessage, details: error.response?.data?.details },
      { status }
    );
  }
}
