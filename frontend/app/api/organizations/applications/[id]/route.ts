import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/firebase-admin-server';
import { FieldValue } from 'firebase-admin/firestore';
import { AuditLogService } from '../../../../../lib/services/AuditLogService';
import { OrganizationVerificationStatus } from '../../../../types/user';

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

    // Check if the wallet address matches the admin wallet address
    console.log('Checking admin status:', {
      isAdmin,
      walletAddress: tokenWalletAddress,
      adminWalletAddress,
      userType: userData?.userType,
    });

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

    // Map the API status to our internal verification status
    const verificationStatus = status === 'approved' ? 'verified' : 'rejected';

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
      try {
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
        const orgData = orgDoc.data();
        const currentStatus: OrganizationVerificationStatus =
          orgData.verificationStatus ||
          (orgData.isVerified ? 'verified' : 'not_verified');

        // Update the organization's status
        await db.collection('users').doc(organizationId).update({
          status: 'verified',
          verificationStatus: 'verified',
          isVerified: true,
          verifiedAt: FieldValue.serverTimestamp(),
          verificationUpdatedAt: FieldValue.serverTimestamp(),
          verifiedBy: uid,
          verificationUpdatedBy: uid,
        });

        // Create audit log entry
        await AuditLogService.logVerificationStatusChange(
          organizationId,
          currentStatus,
          'verified',
          uid,
          'Organization verification approved'
        );

        // Create a notification for the organization
        await db.collection('notifications').add({
          userId: organizationId,
          type: 'organization_verification',
          title: 'Organization Verified',
          message: 'Your organization has been verified successfully.',
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      } catch (updateError) {
        console.error('Error updating organization status:', updateError);

        // Update the application status to reflect the error
        await db
          .collection('organizationApplications')
          .doc(applicationId)
          .update({
            processingError:
              updateError.message || 'Error updating organization status',
            updatedAt: FieldValue.serverTimestamp(),
          });

        // Return success for the application update, but include the error
        return NextResponse.json({
          success: true,
          warning:
            'Application marked as approved, but organization status update failed',
          error: updateError.message || 'Error updating organization status',
        });
      }
    } else if (status === 'rejected' && organizationId) {
      try {
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
        const orgData = orgDoc.data();
        const currentStatus: OrganizationVerificationStatus =
          orgData.verificationStatus ||
          (orgData.isVerified ? 'verified' : 'not_verified');

        // Update the organization's status to rejected
        await db
          .collection('users')
          .doc(organizationId)
          .update({
            status: 'rejected',
            verificationStatus: 'rejected',
            isVerified: false,
            rejectedAt: FieldValue.serverTimestamp(),
            verificationUpdatedAt: FieldValue.serverTimestamp(),
            rejectedBy: uid,
            verificationUpdatedBy: uid,
            rejectionNotes: notes || null,
            verificationRejectionReason: notes || null,
          });

        // Create audit log entry
        await AuditLogService.logVerificationStatusChange(
          organizationId,
          currentStatus,
          'rejected',
          uid,
          notes || 'Organization verification rejected'
        );

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
      } catch (updateError) {
        console.error(
          'Error updating organization status to rejected:',
          updateError
        );

        // Update the application status to reflect the error
        await db
          .collection('organizationApplications')
          .doc(applicationId)
          .update({
            processingError:
              updateError.message || 'Error updating organization status',
            updatedAt: FieldValue.serverTimestamp(),
          });

        // Return success for the application update, but include the error
        return NextResponse.json({
          success: true,
          warning:
            'Application marked as rejected, but organization status update failed',
          error: updateError.message || 'Error updating organization status',
        });
      }
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
