import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Verify the authentication token
    const authResult = await verifyAuth(request);
    
    if (!authResult.success) {
      return NextResponse.json(
        { valid: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    
    // If we get here, the token is valid
    return NextResponse.json({
      valid: true,
      uid: authResult.uid,
      exp: authResult.decodedToken.exp,
    });
  } catch (error: any) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: error.message || 'Token validation failed',
      },
      { status: 500 }
    );
  }
}
