import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '../../../../lib/firebase-admin-server';
import { verifyAuth } from '../../../../lib/auth-middleware';

// Standardize on a single collection name
const USER_COLLECTION = 'users';

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

export async function GET(request: NextRequest) {
  try {
    // Verify the authentication token
    const authResult = await verifyAuth(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status, headers: corsHeaders }
      );
    }

    const uid = authResult.uid;

    try {
      // Get user data from the standardized collection
      const userDoc = await db.collection(USER_COLLECTION).doc(uid).get();

      if (!userDoc.exists) {
        return NextResponse.json(
          {
            error: 'USER_NOT_FOUND',
            message: 'User account not found. Please register first.',
          },
          { status: 404, headers: corsHeaders }
        );
      }

      const userData = userDoc.data();

      return NextResponse.json(
        {
          uid,
          walletAddress: userData.walletAddress,
          userType: userData.userType,
          name: userData.name,
          isVerified: userData.isVerified || false,
          ...(userData.organizationName && {
            organizationName: userData.organizationName,
          }),
        },
        {
          headers: corsHeaders,
        }
      );
    } catch (authError) {
      console.error('Firestore authentication error:', authError);
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_ERROR',
          message:
            'Unable to authenticate with the database. Please try again later.',
        },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('User data error details:', errorMessage);

    return NextResponse.json(
      {
        error: 'USER_DATA_ERROR',
        message: 'Failed to fetch user data. Please try again later.',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
