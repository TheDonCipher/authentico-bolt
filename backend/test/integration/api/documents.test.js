/**
 * Integration tests for Authentico document API
 */
const express = require('express');
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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
    add: jest.fn().mockResolvedValue({ id: 'mock-doc-id' }),
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
const app = require('../../../index');

describe('Document API Integration', () => {
  // Mock Firestore data
  const mockDocuments = [
    {
      id: 'doc-1',
      ownerUid: 'test-user-id',
      documentName: 'Test Document 1',
      documentType: 'identity',
      documentTypeName: 'Identity Document',
      status: 'Pending Verification',
      createdAt: new Date().toISOString(),
      encryptedIpfsCid: 'mock-ipfs-hash-1',
      encryptedDek: 'mock-encrypted-dek-1',
      verifyingOrgId: 'org-user-id',
      verifyingOrgName: 'Test Organization',
      tokenId: 1,
      transactionHash: 'mock-transaction-hash-1',
      blockNumber: 12345,
    },
    {
      id: 'doc-2',
      ownerUid: 'test-user-id',
      documentName: 'Test Document 2',
      documentType: 'education',
      documentTypeName: 'Education Certificate',
      status: 'Verified',
      createdAt: new Date().toISOString(),
      encryptedIpfsCid: 'mock-ipfs-hash-2',
      encryptedDek: 'mock-encrypted-dek-2',
      verifyingOrgId: 'org-user-id',
      verifyingOrgName: 'Test Organization',
      tokenId: 2,
      transactionHash: 'mock-transaction-hash-2',
      blockNumber: 12346,
    },
  ];

  const mockUsers = [
    {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      userType: 'individual',
      walletAddress: '0x1234567890123456789012345678901234567890',
    },
    {
      id: 'org-user-id',
      name: 'Test Organization',
      email: 'org@example.com',
      userType: 'organization',
      isVerified: true,
      walletAddress: '0x0987654321098765432109876543210987654321',
    },
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up mock Firestore data
    const { adminDb } = require('../../../config');
    
    adminDb.collection.mockImplementation((collectionName) => {
      if (collectionName === 'documents') {
        return {
          doc: jest.fn().mockImplementation((docId) => ({
            get: jest.fn().mockResolvedValue({
              exists: docId !== 'non-existent-doc',
              id: docId,
              data: () => mockDocuments.find(doc => doc.id === docId) || null,
            }),
            update: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
          })),
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({
            empty: false,
            docs: mockDocuments.map(doc => ({
              id: doc.id,
              data: () => doc,
            })),
          }),
          add: jest.fn().mockResolvedValue({ id: 'new-doc-id' }),
        };
      } else if (collectionName === 'users') {
        return {
          doc: jest.fn().mockImplementation((userId) => ({
            get: jest.fn().mockResolvedValue({
              exists: userId !== 'non-existent-user',
              id: userId,
              data: () => mockUsers.find(user => user.id === userId) || null,
            }),
            set: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
          })),
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({
            empty: false,
            docs: mockUsers.map(user => ({
              id: user.id,
              data: () => user,
            })),
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

  describe('Document Upload and Verification Workflow', () => {
    test('should upload, retrieve, and verify a document', async () => {
      // Step 1: Upload a document
      const uploadResponse = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', 'Bearer valid-token')
        .field('documentName', 'Integration Test Document')
        .field('documentType', 'identity')
        .field('organizationId', 'org-user-id')
        .attach('file', Buffer.from('test-document-content'), 'test-document.pdf');
      
      expect(uploadResponse.status).toBe(200);
      expect(uploadResponse.body).toHaveProperty('documentId');
      expect(uploadResponse.body).toHaveProperty('status', 'Pending Blockchain Submission');
      
      const documentId = uploadResponse.body.documentId;
      
      // Step 2: Get document details
      const getResponse = await request(app)
        .get(`/api/documents/${documentId}`)
        .set('Authorization', 'Bearer valid-token');
      
      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveProperty('id', documentId);
      expect(getResponse.body).toHaveProperty('documentName', 'Integration Test Document');
      
      // Step 3: Organization verifies the document
      const verifyResponse = await request(app)
        .put(`/api/documents/${documentId}/verify`)
        .set('Authorization', 'Bearer org-token')
        .send({ status: 'Verified' });
      
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body).toHaveProperty('success', true);
      expect(verifyResponse.body).toHaveProperty('transactionHash');
      
      // Step 4: Get updated document details
      const updatedGetResponse = await request(app)
        .get(`/api/documents/${documentId}`)
        .set('Authorization', 'Bearer valid-token');
      
      expect(updatedGetResponse.status).toBe(200);
      expect(updatedGetResponse.body).toHaveProperty('status', 'Verified');
      
      // Step 5: Download the document
      const downloadResponse = await request(app)
        .get(`/api/documents/${documentId}/download`)
        .set('Authorization', 'Bearer valid-token');
      
      expect(downloadResponse.status).toBe(200);
      expect(downloadResponse.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('Document Listing and Filtering', () => {
    test('should list user documents with filtering', async () => {
      // Get all documents
      const allDocsResponse = await request(app)
        .get('/api/documents')
        .set('Authorization', 'Bearer valid-token');
      
      expect(allDocsResponse.status).toBe(200);
      expect(Array.isArray(allDocsResponse.body)).toBe(true);
      expect(allDocsResponse.body.length).toBe(2);
      
      // Filter by status
      const verifiedDocsResponse = await request(app)
        .get('/api/documents?status=Verified')
        .set('Authorization', 'Bearer valid-token');
      
      expect(verifiedDocsResponse.status).toBe(200);
      expect(Array.isArray(verifiedDocsResponse.body)).toBe(true);
      expect(verifiedDocsResponse.body.length).toBe(1);
      expect(verifiedDocsResponse.body[0].status).toBe('Verified');
      
      // Filter by document type
      const identityDocsResponse = await request(app)
        .get('/api/documents?type=identity')
        .set('Authorization', 'Bearer valid-token');
      
      expect(identityDocsResponse.status).toBe(200);
      expect(Array.isArray(identityDocsResponse.body)).toBe(true);
      expect(identityDocsResponse.body.length).toBe(1);
      expect(identityDocsResponse.body[0].documentType).toBe('identity');
    });
  });

  describe('Document Sharing and Verification', () => {
    test('should get secure document details for verification', async () => {
      const response = await request(app)
        .get('/api/documents/doc-1/secure-details')
        .set('Authorization', 'Bearer valid-token');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('documentName');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('verifyingOrgName');
      expect(response.body).toHaveProperty('blockchainDetails');
    });
  });

  describe('Document Deletion', () => {
    test('should delete a document', async () => {
      const response = await request(app)
        .delete('/api/documents/doc-1')
        .set('Authorization', 'Bearer valid-token');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});
