import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-middleware';
import { auth, db } from '../../../../lib/firebase-admin-server';

export async function POST(request: NextRequest) {
  try {
    // Verify the authentication token
    const authResult = await verifyAuth(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get admin wallet address from environment variable
    const adminWalletAddress =
      process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ||
      '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c';

    // Get user ID from token
    const uid = authResult.decodedToken.uid;

    // Check if this user is the admin by checking the UID against known admin wallet
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    // Get wallet address from user data or token
    const tokenWalletAddress =
      userData?.walletAddress ||
      authResult.decodedToken.walletAddress ||
      authResult.decodedToken.wallet_address ||
      authResult.decodedToken.wallet;

    // Log all the relevant information for debugging
    console.log('Admin verification data:', {
      uid,
      userType: userData?.userType,
      tokenWalletAddress,
      adminWalletAddress,
      tokenAdmin: authResult.decodedToken.admin,
      decodedToken: authResult.decodedToken,
    });

    // Check if user is admin by wallet address
    const isAdmin =
      tokenWalletAddress?.toLowerCase() === adminWalletAddress.toLowerCase() ||
      userData?.walletAddress?.toLowerCase() === adminWalletAddress.toLowerCase();

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Only the admin wallet can set admin claims.' },
        { status: 403 }
      );
    }

    // Set admin claims for the user
    try {
      // Set custom claims
      await auth.setCustomUserClaims(uid, {
        admin: true,
        userType: 'admin',
      });

      // Update user document in Firestore
      await db.collection('users').doc(uid).update({
        userType: 'admin',
        isAdmin: true,
        updatedAt: new Date(),
      });

      console.log(`Admin claims set for user ${uid}`);

      return NextResponse.json({
        success: true,
        message: 'Admin claims set successfully',
      });
    } catch (error) {
      console.error('Error setting admin claims:', error);
      return NextResponse.json(
        {
          error: 'Failed to set admin claims',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in set-admin-claims route:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
