import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/firebase-admin-server';

export async function GET(request: NextRequest) {
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
        tokenWalletAddress.toLowerCase() ===
          adminWalletAddress.toLowerCase()) ||
      (userData?.walletAddress &&
        userData.walletAddress.toLowerCase() ===
          adminWalletAddress.toLowerCase());

    console.log('Admin check for applications:', {
      uid,
      tokenWalletAddress,
      adminWalletAddress,
      isAdmin,
      userType: userData?.userType,
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Query for all applications
    const snapshot = await db
      .collection('organizationApplications')
      .orderBy('submittedAt', 'desc')
      .get();

    // Format results
    const applications = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        orgName: data.orgName,
        contactEmail: data.contactEmail,
        website: data.website || '',
        phoneNumber: data.phoneNumber || '',
        industry: data.industry || '',
        status: data.status || 'pending',
        submittedAt: data.submittedAt ? data.submittedAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
      };
    });

    return NextResponse.json(applications);
  } catch (error: any) {
    console.error('Error getting organization applications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get applications' },
      { status: 500 }
    );
  }
}
