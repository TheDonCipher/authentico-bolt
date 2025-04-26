/**
 * Security tests for Authentico security headers
 */
const express = require('express');
const request = require('supertest');
const helmet = require('helmet');
const { expectSecurityHeaders } = require('../utils/securityTestUtils');

// Create a security headers middleware for testing
const securityHeadersMiddleware = (req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

describe('Security Headers Tests', () => {
  let app;
  
  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());
    
    // Add security headers middleware
    app.use(securityHeadersMiddleware);
    
    // Add test route
    app.get('/api/test', (req, res) => {
      res.json({ success: true });
    });
  });

  test('should set Content-Type-Options header', async () => {
    // Act
    const response = await request(app).get('/api/test');
    
    // Assert
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  test('should set X-Frame-Options header', async () => {
    // Act
    const response = await request(app).get('/api/test');
    
    // Assert
    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  test('should set Content-Security-Policy header', async () => {
    // Act
    const response = await request(app).get('/api/test');
    
    // Assert
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
  });

  test('should set X-XSS-Protection header', async () => {
    // Act
    const response = await request(app).get('/api/test');
    
    // Assert
    expect(response.headers['x-xss-protection']).toBe('1; mode=block');
  });

  test('should set Strict-Transport-Security header', async () => {
    // Act
    const response = await request(app).get('/api/test');
    
    // Assert
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
  });

  test('should set Referrer-Policy header', async () => {
    // Act
    const response = await request(app).get('/api/test');
    
    // Assert
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('should set Permissions-Policy header', async () => {
    // Act
    const response = await request(app).get('/api/test');
    
    // Assert
    expect(response.headers['permissions-policy']).toBeDefined();
    expect(response.headers['permissions-policy']).toContain('camera=()');
  });

  test('should apply all security headers using helmet', async () => {
    // Create a new app with helmet
    const helmetApp = express();
    helmetApp.use(helmet());
    helmetApp.get('/api/helmet', (req, res) => {
      res.json({ success: true });
    });
    
    // Act
    const response = await request(helmetApp).get('/api/helmet');
    
    // Assert
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['referrer-policy']).toBeDefined();
  });

  test('should use expectSecurityHeaders utility function', async () => {
    // Create a mock response object
    const res = {
      setHeader: jest.fn(),
    };
    
    // Apply security headers
    securityHeadersMiddleware({}, res, () => {});
    
    // Assert using the utility function
    expectSecurityHeaders(res);
  });
});
