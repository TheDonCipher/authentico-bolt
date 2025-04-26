import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthSuccess } from '../../../../../lib/auth-middleware';
import { db } from '../../../../../lib/firebase-admin-server';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ membershipId: string }> }
) {
  const { membershipId } = await context.params;
  try {
    // Verify the authentication token
    const authResult = await verifyAuth(request);

    if (!isAuthSuccess(authResult)) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const updates = await request.json();

    // Get the membership document
    const membershipDoc = await db
      .collection('organizationMembers')
      .doc(membershipId)
      .get();

    if (!membershipDoc.exists) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      );
    }

    const membershipData = membershipDoc.data() || {};

    // Check if the requester has permission to update this membership
    const isAdmin = authResult.decodedToken.admin === true;

    if (!isAdmin) {
      // Check if user is the organization owner or has admin role
      const orgDoc = await db
        .collection('users')
        .doc(membershipData.orgId || '')
        .get();

      if (!orgDoc.exists) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }

      const orgData = orgDoc.data() || {};
      const isOrgOwner = orgData.ownerUid === authResult.uid;

      if (!isOrgOwner) {
        // Check if user has admin role in the organization
        const requesterMembershipQuery = await db
          .collection('organizationMembers')
          .where('orgId', '==', membershipData.orgId || '')
          .where('userId', '==', authResult.uid)
          .limit(1)
          .get();

        if (requesterMembershipQuery.empty) {
          return NextResponse.json(
            { error: 'Unauthorized access to organization' },
            { status: 403 }
          );
        }

        const requesterMembershipData = requesterMembershipQuery.docs[0].data();
        if (
          requesterMembershipData.role !== 'admin' &&
          requesterMembershipData.role !== 'owner'
        ) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }
    }

    // Update the membership
    await db
      .collection('organizationMembers')
      .doc(membershipId)
      .update({
        ...updates,
        updatedAt: new Date(),
        updatedBy: authResult.uid,
      });

    return NextResponse.json({
      success: true,
      message: 'Membership updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating organization member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update organization member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ membershipId: string }> }
) {
  const { membershipId } = await context.params;
  try {
    // Verify the authentication token
    const authResult = await verifyAuth(request);

    if (!isAuthSuccess(authResult)) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get the membership document
    const membershipDoc = await db
      .collection('organizationMembers')
      .doc(membershipId)
      .get();

    if (!membershipDoc.exists) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      );
    }

    const membershipData = membershipDoc.data() || {};

    // Check if the requester has permission to delete this membership
    const isAdmin = authResult.decodedToken.admin === true;

    if (!isAdmin) {
      // Check if user is the organization owner or has admin role
      const orgDoc = await db
        .collection('users')
        .doc(membershipData.orgId || '')
        .get();

      if (!orgDoc.exists) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }

      const orgData = orgDoc.data() || {};
      const isOrgOwner = orgData.ownerUid === authResult.uid;

      if (!isOrgOwner) {
        // Check if user has admin role in the organization
        const requesterMembershipQuery = await db
          .collection('organizationMembers')
          .where('orgId', '==', membershipData.orgId || '')
          .where('userId', '==', authResult.uid)
          .limit(1)
          .get();

        if (requesterMembershipQuery.empty) {
          return NextResponse.json(
            { error: 'Unauthorized access to organization' },
            { status: 403 }
          );
        }

        const requesterMembershipData = requesterMembershipQuery.docs[0].data();
        if (
          requesterMembershipData.role !== 'admin' &&
          requesterMembershipData.role !== 'owner'
        ) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }
    }

    // Delete the membership
    await db.collection('organizationMembers').doc(membershipId).delete();

    return NextResponse.json({
      success: true,
      message: 'User removed from organization successfully',
    });
  } catch (error: any) {
    console.error('Error removing organization member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove organization member' },
      { status: 500 }
    );
  }
}
