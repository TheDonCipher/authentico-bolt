/**
 * Tests for DocumentUploadService
 */

const DocumentUploadService = require('../../services/DocumentUploadService');
const EncryptionService = require('../../services/EncryptionService');
const StorageService = require('../../services/StorageService');
const { admin, adminDb } = require('../../config');
const fileUploadSecurity = require('../../utils/fileUploadSecurity');

// Mock dependencies
jest.mock('../../services/EncryptionService');
jest.mock('../../services/StorageService');
jest.mock('../../config', () => ({
  admin: {
    firestore: {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'server-timestamp'),
      },
    },
  },
  adminDb: {
    collection: jest.fn(() => ({
      add: jest.fn(() => ({ id: 'doc123' })),
      doc: jest.fn(() => ({
        get: jest.fn(() => ({
          exists: true,
          data: jest.fn(() => mockUserData),
        })),
      })),
    })),
  },
}));
jest.mock('../../utils/fileUploadSecurity', () => ({
  generateSecureFileName: jest.fn(() => 'secure-file-name.pdf'),
}));

// Mock environment variables
process.env.MASTER_KEY_SECRET = '12345678901234567890123456789012'; // 32 characters for AES-256

// Mock user data
const mockUserData = {
  name: 'Test User',
  walletAddress: '0x1234567890123456789012345678901234567890',
};

// Mock organization data
const mockOrgData = {
  name: 'Test Organization',
  walletAddress: '0x0987654321098765432109876543210987654321',
  isVerified: true,
};

describe('DocumentUploadService', () => {
  // Mock file
  const mockFile = {
    buffer: Buffer.from('test content'),
    originalname: 'test.pdf',
    mimetype: 'application/pdf',
    size: 1024,
  };

  // Mock metadata
  const mockMetadata = {
    documentName: 'Test Document',
    documentType: 'identity',
    verifyingOrgId: 'org123',
  };

  // Mock user
  const mockUser = {
    uid: 'user123',
    walletAddress: '0x1234567890123456789012345678901234567890',
  };

  // Mock encryption and storage services
  const mockDek = Buffer.from('mock-dek');
  const mockEncryptedDek = Buffer.from('mock-encrypted-dek');
  const mockEncryptedFile = Buffer.from('mock-encrypted-file');
  const mockIpfsResponse = {
    IpfsHash: 'mock-ipfs-hash',
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock EncryptionService methods
    EncryptionService.prototype.generateKey.mockResolvedValue(mockDek);
    EncryptionService.prototype.encryptKey.mockResolvedValue(mockEncryptedDek);
    EncryptionService.prototype.encryptFile.mockResolvedValue(mockEncryptedFile);

    // Mock StorageService methods
    StorageService.prototype.uploadToIPFS.mockResolvedValue(mockIpfsResponse);

    // Mock Firestore collections
    adminDb.collection.mockImplementation((collectionName) => {
      if (collectionName === 'users') {
        return {
          doc: jest.fn((docId) => {
            return {
              get: jest.fn(() => {
                return {
                  exists: true,
                  data: jest.fn(() => {
                    if (docId === 'user123') {
                      return mockUserData;
                    } else if (docId === 'org123') {
                      return mockOrgData;
                    }
                    return {};
                  }),
                };
              }),
            };
          }),
        };
      } else if (collectionName === 'documents') {
        return {
          add: jest.fn(() => ({ id: 'doc123' })),
        };
      } else if (collectionName === 'notifications') {
        return {
          add: jest.fn(() => ({ id: 'notification123' })),
        };
      }
      return {
        add: jest.fn(),
        doc: jest.fn(),
      };
    });
  });

  test('should upload document successfully', async () => {
    // Call the service
    const result = await DocumentUploadService.uploadDocument(
      mockFile,
      mockMetadata,
      mockUser
    );

    // Verify encryption service was called
    expect(EncryptionService.prototype.generateKey).toHaveBeenCalled();
    expect(EncryptionService.prototype.encryptKey).toHaveBeenCalledWith(
      mockDek,
      expect.any(Buffer)
    );
    expect(EncryptionService.prototype.encryptFile).toHaveBeenCalledWith(
      mockFile.buffer,
      mockDek
    );

    // Verify storage service was called
    expect(StorageService.prototype.uploadToIPFS).toHaveBeenCalledWith(
      mockEncryptedFile,
      expect.stringContaining('secure-file-name.pdf'),
      { documentType: 'identity' }
    );

    // Verify document was added to Firestore
    expect(adminDb.collection).toHaveBeenCalledWith('documents');
    expect(adminDb.collection('documents').add).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUid: 'user123',
        ownerName: 'Test User',
        verifyingOrgId: 'org123',
        verifyingOrgName: 'Test Organization',
        documentName: 'Test Document',
        documentType: 'identity',
        documentTypeName: 'Identity Document',
        originalDocHash: expect.any(String),
        encryptedIpfsCid: 'mock-ipfs-hash',
        encryptedDek: expect.any(String),
        status: 'Pending Verification',
        createdAt: 'server-timestamp',
        updatedAt: 'server-timestamp',
        userWalletAddress: '0x1234567890123456789012345678901234567890',
        orgWalletAddress: '0x0987654321098765432109876543210987654321',
        fileSize: 1024,
        mimeType: 'application/pdf',
        securityChecks: expect.objectContaining({
          malwareScan: 'passed',
          integrityVerified: true,
          encryptionStatus: 'encrypted',
        }),
      })
    );

    // Verify notification was created
    expect(adminDb.collection).toHaveBeenCalledWith('notifications');
    expect(adminDb.collection('notifications').add).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'org123',
        senderId: 'user123',
        senderName: 'Test User',
        type: 'verification_request',
        documentId: 'doc123',
        documentName: 'Test Document',
        message: 'New document "Test Document" requires verification',
        read: false,
        createdAt: 'server-timestamp',
      })
    );

    // Verify result
    expect(result).toEqual({
      documentId: 'doc123',
      status: 'Pending Verification',
      message: 'Document uploaded successfully and pending verification',
    });
  });

  test('should validate inputs', async () => {
    // Test with invalid file
    await expect(
      DocumentUploadService.uploadDocument(null, mockMetadata, mockUser)
    ).rejects.toThrow('Invalid file object');

    // Test with invalid metadata
    await expect(
      DocumentUploadService.uploadDocument(mockFile, {}, mockUser)
    ).rejects.toThrow('Invalid document metadata');

    // Test with invalid user
    await expect(
      DocumentUploadService.uploadDocument(mockFile, mockMetadata, {})
    ).rejects.toThrow('Invalid user information');
  });

  test('should validate organization', async () => {
    // Mock organization not found
    adminDb.collection.mockImplementation((collectionName) => {
      if (collectionName === 'users') {
        return {
          doc: jest.fn((docId) => {
            return {
              get: jest.fn(() => {
                return {
                  exists: false,
                  data: jest.fn(() => null),
                };
              }),
            };
          }),
        };
      }
      return {
        add: jest.fn(),
        doc: jest.fn(),
      };
    });

    // Test with non-existent organization
    await expect(
      DocumentUploadService.uploadDocument(mockFile, mockMetadata, mockUser)
    ).rejects.toThrow('Verifying organization with ID org123 not found');
  });

  test('should validate organization verification status', async () => {
    // Mock unverified organization
    adminDb.collection.mockImplementation((collectionName) => {
      if (collectionName === 'users') {
        return {
          doc: jest.fn((docId) => {
            return {
              get: jest.fn(() => {
                return {
                  exists: true,
                  data: jest.fn(() => ({
                    ...mockOrgData,
                    isVerified: false,
                  })),
                };
              }),
            };
          }),
        };
      }
      return {
        add: jest.fn(),
        doc: jest.fn(),
      };
    });

    // Test with unverified organization
    await expect(
      DocumentUploadService.uploadDocument(mockFile, mockMetadata, mockUser)
    ).rejects.toThrow('Selected organization is not verified');
  });

  test('should handle encryption errors', async () => {
    // Mock encryption error
    EncryptionService.prototype.encryptFile.mockRejectedValue(
      new Error('Encryption failed')
    );

    // Test with encryption error
    await expect(
      DocumentUploadService.uploadDocument(mockFile, mockMetadata, mockUser)
    ).rejects.toThrow('Encryption failed');
  });

  test('should handle storage errors', async () => {
    // Mock storage error
    StorageService.prototype.uploadToIPFS.mockRejectedValue(
      new Error('IPFS upload failed')
    );

    // Test with storage error
    await expect(
      DocumentUploadService.uploadDocument(mockFile, mockMetadata, mockUser)
    ).rejects.toThrow('IPFS upload failed');
  });
});
