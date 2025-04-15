/**
 * Migration script to move user data from "Users" (uppercase) to "users" (lowercase) collection
 * Run this script once to migrate existing data
 */

const { admin, USER_COLLECTION } = require('../config');

async function migrateUsers() {
  const adminDb = admin.firestore();
  const oldCollection = adminDb.collection('Users'); // Uppercase collection
  const newCollection = adminDb.collection(USER_COLLECTION); // Lowercase collection

  console.log('Starting user collection migration...');
  console.log(`Moving data from "Users" to "${USER_COLLECTION}"...`);

  try {
    // Get all documents from the old collection
    const snapshot = await oldCollection.get();
    
    if (snapshot.empty) {
      console.log('No documents found in the "Users" collection. Nothing to migrate.');
      return;
    }

    console.log(`Found ${snapshot.size} documents to migrate.`);
    
    // Batch operations for better performance and atomicity
    const batchSize = 500; // Firestore limit is 500 operations per batch
    let batch = adminDb.batch();
    let operationCount = 0;
    let migratedCount = 0;

    // Process each document
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      
      // Check if document already exists in the new collection
      const existingDoc = await newCollection.doc(doc.id).get();
      
      if (!existingDoc.exists) {
        // Add document to the new collection with the same ID
        const newDocRef = newCollection.doc(doc.id);
        batch.set(newDocRef, userData);
        operationCount++;
        migratedCount++;
        
        // If batch is full, commit it and start a new one
        if (operationCount >= batchSize) {
          await batch.commit();
          console.log(`Committed batch of ${operationCount} operations.`);
          batch = adminDb.batch();
          operationCount = 0;
        }
      } else {
        console.log(`Document ${doc.id} already exists in the new collection. Skipping.`);
      }
    }

    // Commit any remaining operations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${operationCount} operations.`);
    }

    console.log(`Migration complete. Migrated ${migratedCount} documents.`);
    console.log('Note: The original "Users" collection was not deleted. You can delete it manually after verifying the migration.');
    
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateUsers()
  .then(() => {
    console.log('Migration script completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
