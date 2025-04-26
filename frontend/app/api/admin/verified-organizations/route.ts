import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/auth-middleware';
import { db } from '../../../../lib/firebase-admin-server';
import { USER_COLLECTION } from '../../../../lib/constants';
import axios from 'axios';

// Get the API URL from environment variables
let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Remove trailing slash if present
if (API_URL.endsWith('/')) {
  API_URL = API_URL.slice(0, -1);
}

// Log the API URL for debugging
console.log(`API_URL configured as: ${API_URL}`);

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
    const adminWalletAddress =
      process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ||
      '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c';

    // Get wallet address from token claims
    const tokenWalletAddress = authResult.decodedToken.wallet_address || null;

    // Get user data from Firestore to check admin status
    const uid = authResult.decodedToken.uid;
    const userDoc = await db.collection(USER_COLLECTION).doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // Check if user is admin by wallet address or admin flag
    const isAdmin =
      authResult.decodedToken.admin === true ||
      userData?.userType === 'admin' ||
      (tokenWalletAddress &&
        tokenWalletAddress.toLowerCase() ===
          adminWalletAddress.toLowerCase()) ||
      (userData?.walletAddress &&
        userData.walletAddress.toLowerCase() ===
          adminWalletAddress.toLowerCase());

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // We'll try to fetch real data even in development mode
    // Fallback data will only be used if the API call fails

    // For admin users, we'll directly query Firestore for the most up-to-date data
    console.log(
      'Admin: Directly querying Firestore for verified organizations'
    );

    // Skip the backend API call and go straight to Firestore for admin users

    // Fallback to Firestore if backend request fails
    // Log the query we're about to execute
    console.log(
      'Admin: Querying Firestore for verified organizations with userType=organization'
    );

    // Query for organizations with all possible verification fields
    // 1. Query for organizations with verificationStatus=verified
    const verifiedWithStatusSnapshot = await db
      .collection(USER_COLLECTION)
      .where('userType', '==', 'organization')
      .where('verificationStatus', '==', 'verified')
      .get();

    console.log(
      `Admin: Found ${verifiedWithStatusSnapshot.size} organizations with verificationStatus=verified`
    );

    // 2. Query for organizations with isVerified=true
    const verifiedWithLegacySnapshot = await db
      .collection(USER_COLLECTION)
      .where('userType', '==', 'organization')
      .where('isVerified', '==', true)
      .get();

    console.log(
      `Admin: Found ${verifiedWithLegacySnapshot.size} organizations with isVerified=true`
    );

    // 3. Query for organizations with status=verified
    const verifiedWithStatusFieldSnapshot = await db
      .collection(USER_COLLECTION)
      .where('userType', '==', 'organization')
      .where('status', '==', 'verified')
      .get();

    console.log(
      `Admin: Found ${verifiedWithStatusFieldSnapshot.size} organizations with status=verified`
    );

    console.log(
      `Admin: Found ${verifiedWithLegacySnapshot.size} organizations with isVerified=true`
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

    // If no organizations found, return empty array
    if (organizations.length === 0) {
      console.log('Admin: No verified organizations found in Firestore');
    }

    return NextResponse.json(organizations);
  } catch (error: any) {
    console.error('Admin: Error fetching verified organizations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch verified organizations' },
      { status: 500 }
    );
  }
}
