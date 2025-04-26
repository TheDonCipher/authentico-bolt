import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthSuccess } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/firebase-admin-server';
import { DOCUMENT_COLLECTION } from '../../../../lib/constants';

export async function GET(request: NextRequest) {
  try {
    // Verify the authentication token and admin status
    const authResult = await verifyAuth(request);

    if (!isAuthSuccess(authResult)) {
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

    // Get documents from Firestore
    const docsSnapshot = await db
      .collection(DOCUMENT_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    const documents = docsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        documentId: data.documentId || doc.id,
        documentType: data.documentType || 'Unknown',
        documentName: data.documentName || data.name || 'Unnamed Document',
        status: data.status || 'Pending Verification',
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
        publicAddress: data.publicAddress || data.userWalletAddress || '',
        verifyingOrgId: data.verifyingOrgId || '',
        verifyingOrgName: data.verifyingOrgName || 'Unknown Organization',
        verifiedAt: data.verifiedAt ? data.verifiedAt.toDate() : null,
        rejectedAt: data.rejectedAt ? data.rejectedAt.toDate() : null,
        rejectionReason: data.rejectionReason || '',
        ownerUid: data.ownerUid || '',
        ownerName: data.ownerName || 'Unknown User',
      };
    });

    // Return the documents
    return NextResponse.json(documents);
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
