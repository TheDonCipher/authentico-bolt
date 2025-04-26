/**
 * Unit tests for Authentico NotificationService
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
  get: jest.fn(),
  set: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
  add: jest.fn().mockResolvedValue({ id: 'mock-notification-id' }),
};

// Mock dependencies
jest.mock('../../../config', () => ({
  admin: mockFirebaseAdmin,
  adminDb: mockFirestore,
  USER_COLLECTION: 'users',
}));

// Import after mocking
const NotificationService = require('../../../services/NotificationService');

describe('NotificationService', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up mock implementations
    mockFirestore.get.mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'mock-user-id',
          data: () => ({
            email: 'test@example.com',
            name: 'Test User',
            userType: 'admin',
          }),
        },
      ],
    });
  });

  describe('sendInAppNotification', () => {
    test('should create in-app notification in Firestore', async () => {
      // Arrange
      const userId = 'test-user-id';
      const title = 'Test Notification';
      const message = 'This is a test notification';
      const data = { documentId: 'test-doc-id' };

      // Mock the document reference
      const mockDocRef = {
        id: 'mock-notification-id',
        set: jest.fn().mockResolvedValue({}),
      };
      mockFirestore.doc.mockReturnValueOnce(mockDocRef);

      // Act
      const result = await NotificationService.sendInAppNotification(
        userId,
        title,
        message,
        data
      );

      // Assert
      expect(mockFirestore.collection).toHaveBeenCalledWith('notifications');
      expect(mockDocRef.set).toHaveBeenCalledWith({
        userId,
        title,
        message,
        data,
        read: false,
        createdAt: 'mock-timestamp',
      });
      expect(result).toBe('mock-notification-id');
    });

    test('should handle errors when creating notification', async () => {
      // Arrange
      const mockDocRef = {
        id: 'mock-notification-id',
        set: jest.fn().mockRejectedValue(new Error('Firestore error')),
      };
      mockFirestore.doc.mockReturnValueOnce(mockDocRef);

      // Act & Assert
      await expect(
        NotificationService.sendInAppNotification(
          'test-user-id',
          'Test Notification',
          'This is a test notification'
        )
      ).rejects.toThrow();
    });
  });

  describe('notifyDocumentStatusChange', () => {
    test('should send notification for document status change', async () => {
      // Arrange
      const userId = 'test-user-id';
      const email = 'test@example.com';
      const documentId = 'test-doc-id';
      const documentName = 'Test Document';
      const newStatus = 'Verified';

      // Act
      const result = await NotificationService.notifyDocumentStatusChange(
        userId,
        email,
        documentId,
        documentName,
        newStatus
      );

      // Assert
      expect(mockFirestore.set).toHaveBeenCalled();
      expect(result).toHaveProperty('notificationId');
      expect(result).toHaveProperty('emailSent', true);
    });
  });

  describe('notifyAdminsNewApplication', () => {
    test('should notify admins about new organization application', async () => {
      // Arrange
      const orgName = 'Test Organization';
      const applicationId = 'test-application-id';

      // Mock the document reference for sendInAppNotification
      const mockDocRef = {
        id: 'mock-notification-id',
        set: jest.fn().mockResolvedValue({}),
      };
      mockFirestore.doc.mockReturnValue(mockDocRef);

      // Act
      const result = await NotificationService.notifyAdminsNewApplication(
        orgName,
        applicationId
      );

      // Assert
      expect(mockFirestore.collection).toHaveBeenCalledWith('users');
      expect(mockFirestore.where).toHaveBeenCalledWith(
        'userType',
        '==',
        'admin'
      );
      expect(mockDocRef.set).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should handle case when no admins are found', async () => {
      // Arrange
      mockFirestore.get.mockResolvedValueOnce({
        empty: true,
        docs: [],
      });

      // Act
      const result = await NotificationService.notifyAdminsNewApplication(
        'Test Organization',
        'test-application-id'
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('sendEmailNotification', () => {
    test('should simulate sending email notification', async () => {
      // Arrange
      const email = 'test@example.com';
      const subject = 'Test Subject';
      const text = 'Test email body';
      const html = '<p>Test email body</p>';

      // Act
      const result = await NotificationService.sendEmailNotification(
        email,
        subject,
        text,
        html
      );

      // Assert
      expect(result).toBe(true);
    });
  });
});
