/**
 * Cloud Function to sync Firestore user data with Firebase Auth custom claims
 * This function should be triggered when a user document is updated in Firestore
 */

const { admin } = require('../config');

/**
 * Sync user data from Firestore to Firebase Auth custom claims
 * @param {string} userId - The user ID
 * @param {Object} userData - The user data from Firestore
 * @returns {Promise<void>}
 */
async function syncUserClaims(userId, userData) {
  try {
    console.log(`Syncing custom claims for user ${userId}`);
    
    // Create custom claims based on user data
    const customClaims = {
      userType: userData.userType || 'individual',
      walletAddress: userData.walletAddress || '',
    };
    
    // Add verification status for organizations
    if (userData.userType === 'organization') {
      customClaims.isVerified = userData.isVerified === true;
      customClaims.verificationStatus = userData.verificationStatus || 'not_verified';
    }
    
    // Add admin flag if user is admin
    if (userData.userType === 'admin' || userData.admin === true) {
      customClaims.admin = true;
    }
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(userId, customClaims);
    console.log(`Custom claims updated for user ${userId}:`, customClaims);
    
    return customClaims;
  } catch (error) {
    console.error(`Error syncing custom claims for user ${userId}:`, error);
    throw error;
  }
}

module.exports = { syncUserClaims };
