import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../../../lib/firebase-admin-server';
import axios from 'axios';

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    try {
      // Verify the token
      const decodedToken = await auth.verifyIdToken(token);
      const uid = decodedToken.uid;

      // Get organizations directly from Firestore
      const usersRef = db.collection('users');
      const snapshot = await usersRef
        .where('userType', '==', 'organization')
        .where('isVerified', '==', true)
        .get();

      // Format results
      const organizations = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Check if organization details are in the orgDetails field
        const orgDetails = data.orgDetails || {};

        // Ensure name is present with a default if missing
        const hasName = data.name || orgDetails.name;

        return {
          id: doc.id,
          name: data.name || orgDetails.name || 'Unnamed Organization',
          website: data.website || orgDetails.website || null,
          description: data.description || orgDetails.description || null,
          verificationBadge:
            data.verificationBadge || data.status === 'verified' || false,
          documentTypes: data.documentTypes || orgDetails.documentTypes || [],
          industry: data.industry || orgDetails.industry || null,
          phoneNumber: data.phoneNumber || orgDetails.phoneNumber || null,
        };
      });

      // If no organizations found, use fallback data in development
      if (
        organizations.length === 0 &&
        process.env.NODE_ENV === 'development'
      ) {
        const fallbackOrgs = [
          {
            id: 'org1',
            name: 'Example Organization 1',
            website: 'https://example.org',
            description: 'Example verified organization for testing',
            verificationBadge: true,
            documentTypes: ['identity', 'education'],
            industry: 'Education',
            phoneNumber: '+1234567890',
          },
          {
            id: 'org2',
            name: 'Example Organization 2',
            website: 'https://example2.org',
            description: 'Another example organization',
            verificationBadge: true,
            documentTypes: ['financial', 'legal'],
            industry: 'Financial Services',
            phoneNumber: '+0987654321',
          },
        ];
        return NextResponse.json(fallbackOrgs);
      }

      return NextResponse.json(organizations);
    } catch (tokenError: any) {
      return NextResponse.json(
        { error: 'Invalid token', details: tokenError.message },
        { status: 401 }
      );
    }
  } catch (error: any) {
    // In development, return fallback data
    if (process.env.NODE_ENV === 'development') {
      const fallbackOrgs = [
        {
          id: 'org1',
          name: 'Example Organization 1',
          website: 'https://example.org',
          description: 'Example verified organization for testing',
          verificationBadge: true,
          documentTypes: ['identity', 'education'],
          industry: 'Education',
          phoneNumber: '+1234567890',
        },
        {
          id: 'org2',
          name: 'Example Organization 2',
          website: 'https://example2.org',
          description: 'Another example organization',
          verificationBadge: true,
          documentTypes: ['financial', 'legal'],
          industry: 'Financial Services',
          phoneNumber: '+0987654321',
        },
      ];
      return NextResponse.json(fallbackOrgs);
    }

    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}
