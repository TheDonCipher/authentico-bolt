/**
 * authRoutes.js
 * API routes for authentication operations
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../authMiddleware');
const { admin, adminDb, USER_COLLECTION } = require('../config');
const {
  regenerateSessionOnLogin,
  destroySessionOnLogout,
} = require('../middleware/sessionManagement');

// Collection references
const usersCollection = adminDb.collection(USER_COLLECTION);

/**
 * Set admin claims for a user
 * POST /api/auth/set-admin-claims
 */
router.post('/set-admin-claims', verifyToken, async (req, res) => {
  try {
    const { wallet_address } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Get admin wallet address from environment variable
    const ADMIN_WALLET_ADDRESS =
      process.env.ADMIN_WALLET_ADDRESS ||
      '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c';

    // Verify that the wallet address matches the admin wallet address
    if (wallet_address.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Get the current user's UID from the token
    const uid = req.user.uid;

    // Set custom claims for the user
    await admin.auth().setCustomUserClaims(uid, {
      ...req.user,
      admin: true,
      wallet_address: wallet_address,
    });

    // Update or create user document in Firestore
    const userSnapshot = await usersCollection.doc(uid).get();

    if (userSnapshot.exists) {
      // Update existing user
      await usersCollection.doc(uid).update({
        userType: 'admin',
        wallet_address: wallet_address,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Create new user
      await usersCollection.doc(uid).set({
        uid,
        email: req.user.email || '',
        name: req.user.name || 'Admin User',
        userType: 'admin',
        wallet_address: wallet_address,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.status(200).json({
      message: 'Admin claims set successfully',
      uid,
    });
  } catch (error) {
    console.error('Error setting admin claims:', error);
    res.status(500).json({
      error: 'Failed to set admin claims',
      details: error.message,
    });
  }
});

/**
 * Login route
 * POST /api/auth/login
 */
router.post(
  '/login',
  verifyToken,
  regenerateSessionOnLogin,
  async (req, res) => {
    try {
      // User is already authenticated via verifyToken middleware
      // and session is regenerated via regenerateSessionOnLogin middleware

      // Return user data
      res.status(200).json({
        message: 'Login successful',
        user: {
          uid: req.user.uid,
          walletAddress: req.user.walletAddress,
          userType: req.user.userType,
          admin: req.user.admin || false,
        },
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({
        error: 'Login failed',
        details: error.message,
      });
    }
  }
);

/**
 * Logout route
 * POST /api/auth/logout
 */
router.post('/logout', destroySessionOnLogout, (req, res) => {
  res.status(200).json({ message: 'Logout successful' });
});

module.exports = router;
