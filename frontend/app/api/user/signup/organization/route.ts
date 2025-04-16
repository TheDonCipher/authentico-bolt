import { NextResponse } from 'next/server';
import { db, auth } from '../../../../../lib/firebase-admin-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgName, email, walletAddress } = body;

    // Validate required fields
    if (!orgName || !email || !walletAddress) {
      return NextResponse.json(
        { error: 'Organization name, email, and wallet address are required' },
        { status: 400 }
      );
    }

    // Check if organization already exists
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('walletAddress', '==', walletAddress)
      .get();

    if (!snapshot.empty) {
      return NextResponse.json(
        { error: 'Organization with this wallet address already exists' },
        { status: 409 }
      );
    }

    // Create a new organization document
    const orgData = {
      name: orgName,
      email,
      walletAddress,
      userType: 'organization',
      status: 'pending', // Organizations start as pending until verified
      createdAt: new Date().toISOString(),
    };

    // Add organization to Firestore
    const orgRef = await usersRef.add(orgData);
    const uid = orgRef.id;

    // Create organization details document
    const orgDetailsRef = db.collection('organizationDetails').doc(uid);
    await orgDetailsRef.set({
      orgId: uid,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Create a custom token for the new organization
    const customToken = await auth.createCustomToken(uid);

    return NextResponse.json({
      success: true,
      uid,
      walletAddress,
      userType: 'organization',
      token: customToken,
      message: 'organization registered successfully',
    });
  } catch (error) {
    console.error('Error signing up organization:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
