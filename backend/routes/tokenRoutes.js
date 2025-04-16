const express = require('express');
const router = express.Router();
const { firebase, admin } = require('../config');

// Exchange a custom token for an ID token
// This is primarily for testing purposes
router.post('/exchange', async (req, res) => {
  try {
    const { customToken } = req.body;

    if (!customToken) {
      return res.status(400).json({ error: 'Custom token is required' });
    }

    try {
      // Sign in with the custom token using the Firebase client SDK
      const userCredential = await firebase.auth().signInWithCustomToken(customToken);
      
      // Get the ID token
      const idToken = await userCredential.user.getIdToken();

      if (!idToken) {
        return res.status(500).json({ error: 'Failed to get ID token' });
      }

      res.json({ idToken });
    } catch (error) {
      console.error('Error exchanging token:', error);
      res.status(500).json({ error: error.message || 'Failed to exchange token' });
    }
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
