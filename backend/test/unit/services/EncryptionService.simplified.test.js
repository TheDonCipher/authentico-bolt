/**
 * Simplified tests for Authentico EncryptionService
 */
const EncryptionService = require('../../../services/EncryptionService');
const crypto = require('crypto');

describe('EncryptionService Simplified', () => {
  // Test data
  let testDocument;
  let masterKey;
  let dataEncryptionKey;

  beforeEach(async () => {
    // Generate fresh test data for each test
    testDocument = Buffer.from('This is a test document for encryption');
    masterKey = Buffer.from('0123456789abcdef0123456789abcdef'); // 32 bytes for AES-256
    dataEncryptionKey = await EncryptionService.generateKey();
  });

  describe('generateKey', () => {
    test('should generate a key of correct length', async () => {
      // Act
      const key = await EncryptionService.generateKey();

      // Assert
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32); // 256 bits = 32 bytes for AES-256
    });
  });

  describe('encryptKey and decryptKey', () => {
    test('should encrypt and decrypt keys correctly', async () => {
      // Act
      const encryptedKey = await EncryptionService.encryptKey(
        dataEncryptionKey,
        masterKey
      );
      const decryptedKey = await EncryptionService.decryptKey(
        encryptedKey,
        masterKey
      );

      // Assert
      expect(encryptedKey).toBeInstanceOf(Buffer);
      expect(decryptedKey).toBeInstanceOf(Buffer);
      expect(Buffer.compare(decryptedKey, dataEncryptionKey)).toBe(0); // Buffers should be identical
    });
  });

  describe('encryptFile and decryptFile', () => {
    test('should encrypt and decrypt files correctly', async () => {
      // Act
      const encryptedFile = await EncryptionService.encryptFile(
        testDocument,
        dataEncryptionKey
      );
      const decryptedFile = await EncryptionService.decryptFile(
        encryptedFile,
        dataEncryptionKey
      );

      // Assert
      expect(encryptedFile).toBeInstanceOf(Buffer);
      expect(decryptedFile).toBeInstanceOf(Buffer);
      expect(Buffer.compare(decryptedFile, testDocument)).toBe(0); // Original and decrypted should match
    });
  });

  describe('calculateHash', () => {
    test('should generate consistent hashes for the same input', () => {
      // Act
      const hash1 = EncryptionService.calculateHash(testDocument);
      const hash2 = EncryptionService.calculateHash(testDocument);

      // Assert
      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different inputs', () => {
      // Arrange
      const differentDocument = Buffer.from('This is a different document');

      // Act
      const hash1 = EncryptionService.calculateHash(testDocument);
      const hash2 = EncryptionService.calculateHash(differentDocument);

      // Assert
      expect(hash1).not.toBe(hash2);
    });
  });
});
