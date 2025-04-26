const express = require('express');
const router = express.Router();
const { admin } = require('../config');

// Exchange a custom token for an ID token
// This is primarily for testing purposes
router.post('/exchange', async (req, res) => {
  try {
    const { customToken } = req.body;

    if (!customToken) {
      return res.status(400).json({ error: 'Custom token is required' });
    }

    try {
      // Note: This endpoint requires a client-side token exchange
      // The server cannot directly exchange a custom token for an ID token
      // without using the Firebase client SDK

      // Return the custom token and instructions
      res.json({
        message:
          'Please use the client-side Firebase SDK to exchange this token',
        customToken,
      });
    } catch (error) {
      console.error('Error processing token:', error);
      res
        .status(500)
        .json({ error: error.message || 'Failed to process token' });
    }
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
