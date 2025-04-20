import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/firebase-admin-server';
import { USER_COLLECTION } from '../../../../lib/constants';

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
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }
    
    // Get organizations from Firestore
    const orgsQuery = await db.collection(USER_COLLECTION)
      .where('userType', '==', 'organization')
      .get();
    
    const organizations = orgsQuery.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Organization',
        organizationName: data.organizationName || data.name || 'Unnamed Organization',
        contactEmail: data.contactEmail || data.email || '',
        walletAddress: data.walletAddress || '',
        status: data.status || 'pending',
        verificationStatus: data.verificationStatus || data.status || 'pending',
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
        industry: data.industry || '',
        website: data.website || '',
        description: data.description || ''
      };
    });
    
    // Return the organizations
    return NextResponse.json(organizations);
  } catch (error: any) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}
