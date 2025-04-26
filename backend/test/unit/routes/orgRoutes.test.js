/**
 * Unit tests for Authentico organization routes
 */
const express = require('express');
const request = require('supertest');

// Mock dependencies
jest.mock('../../../authMiddleware', () => ({
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

// Mock services
jest.mock('../../../services/NotificationService', () => ({
  sendInAppNotification: jest.fn().mockResolvedValue('mock-notification-id'),
  notifyAdminsNewApplication: jest.fn().mockResolvedValue(true),
}));

// Mock Firestore
const mockFirestore = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  get: jest.fn(),
  set: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
  add: jest.fn().mockResolvedValue({ id: 'mock-app-id' }),
  delete: jest.fn().mockResolvedValue({}),
};

// Mock Firebase Admin
const mockFirebaseAdmin = {
  firestore: {
    FieldValue: {
      serverTimestamp: jest.fn().mockReturnValue('mock-timestamp'),
    },
  },
};

jest.mock('../../../config', () => ({
  admin: mockFirebaseAdmin,
  adminDb: mockFirestore,
  USER_COLLECTION: 'users',
}));

// Import after mocking
const orgRoutes = require('../../../routes/orgRoutes');

describe('Organization Routes', () => {
  let app;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up mock implementations
    mockFirestore.get.mockImplementation(() => {
      const path = mockFirestore.collection.mock.calls[0][0];
      
      if (path === 'organizationApplications') {
        return Promise.resolve({
          empty: false,
          docs: [
            {
              id: 'app-1',
              data: () => ({
                orgName: 'Test Organization',
                contactEmail: 'org@example.com',
                website: 'https://testorg.com',
                submittedBy: 'test-user-id',
                status: 'pending',
                createdAt: new Date().toISOString(),
              }),
            },
          ],
        });
      } else if (path === 'users') {
        return Promise.resolve({
          empty: false,
          docs: [
            {
              id: 'test-user-id',
              data: () => ({
                name: 'Test User',
                email: 'test@example.com',
                userType: 'individual',
              }),
            },
            {
              id: 'org-user-id',
              data: () => ({
                name: 'Test Organization',
                email: 'org@example.com',
                userType: 'organization',
                isVerified: true,
              }),
            },
          ],
        });
      }
      
      return Promise.resolve({
        empty: true,
        docs: [],
      });
    });

    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/organizations', orgRoutes);
  });

  describe('POST /api/organizations/apply', () => {
    test('should require authentication', async () => {
      // Act
      const response = await request(app).post('/api/organizations/apply');
      
      // Assert
      expect(response.status).toBe(401);
    });

    test('should submit organization application successfully', async () => {
      // Act
      const response = await request(app)
        .post('/api/organizations/apply')
        .set('Authorization', 'Bearer valid-token')
        .send({
          orgName: 'New Organization',
          contactEmail: 'new@example.com',
          website: 'https://neworg.com',
          description: 'A new organization',
          address: '123 Main St',
          phoneNumber: '555-1234',
          industry: 'Technology',
          registrationNumber: 'REG123456',
          foundedYear: '2020',
          documentTypes: ['identity', 'education'],
        });
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('applicationId');
      expect(response.body).toHaveProperty('status', 'pending');
    });

    test('should validate required fields', async () => {
      // Act
      const response = await request(app)
        .post('/api/organizations/apply')
        .set('Authorization', 'Bearer valid-token')
        .send({
          // Missing orgName
          contactEmail: 'new@example.com',
          website: 'https://neworg.com',
        });
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should check for existing applications', async () => {
      // Arrange
      mockFirestore.where.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [
            {
              id: 'existing-app',
              data: () => ({
                orgName: 'Existing Organization',
                contactEmail: 'existing@example.com',
                status: 'pending',
              }),
            },
          ],
        }),
      }));
      
      // Act
      const response = await request(app)
        .post('/api/organizations/apply')
        .set('Authorization', 'Bearer valid-token')
        .send({
          orgName: 'Existing Organization',
          contactEmail: 'existing@example.com',
          website: 'https://existingorg.com',
        });
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('GET /api/organizations/applications', () => {
    test('should require authentication', async () => {
      // Act
      const response = await request(app).get('/api/organizations/applications');
      
      // Assert
      expect(response.status).toBe(401);
    });

    test('should require admin access', async () => {
      // Act
      const response = await request(app)
        .get('/api/organizations/applications')
        .set('Authorization', 'Bearer valid-token'); // Non-admin token
      
      // Assert
      expect(response.status).toBe(403);
    });

    test('should get all organization applications for admin', async () => {
      // Act
      const response = await request(app)
        .get('/api/organizations/applications')
        .set('Authorization', 'Bearer admin-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('orgName');
    });
  });

  describe('GET /api/organizations/applications/:applicationId', () => {
    test('should require authentication', async () => {
      // Act
      const response = await request(app).get('/api/organizations/applications/app-1');
      
      // Assert
      expect(response.status).toBe(401);
    });

    test('should get application details for admin', async () => {
      // Arrange
      mockFirestore.doc.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'app-1',
          data: () => ({
            orgName: 'Test Organization',
            contactEmail: 'org@example.com',
            website: 'https://testorg.com',
            submittedBy: 'test-user-id',
            status: 'pending',
            createdAt: new Date().toISOString(),
          }),
        }),
      }));
      
      // Act
      const response = await request(app)
        .get('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer admin-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'app-1');
      expect(response.body).toHaveProperty('orgName', 'Test Organization');
    });

    test('should get own application details for submitter', async () => {
      // Arrange
      mockFirestore.doc.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'app-1',
          data: () => ({
            orgName: 'Test Organization',
            contactEmail: 'org@example.com',
            website: 'https://testorg.com',
            submittedBy: 'test-user-id', // Same as requester
            status: 'pending',
            createdAt: new Date().toISOString(),
          }),
        }),
      }));
      
      // Act
      const response = await request(app)
        .get('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'app-1');
    });

    test('should return 404 for non-existent application', async () => {
      // Arrange
      mockFirestore.doc.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          exists: false,
        }),
      }));
      
      // Act
      const response = await request(app)
        .get('/api/organizations/applications/non-existent-app')
        .set('Authorization', 'Bearer admin-token');
      
      // Assert
      expect(response.status).toBe(404);
    });

    test('should return 403 for unauthorized access', async () => {
      // Arrange
      mockFirestore.doc.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'app-1',
          data: () => ({
            orgName: 'Test Organization',
            contactEmail: 'org@example.com',
            website: 'https://testorg.com',
            submittedBy: 'other-user-id', // Different from requester
            status: 'pending',
            createdAt: new Date().toISOString(),
          }),
        }),
      }));
      
      // Act
      const response = await request(app)
        .get('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer valid-token'); // Non-admin, non-submitter
      
      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/organizations/applications/:applicationId', () => {
    test('should require authentication', async () => {
      // Act
      const response = await request(app)
        .put('/api/organizations/applications/app-1')
        .send({ status: 'approved' });
      
      // Assert
      expect(response.status).toBe(401);
    });

    test('should require admin access', async () => {
      // Act
      const response = await request(app)
        .put('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer valid-token') // Non-admin token
        .send({ status: 'approved' });
      
      // Assert
      expect(response.status).toBe(403);
    });

    test('should approve organization application', async () => {
      // Arrange
      mockFirestore.doc.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'app-1',
          data: () => ({
            orgName: 'Test Organization',
            contactEmail: 'org@example.com',
            website: 'https://testorg.com',
            submittedBy: 'test-user-id',
            status: 'pending',
            createdAt: new Date().toISOString(),
          }),
        }),
        update: jest.fn().mockResolvedValue({}),
      }));
      
      // Act
      const response = await request(app)
        .put('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer admin-token')
        .send({
          status: 'approved',
          notes: 'Application approved',
        });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(mockFirestore.update).toHaveBeenCalled();
      expect(mockFirestore.set).toHaveBeenCalled(); // Create organization user
    });

    test('should reject organization application', async () => {
      // Arrange
      mockFirestore.doc.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'app-1',
          data: () => ({
            orgName: 'Test Organization',
            contactEmail: 'org@example.com',
            website: 'https://testorg.com',
            submittedBy: 'test-user-id',
            status: 'pending',
            createdAt: new Date().toISOString(),
          }),
        }),
        update: jest.fn().mockResolvedValue({}),
      }));
      
      // Act
      const response = await request(app)
        .put('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer admin-token')
        .send({
          status: 'rejected',
          notes: 'Application rejected',
        });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(mockFirestore.update).toHaveBeenCalled();
    });

    test('should validate status value', async () => {
      // Act
      const response = await request(app)
        .put('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer admin-token')
        .send({
          status: 'invalid-status',
          notes: 'Invalid status',
        });
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid status');
    });

    test('should return 404 for non-existent application', async () => {
      // Arrange
      mockFirestore.doc.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          exists: false,
        }),
      }));
      
      // Act
      const response = await request(app)
        .put('/api/organizations/applications/non-existent-app')
        .set('Authorization', 'Bearer admin-token')
        .send({
          status: 'approved',
          notes: 'Application approved',
        });
      
      // Assert
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/organizations/verified', () => {
    test('should get verified organizations', async () => {
      // Arrange
      mockFirestore.where.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [
            {
              id: 'org-1',
              data: () => ({
                name: 'Verified Organization 1',
                userType: 'organization',
                isVerified: true,
                verificationStatus: 'verified',
                website: 'https://org1.com',
                industry: 'Education',
                documentTypes: ['identity', 'education'],
              }),
            },
            {
              id: 'org-2',
              data: () => ({
                name: 'Verified Organization 2',
                userType: 'organization',
                isVerified: true,
                verificationStatus: 'verified',
                website: 'https://org2.com',
                industry: 'Government',
                documentTypes: ['identity', 'certificate'],
              }),
            },
          ],
        }),
      }));
      
      // Act
      const response = await request(app).get('/api/organizations/verified');
      
      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('id', 'org-1');
      expect(response.body[0]).toHaveProperty('name', 'Verified Organization 1');
      expect(response.body[1]).toHaveProperty('id', 'org-2');
      expect(response.body[1]).toHaveProperty('name', 'Verified Organization 2');
    });

    test('should return empty array when no verified organizations', async () => {
      // Arrange
      mockFirestore.where.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          empty: true,
          docs: [],
        }),
      }));
      
      // Act
      const response = await request(app).get('/api/organizations/verified');
      
      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });
});
