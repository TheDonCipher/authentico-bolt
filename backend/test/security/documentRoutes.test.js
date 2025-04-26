/**
 * Security tests for Authentico document routes
 */
const express = require('express');
const request = require('supertest');
const {
  generateRandomDocument,
  generateDocumentHash,
} = require('../utils/securityTestUtils');

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

jest.mock('../../services/EncryptionService', () => ({
  generateKey: jest.fn().mockResolvedValue(Buffer.from('mock-encryption-key')),
  encryptKey: jest.fn().mockResolvedValue(Buffer.from('mock-encrypted-key')),
  decryptKey: jest.fn().mockResolvedValue(Buffer.from('mock-decrypted-key')),
  encryptFile: jest.fn().mockResolvedValue(Buffer.from('mock-encrypted-file')),
  decryptFile: jest.fn().mockResolvedValue(Buffer.from('mock-decrypted-file')),
}));

jest.mock('../../services/StorageService', () => ({
  uploadToIPFS: jest.fn().mockResolvedValue({
    IpfsHash: 'mock-ipfs-hash',
    PinSize: 1000,
    Timestamp: new Date().toISOString(),
  }),
  retrieveFromIPFS: jest
    .fn()
    .mockResolvedValue(Buffer.from('mock-file-content')),
  unpinFromIPFS: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../services/BlockchainService', () => ({
  initialize: jest.fn().mockResolvedValue({}),
  registerDocument: jest.fn().mockResolvedValue({
    transactionHash: '0xmock-transaction-hash',
    blockNumber: 12345,
    tokenId: 1,
  }),
  updateVerificationStatus: jest.fn().mockResolvedValue({
    transactionHash: '0xmock-status-update-hash',
    blockNumber: 12346,
  }),
  getDocumentDetails: jest.fn().mockResolvedValue({
    urlPicture: 'mock-ipfs-hash',
    publicAddress: '0x1234567890123456789012345678901234567890',
    metadataHash: 'mock-metadata-hash',
    status: 'Verified',
  }),
}));

jest.mock('../../config', () => ({
  admin: mockFirebaseAdmin,
  adminDb: mockFirestore,
  USER_COLLECTION: 'users',
}));

// Import after mocking
const documentRoutes = require('../../routes/documentRoutes');
const { verifyToken } = require('../../authMiddleware');
const EncryptionService = require('../../services/EncryptionService');
const StorageService = require('../../services/StorageService');
const BlockchainService = require('../../services/BlockchainService');

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

describe('Document Routes Security Tests', () => {
  let app;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/documents', documentRoutes);
  });

  test('should require authentication for document upload', async () => {
    // Act
    const response = await request(app)
      .post('/api/documents/upload')
      .field('documentName', 'Test Document')
      .field('documentType', 'identity')
      .field('organizationId', 'test-org-id')
      .attach(
        'file',
        Buffer.from('test-document-content'),
        'test-document.pdf'
      );

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  test('should validate document type during upload', async () => {
    // Act
    const response = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', 'Bearer valid-token')
      .field('documentName', 'Test Document')
      .field('documentType', 'invalid-type') // Invalid document type
      .field('organizationId', 'test-org-id')
      .attach(
        'file',
        Buffer.from('test-document-content'),
        'test-document.pdf'
      );

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Invalid document type');
  });

  test('should validate file size during upload', async () => {
    // Mock a large file
    jest.mock('multer', () => {
      const multer = () => ({
        single: () => (req, res, next) => {
          req.file = {
            originalname: 'large-document.pdf',
            mimetype: 'application/pdf',
            buffer: Buffer.alloc(11 * 1024 * 1024), // 11MB (over limit)
            size: 11 * 1024 * 1024,
          };
          next();
        },
      });
      multer.memoryStorage = jest.fn();
      return multer;
    });

    // Act
    const response = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', 'Bearer valid-token')
      .field('documentName', 'Large Document')
      .field('documentType', 'identity')
      .field('organizationId', 'test-org-id')
      .attach('file', Buffer.alloc(11 * 1024 * 1024), 'large-document.pdf');

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('File size exceeds limit');
  });

  test('should securely handle document download with proper authorization', async () => {
    // Act
    const response = await request(app)
      .get('/api/documents/download/test-doc-id')
      .set('Authorization', 'Bearer valid-token');

    // Assert
    expect(response.status).toBe(200);
    expect(StorageService.retrieveFromIPFS).toHaveBeenCalled();
    expect(EncryptionService.decryptKey).toHaveBeenCalled();
    expect(EncryptionService.decryptFile).toHaveBeenCalled();
  });

  test('should prevent unauthorized document access', async () => {
    // Mock document ownership check to fail
    mockFirestore
      .collection()
      .doc()
      .get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          uploadedBy: 'different-user-id', // Different user than the requester
          documentName: 'Test Document',
          documentType: 'identity',
          status: 'Verified',
        }),
      });

    // Act
    const response = await request(app)
      .get('/api/documents/download/test-doc-id')
      .set('Authorization', 'Bearer valid-token');

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Unauthorized');
  });

  test('should securely handle document verification status updates', async () => {
    // Act
    const response = await request(app)
      .put('/api/documents/test-doc-id/verify')
      .set('Authorization', 'Bearer org-token')
      .send({ status: 'Verified' });

    // Assert
    expect(response.status).toBe(200);
    expect(BlockchainService.updateVerificationStatus).toHaveBeenCalled();
  });

  test('should prevent non-organization users from verifying documents', async () => {
    // Act
    const response = await request(app)
      .put('/api/documents/test-doc-id/verify')
      .set('Authorization', 'Bearer valid-token') // Individual user, not org
      .send({ status: 'Verified' });

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Only verified organizations');
  });

  test('should validate verification status values', async () => {
    // Act
    const response = await request(app)
      .put('/api/documents/test-doc-id/verify')
      .set('Authorization', 'Bearer org-token')
      .send({ status: 'InvalidStatus' }); // Invalid status

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Invalid status');
  });

  test('should securely handle document deletion', async () => {
    // Act
    const response = await request(app)
      .delete('/api/documents/test-doc-id')
      .set('Authorization', 'Bearer valid-token');

    // Assert
    expect(response.status).toBe(200);
    expect(StorageService.unpinFromIPFS).toHaveBeenCalled();
  });

  test('should prevent unauthorized document deletion', async () => {
    // Mock document ownership check to fail
    mockFirestore
      .collection()
      .doc()
      .get.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          uploadedBy: 'different-user-id', // Different user than the requester
          documentName: 'Test Document',
          documentType: 'identity',
          status: 'Verified',
        }),
      });

    // Act
    const response = await request(app)
      .delete('/api/documents/test-doc-id')
      .set('Authorization', 'Bearer valid-token');

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('Unauthorized');
  });
});
