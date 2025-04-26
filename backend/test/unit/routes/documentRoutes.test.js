/**
 * Unit tests for Authentico document routes
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
jest.mock('../../../services/EncryptionService', () => ({
  generateKey: jest.fn().mockResolvedValue(Buffer.from('mock-key')),
  encryptKey: jest.fn().mockResolvedValue(Buffer.from('mock-encrypted-key')),
  encryptFile: jest.fn().mockResolvedValue(Buffer.from('mock-encrypted-file')),
  decryptKey: jest.fn().mockResolvedValue(Buffer.from('mock-decrypted-key')),
  decryptFile: jest.fn().mockResolvedValue(Buffer.from('mock-decrypted-file')),
  hashDocument: jest.fn().mockResolvedValue('mock-document-hash'),
}));

jest.mock('../../../services/StorageService', () => ({
  uploadToIPFS: jest.fn().mockResolvedValue({ IpfsHash: 'mock-ipfs-hash' }),
  retrieveFromIPFS: jest.fn().mockResolvedValue(Buffer.from('mock-file-content')),
  unpinFromIPFS: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../../services/BlockchainService', () => ({
  registerDocument: jest.fn().mockResolvedValue({
    transactionHash: 'mock-transaction-hash',
    blockNumber: 12345,
    tokenId: 1,
  }),
  updateVerificationStatus: jest.fn().mockResolvedValue({
    transactionHash: 'mock-status-update-hash',
    blockNumber: 12346,
  }),
  getDocumentDetails: jest.fn().mockResolvedValue({
    urlPicture: 'mock-ipfs-hash',
    publicAddress: '0x1234567890123456789012345678901234567890',
    metadataHash: 'mock-metadata-hash',
    status: 'Verified',
  }),
}));

jest.mock('../../../services/NotificationService', () => ({
  sendInAppNotification: jest.fn().mockResolvedValue('mock-notification-id'),
  notifyDocumentStatusChange: jest.fn().mockResolvedValue('mock-notification-id'),
}));

// Mock Firestore
const mockFirestore = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  get: jest.fn(),
  set: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
  add: jest.fn().mockResolvedValue({ id: 'mock-doc-id' }),
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

// Mock multer
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      req.file = {
        originalname: 'test-document.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test-document-content'),
        size: 1024,
      };
      next();
    },
  });
  multer.memoryStorage = jest.fn();
  return multer;
});

// Import after mocking
const documentRoutes = require('../../../routes/documentRoutes');

describe('Document Routes', () => {
  let app;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up mock implementations
    mockFirestore.get.mockImplementation(() => {
      const path = mockFirestore.collection.mock.calls[0][0];
      
      if (path === 'documents') {
        return Promise.resolve({
          empty: false,
          docs: [
            {
              id: 'doc-1',
              data: () => ({
                ownerUid: 'test-user-id',
                documentName: 'Test Document',
                documentType: 'identity',
                status: 'Pending Verification',
                createdAt: new Date().toISOString(),
                encryptedIpfsCid: 'mock-ipfs-hash',
                encryptedDek: 'mock-encrypted-dek',
                verifyingOrgId: 'org-user-id',
                verifyingOrgName: 'Test Organization',
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
    app.use('/api/documents', documentRoutes);
  });

  describe('GET /api/documents/types', () => {
    test('should return document types', async () => {
      // Act
      const response = await request(app).get('/api/documents/types');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/documents/upload', () => {
    test('should require authentication', async () => {
      // Act
      const response = await request(app).post('/api/documents/upload');
      
      // Assert
      expect(response.status).toBe(401);
    });

    test('should upload document successfully', async () => {
      // Act
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', 'Bearer valid-token')
        .field('documentName', 'Test Document')
        .field('documentType', 'identity')
        .field('organizationId', 'org-user-id')
        .attach('file', Buffer.from('test-document-content'), 'test-document.pdf');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('documentId');
      expect(response.body).toHaveProperty('status', 'Pending Verification');
    });

    test('should validate required fields', async () => {
      // Act
      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', 'Bearer valid-token')
        .field('documentName', 'Test Document')
        // Missing documentType
        .field('organizationId', 'org-user-id')
        .attach('file', Buffer.from('test-document-content'), 'test-document.pdf');
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/documents', () => {
    test('should require authentication', async () => {
      // Act
      const response = await request(app).get('/api/documents');
      
      // Assert
      expect(response.status).toBe(401);
    });

    test('should get user documents', async () => {
      // Act
      const response = await request(app)
        .get('/api/documents')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('documentName');
    });
  });

  describe('GET /api/documents/:documentId', () => {
    test('should require authentication', async () => {
      // Act
      const response = await request(app).get('/api/documents/doc-1');
      
      // Assert
      expect(response.status).toBe(401);
    });

    test('should get document details', async () => {
      // Arrange
      mockFirestore.doc.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'doc-1',
          data: () => ({
            ownerUid: 'test-user-id',
            documentName: 'Test Document',
            documentType: 'identity',
            status: 'Pending Verification',
            createdAt: new Date().toISOString(),
            encryptedIpfsCid: 'mock-ipfs-hash',
            encryptedDek: 'mock-encrypted-dek',
            verifyingOrgId: 'org-user-id',
            verifyingOrgName: 'Test Organization',
          }),
        }),
      }));
      
      // Act
      const response = await request(app)
        .get('/api/documents/doc-1')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'doc-1');
      expect(response.body).toHaveProperty('documentName', 'Test Document');
    });

    test('should return 404 for non-existent document', async () => {
      // Arrange
      mockFirestore.doc.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          exists: false,
        }),
      }));
      
      // Act
      const response = await request(app)
        .get('/api/documents/non-existent-doc')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(404);
    });

    test('should return 403 for unauthorized access', async () => {
      // Arrange
      mockFirestore.doc.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'doc-1',
          data: () => ({
            ownerUid: 'other-user-id', // Different owner
            verifyingOrgId: 'other-org-id', // Different org
            documentName: 'Test Document',
            documentType: 'identity',
            status: 'Pending Verification',
          }),
        }),
      }));
      
      // Act
      const response = await request(app)
        .get('/api/documents/doc-1')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/documents/:documentId/verify', () => {
    test('should require authentication', async () => {
      // Act
      const response = await request(app)
        .put('/api/documents/doc-1/verify')
        .send({ status: 'Verified' });
      
      // Assert
      expect(response.status).toBe(401);
    });

    test('should verify document successfully', async () => {
      // Arrange
      mockFirestore.doc.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'doc-1',
          data: () => ({
            ownerUid: 'test-user-id',
            documentName: 'Test Document',
            documentType: 'identity',
            status: 'Pending Verification',
            verifyingOrgId: 'org-user-id',
            tokenId: 1,
            userWalletAddress: '0x1234567890123456789012345678901234567890',
            orgWalletAddress: '0x0987654321098765432109876543210987654321',
          }),
        }),
        update: jest.fn().mockResolvedValue({}),
      }));
      
      // Act
      const response = await request(app)
        .put('/api/documents/doc-1/verify')
        .set('Authorization', 'Bearer org-token')
        .send({ status: 'Verified' });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('transactionHash');
    });

    test('should validate verification status', async () => {
      // Act
      const response = await request(app)
        .put('/api/documents/doc-1/verify')
        .set('Authorization', 'Bearer org-token')
        .send({ status: 'InvalidStatus' });
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should return 403 if not the verifying organization', async () => {
      // Arrange
      mockFirestore.doc.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'doc-1',
          data: () => ({
            ownerUid: 'test-user-id',
            documentName: 'Test Document',
            documentType: 'identity',
            status: 'Pending Verification',
            verifyingOrgId: 'other-org-id', // Different org
          }),
        }),
      }));
      
      // Act
      const response = await request(app)
        .put('/api/documents/doc-1/verify')
        .set('Authorization', 'Bearer org-token')
        .send({ status: 'Verified' });
      
      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/documents/:documentId', () => {
    test('should require authentication', async () => {
      // Act
      const response = await request(app).delete('/api/documents/doc-1');
      
      // Assert
      expect(response.status).toBe(401);
    });

    test('should delete document successfully', async () => {
      // Arrange
      mockFirestore.doc.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'doc-1',
          data: () => ({
            ownerUid: 'test-user-id',
            documentName: 'Test Document',
            documentType: 'identity',
            status: 'Pending Verification',
            encryptedIpfsCid: 'mock-ipfs-hash',
          }),
        }),
        delete: jest.fn().mockResolvedValue({}),
      }));
      
      // Act
      const response = await request(app)
        .delete('/api/documents/doc-1')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('should return 404 for non-existent document', async () => {
      // Arrange
      mockFirestore.doc.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          exists: false,
        }),
      }));
      
      // Act
      const response = await request(app)
        .delete('/api/documents/non-existent-doc')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(404);
    });

    test('should return 403 if not the document owner', async () => {
      // Arrange
      mockFirestore.doc.mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'doc-1',
          data: () => ({
            ownerUid: 'other-user-id', // Different owner
            documentName: 'Test Document',
            documentType: 'identity',
            status: 'Pending Verification',
          }),
        }),
      }));
      
      // Act
      const response = await request(app)
        .delete('/api/documents/doc-1')
        .set('Authorization', 'Bearer valid-token');
      
      // Assert
      expect(response.status).toBe(403);
    });
  });
});
