import { NextResponse } from 'next/server';
import { db, auth } from '../../../../lib/firebase-admin-server';
import admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const { walletAddress, userType, userData } = await request.json();

    if (!walletAddress || !userType || !userData) {
      return NextResponse.json(
        {
          error: 'Wallet address, user type, and user data are required',
        },
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
        {
          error: 'User with this wallet address already exists',
        },
        { status: 409 }
      );
    }

    // Create a new user in Firebase Auth
    const userRecord = await auth.createUser({
      // No email/password for wallet-based auth
      displayName: userData.name || 'Authentico User',
    });

    // Store user data in Firestore
    const userDocRef = usersRef.doc(userRecord.uid);
    await userDocRef.set({
      uid: userRecord.uid,
      walletAddress,
      userType,
      name: userData.name,
      ...(userType === 'organization' && {
        organizationName: userData.organizationName,
      }),
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        uid: userRecord.uid,
        message: 'User registered successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        error: 'Registration failed',
      },
      { status: 500 }
    );
  }
}
