/**
 * Script to test verified organization fetching
 *
 * This script tests the API endpoints for fetching verified organizations
 * and logs the results for debugging.
 */

const axios = require('axios');
const { getAuthToken } = require('../frontend/lib/token-util');

// API endpoints
const API_ENDPOINTS = {
  VERIFIED_ORGS: '/api/organizations/verified',
  ADMIN_VERIFIED_ORGS: '/api/admin/verified-organizations',
  DIRECT_FIRESTORE: '/api/organizations/direct-firestore',
};

// Test regular endpoint
async function testVerifiedOrganizationsEndpoint() {
  try {
    console.log('Testing regular verified organizations endpoint...');

    // Get auth token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Make request
    const response = await axios.get(API_ENDPOINTS.VERIFIED_ORGS, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Log results
    console.log(`Found ${response.data.length} verified organizations`);
    console.log('First organization:', response.data[0]);

    return response.data;
  } catch (error) {
    console.error(
      'Error testing verified organizations endpoint:',
      error.message
    );
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

// Test admin endpoint
async function testAdminVerifiedOrganizationsEndpoint() {
  try {
    console.log('Testing admin verified organizations endpoint...');

    // Get auth token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Make request
    const response = await axios.get(API_ENDPOINTS.ADMIN_VERIFIED_ORGS, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Log results
    console.log(
      `Found ${response.data.length} verified organizations (admin endpoint)`
    );
    if (response.data.length > 0) {
      console.log('First organization:', response.data[0]);
    }

    return response.data;
  } catch (error) {
    console.error(
      'Error testing admin verified organizations endpoint:',
      error.message
    );
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

// Test direct Firestore endpoint
async function testDirectFirestoreEndpoint() {
  try {
    console.log('Testing direct Firestore endpoint...');

    // Get auth token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Create a custom endpoint for direct Firestore testing
    // This will use the getVerifiedOrganizations function with useDirectFirestore=true
    const response = await axios.get(API_ENDPOINTS.DIRECT_FIRESTORE, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params: {
        useDirectFirestore: true,
      },
    });

    // Log results
    console.log(
      `Found ${response.data.length} verified organizations (direct Firestore)`
    );
    if (response.data.length > 0) {
      console.log('First organization:', response.data[0]);
    }

    return response.data;
  } catch (error) {
    console.error('Error testing direct Firestore endpoint:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('Starting verified organizations tests...');

  // Test regular endpoint
  const regularOrgs = await testVerifiedOrganizationsEndpoint();

  // Test admin endpoint
  const adminOrgs = await testAdminVerifiedOrganizationsEndpoint();

  // Test direct Firestore endpoint
  const firestoreOrgs = await testDirectFirestoreEndpoint();

  // Compare results
  if (regularOrgs || adminOrgs || firestoreOrgs) {
    console.log('\nComparing results:');
    console.log(
      `Regular endpoint: ${
        regularOrgs ? regularOrgs.length : 'N/A'
      } organizations`
    );
    console.log(
      `Admin endpoint: ${adminOrgs ? adminOrgs.length : 'N/A'} organizations`
    );
    console.log(
      `Firestore endpoint: ${
        firestoreOrgs ? firestoreOrgs.length : 'N/A'
      } organizations`
    );

    // Check for duplicates in regular endpoint
    const regularOrgIds = new Set();
    const regularDuplicates = [];

    regularOrgs.forEach((org) => {
      if (regularOrgIds.has(org.id)) {
        regularDuplicates.push(org.id);
      } else {
        regularOrgIds.add(org.id);
      }
    });

    console.log(`Regular endpoint duplicates: ${regularDuplicates.length}`);
    if (regularDuplicates.length > 0) {
      console.log('Duplicate IDs:', regularDuplicates);
    }

    // Check for duplicates in admin endpoint
    const adminOrgIds = new Set();
    const adminDuplicates = [];

    adminOrgs.forEach((org) => {
      if (adminOrgIds.has(org.id)) {
        adminDuplicates.push(org.id);
      } else {
        adminOrgIds.add(org.id);
      }
    });

    console.log(`Admin endpoint duplicates: ${adminDuplicates.length}`);
    if (adminDuplicates.length > 0) {
      console.log('Duplicate IDs:', adminDuplicates);
    }

    // Check for non-verified organizations
    const nonVerifiedRegular = regularOrgs.filter(
      (org) =>
        !org.isVerified &&
        org.status !== 'verified' &&
        org.verificationStatus !== 'verified'
    );

    console.log(
      `Non-verified organizations in regular endpoint: ${nonVerifiedRegular.length}`
    );
    if (nonVerifiedRegular.length > 0) {
      console.log('First non-verified organization:', nonVerifiedRegular[0]);
    }

    const nonVerifiedAdmin = adminOrgs.filter(
      (org) =>
        !org.isVerified &&
        org.status !== 'verified' &&
        org.verificationStatus !== 'verified'
    );

    console.log(
      `Non-verified organizations in admin endpoint: ${nonVerifiedAdmin.length}`
    );
    if (nonVerifiedAdmin.length > 0) {
      console.log('First non-verified organization:', nonVerifiedAdmin[0]);
    }
  }

  console.log('\nTests completed.');
}

// Run the tests
runTests().catch((error) => {
  console.error('Error running tests:', error);
});
