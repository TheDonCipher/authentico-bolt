/**
 * Migration script for Organization Verification feature
 *
 * This script:
 * 1. Updates existing organization users with new verification fields
 * 2. Updates existing organization applications with consistent status values
 * 3. Creates initial audit log entries for existing verified organizations
 *
 * Run with: node scripts/migrate-organization-verification.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// Look for the service account file with different possible names
let serviceAccountPath;
const possiblePaths = [
  path.join(__dirname, '../firebase-service-account.json'),
  path.join(__dirname, '../serviceAccountKey.json'),
  path.join(__dirname, '../@firebase-service-account.json'),
];

for (const filePath of possiblePaths) {
  if (fs.existsSync(filePath)) {
    serviceAccountPath = filePath;
    break;
  }
}

if (!serviceAccountPath) {
  console.error(
    'Service account key file not found. Tried the following paths:'
  );
  possiblePaths.forEach((p) => console.error(`- ${p}`));
  console.error(
    'Please ensure your Firebase service account key file is in the root directory'
  );
  process.exit(1);
}

console.log(`Using service account file: ${serviceAccountPath}`);
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// Migration functions
async function migrateOrganizationUsers() {
  console.log('Migrating organization users...');

  const organizationsSnapshot = await db
    .collection('users')
    .where('userType', '==', 'organization')
    .get();

  console.log(`Found ${organizationsSnapshot.size} organization users`);

  let batch = db.batch();
  let count = 0;

  for (const doc of organizationsSnapshot.docs) {
    const userData = doc.data();
    const orgId = doc.id;

    // Determine verification status based on existing data
    let verificationStatus = 'not_verified';
    if (userData.isVerified === true) {
      verificationStatus = 'verified';
    } else if (userData.status === 'pending') {
      verificationStatus = 'pending';
    } else if (userData.status === 'rejected') {
      verificationStatus = 'rejected';
    }

    // Update user document with new fields
    const updateData = {
      verificationStatus: verificationStatus,
      verificationUpdatedAt:
        userData.verifiedAt ||
        userData.rejectedAt ||
        FieldValue.serverTimestamp(),
    };

    // Only set rejection reason if status is rejected
    if (verificationStatus === 'rejected' && userData.rejectionNotes) {
      updateData.verificationRejectionReason = userData.rejectionNotes;
    }

    batch.update(doc.ref, updateData);
    count++;

    // Firestore batches are limited to 500 operations
    if (count % 400 === 0) {
      await batch.commit();
      console.log(`Processed ${count} organizations`);
      batch = db.batch();
    }
  }

  if (count % 400 !== 0) {
    await batch.commit();
  }

  console.log(`Successfully migrated ${count} organization users`);
}

async function migrateOrganizationApplications() {
  console.log('Migrating organization applications...');

  const applicationsSnapshot = await db
    .collection('organizationApplications')
    .get();

  console.log(`Found ${applicationsSnapshot.size} organization applications`);

  let batch = db.batch();
  let count = 0;

  for (const doc of applicationsSnapshot.docs) {
    const appData = doc.data();

    // Ensure organizationId is set
    if (!appData.organizationId && appData.submittedBy) {
      batch.update(doc.ref, {
        organizationId: appData.submittedBy,
      });
      count++;
    }

    // Normalize status values
    if (appData.status === 'approved') {
      batch.update(doc.ref, {
        status: 'verified',
      });
      count++;
    }

    // Firestore batches are limited to 500 operations
    if (count % 400 === 0) {
      await batch.commit();
      console.log(`Processed ${count} applications`);
      batch = db.batch();
    }
  }

  if (count % 400 !== 0) {
    await batch.commit();
  }

  console.log(`Successfully migrated ${count} organization applications`);
}

async function createInitialAuditLogs() {
  console.log('Creating initial audit logs for verified organizations...');

  const verifiedOrgsSnapshot = await db
    .collection('users')
    .where('userType', '==', 'organization')
    .where('isVerified', '==', true)
    .get();

  console.log(`Found ${verifiedOrgsSnapshot.size} verified organizations`);

  let batch = db.batch();
  let count = 0;

  for (const doc of verifiedOrgsSnapshot.docs) {
    const userData = doc.data();
    const orgId = doc.id;

    // Create audit log entry
    const auditLogRef = db.collection('verificationAuditLogs').doc();
    batch.set(auditLogRef, {
      organizationId: orgId,
      organizationName:
        userData.organizationName || userData.name || 'Unknown Organization',
      oldStatus: 'not_verified',
      newStatus: 'verified',
      updatedBy: userData.verifiedBy || 'system_migration',
      updatedByName: 'System Migration',
      updatedAt: userData.verifiedAt || FieldValue.serverTimestamp(),
      notes: 'Initial migration for existing verified organization',
    });
    count++;

    // Firestore batches are limited to 500 operations
    if (count % 400 === 0) {
      await batch.commit();
      console.log(`Created ${count} audit logs`);
      batch = db.batch();
    }
  }

  if (count % 400 !== 0) {
    await batch.commit();
  }

  console.log(`Successfully created ${count} initial audit logs`);
}

// Run migrations
async function runMigrations() {
  try {
    console.log('Starting migrations...');

    // Run migrations in sequence
    await migrateOrganizationUsers();
    await migrateOrganizationApplications();
    await createInitialAuditLogs();

    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
