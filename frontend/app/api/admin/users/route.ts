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
    const isAdmin = authResult.decodedToken.admin === true || 
      (authResult.decodedToken.walletAddress && 
       authResult.decodedToken.walletAddress.toLowerCase() === 
       (process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c').toLowerCase());
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }
    
    // Get users from Firestore
    const usersSnapshot = await db.collection(USER_COLLECTION).get();
    
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        name: data.name || 'Unnamed User',
        email: data.email || undefined,
        walletAddress: data.walletAddress || '',
        userType: data.userType || 'individual',
        isVerified: data.isVerified || false,
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null
      };
    });
    
    // Return the users
    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
