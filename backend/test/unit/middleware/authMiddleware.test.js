/**
 * Unit tests for Authentico authentication middleware
 */

// Mock Firebase Admin
const mockVerifyIdToken = jest.fn();
const mockFirebaseAdmin = {
  auth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
};

// Mock dependencies
jest.mock('../../../config', () => ({
  admin: mockFirebaseAdmin,
}));

// Import after mocking
const { verifyToken } = require('../../../authMiddleware');

describe('Authentication Middleware', () => {
  // Mock request, response, and next function
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up mock implementations
    mockVerifyIdToken.mockImplementation((token) => {
      if (token === 'valid-token') {
        return Promise.resolve({
          uid: 'test-user-id',
          walletAddress: '0x1234567890123456789012345678901234567890',
          userType: 'individual',
        });
      } else if (token === 'admin-token') {
        return Promise.resolve({
          uid: 'admin-user-id',
          walletAddress: '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c',
          userType: 'admin',
          admin: true,
        });
      } else if (token === 'org-token') {
        return Promise.resolve({
          uid: 'org-user-id',
          walletAddress: '0x0987654321098765432109876543210987654321',
          userType: 'organization',
          isVerified: true,
        });
      } else {
        return Promise.reject(new Error('Invalid token'));
      }
    });

    // Create fresh mock objects for each test
    req = {
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  describe('verifyToken', () => {
    test('should pass for valid token', async () => {
      // Arrange
      req.headers.authorization = 'Bearer valid-token';

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(mockFirebaseAdmin.auth().verifyIdToken).toHaveBeenCalledWith(
        'valid-token'
      );
      expect(req.user).toBeDefined();
      expect(req.user.uid).toBe('test-user-id');
      expect(req.user.walletAddress).toBe(
        '0x1234567890123456789012345678901234567890'
      );
      expect(req.user.userType).toBe('individual');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should pass for admin token', async () => {
      // Arrange
      req.headers.authorization = 'Bearer admin-token';

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(mockFirebaseAdmin.auth().verifyIdToken).toHaveBeenCalledWith(
        'admin-token'
      );
      expect(req.user).toBeDefined();
      expect(req.user.uid).toBe('admin-user-id');
      expect(req.user.walletAddress).toBe(
        '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c'
      );
      expect(req.user.userType).toBe('admin');
      expect(req.user.admin).toBe(true);
      expect(next).toHaveBeenCalled();
    });

    test('should pass for organization token', async () => {
      // Arrange
      req.headers.authorization = 'Bearer org-token';

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(mockFirebaseAdmin.auth().verifyIdToken).toHaveBeenCalledWith(
        'org-token'
      );
      expect(req.user).toBeDefined();
      expect(req.user.uid).toBe('org-user-id');
      expect(req.user.walletAddress).toBe(
        '0x0987654321098765432109876543210987654321'
      );
      expect(req.user.userType).toBe('organization');
      expect(req.user.isVerified).toBe(true);
      expect(next).toHaveBeenCalled();
    });

    test('should reject request with no authorization header', async () => {
      // Arrange
      req.headers = {}; // No authorization header

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(mockFirebaseAdmin.auth().verifyIdToken).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with invalid authorization format', async () => {
      // Arrange
      req.headers.authorization = 'InvalidFormat'; // Not 'Bearer token'

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid token',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with invalid token', async () => {
      // Arrange
      req.headers.authorization = 'Bearer invalid-token';
      mockFirebaseAdmin
        .auth()
        .verifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(mockFirebaseAdmin.auth().verifyIdToken).toHaveBeenCalledWith(
        'invalid-token'
      );
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle Firebase errors', async () => {
      // Arrange
      req.headers.authorization = 'Bearer error-token';
      mockFirebaseAdmin
        .auth()
        .verifyIdToken.mockRejectedValueOnce(new Error('Firebase error'));

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(mockFirebaseAdmin.auth().verifyIdToken).toHaveBeenCalledWith(
        'error-token'
      );
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
