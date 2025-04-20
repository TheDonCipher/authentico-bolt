import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth, db } from '../../../../lib/firebase-admin-server';

/**
 * API endpoint to check the current session state
 * This is useful for debugging authentication issues
 */
export async function GET(request: NextRequest) {
  try {
    // Get cookies
    const cookieStore = await cookies();
    const authTokenCookie = cookieStore.get('authToken');
    const userDataCookie = cookieStore.get('userData');

    // Check if cookies exist
    const hasCookies = {
      authToken: !!authTokenCookie,
      userData: !!userDataCookie,
    };

    // Parse user data if available
    let userData = null;
    try {
      if (userDataCookie) {
        userData = JSON.parse(userDataCookie.value);
      }
    } catch (error) {
      console.error('Error parsing user data cookie:', error);
    }

    // Check token validity if available
    let tokenValid = false;
    let tokenData: any = null;
    let firebaseUser: any = null;

    if (authTokenCookie) {
      try {
        // Verify the token
        const decodedToken = await auth.verifyIdToken(authTokenCookie.value);
        tokenValid = true;
        tokenData = {
          uid: decodedToken.uid,
          exp: decodedToken.exp,
          iat: decodedToken.iat,
          auth_time: decodedToken.auth_time,
        };

        // Get user from Firestore
        const userDoc = await db
          .collection('users')
          .doc(decodedToken.uid)
          .get();
        if (userDoc.exists) {
          firebaseUser = {
            uid: userDoc.id,
            userType: userDoc.data()?.userType,
            walletAddress: userDoc.data()?.walletAddress,
            name: userDoc.data()?.name,
            organizationName: userDoc.data()?.organizationName,
            isVerified: userDoc.data()?.isVerified,
          };
        }
      } catch (error) {
        console.error('Token verification error:', error);
      }
    }

    // Return session information
    return NextResponse.json({
      hasCookies,
      userData,
      tokenValid,
      tokenData,
      firebaseUser,
    });
  } catch (error: any) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check session' },
      { status: 500 }
    );
  }
}
