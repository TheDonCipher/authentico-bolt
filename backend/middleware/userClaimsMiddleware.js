/**
 * Middleware to sync user claims with Firestore data
 */

const { admin, adminDb, USER_COLLECTION } = require('../config');
const { syncUserClaims } = require('../functions/syncUserClaims');

/**
 * Middleware to sync user claims after authentication
 * This middleware should be used after the verifyToken middleware
 */
const syncUserClaimsMiddleware = async (req, res, next) => {
  try {
    // Skip if no user is authenticated
    if (!req.user || !req.user.uid) {
      return next();
    }

    // Get user data from Firestore
    const userSnapshot = await adminDb.collection(USER_COLLECTION).doc(req.user.uid).get();
    
    if (!userSnapshot.exists) {
      console.log(`User ${req.user.uid} not found in Firestore, skipping claims sync`);
      return next();
    }
    
    const userData = userSnapshot.data();
    
    // Check if claims need to be updated
    const needsUpdate = checkIfClaimsNeedUpdate(req.user, userData);
    
    if (needsUpdate) {
      console.log(`Syncing claims for user ${req.user.uid}`);
      await syncUserClaims(req.user.uid, userData);
      
      // Note: The updated claims won't be available in the current request
      // They will be applied on the next token refresh
      console.log(`Claims updated for user ${req.user.uid}, will be applied on next token refresh`);
    }
    
    // Continue with the request
    next();
  } catch (error) {
    console.error('Error in syncUserClaimsMiddleware:', error);
    // Don't fail the request if claims sync fails
    next();
  }
};

/**
 * Check if user claims need to be updated
 * @param {Object} tokenClaims - Claims from the token
 * @param {Object} userData - User data from Firestore
 * @returns {boolean} - True if claims need to be updated
 */
function checkIfClaimsNeedUpdate(tokenClaims, userData) {
  // Check userType
  if (tokenClaims.userType !== userData.userType) {
    return true;
  }
  
  // Check wallet address
  if (tokenClaims.walletAddress !== userData.walletAddress) {
    return true;
  }
  
  // Check verification status for organizations
  if (userData.userType === 'organization') {
    const isVerifiedInToken = tokenClaims.isVerified === true;
    const isVerifiedInFirestore = userData.isVerified === true;
    
    if (isVerifiedInToken !== isVerifiedInFirestore) {
      return true;
    }
    
    if (tokenClaims.verificationStatus !== userData.verificationStatus) {
      return true;
    }
  }
  
  // Check admin status
  const isAdminInToken = tokenClaims.admin === true;
  const isAdminInFirestore = userData.userType === 'admin' || userData.admin === true;
  
  if (isAdminInToken !== isAdminInFirestore) {
    return true;
  }
  
  return false;
}

module.exports = { syncUserClaimsMiddleware };
