import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/firebase-admin-server';

export async function GET(request: NextRequest) {
  try {
    // Verify the authentication token
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const usersQuery = await db
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (usersQuery.empty) {
      return NextResponse.json(
        { error: 'User not found with this email' },
        { status: 404 }
      );
    }
    
    const userDoc = usersQuery.docs[0];
    const userData = userDoc.data();
    
    // Return user data with limited fields for security
    return NextResponse.json({
      uid: userDoc.id,
      name: userData.name || '',
      email: userData.email || '',
      userType: userData.userType || '',
    });
  } catch (error: any) {
    console.error('Error finding user by email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to find user' },
      { status: 500 }
    );
  }
}
