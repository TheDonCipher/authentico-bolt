import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/firebase-admin-server';
import {
  USER_COLLECTION,
  DOCUMENT_COLLECTION,
  ORGANIZATION_COLLECTION,
} from '../../../../lib/constants';

export async function GET(request: NextRequest) {
  try {
    // Verify the authentication token and admin status
    const authResult = await verifyAuth(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Check if user is admin
    const adminWalletAddress =
      process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ||
      '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c';

    // Get user ID from token
    const uid = authResult.decodedToken.uid;

    // Check if this user is the admin by checking the UID against known admin wallet
    // This is a workaround since the wallet address might not be in the token
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    // Get wallet address from user data or token
    const tokenWalletAddress =
      userData?.walletAddress ||
      authResult.decodedToken.walletAddress ||
      authResult.decodedToken.wallet_address ||
      authResult.decodedToken.wallet;

    // Check if user is admin by wallet address or admin flag
    const isAdmin =
      authResult.decodedToken.admin === true ||
      userData?.userType === 'admin' ||
      (tokenWalletAddress &&
        tokenWalletAddress.toLowerCase() === adminWalletAddress.toLowerCase());

    console.log('Admin check:', {
      uid,
      tokenWalletAddress,
      adminWalletAddress,
      isAdmin,
      userType: userData?.userType,
      decodedToken: authResult.decodedToken,
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Get counts from Firestore
    const [
      usersSnapshot,
      documentsSnapshot,
      organizationsSnapshot,
      pendingOrgsSnapshot,
    ] = await Promise.all([
      db.collection(USER_COLLECTION).count().get(),
      db.collection(DOCUMENT_COLLECTION).count().get(),
      db.collection(ORGANIZATION_COLLECTION).count().get(),
      db
        .collection(ORGANIZATION_COLLECTION)
        .where('status', '==', 'pending')
        .count()
        .get(),
    ]);

    // Return the statistics
    return NextResponse.json({
      users: usersSnapshot.data().count,
      documents: documentsSnapshot.data().count,
      organizations: organizationsSnapshot.data().count,
      pendingOrganizations: pendingOrgsSnapshot.data().count,
    });
  } catch (error: any) {
    console.error('Error fetching admin statistics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}
