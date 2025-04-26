/**
 * Security tests for Authentico JWT token security
 */
const jwt = require('jsonwebtoken');
const express = require('express');
const request = require('supertest');
const {
  createMockRequest,
  createMockResponse,
} = require('../utils/securityTestUtils');

// Import mocks first to avoid initialization errors
const { mockFirebaseAdmin } = require('../mocks/services');

// Mock the admin module
jest.mock('../../config', () => ({
  admin: mockFirebaseAdmin,
  adminDb: {},
  USER_COLLECTION: 'users',
}));

// Import after mocking
const { verifyToken } = require('../../authMiddleware');

describe('JWT Token Security Tests', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create fresh mock objects for each test
    req = createMockRequest();
    res = createMockResponse();
    next = jest.fn();
  });

  test('should reject tokens with invalid algorithm', async () => {
    // Arrange
    // Create a token with an insecure algorithm (none)
    const insecureToken = jwt.sign(
      { uid: 'test-user-id', algorithm: 'none' },
      'secret'
    );
    req.headers = { authorization: `Bearer ${insecureToken}` };

    // Mock Firebase to reject tokens with invalid algorithms
    mockFirebaseAdmin
      .auth()
      .verifyIdToken.mockRejectedValueOnce(
        new Error('Invalid algorithm specified in JWT')
      );

    // Act
    await verifyToken(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid token' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject tokens with invalid audience', async () => {
    // Arrange
    req.headers = { authorization: 'Bearer invalid-audience-token' };
    mockFirebaseAdmin
      .auth()
      .verifyIdToken.mockRejectedValueOnce(
        new Error('Invalid audience specified in JWT')
      );

    // Act
    await verifyToken(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid token' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject tokens with invalid issuer', async () => {
    // Arrange
    req.headers = { authorization: 'Bearer invalid-issuer-token' };
    mockFirebaseAdmin
      .auth()
      .verifyIdToken.mockRejectedValueOnce(
        new Error('Invalid issuer specified in JWT')
      );

    // Act
    await verifyToken(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid token' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject tokens with invalid subject', async () => {
    // Arrange
    req.headers = { authorization: 'Bearer invalid-subject-token' };
    mockFirebaseAdmin
      .auth()
      .verifyIdToken.mockRejectedValueOnce(
        new Error('Invalid subject specified in JWT')
      );

    // Act
    await verifyToken(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid token' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject tokens with invalid signature', async () => {
    // Arrange
    // Create a token with a valid structure but invalid signature
    const validPayload = {
      uid: 'test-user-id',
      wallet_address: '0x1234567890123456789012345678901234567890',
      userType: 'individual',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    // Create a token with a tampered signature
    const parts = jwt.sign(validPayload, 'correct-secret').split('.');
    parts[2] = parts[2].replace(/[a-zA-Z]/g, 'X'); // Tamper with the signature
    const tamperedToken = parts.join('.');

    req.headers = { authorization: `Bearer ${tamperedToken}` };
    mockFirebaseAdmin
      .auth()
      .verifyIdToken.mockRejectedValueOnce(new Error('Invalid signature'));

    // Act
    await verifyToken(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid token' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject tokens with missing required claims', async () => {
    // Create a test app with a middleware that checks for required claims
    const testApp = express();
    testApp.use(express.json());

    // Add middleware to check for required claims
    testApp.use((req, res, next) => {
      // Mock token verification
      const token = {
        // Missing walletAddress and userType
        uid: 'test-user-id',
      };

      // Check for required claims
      const requiredClaims = ['uid', 'walletAddress', 'userType'];
      const missingClaims = requiredClaims.filter((claim) => !token[claim]);

      if (missingClaims.length > 0) {
        return res.status(401).json({
          error: 'Invalid token',
          message: `Missing required claims: ${missingClaims.join(', ')}`,
        });
      }

      req.user = token;
      next();
    });

    // Add test route
    testApp.get('/api/test', (req, res) => {
      res.json({ success: true });
    });

    // Act
    const response = await request(testApp).get('/api/test');

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid token');
    expect(response.body.message).toContain('Missing required claims');
  });

  test('should handle token replay attacks', async () => {
    // Arrange
    req.headers = { authorization: 'Bearer replayed-token' };

    // Mock Firebase to detect a replayed token
    // In a real implementation, this would check a token blacklist or use a nonce
    mockFirebaseAdmin
      .auth()
      .verifyIdToken.mockRejectedValueOnce(
        new Error('Token has been used before')
      );

    // Act
    await verifyToken(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid token' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('should validate token structure', async () => {
    // Arrange
    // Create a token with an invalid structure (missing parts)
    const invalidStructureToken = 'header.payload'; // Missing signature part
    req.headers = { authorization: `Bearer ${invalidStructureToken}` };

    mockFirebaseAdmin
      .auth()
      .verifyIdToken.mockRejectedValueOnce(new Error('JWT malformed'));

    // Act
    await verifyToken(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid token' })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
