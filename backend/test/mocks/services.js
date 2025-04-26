/**
 * Mock services for Authentico backend security testing
 */

// Mock Firebase Admin
const mockFirebaseAdmin = {
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
      } else if (token === 'expired-token') {
        throw new Error('Firebase ID token has expired');
      } else {
        throw new Error('Invalid token');
      }
    }),
    createCustomToken: jest.fn().mockResolvedValue('mock-custom-token'),
    createUser: jest.fn().mockResolvedValue({ uid: 'new-test-user-id' }),
  }),
  firestore: {
    FieldValue: {
      serverTimestamp: jest.fn().mockReturnValue('mock-timestamp'),
    },
  },
};

// Mock Firestore
const mockFirestore = {
  collection: jest.fn().mockImplementation((collectionName) => ({
    doc: jest.fn().mockImplementation((docId) => ({
      get: jest.fn().mockResolvedValue({
        exists: docId !== 'non-existent-doc',
        id: docId,
        data: jest.fn().mockReturnValue({
          uid: docId,
          walletAddress: '0x1234567890123456789012345678901234567890',
          userType: 'individual',
          name: 'Test User',
          documentName: 'Test Document',
          documentType: 'identity',
          status: 'Pending Verification',
          encryptedDek: 'mock-encrypted-dek',
          ipfsCid: 'mock-ipfs-cid',
          documentHash: 'mock-document-hash',
          createdAt: new Date().toISOString(),
        }),
      }),
      set: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    })),
    where: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'test-doc-id',
            data: jest.fn().mockReturnValue({
              uid: 'test-user-id',
              walletAddress: '0x1234567890123456789012345678901234567890',
              userType: 'individual',
              name: 'Test User',
            }),
          },
        ],
      }),
      where: jest.fn().mockReturnThis(),
    })),
    add: jest.fn().mockResolvedValue({ id: 'new-doc-id' }),
  })),
};

// Mock EncryptionService
const mockEncryptionService = {
  generateKey: jest.fn().mockResolvedValue(Buffer.from('mock-encryption-key')),
  encryptKey: jest.fn().mockResolvedValue(Buffer.from('mock-encrypted-key')),
  decryptKey: jest.fn().mockResolvedValue(Buffer.from('mock-decrypted-key')),
  encryptFile: jest.fn().mockResolvedValue(Buffer.from('mock-encrypted-file')),
  decryptFile: jest.fn().mockResolvedValue(Buffer.from('mock-decrypted-file')),
};

// Mock StorageService
const mockStorageService = {
  uploadToIPFS: jest.fn().mockResolvedValue({
    IpfsHash: 'mock-ipfs-hash',
    PinSize: 1000,
    Timestamp: new Date().toISOString(),
  }),
  retrieveFromIPFS: jest.fn().mockResolvedValue(Buffer.from('mock-file-content')),
  unpinFromIPFS: jest.fn().mockResolvedValue({ success: true }),
};

// Mock BlockchainService
const mockBlockchainService = {
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
};

// Mock NotificationService
const mockNotificationService = {
  createNotification: jest.fn().mockResolvedValue({ id: 'mock-notification-id' }),
  getNotificationsForUser: jest.fn().mockResolvedValue([
    {
      id: 'mock-notification-id',
      userId: 'test-user-id',
      message: 'Test notification',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ]),
  markAsRead: jest.fn().mockResolvedValue({}),
};

module.exports = {
  mockFirebaseAdmin,
  mockFirestore,
  mockEncryptionService,
  mockStorageService,
  mockBlockchainService,
  mockNotificationService,
};
