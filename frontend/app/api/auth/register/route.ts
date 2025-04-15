import { NextResponse } from 'next/server';
import { db, auth } from '../../../../lib/firebase-admin-server';
import admin from 'firebase-admin';

// Standardize on a single collection name
const USER_COLLECTION = 'users';

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

    try {
      // Check if user already exists
      const usersRef = db.collection(USER_COLLECTION);
      const snapshot = await usersRef
        .where('walletAddress', '==', walletAddress)
        .get();

      if (!snapshot.empty) {
        return NextResponse.json(
          {
            error: 'WALLET_ALREADY_REGISTERED',
            message:
              'This wallet address is already registered. Please sign in instead.',
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
    } catch (authError) {
      console.error('Firestore/Auth error during registration:', authError);
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_ERROR',
          message: 'Unable to create user account. Please try again later.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Registration error details:', errorMessage);

    return NextResponse.json(
      {
        error: 'REGISTRATION_FAILED',
        message: 'Registration failed. Please try again later.',
      },
      { status: 500 }
    );
  }
}
