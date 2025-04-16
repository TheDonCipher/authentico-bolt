import { NextResponse } from 'next/server';
import { db, auth } from '../../../../../lib/firebase-admin-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, walletAddress, userType } = body;

    // Validate required fields
    if (!name || !email || !walletAddress) {
      return NextResponse.json(
        { error: 'Name, email, and wallet address are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('walletAddress', '==', walletAddress)
      .get();

    if (!snapshot.empty) {
      return NextResponse.json(
        { error: 'User with this wallet address already exists' },
        { status: 409 }
      );
    }

    // Create a new user document
    const userData = {
      name,
      email,
      walletAddress,
      userType: userType || 'individual',
      createdAt: new Date().toISOString(),
    };

    // Add user to Firestore
    const userRef = await usersRef.add(userData);
    const uid = userRef.id;

    // Create a custom token for the new user
    const customToken = await auth.createCustomToken(uid);

    return NextResponse.json({
      success: true,
      uid,
      walletAddress,
      userType: userData.userType,
      token: customToken,
      message: 'individual user registered successfully',
    });
  } catch (error) {
    console.error('Error signing up individual:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
