const express = require('express');
const router = express.Router();
const { admin, firebase, USER_COLLECTION } = require('./config');

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Create Firebase auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // Create user document in Firestore
    await admin
      .firestore()
      .collection(USER_COLLECTION)
      .doc(userRecord.uid)
      .set({
        email,
        displayName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    const token = await user.user.getIdToken();

    res.json({ token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');

    const decodedToken = await admin.auth().verifyIdToken(token);
    const user = await admin.auth().getUser(decodedToken.uid);

    res.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    });
  } catch (error) {
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

module.exports = router;
