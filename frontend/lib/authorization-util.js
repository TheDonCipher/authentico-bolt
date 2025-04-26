/**
 * Authorization utility functions for the Authentico platform
 */

/**
 * Check if a user is an admin based on their wallet address or user data
 * @param {Object} user - The user object from the auth context
 * @returns {boolean} - True if the user is an admin, false otherwise
 */
export const isAdmin = (user) => {
  if (!user) return false;

  // Get the admin wallet address from environment variables
  const adminWalletAddress =
    process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ||
    '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c';

  // Check if user has a wallet address that matches the admin wallet address
  if (user.walletAddress && 
      user.walletAddress.toLowerCase() === adminWalletAddress.toLowerCase()) {
    return true;
  }

  // Check if user has admin flag in their claims
  if (user.customClaims && user.customClaims.admin === true) {
    return true;
  }

  // Check if user has admin userType
  if (user.userType === 'admin') {
    return true;
  }

  // Check if user has admin role
  if (user.role === 'admin') {
    return true;
  }

  return false;
};

/**
 * Check if a user is an organization based on their user data
 * @param {Object} user - The user object from the auth context
 * @returns {boolean} - True if the user is an organization, false otherwise
 */
export const isOrganization = (user) => {
  if (!user) return false;

  // Check if user has organization userType
  if (user.userType === 'organization') {
    return true;
  }

  // Check if user has organization role
  if (user.role === 'organization') {
    return true;
  }

  return false;
};

/**
 * Check if an organization is verified based on their user data
 * @param {Object} user - The user object from the auth context
 * @returns {boolean} - True if the organization is verified, false otherwise
 */
export const isVerifiedOrganization = (user) => {
  if (!isOrganization(user)) return false;

  // Check if organization has verified status
  if (user.verificationStatus === 'verified') {
    return true;
  }

  // Check if organization has legacy isVerified flag
  if (user.isVerified === true) {
    return true;
  }

  // Check if organization has verified status
  if (user.status === 'verified') {
    return true;
  }

  return false;
};

/**
 * Check if a user is an individual based on their user data
 * @param {Object} user - The user object from the auth context
 * @returns {boolean} - True if the user is an individual, false otherwise
 */
export const isIndividual = (user) => {
  if (!user) return false;

  // Check if user has individual userType
  if (user.userType === 'individual') {
    return true;
  }

  // Check if user has individual role
  if (user.role === 'individual') {
    return true;
  }

  // If user is not an admin or organization, assume they are an individual
  return !isAdmin(user) && !isOrganization(user);
};
