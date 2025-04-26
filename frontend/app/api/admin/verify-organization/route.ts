import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-middleware';
import { auth, db } from '../../../../lib/firebase-admin-server';
import { FieldValue } from 'firebase-admin/firestore';

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

    // Check if user is admin by wallet address or admin flag
    // First, check if the admin flag is set in the token
    let isAdmin = authResult.decodedToken.admin === true;

    // If not, check if the user type is admin in Firestore
    if (!isAdmin && userData?.userType === 'admin') {
      isAdmin = true;
    }

    // If still not, check if the wallet address matches the admin wallet address
    if (!isAdmin && tokenWalletAddress) {
      isAdmin =
        tokenWalletAddress.toLowerCase() === adminWalletAddress.toLowerCase();
    }

    // Finally, check the wallet address in the user data
    if (!isAdmin && userData?.walletAddress) {
      isAdmin =
        userData.walletAddress.toLowerCase() ===
        adminWalletAddress.toLowerCase();
    }

    console.log('Is admin check result:', isAdmin);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Get request body
    const { applicationId, status, notes } = await request.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected".' },
        { status: 400 }
      );
    }

    // Map the API status to our internal verification status
    const verificationStatus = status === 'approved' ? 'verified' : 'rejected';

    // First try to get the application from organizationApplications collection
    let applicationDoc = await db
      .collection('organizationApplications')
      .doc(applicationId)
      .get();

    // If not found, try to get from users collection
    if (!applicationDoc.exists) {
      applicationDoc = await db.collection('users').doc(applicationId).get();
      
      if (!applicationDoc.exists) {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }
    }

    const applicationData = applicationDoc.data() || {};
    const organizationId = applicationData.organizationId || applicationId;

    // Update the application status in organizationApplications collection if it exists
    if (applicationDoc.ref.path.includes('organizationApplications')) {
      await db
        .collection('organizationApplications')
        .doc(applicationId)
        .update({
          status,
          notes: notes || null,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: uid,
        });
    }

    // Update the organization's status in the users collection
    try {
      console.log(
        `Updating organization ${organizationId} status to ${verificationStatus}`
      );

      // First check if the organization exists
      const orgDoc = await db.collection('users').doc(organizationId).get();
      
      if (!orgDoc.exists) {
        console.error(`Organization ${organizationId} not found`);
        return NextResponse.json(
          { error: `Organization with ID ${organizationId} not found` },
          { status: 404 }
        );
      }

      // Get the current verification status
      const orgData = orgDoc.data() || {};
      const currentStatus = 
        orgData.verificationStatus ||
        (orgData.isVerified ? 'verified' : 'not_verified');

      console.log(`Current organization status: ${currentStatus}`);

      // Update the organization's status
      if (status === 'approved') {
        await db.collection('users').doc(organizationId).update({
          verificationStatus: 'verified',
          isVerified: true,
          verifiedAt: FieldValue.serverTimestamp(),
          verificationUpdatedAt: FieldValue.serverTimestamp(),
          verifiedBy: uid,
          verificationUpdatedBy: uid,
        });
      } else {
        await db.collection('users').doc(organizationId).update({
          verificationStatus: 'rejected',
          isVerified: false,
          rejectedAt: FieldValue.serverTimestamp(),
          verificationUpdatedAt: FieldValue.serverTimestamp(),
          rejectedBy: uid,
          verificationUpdatedBy: uid,
          rejectionNotes: notes || null,
          verificationRejectionReason: notes || null,
        });
      }

      // Create a notification for the organization
      await db.collection('notifications').add({
        userId: organizationId,
        type: 'organization_verification',
        title: status === 'approved' ? 'Organization Verified' : 'Organization Verification Rejected',
        message: status === 'approved' 
          ? 'Your organization has been verified successfully.'
          : 'Your organization verification request has been rejected.',
        notes: notes || null,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        message: `Organization ${status} successfully`,
        organizationId: organizationId,
        status: status,
      });
    } catch (error: any) {
      console.error(`Error updating organization status: ${error.message}`);
      return NextResponse.json(
        { error: error.message || 'Failed to update organization status' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in verify-organization route:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
