const express = require('express');
const router = express.Router();
const { admin, adminDb, firebase, USER_COLLECTION } = require('./config');

// User registration with wallet address
router.post('/register', async (req, res) => {
  try {
    const { walletAddress, userType, userData } = req.body;

    if (!walletAddress || !userType || !userData) {
      return res.status(400).json({
        error: 'Wallet address, user type, and user data are required',
      });
    }

    // Check if user already exists
    const usersRef = adminDb.collection(USER_COLLECTION);
    const snapshot = await usersRef
      .where('walletAddress', '==', walletAddress)
      .get();

    if (!snapshot.empty) {
      return res.status(409).json({
        error: 'WALLET_ALREADY_REGISTERED',
        message:
          'This wallet address is already registered. Please sign in instead.',
      });
    }

    // Create Firebase auth user without email/password for wallet-based auth
    const userRecord = await admin.auth().createUser({
      displayName: userData.name || 'Authentico User',
    });

    // Create user document in Firestore
    await usersRef.doc(userRecord.uid).set({
      uid: userRecord.uid,
      walletAddress,
      userType,
      name: userData.name,
      ...(userType === 'organization' && {
        organizationName: userData.organizationName,
      }),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      success: true,
      uid: userRecord.uid,
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// User login with wallet address
router.post('/login', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Check if user exists in Firestore
    const usersRef = adminDb.collection(USER_COLLECTION);
    const snapshot = await usersRef
      .where('walletAddress', '==', walletAddress)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: 'NEW_USER',
        message: 'This wallet is not registered yet. Please register first.',
      });
    }

    // User exists, create a custom token for them
    const userDoc = snapshot.docs[0];
    const uid = userDoc.id;
    const userData = userDoc.data();

    // Create a custom token for this user
    const token = await admin.auth().createCustomToken(uid);

    res.json({
      token,
      user: {
        uid,
        walletAddress: userData.walletAddress,
        userType: userData.userType,
        name: userData.name,
      },
      message: 'Sign in successful!',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Get current user with wallet information
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');

    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user data from Firestore to include wallet address
    const userDoc = await adminDb.collection(USER_COLLECTION).doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    res.json({
      uid: uid,
      walletAddress: userData.walletAddress,
      userType: userData.userType,
      name: userData.name || userData.displayName,
      ...(userData.organizationName && {
        organizationName: userData.organizationName,
      }),
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Set user role (admin only)
router.post('/set-role', async (req, res) => {
  try {
    const { uid, role } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');

    // Verify admin token
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken.admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Set custom claim
    await admin.auth().setCustomUserClaims(uid, { [role]: true });

    res.json({ message: `User ${uid} role set to ${role}` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Validate token
router.get('/validate', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');

    // Verify token
    const decodedToken = await admin.auth().verifyIdToken(token);

    res.json({
      valid: true,
      uid: decodedToken.uid,
      exp: decodedToken.exp,
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      error: error.message,
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');

    // Verify token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // In a real implementation, you would revoke the token or add it to a blacklist
    // Firebase doesn't provide a direct way to invalidate tokens, but you can:
    // 1. Force token refresh by updating user's security settings
    await admin.auth().revokeRefreshTokens(decodedToken.uid);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
