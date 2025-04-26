import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthSuccess } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/firebase-admin-server';

export async function GET(request: NextRequest) {
  try {
    // Verify the authentication token
    const authResult = await verifyAuth(request);

    if (!isAuthSuccess(authResult)) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get user ID from token
    const uid = authResult.decodedToken.uid;

    // Get the user document to check verification status
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data() || {};

    // Check if the user is an organization
    if (userData.userType !== 'organization') {
      return NextResponse.json(
        { error: 'User is not an organization' },
        { status: 400 }
      );
    }

    // Get verification status from user data
    const verificationStatus =
      userData.verificationStatus ||
      (userData.isVerified ? 'verified' : 'not_verified');

    // If the user is already verified, return the status
    if (verificationStatus === 'verified') {
      return NextResponse.json({
        status: verificationStatus,
        isVerified: true,
        verifiedAt:
          userData.verifiedAt || userData.verificationUpdatedAt || null,
      });
    }

    // If the user is rejected, return the status and reason
    if (verificationStatus === 'rejected') {
      return NextResponse.json({
        status: verificationStatus,
        isVerified: false,
        rejectedAt:
          userData.rejectedAt || userData.verificationUpdatedAt || null,
        rejectionReason:
          userData.verificationRejectionReason ||
          userData.rejectionNotes ||
          null,
      });
    }

    // Check if there's a pending application
    const applicationQuery = await db
      .collection('organizationApplications')
      .where('submittedBy', '==', uid)
      .orderBy('submittedAt', 'desc')
      .limit(1)
      .get();

    if (applicationQuery.empty) {
      return NextResponse.json({
        status: 'not_verified',
        isVerified: false,
        hasApplication: false,
      });
    }

    // Get the most recent application
    const applicationDoc = applicationQuery.docs[0];
    const applicationData = applicationDoc.data();

    return NextResponse.json({
      status: verificationStatus,
      isVerified: verificationStatus === 'verified',
      hasApplication: true,
      application: {
        id: applicationDoc.id,
        status: applicationData.status,
        submittedAt: applicationData.submittedAt
          ? applicationData.submittedAt.toDate()
          : null,
        updatedAt: applicationData.updatedAt
          ? applicationData.updatedAt.toDate()
          : null,
        notes: applicationData.notes || null,
      },
    });
  } catch (error: any) {
    console.error('Error getting application status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get application status' },
      { status: 500 }
    );
  }
}
