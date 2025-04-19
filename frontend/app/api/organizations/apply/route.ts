import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/firebase-admin-server';
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

    // Get user ID from token
    const uid = authResult.decodedToken.uid;

    // Get request body
    const {
      orgName,
      contactEmail,
      website,
      description,
      address,
      phoneNumber,
      industry,
      registrationNumber,
      foundedYear,
      documentTypes,
    } = await request.json();

    // Validate required fields
    if (!orgName || !contactEmail || !website) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate document types if provided
    if (documentTypes && !Array.isArray(documentTypes)) {
      return NextResponse.json(
        { error: 'Document types must be an array' },
        { status: 400 }
      );
    }

    // Check if an application already exists for this user
    const existingAppQuery = await db
      .collection('organizationApplications')
      .where('submittedBy', '==', uid)
      .where('status', '==', 'pending')
      .get();

    if (!existingAppQuery.empty) {
      return NextResponse.json(
        { error: 'You already have a pending application' },
        { status: 409 }
      );
    }

    // Get the user document to link the application to the organization
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    // Update the user's verification status to pending
    await db.collection('users').doc(uid).update({
      verificationStatus: 'pending',
      verificationUpdatedAt: FieldValue.serverTimestamp(),
    });

    // Create the application
    const applicationRef = await db.collection('organizationApplications').add({
      orgName,
      contactEmail,
      website,
      description: description || '',
      address: address || '',
      phoneNumber: phoneNumber || '',
      industry: industry || '',
      registrationNumber: registrationNumber || '',
      foundedYear: foundedYear || '',
      documentTypes: documentTypes || [],
      status: 'pending',
      submittedBy: uid,
      organizationId: uid,
      submittedAt: FieldValue.serverTimestamp(),
    });

    // Notify admins about the new application
    try {
      // Get admin users
      const adminSnapshot = await db
        .collection('users')
        .where('userType', '==', 'admin')
        .get();

      // Create notifications for each admin
      const notificationPromises = adminSnapshot.docs.map(async (adminDoc) => {
        return db.collection('notifications').add({
          userId: adminDoc.id,
          type: 'organization_application',
          title: 'New Organization Application',
          message: `${orgName} has submitted a verification application.`,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
          metadata: {
            applicationId: applicationRef.id,
            orgName,
          },
        });
      });

      await Promise.all(notificationPromises);
    } catch (notificationError) {
      console.error(
        'Error notifying admins about new application:',
        notificationError
      );
      // Continue with the process even if notification fails
    }

    return NextResponse.json({
      applicationId: applicationRef.id,
      status: 'pending',
      message: 'Organization application submitted successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting organization application:', error);
    return NextResponse.json(
      { error: error.message || 'Application submission failed' },
      { status: 500 }
    );
  }
}
