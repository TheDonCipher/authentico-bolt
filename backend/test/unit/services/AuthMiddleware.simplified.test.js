/**
 * Simplified tests for Authentico AuthMiddleware
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

describe('AuthMiddleware Simplified', () => {
  // Mock request, response, and next function
  let req, res, next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock behavior
    mockVerifyIdToken.mockResolvedValue({
      uid: 'test-user-id',
      walletAddress: '0x1234567890123456789012345678901234567890',
      userType: 'individual',
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

    test('should reject requests with no token', async () => {
      // Arrange
      req.headers.authorization = '';

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject requests with invalid token', async () => {
      // Arrange
      req.headers.authorization = 'Bearer invalid-token';
      mockVerifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));

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

    test('should handle token verification errors gracefully', async () => {
      // Arrange
      req.headers.authorization = 'Bearer error-token';
      mockVerifyIdToken.mockRejectedValueOnce(new Error('Firebase error'));

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

    test('should handle unexpected errors gracefully', async () => {
      // Arrange
      req.headers = null; // This will cause an error when accessing req.headers.authorization
      
      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Authentication error',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});
