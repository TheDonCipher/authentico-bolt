import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/firebase-admin-server';
import firebase from '../../../../lib/firebase-compat';

/**
 * Exchange a custom token for an ID token
 *
 * This endpoint is used for testing purposes to exchange a Firebase custom token
 * for an ID token that can be used for authentication.
 *
 * In a real application, this would be done by the client SDK directly.
 */
export async function POST(request: NextRequest) {
  try {
    const { customToken } = await request.json();

    if (!customToken) {
      return NextResponse.json(
        { error: 'Custom token is required' },
        { status: 400 }
      );
    }

    // Use the Firebase client SDK to sign in with the custom token
    // This is a workaround for testing since we can't use the client SDK directly in tests
    const userCredential = await firebase
      .auth()
      .signInWithCustomToken(customToken);

    // Get the ID token
    const idToken = await userCredential.user?.getIdToken();

    if (!idToken) {
      return NextResponse.json(
        { error: 'Failed to get ID token' },
        { status: 500 }
      );
    }

    return NextResponse.json({ idToken });
  } catch (error: any) {
    console.error('Error exchanging token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to exchange token' },
      { status: 500 }
    );
  }
}
