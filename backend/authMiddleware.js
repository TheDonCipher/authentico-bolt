const { admin } = require('./config');

const verifyToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
      const uid = decodedToken.uid;
      console.log(`Successfully verified ID token for user: ${uid}`);

      // Set the user object on the request
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('ID token verification failed:', error);
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided authentication token is invalid or expired.',
      });
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication.',
    });
  }
};

module.exports = { verifyToken };
