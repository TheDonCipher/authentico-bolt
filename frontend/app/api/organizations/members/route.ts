import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-middleware';
import { db, auth } from '../../../../lib/firebase-admin-server';

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
    
    // Get query parameters
    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user has access to this organization
    const orgDoc = await db.collection('users').doc(orgId).get();
    
    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    const orgData = orgDoc.data();
    const isOrgOwner = orgData?.ownerUid === authResult.uid;
    const isAdmin = authResult.decodedToken.admin === true;
    
    // Check if user is a member or admin
    if (!isOrgOwner && !isAdmin) {
      const membershipQuery = await db
        .collection('organizationMembers')
        .where('orgId', '==', orgId)
        .where('userId', '==', authResult.uid)
        .limit(1)
        .get();
      
      if (membershipQuery.empty) {
        return NextResponse.json(
          { error: 'Unauthorized access to organization' },
          { status: 403 }
        );
      }
      
      // Check if user has admin role in the organization
      const memberData = membershipQuery.docs[0].data();
      if (memberData.role !== 'admin' && memberData.role !== 'owner') {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }
    
    // Get all members of the organization
    const membersQuery = await db
      .collection('organizationMembers')
      .where('orgId', '==', orgId)
      .get();
    
    const members = [];
    
    // Process each member
    for (const doc of membersQuery.docs) {
      const memberData = doc.data();
      
      // Get user details
      try {
        const userDoc = await db.collection('users').doc(memberData.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          members.push({
            id: doc.id,
            userId: memberData.userId,
            name: userData.name || 'Unknown User',
            email: userData.email || '',
            role: memberData.role || 'member',
            permissions: memberData.permissions || [],
            addedAt: memberData.addedAt?.toDate() || null,
          });
        }
      } catch (error) {
        console.error(`Error fetching user details for ${memberData.userId}:`, error);
      }
    }
    
    return NextResponse.json(members);
  } catch (error: any) {
    console.error('Error getting organization members:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get organization members' },
      { status: 500 }
    );
  }
}

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
    
    const { orgId, userId, role, permissions } = await request.json();
    
    if (!orgId || !userId) {
      return NextResponse.json(
        { error: 'Organization ID and user ID are required' },
        { status: 400 }
      );
    }
    
    // Check if organization exists
    const orgDoc = await db.collection('users').doc(orgId).get();
    
    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    // Check if user exists
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the requester has permission to add members
    const orgData = orgDoc.data();
    const isOrgOwner = orgData?.ownerUid === authResult.uid;
    const isAdmin = authResult.decodedToken.admin === true;
    
    if (!isOrgOwner && !isAdmin) {
      const membershipQuery = await db
        .collection('organizationMembers')
        .where('orgId', '==', orgId)
        .where('userId', '==', authResult.uid)
        .limit(1)
        .get();
      
      if (membershipQuery.empty) {
        return NextResponse.json(
          { error: 'Unauthorized access to organization' },
          { status: 403 }
        );
      }
      
      // Check if user has admin role in the organization
      const memberData = membershipQuery.docs[0].data();
      if (memberData.role !== 'admin' && memberData.role !== 'owner') {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }
    
    // Check if user is already a member
    const existingMemberQuery = await db
      .collection('organizationMembers')
      .where('orgId', '==', orgId)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (!existingMemberQuery.empty) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 409 }
      );
    }
    
    // Add user to organization
    const membershipData = {
      orgId,
      userId,
      role: role || 'member',
      permissions: permissions || [],
      addedAt: new Date(),
      addedBy: authResult.uid,
    };
    
    const docRef = await db.collection('organizationMembers').add(membershipData);
    
    return NextResponse.json({
      success: true,
      membershipId: docRef.id,
      message: 'User added to organization successfully',
    });
  } catch (error: any) {
    console.error('Error adding organization member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add organization member' },
      { status: 500 }
    );
  }
}
