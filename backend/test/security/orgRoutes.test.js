/**
 * Security tests for Authentico organization routes
 */
const express = require('express');
const request = require('supertest');

// Import mocks first to avoid initialization errors
const { mockFirebaseAdmin, mockFirestore } = require('../mocks/services');

// Mock dependencies
jest.mock('../../authMiddleware', () => ({
  verifyToken: jest.fn((req, res, next) => {
    if (req.headers.authorization === 'Bearer valid-token') {
      req.user = {
        uid: 'test-user-id',
        walletAddress: '0x1234567890123456789012345678901234567890',
        userType: 'individual',
      };
      next();
    } else if (req.headers.authorization === 'Bearer admin-token') {
      req.user = {
        uid: 'admin-user-id',
        walletAddress: '0x4Ca717EAAC6Ec3917Cb6E23557e1CEa7267E2A1c',
        userType: 'admin',
        admin: true,
      };
      next();
    } else if (req.headers.authorization === 'Bearer org-token') {
      req.user = {
        uid: 'org-user-id',
        walletAddress: '0x0987654321098765432109876543210987654321',
        userType: 'organization',
        isVerified: true,
      };
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }),
}));

jest.mock('../../config', () => ({
  admin: mockFirebaseAdmin,
  adminDb: mockFirestore,
  USER_COLLECTION: 'users',
}));

jest.mock('../../services/NotificationService', () => ({
  createNotification: jest
    .fn()
    .mockResolvedValue({ id: 'mock-notification-id' }),
  getNotificationsForUser: jest.fn().mockResolvedValue([]),
  markAsRead: jest.fn().mockResolvedValue({}),
}));

// Import after mocking
const orgRoutes = require('../../routes/orgRoutes');
const { verifyToken } = require('../../authMiddleware');

describe('Organization Routes Security Tests', () => {
  let app;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/organizations', orgRoutes);
  });

  test('should require authentication for organization application', async () => {
    // Act
    const response = await request(app).post('/api/organizations/apply').send({
      orgName: 'Test Organization',
      contactEmail: 'contact@testorg.com',
      website: 'https://testorg.com',
    });

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  test('should validate required fields for organization application', async () => {
    // Act
    const response = await request(app)
      .post('/api/organizations/apply')
      .set('Authorization', 'Bearer valid-token')
      .send({
        // Missing required fields
        orgName: 'Test Organization',
        // Missing contactEmail
        // Missing website
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Missing required fields');
  });

  test('should validate email format for organization application', async () => {
    // Act
    const response = await request(app)
      .post('/api/organizations/apply')
      .set('Authorization', 'Bearer valid-token')
      .send({
        orgName: 'Test Organization',
        contactEmail: 'invalid-email', // Invalid email format
        website: 'https://testorg.com',
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Invalid email format');
  });

  test('should validate website URL format for organization application', async () => {
    // Act
    const response = await request(app)
      .post('/api/organizations/apply')
      .set('Authorization', 'Bearer valid-token')
      .send({
        orgName: 'Test Organization',
        contactEmail: 'contact@testorg.com',
        website: 'invalid-url', // Invalid URL format
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Invalid website URL');
  });

  test('should prevent duplicate organization applications', async () => {
    // Mock existing application
    mockFirestore
      .collection()
      .where()
      .get.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'existing-app-id',
            data: () => ({
              orgName: 'Test Organization',
              contactEmail: 'contact@testorg.com',
              status: 'pending',
            }),
          },
        ],
      });

    // Act
    const response = await request(app)
      .post('/api/organizations/apply')
      .set('Authorization', 'Bearer valid-token')
      .send({
        orgName: 'Test Organization',
        contactEmail: 'contact@testorg.com',
        website: 'https://testorg.com',
      });

    // Assert
    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('already exists');
  });

  test('should require admin privileges for updating application status', async () => {
    // Act
    const response = await request(app)
      .put('/api/organizations/applications/test-app-id')
      .set('Authorization', 'Bearer valid-token') // Non-admin token
      .send({
        status: 'approved',
        notes: 'Approved by admin',
      });

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Admin privileges required');
  });

  test('should validate status values for application updates', async () => {
    // Act
    const response = await request(app)
      .put('/api/organizations/applications/test-app-id')
      .set('Authorization', 'Bearer admin-token')
      .send({
        status: 'invalid-status', // Invalid status
        notes: 'Status update',
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Invalid status');
  });

  test('should securely handle application approval', async () => {
    // Mock application data
    mockFirestore
      .collection()
      .doc()
      .get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          orgName: 'Test Organization',
          contactEmail: 'contact@testorg.com',
          website: 'https://testorg.com',
          submittedBy: 'test-user-id',
          status: 'pending',
        }),
      });

    // Act
    const response = await request(app)
      .put('/api/organizations/applications/test-app-id')
      .set('Authorization', 'Bearer admin-token')
      .send({
        status: 'approved',
        notes: 'Approved by admin',
      });

    // Assert
    expect(response.status).toBe(200);
    expect(mockFirestore.collection().doc().update).toHaveBeenCalled();
  });

  test('should securely handle application rejection', async () => {
    // Mock application data
    mockFirestore
      .collection()
      .doc()
      .get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          orgName: 'Test Organization',
          contactEmail: 'contact@testorg.com',
          website: 'https://testorg.com',
          submittedBy: 'test-user-id',
          status: 'pending',
        }),
      });

    // Act
    const response = await request(app)
      .put('/api/organizations/applications/test-app-id')
      .set('Authorization', 'Bearer admin-token')
      .send({
        status: 'rejected',
        notes: 'Rejected by admin',
      });

    // Assert
    expect(response.status).toBe(200);
    expect(mockFirestore.collection().doc().update).toHaveBeenCalled();
  });

  test('should prevent non-existent application updates', async () => {
    // Mock non-existent application
    mockFirestore.collection().doc().get.mockResolvedValueOnce({
      exists: false,
    });

    // Act
    const response = await request(app)
      .put('/api/organizations/applications/non-existent-app-id')
      .set('Authorization', 'Bearer admin-token')
      .send({
        status: 'approved',
        notes: 'Approved by admin',
      });

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('not found');
  });

  test('should securely list verified organizations', async () => {
    // Mock verified organizations
    mockFirestore
      .collection()
      .where()
      .get.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'org-1',
            data: () => ({
              name: 'Organization 1',
              userType: 'organization',
              isVerified: true,
              verificationStatus: 'verified',
              industry: 'Education',
            }),
          },
          {
            id: 'org-2',
            data: () => ({
              name: 'Organization 2',
              userType: 'organization',
              isVerified: true,
              verificationStatus: 'verified',
              industry: 'Healthcare',
            }),
          },
        ],
      });

    // Act
    const response = await request(app)
      .get('/api/organizations/verified')
      .set('Authorization', 'Bearer valid-token');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('organizations');
    expect(response.body.organizations).toHaveLength(2);

    // Ensure sensitive data is not exposed
    response.body.organizations.forEach((org) => {
      expect(org).not.toHaveProperty('walletAddress');
      expect(org).not.toHaveProperty('email');
      expect(org).not.toHaveProperty('uid');
    });
  });
});
