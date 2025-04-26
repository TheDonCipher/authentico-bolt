/**
 * Security tests for Authentico authentication routes
 */
const express = require('express');
const request = require('supertest');

// Import mocks first to avoid initialization errors
const { mockFirebaseAdmin, mockFirestore } = require('../mocks/services');

// Mock dependencies
jest.mock('../../config', () => ({
  admin: mockFirebaseAdmin,
  adminDb: mockFirestore,
  USER_COLLECTION: 'users',
}));

// Import after mocking
const authRoutes = require('../../authRoutes');

describe('Authentication Routes Security Tests', () => {
  let app;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  test('should validate required fields for user registration', async () => {
    // Act
    const response = await request(app).post('/api/auth/register').send({
      // Missing required fields
      walletAddress: '0x1234567890123456789012345678901234567890',
      // Missing userType
      // Missing userData
    });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('required');
  });

  test('should validate wallet address format for registration', async () => {
    // Act
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        walletAddress: 'invalid-wallet-address', // Invalid format
        userType: 'individual',
        userData: {
          name: 'Test User',
        },
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Invalid wallet address format');
  });

  test('should prevent duplicate wallet registrations', async () => {
    // Mock existing user with same wallet
    mockFirestore
      .collection()
      .where()
      .get.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'existing-user-id',
            data: () => ({
              walletAddress: '0x1234567890123456789012345678901234567890',
              userType: 'individual',
              name: 'Existing User',
            }),
          },
        ],
      });

    // Act
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        walletAddress: '0x1234567890123456789012345678901234567890',
        userType: 'individual',
        userData: {
          name: 'Test User',
        },
      });

    // Assert
    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('WALLET_ALREADY_REGISTERED');
  });

  test('should securely create user account on registration', async () => {
    // Mock empty result for wallet check
    mockFirestore.collection().where().get.mockResolvedValueOnce({
      empty: true,
      docs: [],
    });

    // Act
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        walletAddress: '0x1234567890123456789012345678901234567890',
        userType: 'individual',
        userData: {
          name: 'Test User',
        },
      });

    // Assert
    expect(response.status).toBe(201);
    expect(mockFirebaseAdmin.auth().createUser).toHaveBeenCalled();
    expect(mockFirestore.collection().doc().set).toHaveBeenCalled();
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('uid');
  });

  test('should validate required fields for login', async () => {
    // Act
    const response = await request(app).post('/api/auth/login').send({
      // Missing walletAddress
    });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('required');
  });

  test('should validate wallet address format for login', async () => {
    // Act
    const response = await request(app).post('/api/auth/login').send({
      walletAddress: 'invalid-wallet-address', // Invalid format
    });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Invalid wallet address format');
  });

  test('should handle non-existent user login attempts', async () => {
    // Mock empty result for wallet check
    mockFirestore.collection().where().get.mockResolvedValueOnce({
      empty: true,
      docs: [],
    });

    // Act
    const response = await request(app).post('/api/auth/login').send({
      walletAddress: '0x1234567890123456789012345678901234567890',
    });

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('NEW_USER');
  });

  test('should securely generate authentication token on login', async () => {
    // Mock existing user
    mockFirestore
      .collection()
      .where()
      .get.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'test-user-id',
            data: () => ({
              walletAddress: '0x1234567890123456789012345678901234567890',
              userType: 'individual',
              name: 'Test User',
            }),
          },
        ],
      });

    // Act
    const response = await request(app).post('/api/auth/login').send({
      walletAddress: '0x1234567890123456789012345678901234567890',
    });

    // Assert
    expect(response.status).toBe(200);
    expect(mockFirebaseAdmin.auth().createCustomToken).toHaveBeenCalledWith(
      'test-user-id'
    );
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('uid');
    expect(response.body.user).toHaveProperty('walletAddress');
    expect(response.body.user).toHaveProperty('userType');
  });

  test('should not expose sensitive user data in login response', async () => {
    // Mock existing user with sensitive data
    mockFirestore
      .collection()
      .where()
      .get.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'test-user-id',
            data: () => ({
              walletAddress: '0x1234567890123456789012345678901234567890',
              userType: 'individual',
              name: 'Test User',
              email: 'test@example.com',
              phoneNumber: '123-456-7890',
              address: '123 Main St',
              sensitiveData: 'should not be exposed',
            }),
          },
        ],
      });

    // Act
    const response = await request(app).post('/api/auth/login').send({
      walletAddress: '0x1234567890123456789012345678901234567890',
    });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.user).not.toHaveProperty('sensitiveData');
    expect(response.body.user).not.toHaveProperty('email');
    expect(response.body.user).not.toHaveProperty('phoneNumber');
    expect(response.body.user).not.toHaveProperty('address');
  });

  test('should handle login errors gracefully', async () => {
    // Mock Firebase error
    mockFirebaseAdmin
      .auth()
      .createCustomToken.mockRejectedValueOnce(
        new Error('Authentication service unavailable')
      );

    // Mock existing user
    mockFirestore
      .collection()
      .where()
      .get.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'test-user-id',
            data: () => ({
              walletAddress: '0x1234567890123456789012345678901234567890',
              userType: 'individual',
              name: 'Test User',
            }),
          },
        ],
      });

    // Act
    const response = await request(app).post('/api/auth/login').send({
      walletAddress: '0x1234567890123456789012345678901234567890',
    });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});
