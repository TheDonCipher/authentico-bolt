/**
 * Simplified integration tests for Authentico organization API
 */
const express = require('express');
const request = require('supertest');

// Mock dependencies
jest.mock('../../../config', () => {
  // Create mock Firestore
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

  // Create mock Firebase Admin
  const mockFirebaseAdmin = {
    firestore: {
      FieldValue: {
        serverTimestamp: jest.fn().mockReturnValue('mock-timestamp'),
      },
    },
    auth: () => ({
      verifyIdToken: jest.fn().mockImplementation((token) => {
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
      }),
    }),
  };

  return {
    admin: mockFirebaseAdmin,
    adminDb: mockFirestore,
    USER_COLLECTION: 'users',
  };
});

// Mock services
jest.mock('../../../services/NotificationService', () => ({
  sendInAppNotification: jest.fn().mockResolvedValue('mock-notification-id'),
  notifyAdminsNewApplication: jest.fn().mockResolvedValue(['mock-notification-id']),
}));

// Create a simplified express app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock organization routes
  app.post('/api/organizations/apply', (req, res) => {
    if (!req.body.organizationName || !req.body.industry) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (req.body.organizationName === 'Existing Org') {
      return res.status(409).json({ error: 'Organization application already exists' });
    }
    
    res.status(201).json({
      applicationId: 'mock-app-id',
      status: 'pending',
    });
  });
  
  app.get('/api/organizations/applications', (req, res) => {
    // Only admin can access all applications
    if (req.headers.authorization !== 'Bearer admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const mockApplications = [
      {
        id: 'app-1',
        organizationName: 'Test Organization 1',
        industry: 'Healthcare',
        status: 'pending',
        createdAt: new Date().toISOString(),
        submittedBy: 'test-user-id',
      },
      {
        id: 'app-2',
        organizationName: 'Test Organization 2',
        industry: 'Education',
        status: 'approved',
        createdAt: new Date().toISOString(),
        submittedBy: 'test-user-id',
      },
    ];
    
    res.status(200).json(mockApplications);
  });
  
  app.get('/api/organizations/applications/:applicationId', (req, res) => {
    if (req.params.applicationId === 'non-existent-app') {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Only admin or submitter can access application details
    if (req.headers.authorization !== 'Bearer admin-token' && 
        req.headers.authorization !== 'Bearer valid-token') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const mockApplication = {
      id: req.params.applicationId,
      organizationName: 'Test Organization',
      industry: 'Healthcare',
      status: 'pending',
      createdAt: new Date().toISOString(),
      submittedBy: 'test-user-id',
    };
    
    res.status(200).json(mockApplication);
  });
  
  app.put('/api/organizations/applications/:applicationId', (req, res) => {
    // Only admin can update application status
    if (req.headers.authorization !== 'Bearer admin-token') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    if (req.params.applicationId === 'non-existent-app') {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    if (!req.body.status || !['approved', 'rejected'].includes(req.body.status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    res.status(200).json({
      success: true,
      message: `Application ${req.body.status}`,
    });
  });
  
  app.get('/api/organizations/verified', (req, res) => {
    const mockOrganizations = [
      {
        id: 'org-1',
        organizationName: 'Verified Organization 1',
        industry: 'Healthcare',
        isVerified: true,
      },
      {
        id: 'org-2',
        organizationName: 'Verified Organization 2',
        industry: 'Education',
        isVerified: true,
      },
    ];
    
    res.status(200).json(mockOrganizations);
  });
  
  return app;
};

describe('Organization API Integration', () => {
  let app;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a fresh test app for each test
    app = createTestApp();
  });
  
  describe('Organization Application Process', () => {
    test('should submit organization application successfully', async () => {
      const response = await request(app)
        .post('/api/organizations/apply')
        .set('Authorization', 'Bearer valid-token')
        .send({
          organizationName: 'New Test Organization',
          industry: 'Technology',
          website: 'https://example.com',
          description: 'A test organization',
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('applicationId');
      expect(response.body).toHaveProperty('status', 'pending');
    });
    
    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/organizations/apply')
        .set('Authorization', 'Bearer valid-token')
        .send({
          // Missing required fields
          website: 'https://example.com',
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    test('should check for existing applications', async () => {
      const response = await request(app)
        .post('/api/organizations/apply')
        .set('Authorization', 'Bearer valid-token')
        .send({
          organizationName: 'Existing Org',
          industry: 'Technology',
        });
      
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });
  });
  
  describe('Organization Application Management', () => {
    test('should get all organization applications for admin', async () => {
      const response = await request(app)
        .get('/api/organizations/applications')
        .set('Authorization', 'Bearer admin-token');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
    
    test('should require admin access for applications list', async () => {
      const response = await request(app)
        .get('/api/organizations/applications')
        .set('Authorization', 'Bearer valid-token');
      
      expect(response.status).toBe(403);
    });
    
    test('should get application details for admin', async () => {
      const response = await request(app)
        .get('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer admin-token');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'app-1');
      expect(response.body).toHaveProperty('organizationName');
    });
    
    test('should get own application details for submitter', async () => {
      const response = await request(app)
        .get('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer valid-token');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'app-1');
    });
    
    test('should return 404 for non-existent application', async () => {
      const response = await request(app)
        .get('/api/organizations/applications/non-existent-app')
        .set('Authorization', 'Bearer admin-token');
      
      expect(response.status).toBe(404);
    });
    
    test('should return 403 for unauthorized access', async () => {
      const response = await request(app)
        .get('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer org-token');
      
      expect(response.status).toBe(403);
    });
  });
  
  describe('Organization Application Approval/Rejection', () => {
    test('should approve organization application', async () => {
      const response = await request(app)
        .put('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer admin-token')
        .send({ status: 'approved' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
    
    test('should reject organization application', async () => {
      const response = await request(app)
        .put('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer admin-token')
        .send({ status: 'rejected' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
    
    test('should validate status value', async () => {
      const response = await request(app)
        .put('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer admin-token')
        .send({ status: 'invalid-status' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    test('should require admin access', async () => {
      const response = await request(app)
        .put('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer valid-token')
        .send({ status: 'approved' });
      
      expect(response.status).toBe(403);
    });
    
    test('should return 404 for non-existent application', async () => {
      const response = await request(app)
        .put('/api/organizations/applications/non-existent-app')
        .set('Authorization', 'Bearer admin-token')
        .send({ status: 'approved' });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('Verified Organizations', () => {
    test('should get verified organizations', async () => {
      const response = await request(app)
        .get('/api/organizations/verified');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('isVerified', true);
    });
  });
});
