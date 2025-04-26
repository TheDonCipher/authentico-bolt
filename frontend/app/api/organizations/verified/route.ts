import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/firebase-admin-server';
import { USER_COLLECTION } from '../../../../lib/constants';

/**
 * API route to fetch verified organizations for normal users
 * This route directly queries Firestore for verified organizations
 */

export async function GET(request: NextRequest) {
  try {
    // Verify the authentication token
    const authResult = await verifyAuth(request);

    if (!authResult.success) {
      console.error('Authentication failed:', authResult.error);
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    console.log('Authentication successful, fetching verified organizations');

    // Get user ID from token
    const uid = authResult.decodedToken.uid;

    // Get organizations directly from Firestore
    const usersRef = db.collection(USER_COLLECTION);

    // Log the query we're about to execute
    console.log(
      'Querying Firestore for verified organizations with userType=organization'
    );

    // Query for organizations with all possible verification fields
    // 1. Query for organizations with verificationStatus=verified
    const verifiedWithStatusSnapshot = await usersRef
      .where('userType', '==', 'organization')
      .where('verificationStatus', '==', 'verified')
      .get();

    console.log(
      `Found ${verifiedWithStatusSnapshot.size} organizations with verificationStatus=verified`
    );

    // 2. Query for organizations with isVerified=true
    const verifiedWithLegacySnapshot = await usersRef
      .where('userType', '==', 'organization')
      .where('isVerified', '==', true)
      .get();

    console.log(
      `Found ${verifiedWithLegacySnapshot.size} organizations with isVerified=true`
    );

    // 3. Query for organizations with status=verified
    const verifiedWithStatusFieldSnapshot = await usersRef
      .where('userType', '==', 'organization')
      .where('status', '==', 'verified')
      .get();

    console.log(
      `Found ${verifiedWithStatusFieldSnapshot.size} organizations with status=verified`
    );

    // Combine the results, ensuring no duplicates
    const verifiedOrgIds = new Set();
    const verifiedDocs: any[] = [];

    // Add docs from all queries, avoiding duplicates
    // 1. Add docs from the verificationStatus=verified query
    verifiedWithStatusSnapshot.forEach((doc) => {
      verifiedOrgIds.add(doc.id);
      verifiedDocs.push(doc);
    });

    // 2. Add docs from the isVerified=true query if not already included
    verifiedWithLegacySnapshot.forEach((doc) => {
      if (!verifiedOrgIds.has(doc.id)) {
        verifiedOrgIds.add(doc.id);
        verifiedDocs.push(doc);
      }
    });

    // 3. Add docs from the status=verified query if not already included
    verifiedWithStatusFieldSnapshot.forEach((doc) => {
      if (!verifiedOrgIds.has(doc.id)) {
        verifiedOrgIds.add(doc.id);
        verifiedDocs.push(doc);
      }
    });

    // Format results
    const organizations = verifiedDocs.map((doc) => {
      const data = doc.data();
      // Check if organization details are in the orgDetails field
      const orgDetails = data.orgDetails || {};

      return {
        id: doc.id,
        name: data.name || orgDetails.name || 'Unnamed Organization',
        organizationName:
          data.organizationName ||
          data.name ||
          orgDetails.name ||
          'Unnamed Organization',
        website: data.website || orgDetails.website || null,
        description: data.description || orgDetails.description || null,
        verificationBadge:
          data.verificationBadge || data.status === 'verified' || false,
        documentTypes: data.documentTypes || orgDetails.documentTypes || [],
        industry: data.industry || orgDetails.industry || null,
        phoneNumber: data.phoneNumber || orgDetails.phoneNumber || null,
        email: data.email || orgDetails.email || null,
        verifiedAt: data.verifiedAt ? data.verifiedAt.toDate() : null,
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        status: data.status || (data.isVerified ? 'verified' : 'pending'),
        verificationStatus:
          data.verificationStatus || (data.isVerified ? 'verified' : 'pending'),
        isVerified:
          data.isVerified ||
          data.status === 'verified' ||
          data.verificationStatus === 'verified' ||
          false,
      };
    });

    // If no organizations found, log a warning
    if (organizations.length === 0) {
      console.warn('No verified organizations found in Firestore');
    }

    console.log(`Returning ${organizations.length} verified organizations`);

    // Cache headers to improve performance
    const headers = new Headers();
    headers.append('Cache-Control', 'public, max-age=60'); // Cache for 1 minute

    return NextResponse.json(organizations, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Server error:', error.message);
    // Log the error with more details
    console.error('Server error details:', error);

    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}
