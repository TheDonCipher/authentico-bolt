/**
 * orgRoutes.js
 * API routes for organization operations
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../authMiddleware');
const { admin, db, USER_COLLECTION } = require('../config');

// Collection references
const orgApplicationsCollection = db.collection('organizationApplications');
const usersCollection = db.collection(USER_COLLECTION);

/**
 * Submit an organization application
 * POST /api/organizations/apply
 */
router.post('/apply', verifyToken, async (req, res) => {
  try {
    const { orgName, contactEmail, website, description, address } = req.body;

    // Validate required fields
    if (!orgName || !contactEmail || !website) {
      return res.status(400).json({ error: 'Missing required fields' });
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
    // Query for verified organizations
    const snapshot = await usersCollection
      .where('userType', '==', 'organization')
      .where('isVerified', '==', true)
      .get();

    // Format results
    const organizations = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        website: data.website || null,
        description: data.description || null,
      };
    });

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
