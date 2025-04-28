import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * API endpoint to check if the backend is online
 * This is used by the frontend to determine if the backend is available
 */
export async function GET() {
  try {
    // Get the backend API URL from environment variables
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    
    // Remove trailing slash if present
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }
    
    // Ensure the URL has the correct format
    if (!apiUrl.endsWith('/api')) {
      apiUrl = `${apiUrl}/api`;
    }
    
    console.log(`Checking backend status at: ${apiUrl}/health`);
    
    // Try to connect to the backend health endpoint with a short timeout
    const response = await axios.get(`${apiUrl}/health`, {
      timeout: 5000, // 5 second timeout
    });
    
    // If we get here, the backend is online
    return NextResponse.json({
      status: 'ok',
      online: true,
      timestamp: new Date().toISOString(),
      backendUrl: apiUrl,
      backendResponse: response.data,
    });
  } catch (error: any) {
    console.error('Backend status check error:', error.message);
    
    // Return a response indicating the backend is offline
    return NextResponse.json({
      status: 'error',
      online: false,
      timestamp: new Date().toISOString(),
      error: error.message || 'Failed to connect to backend',
    });
  }
}
