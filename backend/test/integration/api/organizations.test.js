/**
 * Integration tests for Authentico organization API
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
  notifyAdminsNewApplication: jest.fn().mockResolvedValue(true),
}));

// Import after mocking
const app = require('../../../index');

describe('Organization API Integration', () => {
  // Mock Firestore data
  const mockApplications = [
    {
      id: 'app-1',
      orgName: 'Test Organization 1',
      contactEmail: 'org1@example.com',
      website: 'https://testorg1.com',
      description: 'A test organization',
      address: '123 Main St',
      phoneNumber: '555-1234',
      industry: 'Technology',
      registrationNumber: 'REG123456',
      foundedYear: '2020',
      documentTypes: ['identity', 'education'],
      submittedBy: 'test-user-id',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'app-2',
      orgName: 'Test Organization 2',
      contactEmail: 'org2@example.com',
      website: 'https://testorg2.com',
      description: 'Another test organization',
      address: '456 Oak St',
      phoneNumber: '555-5678',
      industry: 'Healthcare',
      registrationNumber: 'REG789012',
      foundedYear: '2018',
      documentTypes: ['identity', 'medical'],
      submittedBy: 'other-user-id',
      status: 'approved',
      createdAt: new Date().toISOString(),
    },
  ];

  const mockOrganizations = [
    {
      id: 'org-1',
      name: 'Verified Organization 1',
      email: 'org1@example.com',
      website: 'https://verifiedorg1.com',
      description: 'A verified organization',
      address: '789 Pine St',
      phoneNumber: '555-9012',
      industry: 'Education',
      registrationNumber: 'REG345678',
      foundedYear: '2019',
      documentTypes: ['identity', 'education'],
      userType: 'organization',
      isVerified: true,
      verificationStatus: 'verified',
      walletAddress: '0x0987654321098765432109876543210987654321',
    },
    {
      id: 'org-2',
      name: 'Verified Organization 2',
      email: 'org2@example.com',
      website: 'https://verifiedorg2.com',
      description: 'Another verified organization',
      address: '321 Elm St',
      phoneNumber: '555-3456',
      industry: 'Government',
      registrationNumber: 'REG901234',
      foundedYear: '2017',
      documentTypes: ['identity', 'certificate'],
      userType: 'organization',
      isVerified: true,
      verificationStatus: 'verified',
      walletAddress: '0x1111222233334444555566667777888899990000',
    },
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up mock Firestore data
    const { adminDb } = require('../../../config');
    
    adminDb.collection.mockImplementation((collectionName) => {
      if (collectionName === 'organizationApplications') {
        return {
          doc: jest.fn().mockImplementation((appId) => ({
            get: jest.fn().mockResolvedValue({
              exists: appId !== 'non-existent-app',
              id: appId,
              data: () => mockApplications.find(app => app.id === appId) || null,
            }),
            update: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
          })),
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({
            empty: false,
            docs: mockApplications.map(app => ({
              id: app.id,
              data: () => app,
            })),
          }),
          add: jest.fn().mockResolvedValue({ id: 'new-app-id' }),
        };
      } else if (collectionName === 'users') {
        return {
          doc: jest.fn().mockImplementation((userId) => ({
            get: jest.fn().mockResolvedValue({
              exists: userId !== 'non-existent-user',
              id: userId,
              data: () => mockOrganizations.find(org => org.id === userId) || null,
            }),
            set: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
          })),
          where: jest.fn().mockImplementation((field, operator, value) => {
            if (field === 'userType' && value === 'organization') {
              return {
                where: jest.fn().mockReturnThis(),
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: mockOrganizations.map(org => ({
                    id: org.id,
                    data: () => org,
                  })),
                }),
              };
            }
            return {
              where: jest.fn().mockReturnThis(),
              get: jest.fn().mockResolvedValue({
                empty: true,
                docs: [],
              }),
            };
          }),
        };
      }
      
      return {
        doc: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          empty: true,
          docs: [],
        }),
        add: jest.fn().mockResolvedValue({ id: 'mock-id' }),
      };
    });
  });

  describe('Organization Application Workflow', () => {
    test('should submit, review, and approve an organization application', async () => {
      // Step 1: Submit an organization application
      const submitResponse = await request(app)
        .post('/api/organizations/apply')
        .set('Authorization', 'Bearer valid-token')
        .send({
          orgName: 'New Test Organization',
          contactEmail: 'neworg@example.com',
          website: 'https://newtestorg.com',
          description: 'A new test organization',
          address: '789 New St',
          phoneNumber: '555-7890',
          industry: 'Finance',
          registrationNumber: 'REG567890',
          foundedYear: '2021',
          documentTypes: ['identity', 'financial'],
        });
      
      expect(submitResponse.status).toBe(201);
      expect(submitResponse.body).toHaveProperty('applicationId');
      expect(submitResponse.body).toHaveProperty('status', 'pending');
      
      const applicationId = submitResponse.body.applicationId;
      
      // Step 2: Admin reviews the application
      const getResponse = await request(app)
        .get(`/api/organizations/applications/${applicationId}`)
        .set('Authorization', 'Bearer admin-token');
      
      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveProperty('id', applicationId);
      expect(getResponse.body).toHaveProperty('orgName', 'New Test Organization');
      
      // Step 3: Admin approves the application
      const approveResponse = await request(app)
        .put(`/api/organizations/applications/${applicationId}`)
        .set('Authorization', 'Bearer admin-token')
        .send({
          status: 'approved',
          notes: 'Application approved',
        });
      
      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body).toHaveProperty('success', true);
      
      // Step 4: Verify the organization appears in the verified organizations list
      const verifiedResponse = await request(app)
        .get('/api/organizations/verified');
      
      expect(verifiedResponse.status).toBe(200);
      expect(Array.isArray(verifiedResponse.body)).toBe(true);
      // Note: In a real test, we would check for the new organization,
      // but our mock doesn't update the list dynamically
    });
  });

  describe('Organization Application Management', () => {
    test('should list all applications for admin', async () => {
      const response = await request(app)
        .get('/api/organizations/applications')
        .set('Authorization', 'Bearer admin-token');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('orgName');
      expect(response.body[0]).toHaveProperty('status');
    });

    test('should reject application', async () => {
      const response = await request(app)
        .put('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer admin-token')
        .send({
          status: 'rejected',
          notes: 'Application rejected',
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('should get own application details', async () => {
      const response = await request(app)
        .get('/api/organizations/applications/app-1')
        .set('Authorization', 'Bearer valid-token');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'app-1');
      expect(response.body).toHaveProperty('orgName', 'Test Organization 1');
    });
  });

  describe('Verified Organizations', () => {
    test('should list all verified organizations', async () => {
      const response = await request(app)
        .get('/api/organizations/verified');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('industry');
      expect(response.body[0]).toHaveProperty('documentTypes');
    });

    test('should filter verified organizations by document type', async () => {
      const response = await request(app)
        .get('/api/organizations/verified?documentType=education');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].documentTypes).toContain('education');
    });
  });
});
