/**
 * Security tests for Authentico API security
 */
const express = require('express');
const request = require('supertest');

// Create API security middleware for testing
const createApiSecurityMiddleware = () => {
  return (req, res, next) => {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Add API version header
    res.setHeader('X-API-Version', '1.0.0');
    
    next();
  };
};

// Create error handling middleware for testing
const createErrorHandlingMiddleware = () => {
  return (err, req, res, next) => {
    // Log error for debugging (in a real app, this would use a proper logger)
    console.error(err);
    
    // Create a sanitized error response
    const statusCode = err.statusCode || 500;
    const errorResponse = {
      error: err.message || 'Internal Server Error',
      requestId: req.id, // In a real app, each request would have a unique ID
    };
    
    // Don't include stack traces or sensitive information in production
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.stack = err.stack;
    }
    
    res.status(statusCode).json(errorResponse);
  };
};

// Create API versioning middleware for testing
const createApiVersioningMiddleware = (supportedVersions = ['1.0.0']) => {
  return (req, res, next) => {
    // Get requested API version from header or default to latest
    const requestedVersion = req.headers['x-api-version'] || supportedVersions[supportedVersions.length - 1];
    
    // Check if requested version is supported
    if (!supportedVersions.includes(requestedVersion)) {
      return res.status(400).json({
        error: 'Unsupported API version',
        supportedVersions,
      });
    }
    
    // Set API version for this request
    req.apiVersion = requestedVersion;
    
    next();
  };
};

describe('API Security Tests', () => {
  let app;
  
  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());
    
    // Add request ID middleware
    app.use((req, res, next) => {
      req.id = 'test-request-id';
      next();
    });
    
    // Add API security middleware
    app.use(createApiSecurityMiddleware());
    
    // Add API versioning middleware
    app.use(createApiVersioningMiddleware(['1.0.0', '1.1.0', '2.0.0']));
    
    // Add test routes
    app.get('/api/test', (req, res) => {
      res.json({ success: true, version: req.apiVersion });
    });
    
    app.get('/api/error', (req, res, next) => {
      // Simulate an error
      const error = new Error('Test error');
      error.statusCode = 400;
      next(error);
    });
    
    app.get('/api/sensitive-error', (req, res, next) => {
      // Simulate an error with sensitive information
      try {
        // Simulate a database error
        throw new Error('Database connection failed: mongodb://user:password@localhost:27017/db');
      } catch (err) {
        // Sanitize the error
        const sanitizedError = new Error('Database connection failed');
        sanitizedError.statusCode = 500;
        next(sanitizedError);
      }
    });
    
    // Add error handling middleware
    app.use(createErrorHandlingMiddleware());
  });
  
  test('should include security headers in API responses', async () => {
    // Act
    const response = await request(app).get('/api/test');
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['content-security-policy']).toBe("default-src 'self'");
    expect(response.headers['x-xss-protection']).toBe('1; mode=block');
  });
  
  test('should include API version in responses', async () => {
    // Act
    const response = await request(app).get('/api/test');
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.headers['x-api-version']).toBe('1.0.0');
  });
  
  test('should validate API version in requests', async () => {
    // Act - Request with supported version
    const response1 = await request(app)
      .get('/api/test')
      .set('X-API-Version', '1.1.0');
    
    // Assert
    expect(response1.status).toBe(200);
    expect(response1.body.version).toBe('1.1.0');
    
    // Act - Request with unsupported version
    const response2 = await request(app)
      .get('/api/test')
      .set('X-API-Version', '3.0.0');
    
    // Assert
    expect(response2.status).toBe(400);
    expect(response2.body).toHaveProperty('error', 'Unsupported API version');
    expect(response2.body).toHaveProperty('supportedVersions');
  });
  
  test('should handle errors securely', async () => {
    // Act
    const response = await request(app).get('/api/error');
    
    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Test error');
    expect(response.body).toHaveProperty('requestId', 'test-request-id');
  });
  
  test('should not expose sensitive information in error responses', async () => {
    // Act
    const response = await request(app).get('/api/sensitive-error');
    
    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Database connection failed');
    expect(response.body.error).not.toContain('password');
    expect(response.body.error).not.toContain('mongodb://');
  });
  
  test('should handle non-existent routes securely', async () => {
    // Act
    const response = await request(app).get('/api/non-existent');
    
    // Assert
    expect(response.status).toBe(404);
  });
  
  test('should handle invalid JSON securely', async () => {
    // Act
    const response = await request(app)
      .post('/api/test')
      .set('Content-Type', 'application/json')
      .send('{invalid json}');
    
    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('JSON');
  });
  
  test('should validate Content-Type header', async () => {
    // Create a test app with Content-Type validation
    const testApp = express();
    
    // Add middleware to validate Content-Type
    testApp.use((req, res, next) => {
      if (req.method === 'POST' || req.method === 'PUT') {
        const contentType = req.headers['content-type'] || '';
        if (!contentType.includes('application/json')) {
          return res.status(415).json({ error: 'Unsupported Media Type. Use application/json' });
        }
      }
      next();
    });
    
    // Add test route
    testApp.post('/api/test', express.json(), (req, res) => {
      res.json({ success: true });
    });
    
    // Act - Request with correct Content-Type
    const response1 = await request(testApp)
      .post('/api/test')
      .set('Content-Type', 'application/json')
      .send({ test: true });
    
    // Assert
    expect(response1.status).toBe(200);
    
    // Act - Request with incorrect Content-Type
    const response2 = await request(testApp)
      .post('/api/test')
      .set('Content-Type', 'text/plain')
      .send('test');
    
    // Assert
    expect(response2.status).toBe(415);
    expect(response2.body).toHaveProperty('error');
    expect(response2.body.error).toContain('application/json');
  });
  
  test('should implement proper HTTP method handling', async () => {
    // Create a test app with method validation
    const testApp = express();
    
    // Add test route that only accepts GET
    testApp.get('/api/get-only', (req, res) => {
      res.json({ success: true });
    });
    
    // Add middleware to handle unsupported methods
    testApp.use((req, res, next) => {
      res.status(405).json({ error: 'Method Not Allowed' });
    });
    
    // Act - Request with correct method
    const response1 = await request(testApp).get('/api/get-only');
    
    // Assert
    expect(response1.status).toBe(200);
    
    // Act - Request with incorrect method
    const response2 = await request(testApp).post('/api/get-only');
    
    // Assert
    expect(response2.status).toBe(405);
    expect(response2.body).toHaveProperty('error', 'Method Not Allowed');
  });
});
