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
    console.log('Getting verified organizations for user:', req.user.uid);

    // Query for verified organizations
    const snapshot = await usersCollection
      .where('userType', '==', 'organization')
      .where('isVerified', '==', true)
      .get();

    console.log(`Found ${snapshot.size} verified organizations`);

    // Log the raw data from Firestore
    snapshot.docs.forEach((doc, index) => {
      console.log(`Organization ${index + 1} (${doc.id}):`, doc.data());
    });

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
      console.log(`Formatted organization ${doc.id}:`, org);
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
    // Check if user is an admin
    const userSnapshot = await usersCollection.doc(req.user.uid).get();

    if (!userSnapshot.exists || userSnapshot.data().userType !== 'admin') {
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

    // Check if user is an admin
    const userSnapshot = await usersCollection.doc(req.user.uid).get();

    if (!userSnapshot.exists || userSnapshot.data().userType !== 'admin') {
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

        // Send notification
        const title = `Organization Verification ${
          status.charAt(0).toUpperCase() + status.slice(1)
        }`;
        const message =
          status === 'approved'
            ? 'Your organization has been verified! You can now verify documents.'
            : `Your organization verification was rejected. Reason: ${
                notes || 'No reason provided'
              }`;

        await NotificationService.sendInAppNotification(
          appData.submittedBy,
          title,
          message,
          { status, applicationId }
        );

        // Send email notification if email is available
        if (userData.email) {
          const emailSubject = `Organization Verification ${
            status.charAt(0).toUpperCase() + status.slice(1)
          }`;
          const emailText =
            status === 'approved'
              ? `Your organization ${appData.orgName} has been verified! You can now verify documents submitted by users.`
              : `Your organization ${
                  appData.orgName
                } verification was rejected. Reason: ${
                  notes || 'No reason provided'
                }`;

          const emailHtml =
            status === 'approved'
              ? `
              <h2>Organization Verification Approved</h2>
              <p>Congratulations! Your organization <strong>${
                appData.orgName
              }</strong> has been verified.</p>
              <p>You can now verify documents submitted by users through the Authentico platform.</p>
              <p>Visit your <a href="${
                process.env.FRONTEND_URL || 'http://localhost:3000'
              }/organization-dashboard">Organization Dashboard</a> to get started.</p>
            `
              : `
              <h2>Organization Verification Rejected</h2>
              <p>We regret to inform you that your organization <strong>${
                appData.orgName
              }</strong> verification request has been rejected.</p>
              <p><strong>Reason:</strong> ${notes || 'No reason provided'}</p>
              <p>You may submit a new application with the required corrections.</p>
            `;

          await NotificationService.sendEmailNotification(
            userData.email,
            emailSubject,
            emailText,
            emailHtml
          );
        }
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Continue with the process even if notification fails
    }

    // If approved, create or update user account
    if (status === 'approved') {
      try {
        // Check if user already exists with this email
        const userQuery = await usersCollection
          .where('email', '==', appData.contactEmail)
          .get();

        if (userQuery.empty) {
          // Create new user in Firebase Auth
          const userRecord = await admin.auth().createUser({
            email: appData.contactEmail,
            emailVerified: true,
            displayName: appData.orgName,
          });

          // Set custom claims
          await admin.auth().setCustomUserClaims(userRecord.uid, {
            userType: 'organization',
            isVerified: true,
          });

          // Create user document in Firestore
          await usersCollection.doc(userRecord.uid).set({
            email: appData.contactEmail,
            name: appData.orgName,
            userType: 'organization',
            isVerified: true,
            website: appData.website,
            description: appData.description || '',
            address: appData.address || '',
            phoneNumber: appData.phoneNumber || '',
            industry: appData.industry || '',
            registrationNumber: appData.registrationNumber || '',
            foundedYear: appData.foundedYear || '',
            documentTypes: appData.documentTypes || [],
            verificationBadge: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.uid,
          });
        } else {
          // Update existing user
          const userDoc = userQuery.docs[0];

          // Update custom claims
          await admin.auth().setCustomUserClaims(userDoc.id, {
            userType: 'organization',
            isVerified: true,
          });

          // Update user document
          await usersCollection.doc(userDoc.id).update({
            userType: 'organization',
            isVerified: true,
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
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: req.user.uid,
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
