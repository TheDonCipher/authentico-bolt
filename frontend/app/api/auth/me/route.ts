import { NextResponse } from 'next/server';
import { db, auth } from '../../../../lib/firebase-admin-server';

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    return NextResponse.json({
      uid,
      walletAddress: userData.walletAddress,
      userType: userData.userType,
      name: userData.name,
      ...(userData.organizationName && {
        organizationName: userData.organizationName,
      }),
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}
