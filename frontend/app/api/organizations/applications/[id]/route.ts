import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/firebase-admin-server';
import { FieldValue } from 'firebase-admin/firestore';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if user is admin by wallet address or admin flag
    const isAdmin =
      authResult.decodedToken.admin === true ||
      userData?.userType === 'admin' ||
      (tokenWalletAddress &&
        tokenWalletAddress.toLowerCase() === adminWalletAddress.toLowerCase()) ||
      (userData?.walletAddress &&
        userData.walletAddress.toLowerCase() === adminWalletAddress.toLowerCase());

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Get application ID from URL params
    const applicationId = params.id;

    // Get request body
    const { status, notes } = await request.json();

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected".' },
        { status: 400 }
      );
    }

    // Get the application
    const applicationDoc = await db
      .collection('organizationApplications')
      .doc(applicationId)
      .get();

    if (!applicationDoc.exists) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const applicationData = applicationDoc.data();
    const organizationId = applicationData.organizationId;

    // Update the application status
    await db
      .collection('organizationApplications')
      .doc(applicationId)
      .update({
        status,
        notes: notes || null,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
      });

    // If approved, update the organization's status in the users collection
    if (status === 'approved' && organizationId) {
      await db.collection('users').doc(organizationId).update({
        status: 'verified',
        verifiedAt: FieldValue.serverTimestamp(),
        verifiedBy: uid,
      });

      // Create a notification for the organization
      await db.collection('notifications').add({
        userId: organizationId,
        type: 'organization_verification',
        title: 'Organization Verified',
        message: 'Your organization has been verified successfully.',
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    } else if (status === 'rejected' && organizationId) {
      // Update the organization's status to rejected
      await db.collection('users').doc(organizationId).update({
        status: 'rejected',
        rejectedAt: FieldValue.serverTimestamp(),
        rejectedBy: uid,
        rejectionNotes: notes || null,
      });

      // Create a notification for the organization
      await db.collection('notifications').add({
        userId: organizationId,
        type: 'organization_verification',
        title: 'Organization Verification Rejected',
        message: 'Your organization verification request has been rejected.',
        notes: notes || null,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating organization application:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update application' },
      { status: 500 }
    );
  }
}
