/**
 * Script to sync all users' Firestore data with Firebase Auth custom claims
 */

const { admin, adminDb } = require('../config');
const { syncUserClaims } = require('../functions/syncUserClaims');

async function syncAllUsers() {
  try {
    console.log('Starting to sync all users...');
    
    // Get all users from Firestore
    const usersSnapshot = await adminDb.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in Firestore');
      return;
    }
    
    console.log(`Found ${usersSnapshot.size} users to sync`);
    
    // Process each user
    const promises = usersSnapshot.docs.map(async (doc) => {
      const userId = doc.id;
      const userData = doc.data();
      
      try {
        // Get the user from Firebase Auth
        const userRecord = await admin.auth().getUser(userId);
        
        // Sync custom claims
        const customClaims = await syncUserClaims(userId, userData);
        
        console.log(`Synced user ${userId} (${userData.name || 'unnamed'})`);
        return { userId, success: true, customClaims };
      } catch (error) {
        console.error(`Error syncing user ${userId}:`, error.message);
        return { userId, success: false, error: error.message };
      }
    });
    
    // Wait for all promises to resolve
    const results = await Promise.all(promises);
    
    // Log summary
    const successful = results.filter(r => r.success).length;
    console.log(`Sync complete. ${successful}/${results.length} users synced successfully.`);
    
    return results;
  } catch (error) {
    console.error('Error syncing users:', error);
    throw error;
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  syncAllUsers()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { syncAllUsers };
