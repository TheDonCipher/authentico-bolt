/**
 * Simplified tests for Authentico VerificationRequestService
 */

// Create mock Firebase Admin and Firestore
const mockFirebaseAdmin = {
  firestore: {
    FieldValue: {
      serverTimestamp: jest.fn().mockReturnValue('mock-timestamp'),
    },
  },
};

const mockFirestore = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  get: jest.fn(),
  set: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
};

// Create a chainable mock for Firestore queries
const createChainableMock = () => {
  const mock = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
  };
  return mock;
};

// Mock NotificationService
const mockNotificationService = {
  sendInAppNotification: jest.fn().mockResolvedValue('mock-notification-id'),
  sendEmailNotification: jest.fn().mockResolvedValue(true),
};

// Mock dependencies
jest.mock('../../../config', () => ({
  admin: mockFirebaseAdmin,
  adminDb: mockFirestore,
}));

jest.mock(
  '../../../services/NotificationService',
  () => mockNotificationService
);

// Import after mocking
const VerificationRequestService = require('../../../services/VerificationRequestService');

describe('VerificationRequestService Simplified', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock behavior
    mockFirestore.doc.mockReturnValue({
      id: 'mock-verification-request-id',
      set: jest.fn().mockResolvedValue({}),
    });

    mockFirestore.get.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'mock-verification-request-id',
          data: () => ({
            documentId: 'test-doc-id',
            documentName: 'Test Document',
            ownerId: 'test-user-id',
            verifyingOrgName: 'Test Organization',
          }),
          ref: {
            update: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    });
  });

  describe('createVerificationRequest', () => {
    test('should create a verification request in Firestore', async () => {
      // Arrange
      const documentId = 'test-doc-id';
      const documentData = {
        documentName: 'Test Document',
        documentType: 'certificate',
        documentTypeName: 'Certificate',
        ownerUid: 'test-user-id',
        ownerName: 'Test User',
        verifyingOrgId: 'test-org-id',
        verifyingOrgName: 'Test Organization',
        originalDocHash: 'test-hash',
        tokenId: '123',
        transactionHash: 'test-tx-hash',
      };

      // Act
      const result = await VerificationRequestService.createVerificationRequest(
        documentId,
        documentData
      );

      // Assert
      expect(mockFirestore.collection).toHaveBeenCalledWith(
        'verificationRequests'
      );
      expect(mockFirestore.doc).toHaveBeenCalled();
      expect(result).toBe('mock-verification-request-id');
    });

    test('should handle errors when creating verification request', async () => {
      // Arrange
      const documentId = 'test-doc-id';
      const documentData = {
        documentName: 'Test Document',
      };

      // Mock Firestore to throw an error
      const mockDocRef = {
        id: 'mock-verification-request-id',
        set: jest.fn().mockRejectedValue(new Error('Firestore error')),
      };
      mockFirestore.doc.mockReturnValueOnce(mockDocRef);

      // Act & Assert
      await expect(
        VerificationRequestService.createVerificationRequest(
          documentId,
          documentData
        )
      ).rejects.toThrow('Firestore error');
    });
  });

  describe('updateVerificationRequestStatus', () => {
    test('should update verification request status to verified', async () => {
      // Arrange
      const documentId = 'test-doc-id';
      const status = 'verified';

      // Create chainable mock for Firestore
      const chainableMock = createChainableMock();
      chainableMock.get.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'mock-verification-request-id',
            data: () => ({
              documentId: 'test-doc-id',
              documentName: 'Test Document',
              ownerId: 'test-user-id',
              verifyingOrgName: 'Test Organization',
            }),
            ref: {
              update: jest.fn().mockResolvedValue({}),
            },
          },
        ],
      });

      // Mock collection to return our chainable mock
      mockFirestore.collection.mockImplementation((collectionName) => {
        if (collectionName === 'users') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                  email: 'test@example.com',
                }),
              }),
            }),
          };
        }
        if (collectionName === 'verificationRequests') {
          return chainableMock;
        }
        return mockFirestore;
      });

      // Act
      const result =
        await VerificationRequestService.updateVerificationRequestStatus(
          documentId,
          status
        );

      // Assert
      expect(chainableMock.where).toHaveBeenCalledWith(
        'documentId',
        '==',
        documentId
      );
      expect(chainableMock.limit).toHaveBeenCalledWith(1);
      expect(chainableMock.get).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should update verification request status to rejected with reason', async () => {
      // Arrange
      const documentId = 'test-doc-id';
      const status = 'rejected';
      const rejectionReason = 'Document is invalid';

      // Create chainable mock for Firestore
      const chainableMock = createChainableMock();
      chainableMock.get.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'mock-verification-request-id',
            data: () => ({
              documentId: 'test-doc-id',
              documentName: 'Test Document',
              ownerId: 'test-user-id',
              verifyingOrgName: 'Test Organization',
            }),
            ref: {
              update: jest.fn().mockResolvedValue({}),
            },
          },
        ],
      });

      // Mock collection to return our chainable mock
      mockFirestore.collection.mockImplementation((collectionName) => {
        if (collectionName === 'users') {
          return {
            doc: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => ({
                  email: 'test@example.com',
                }),
              }),
            }),
          };
        }
        if (collectionName === 'verificationRequests') {
          return chainableMock;
        }
        return mockFirestore;
      });

      // Act
      const result =
        await VerificationRequestService.updateVerificationRequestStatus(
          documentId,
          status,
          rejectionReason
        );

      // Assert
      expect(chainableMock.where).toHaveBeenCalledWith(
        'documentId',
        '==',
        documentId
      );
      expect(chainableMock.limit).toHaveBeenCalledWith(1);
      expect(chainableMock.get).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should return false when no verification request is found', async () => {
      // Arrange
      const documentId = 'non-existent-doc-id';
      const status = 'verified';

      // Create chainable mock for Firestore
      const chainableMock = createChainableMock();
      chainableMock.get.mockResolvedValue({
        empty: true,
        docs: [],
      });

      // Mock collection to return our chainable mock
      mockFirestore.collection.mockImplementation((collectionName) => {
        if (collectionName === 'verificationRequests') {
          return chainableMock;
        }
        return mockFirestore;
      });

      // Act
      const result =
        await VerificationRequestService.updateVerificationRequestStatus(
          documentId,
          status
        );

      // Assert
      expect(chainableMock.where).toHaveBeenCalledWith(
        'documentId',
        '==',
        documentId
      );
      expect(chainableMock.limit).toHaveBeenCalledWith(1);
      expect(chainableMock.get).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    test('should handle errors when updating verification request status', async () => {
      // Arrange
      const documentId = 'test-doc-id';
      const status = 'verified';

      // Create chainable mock for Firestore
      const chainableMock = createChainableMock();
      chainableMock.get.mockRejectedValue(new Error('Firestore error'));

      // Mock collection to return our chainable mock
      mockFirestore.collection.mockImplementation((collectionName) => {
        if (collectionName === 'verificationRequests') {
          return chainableMock;
        }
        return mockFirestore;
      });

      // Act & Assert
      await expect(
        VerificationRequestService.updateVerificationRequestStatus(
          documentId,
          status
        )
      ).rejects.toThrow('Firestore error');
    });
  });
});
