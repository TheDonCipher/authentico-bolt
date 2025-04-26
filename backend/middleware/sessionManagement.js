/**
 * Session Management Middleware for Authentico
 * 
 * This middleware implements secure session management for the Authentico application.
 */

// Constants
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_COOKIE_NAME = 'authentico.sid';

/**
 * Configure secure session options
 * @returns {Object} Session options
 */
function getSessionOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    secret: process.env.SESSION_SECRET || 'authentico-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_TIMEOUT,
    },
  };
}

/**
 * Middleware to regenerate session ID on login
 */
function regenerateSessionOnLogin(req, res, next) {
  const user = req.user;
  
  // Skip if no user (not a login request)
  if (!user) {
    return next();
  }
  
  // Store the user data temporarily
  const userData = { ...user };
  
  // Regenerate the session
  req.session.regenerate((err) => {
    if (err) {
      console.error('Failed to regenerate session:', err);
      return res.status(500).json({ error: 'Session regeneration failed' });
    }
    
    // Restore user data to the new session
    req.session.user = userData;
    req.session.authenticated = true;
    req.session.createdAt = Date.now();
    
    next();
  });
}

/**
 * Middleware to destroy session on logout
 */
function destroySessionOnLogout(req, res, next) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Failed to destroy session:', err);
      return res.status(500).json({ error: 'Session destruction failed' });
    }
    
    // Clear the session cookie
    res.clearCookie(SESSION_COOKIE_NAME);
    next();
  });
}

/**
 * Middleware to check session timeout
 */
function checkSessionTimeout(req, res, next) {
  // Skip if no session or not authenticated
  if (!req.session || !req.session.authenticated) {
    return next();
  }
  
  const currentTime = Date.now();
  const sessionCreatedAt = req.session.createdAt || 0;
  
  // Check if session has expired
  if (currentTime - sessionCreatedAt > SESSION_TIMEOUT) {
    return destroySessionOnLogout(req, res, () => {
      res.status(401).json({ error: 'Session expired' });
    });
  }
  
  // Update session creation time
  req.session.createdAt = currentTime;
  next();
}

/**
 * Middleware to protect against session fixation
 */
function protectAgainstSessionFixation(req, res, next) {
  // Skip if no session
  if (!req.session) {
    return next();
  }
  
  // Check if session has been validated
  if (!req.session.validated) {
    // Regenerate session for new sessions
    req.session.regenerate((err) => {
      if (err) {
        console.error('Failed to regenerate session:', err);
        return res.status(500).json({ error: 'Session regeneration failed' });
      }
      
      // Mark session as validated
      req.session.validated = true;
      req.session.createdAt = Date.now();
      
      next();
    });
  } else {
    next();
  }
}

/**
 * Middleware to protect against session hijacking
 */
function protectAgainstSessionHijacking(req, res, next) {
  // Skip if no session or not authenticated
  if (!req.session || !req.session.authenticated) {
    return next();
  }
  
  // Get client fingerprint
  const userAgent = req.headers['user-agent'] || '';
  const clientIp = req.ip || req.connection.remoteAddress;
  const fingerprint = `${userAgent}|${clientIp}`;
  
  // Check if fingerprint matches
  if (!req.session.fingerprint) {
    // First request, set fingerprint
    req.session.fingerprint = fingerprint;
  } else if (req.session.fingerprint !== fingerprint) {
    // Fingerprint mismatch, potential session hijacking
    return destroySessionOnLogout(req, res, () => {
      res.status(403).json({ error: 'Session validation failed' });
    });
  }
  
  next();
}

module.exports = {
  getSessionOptions,
  regenerateSessionOnLogin,
  destroySessionOnLogout,
  checkSessionTimeout,
  protectAgainstSessionFixation,
  protectAgainstSessionHijacking,
};
