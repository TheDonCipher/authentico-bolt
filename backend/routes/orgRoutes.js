/**
 * orgRoutes.js
 * API routes for organization operations
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../authMiddleware');
const { admin, adminDb, USER_COLLECTION } = require('../config');
const NotificationService = require('../services/NotificationService');

// Collection references - use adminDb for server-side operations
const orgApplicationsCollection = adminDb.collection(
  'organizationApplications'
);
const usersCollection = adminDb.collection(USER_COLLECTION);

/**
 * Submit an organization application
 * POST /api/organizations/apply
 */
router.post('/apply', verifyToken, async (req, res) => {
  try {
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
    } = req.body;

    // Validate required fields
    if (!orgName || !contactEmail || !website) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate document types if provided
    if (documentTypes && !Array.isArray(documentTypes)) {
      return res.status(400).json({ error: 'Document types must be an array' });
    }

    // Check if an application already exists for this email
    const existingAppQuery = await orgApplicationsCollection
      .where('contactEmail', '==', contactEmail)
      .get();

    if (!existingAppQuery.empty) {
      return res
        .status(409)
        .json({ error: 'An application with this email already exists' });
    }

    // Create the application
    const applicationRef = await orgApplicationsCollection.add({
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
      submittedBy: req.user.uid,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify admins about the new application
    try {
      await NotificationService.notifyAdminsNewApplication(
        orgName,
        applicationRef.id
      );
    } catch (notificationError) {
      console.error(
        'Error notifying admins about new application:',
        notificationError
      );
      // Continue with the process even if notification fails
    }

    res.status(201).json({
      applicationId: applicationRef.id,
      status: 'pending',
      message: 'Organization application submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting organization application:', error);
    res
      .status(500)
      .json({ error: 'Application submission failed', details: error.message });
  }
});

/**
 * Get application status by ID
 * GET /api/organizations/application/:applicationId
 */
router.get('/application/:applicationId', verifyToken, async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Get application from Firestore
    const appSnapshot = await orgApplicationsCollection
      .doc(applicationId)
      .get();

    if (!appSnapshot.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const appData = appSnapshot.data();

    // Check if user is authorized to access this application
    if (appData.submittedBy !== req.user.uid) {
      return res
        .status(403)
        .json({ error: 'Unauthorized access to application' });
    }

    // Return application details
    res.json({
      id: appSnapshot.id,
      orgName: appData.orgName,
      contactEmail: appData.contactEmail,
      website: appData.website,
      phoneNumber: appData.phoneNumber || '',
      industry: appData.industry || '',
      registrationNumber: appData.registrationNumber || '',
      foundedYear: appData.foundedYear || '',
      documentTypes: appData.documentTypes || [],
      description: appData.description || '',
      address: appData.address || '',
      status: appData.status,
      notes: appData.notes || null,
      submittedAt: appData.submittedAt.toDate(),
      updatedAt: appData.updatedAt ? appData.updatedAt.toDate() : null,
    });
  } catch (error) {
    console.error('Error getting application details:', error);
    res.status(500).json({
      error: 'Failed to get application details',
      details: error.message,
    });
  }
});

/**
 * Get application status for current user
 * GET /api/organizations/application/status
 */
router.get('/application/status', verifyToken, async (req, res) => {
  try {
    // Query for applications submitted by the current user
    const applicationsQuery = await orgApplicationsCollection
      .where('submittedBy', '==', req.user.uid)
      .orderBy('submittedAt', 'desc')
      .limit(1)
      .get();

    if (applicationsQuery.empty) {
      return res.status(404).json({ error: 'No application found' });
    }

    // Get the most recent application
    const appSnapshot = applicationsQuery.docs[0];
    const appData = appSnapshot.data();

    // Return application details
    res.json({
      id: appSnapshot.id,
      orgName: appData.orgName,
      contactEmail: appData.contactEmail,
      website: appData.website,
      phoneNumber: appData.phoneNumber || '',
      industry: appData.industry || '',
      registrationNumber: appData.registrationNumber || '',
      foundedYear: appData.foundedYear || '',
      documentTypes: appData.documentTypes || [],
      description: appData.description || '',
      address: appData.address || '',
      status: appData.status,
      notes: appData.notes || null,
      submittedAt: appData.submittedAt.toDate(),
      updatedAt: appData.updatedAt ? appData.updatedAt.toDate() : null,
    });
  } catch (error) {
    console.error('Error getting application status:', error);
    res.status(500).json({
      error: 'Failed to get application status',
      details: error.message,
    });
  }
});

/**
 * Get all verified organizations
 * GET /api/organizations/verified
 */
router.get('/verified', verifyToken, async (req, res) => {
  try {
    // Only log in development environment with minimal information
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `Verified organizations request from: ${req.user.uid.substring(
          0,
          8
        )}...`
      );
    }

    // Query for verified organizations
    const snapshot = await usersCollection
      .where('userType', '==', 'organization')
      .where('isVerified', '==', true)
      .get();

    // Format results
    const organizations = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Check if organization details are in the orgDetails field
      const orgDetails = data.orgDetails || {};

      // Ensure name is present
      if (!data.name && !orgDetails.name) {
        console.warn(`Organization ${doc.id} has no name property`);
      }

      const org = {
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

      return org;
    });

    // If no organizations found, return fallback data in development
    if (organizations.length === 0 && process.env.NODE_ENV === 'development') {
      console.log('No verified organizations found, returning fallback data');
      return res.json([
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
      ]);
    }

    res.json(organizations);
  } catch (error) {
    console.error('Error getting verified organizations:', error);
    res
      .status(500)
      .json({ error: 'Failed to get organizations', details: error.message });
  }
});

/**
 * Admin only: Get all organization applications
 * GET /api/organizations/applications
 */
router.get('/applications', verifyToken, async (req, res) => {
  try {
    // Get admin wallet address from environment variable
    const ADMIN_WALLET_ADDRESS =
      process.env.ADMIN_WALLET_ADDRESS ||
      '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c';

    // Check if user is an admin by wallet address or userType
    let isAdmin = false;

    // Check if wallet address is in the token claims
    if (
      req.user.wallet_address &&
      req.user.wallet_address.toLowerCase() ===
        ADMIN_WALLET_ADDRESS.toLowerCase()
    ) {
      isAdmin = true;
    } else {
      // Check if user is an admin in Firestore
      const userSnapshot = await usersCollection.doc(req.user.uid).get();
      if (userSnapshot.exists && userSnapshot.data().userType === 'admin') {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      console.log('Unauthorized access attempt:', req.user.uid);
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Query for all applications
    const snapshot = await orgApplicationsCollection
      .orderBy('submittedAt', 'desc')
      .get();

    // Format results
    const applications = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        orgName: data.orgName,
        contactEmail: data.contactEmail,
        website: data.website,
        status: data.status,
        submittedAt: data.submittedAt.toDate(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
      };
    });

    res.json(applications);
  } catch (error) {
    console.error('Error getting organization applications:', error);
    res
      .status(500)
      .json({ error: 'Failed to get applications', details: error.message });
  }
});

/**
 * Admin only: Update application status
 * PUT /api/organizations/applications/:applicationId
 */
router.put('/applications/:applicationId', verifyToken, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    // Validate status
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get admin wallet address from environment variable
    const ADMIN_WALLET_ADDRESS =
      process.env.ADMIN_WALLET_ADDRESS ||
      '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c';

    // Check if user is an admin by wallet address or userType
    let isAdmin = false;

    // Check if wallet address is in the token claims
    if (
      req.user.wallet_address &&
      req.user.wallet_address.toLowerCase() ===
        ADMIN_WALLET_ADDRESS.toLowerCase()
    ) {
      isAdmin = true;
    } else {
      // Check if user is an admin in Firestore
      const userSnapshot = await usersCollection.doc(req.user.uid).get();
      if (userSnapshot.exists && userSnapshot.data().userType === 'admin') {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      console.log('Unauthorized access attempt:', req.user.uid);
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Get application
    const appSnapshot = await orgApplicationsCollection
      .doc(applicationId)
      .get();

    if (!appSnapshot.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const appData = appSnapshot.data();

    // Update application status
    await orgApplicationsCollection.doc(applicationId).update({
      status,
      notes: notes || null,
      updatedBy: req.user.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send notification to the organization user
    try {
      // Get the user who submitted the application
      const userSnapshot = await usersCollection.doc(appData.submittedBy).get();
      if (userSnapshot.exists) {
        const userData = userSnapshot.data();

        // Use the enhanced notification service
        await NotificationService.notifyOrganizationVerificationStatus(
          appData.submittedBy,
          userData.email || appData.contactEmail,
          appData.orgName,
          status,
          notes
        );
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Continue with the process even if notification fails
    }

    // If approved, update the organization's status in Firestore
    if (status === 'approved') {
      try {
        // First, check if the organization already exists in Firestore
        // This should be the user who submitted the application
        const orgDoc = await usersCollection.doc(appData.submittedBy).get();

        if (orgDoc.exists) {
          console.log(
            `Updating existing organization ${appData.submittedBy} in Firestore`
          );

          // Update the organization document
          await usersCollection.doc(appData.submittedBy).update({
            userType: 'organization',
            isVerified: true,
            verificationStatus: 'verified',
            name: appData.orgName,
            website: appData.website,
            description: appData.description || '',
            address: appData.address || '',
            phoneNumber: appData.phoneNumber || '',
            industry: appData.industry || '',
            registrationNumber: appData.registrationNumber || '',
            foundedYear: appData.foundedYear || '',
            documentTypes: appData.documentTypes || [],
            verificationBadge: true,
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: req.user.uid,
          });

          // Try to update custom claims if possible
          try {
            // Get the user's UID from Firebase Auth
            const userRecord = await admin
              .auth()
              .getUserByEmail(appData.contactEmail)
              .catch(() => null); // Catch and return null if user doesn't exist

            if (userRecord) {
              // Update custom claims
              await admin.auth().setCustomUserClaims(userRecord.uid, {
                userType: 'organization',
                isVerified: true,
              });
              console.log(`Updated custom claims for user ${userRecord.uid}`);
            } else {
              console.log(
                `No Firebase Auth user found for email ${appData.contactEmail}, skipping custom claims update`
              );
            }
          } catch (claimsError) {
            console.error('Error updating custom claims:', claimsError);
            // Continue even if custom claims update fails
          }
        } else {
          console.log(
            `Organization ${appData.submittedBy} not found in Firestore, creating new document`
          );

          // Create a new organization document
          await usersCollection.doc(appData.submittedBy).set({
            email: appData.contactEmail,
            name: appData.orgName,
            userType: 'organization',
            isVerified: true,
            verificationStatus: 'verified',
            website: appData.website,
            description: appData.description || '',
            address: appData.address || '',
            phoneNumber: appData.phoneNumber || '',
            industry: appData.industry || '',
            registrationNumber: appData.registrationNumber || '',
            foundedYear: appData.foundedYear || '',
            documentTypes: appData.documentTypes || [],
            verificationBadge: true,
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.uid,
          });
        }
      } catch (error) {
        console.error('Error creating/updating user account:', error);

        // Update application to reflect error
        await orgApplicationsCollection.doc(applicationId).update({
          status: 'error',
          error: error.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        throw error;
      }
    }

    res.json({
      applicationId,
      status,
      message: `Application ${status} successfully`,
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res
      .status(500)
      .json({ error: 'Failed to update application', details: error.message });
  }
});

module.exports = router;
