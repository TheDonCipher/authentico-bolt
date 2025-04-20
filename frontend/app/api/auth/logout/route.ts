import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/firebase-admin-server';
import axios from 'axios';

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];

    try {
      // Verify the token
      const decodedToken = await auth.verifyIdToken(token);
      const uid = decodedToken.uid;

      // Forward the logout request to the backend
      const response = await axios.post(
        `${API_URL}/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Add the token to a blacklist in memory (this is a simple implementation)
      // In a production environment, you would use a more robust solution like Redis
      global.tokenBlacklist = global.tokenBlacklist || new Set();
      global.tokenBlacklist.add(token);

      return NextResponse.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Logout failed',
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Logout failed',
      },
      { status: 500 }
    );
  }
}
