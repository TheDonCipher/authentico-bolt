/**
 * Tests for secureDocumentRoutes
 */

const request = require('supertest');
const express = require('express');
const multer = require('multer');
const DocumentUploadService = require('../../services/DocumentUploadService');
const { verifyToken } = require('../../authMiddleware');
const { isValidDocumentType } = require('../../constants/documentTypes');
const { secureFileUpload } = require('../../middleware/fileUploadMiddleware');

// Mock dependencies
jest.mock('../../services/DocumentUploadService');
jest.mock('../../authMiddleware', () => ({
  verifyToken: jest.fn((req, res, next) => {
    req.user = {
      uid: 'user123',
      walletAddress: '0x1234567890123456789012345678901234567890',
    };
    next();
  }),
}));
jest.mock('../../constants/documentTypes', () => ({
  isValidDocumentType: jest.fn((type) => ['identity', 'financial', 'educational', 'medical', 'legal', 'property', 'other'].includes(type)),
}));
jest.mock('../../middleware/fileUploadMiddleware', () => ({
  secureFileUpload: jest.fn(() => (req, res, next) => {
    req.file = {
      buffer: Buffer.from('test content'),
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      sanitizedName: 'test.pdf',
      secureFileName: 'secure-test.pdf',
      hash: 'file-hash',
    };
    next();
  }),
}));
jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req, res, next) => next());
});

// Create express app with routes
const app = express();
app.use(express.json());
app.use('/api/secure/documents', require('../../routes/secureDocumentRoutes'));

describe('secureDocumentRoutes', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock DocumentUploadService.uploadDocument
    DocumentUploadService.uploadDocument.mockResolvedValue({
      documentId: 'doc123',
      status: 'Pending Verification',
      message: 'Document uploaded successfully and pending verification',
    });
  });

  describe('POST /upload', () => {
    test('should upload document successfully', async () => {
      const response = await request(app)
        .post('/api/secure/documents/upload')
        .field('documentName', 'Test Document')
        .field('documentType', 'identity')
        .field('verifyingOrgId', 'org123')
        .attach('document_file', Buffer.from('test content'), 'test.pdf');

      // Verify response
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        documentId: 'doc123',
        status: 'Pending Verification',
        message: 'Document uploaded successfully and pending verification',
      });

      // Verify service was called
      expect(DocumentUploadService.uploadDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          buffer: expect.any(Buffer),
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
        }),
        {
          documentName: 'Test Document',
          documentType: 'identity',
          verifyingOrgId: 'org123',
        },
        {
          uid: 'user123',
          walletAddress: '0x1234567890123456789012345678901234567890',
        }
      );
    });

    test('should validate document type', async () => {
      // Mock isValidDocumentType to return false
      isValidDocumentType.mockReturnValueOnce(false);

      const response = await request(app)
        .post('/api/secure/documents/upload')
        .field('documentName', 'Test Document')
        .field('documentType', 'invalid-type')
        .field('verifyingOrgId', 'org123')
        .attach('document_file', Buffer.from('test content'), 'test.pdf');

      // Verify response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'INVALID_DOCUMENT_TYPE',
        message: 'Invalid document type. Please select a valid document type.',
      });

      // Verify service was not called
      expect(DocumentUploadService.uploadDocument).not.toHaveBeenCalled();
    });

    test('should validate document name', async () => {
      const response = await request(app)
        .post('/api/secure/documents/upload')
        .field('documentName', '')
        .field('documentType', 'identity')
        .field('verifyingOrgId', 'org123')
        .attach('document_file', Buffer.from('test content'), 'test.pdf');

      // Verify response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'INVALID_DOCUMENT_NAME',
        message: 'Document name is required.',
      });

      // Verify service was not called
      expect(DocumentUploadService.uploadDocument).not.toHaveBeenCalled();
    });

    test('should validate verifying organization', async () => {
      const response = await request(app)
        .post('/api/secure/documents/upload')
        .field('documentName', 'Test Document')
        .field('documentType', 'identity')
        .field('verifyingOrgId', '')
        .attach('document_file', Buffer.from('test content'), 'test.pdf');

      // Verify response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'INVALID_ORGANIZATION',
        message: 'Verifying organization is required.',
      });

      // Verify service was not called
      expect(DocumentUploadService.uploadDocument).not.toHaveBeenCalled();
    });

    test('should handle service errors', async () => {
      // Mock service error
      DocumentUploadService.uploadDocument.mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .post('/api/secure/documents/upload')
        .field('documentName', 'Test Document')
        .field('documentType', 'identity')
        .field('verifyingOrgId', 'org123')
        .attach('document_file', Buffer.from('test content'), 'test.pdf');

      // Verify response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'SERVER_ERROR',
        message: 'An unexpected error occurred during document upload',
        details: 'Service error',
      });
    });

    test('should handle organization errors', async () => {
      // Mock organization error
      DocumentUploadService.uploadDocument.mockRejectedValue(
        new Error('Selected organization is not verified')
      );

      const response = await request(app)
        .post('/api/secure/documents/upload')
        .field('documentName', 'Test Document')
        .field('documentType', 'identity')
        .field('verifyingOrgId', 'org123')
        .attach('document_file', Buffer.from('test content'), 'test.pdf');

      // Verify response
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'ORGANIZATION_ERROR',
        message: 'Selected organization is not verified',
      });
    });

    test('should handle storage errors', async () => {
      // Mock IPFS error
      DocumentUploadService.uploadDocument.mockRejectedValue(
        new Error('Failed to upload to IPFS')
      );

      const response = await request(app)
        .post('/api/secure/documents/upload')
        .field('documentName', 'Test Document')
        .field('documentType', 'identity')
        .field('verifyingOrgId', 'org123')
        .attach('document_file', Buffer.from('test content'), 'test.pdf');

      // Verify response
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'SERVER_ERROR',
        message: 'An unexpected error occurred during document upload',
        details: 'Failed to upload to IPFS',
      });
    });
  });

  describe('GET /', () => {
    test('should get user documents', async () => {
      // Mock adminDb.collection().where().orderBy().get()
      const mockDocumentsSnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            id: 'doc123',
            data: () => ({
              documentName: 'Test Document',
              documentType: 'identity',
              status: 'Pending Verification',
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() },
            }),
          });
        }),
      };

      // Mock the Firestore query chain
      const mockWhere = jest.fn(() => ({ orderBy: mockOrderBy }));
      const mockOrderBy = jest.fn(() => ({ get: mockGet }));
      const mockGet = jest.fn(() => Promise.resolve(mockDocumentsSnapshot));
      const mockCollection = jest.fn(() => ({ where: mockWhere }));

      // Replace the adminDb import in the route file
      jest.mock('../../config', () => ({
        adminDb: {
          collection: mockCollection,
        },
      }));

      // Reload the route file to use the mocked adminDb
      jest.resetModules();
      const secureDocumentRoutes = require('../../routes/secureDocumentRoutes');
      const testApp = express();
      testApp.use(express.json());
      testApp.use('/api/secure/documents', secureDocumentRoutes);

      // Make the request
      const response = await request(testApp).get('/api/secure/documents');

      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('documents');
      expect(Array.isArray(response.body.documents)).toBe(true);
    });
  });
});
