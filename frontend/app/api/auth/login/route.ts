import { NextResponse } from 'next/server';
import { db, auth } from '../../../../lib/firebase-admin-server';

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Check if user exists in Firestore
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('walletAddress', '==', walletAddress)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'NEW_USER' }, { status: 404 });
    }

    // User exists, create a custom token for them
    const userDoc = snapshot.docs[0];
    const uid = userDoc.id;
    const userData = userDoc.data();

    // Create a custom token for this user
    const token = await auth.createCustomToken(uid);

    return NextResponse.json({
      token,
      user: {
        uid,
        walletAddress: userData.walletAddress,
        userType: userData.userType,
        name: userData.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
