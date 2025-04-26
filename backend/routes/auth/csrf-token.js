/**
 * CSRF Token Route
 * Provides an endpoint to get a CSRF token for the client
 */

const express = require('express');
const router = express.Router();

/**
 * Get a CSRF token
 * GET /api/auth/csrf-token
 */
router.get('/', (req, res) => {
  try {
    // The CSRF token is automatically generated and set as a cookie
    // by the csrfTokenGenerator middleware in the main app
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'CSRF token generated successfully',
    });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    res.status(500).json({
      error: 'Failed to generate CSRF token',
      details: error.message,
    });
  }
});

module.exports = router;
