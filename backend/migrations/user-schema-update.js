const { adminDb, USER_COLLECTION, admin } = require('../config');

/**
 * Updates user schema to ensure all required fields are present
 * Based on the User interface from frontend/app/types/user.ts
 */
async function updateUserSchema() {
  console.log('Starting user schema update migration...');

  try {
    const usersRef = adminDb.collection(USER_COLLECTION);
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      console.log('No user documents found. Nothing to update.');
      return;
    }

    console.log(`Found ${snapshot.size} user documents to process.`);

    const batch = adminDb.batch();
    let updatedCount = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const updates = {};

      // Ensure required fields are present with default values if missing
      if (!data.uid) updates.uid = doc.id;
      if (!data.walletAddress) updates.walletAddress = '';
      if (!data.userType) updates.userType = 'individual';
      if (!data.name) updates.name = 'Authentico User';

      // Convert boolean fields to proper boolean values
      if (data.isVerified !== undefined) {
        updates.isVerified = !!data.isVerified;
      } else {
        updates.isVerified = false;
      }

      // Add timestamps if missing
      if (!data.createdAt) {
        updates.createdAt = admin.firestore.FieldValue.serverTimestamp();
      }

      // Always update the updatedAt timestamp
      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      // Only update if there are changes to make
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully updated ${updatedCount} user documents.`);
    } else {
      console.log('No user documents needed updates.');
    }

    console.log('User schema update migration completed successfully.');
  } catch (error) {
    console.error('Error during user schema update:', error);
    throw error;
  }
}

module.exports = { updateUserSchema };
