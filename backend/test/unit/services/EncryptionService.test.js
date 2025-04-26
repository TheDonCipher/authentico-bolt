/**
 * Unit tests for Authentico EncryptionService
 */
const EncryptionService = require('../../../services/EncryptionService');
const crypto = require('crypto');

describe('EncryptionService', () => {
  // Test data
  let testDocument;
  let masterKey;
  let dataEncryptionKey;

  beforeEach(async () => {
    // Generate fresh test data for each test
    testDocument = crypto.randomBytes(2048); // 2KB test document
    masterKey = crypto.randomBytes(32); // 256-bit key
    dataEncryptionKey = await EncryptionService.generateKey();
  });

  describe('generateKey', () => {
    test('should generate a key of correct length', async () => {
      // Act
      const key = await EncryptionService.generateKey();

      // Assert
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32); // 256 bits = 32 bytes
    });

    test('should generate unique keys on each call', async () => {
      // Act
      const key1 = await EncryptionService.generateKey();
      const key2 = await EncryptionService.generateKey();

      // Assert
      expect(Buffer.compare(key1, key2)).not.toBe(0); // Keys should be different
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
      expect(encryptedKey.length).toBeGreaterThan(dataEncryptionKey.length); // Encrypted data is larger due to IV and auth tag
      expect(decryptedKey).toBeInstanceOf(Buffer);
      expect(decryptedKey.length).toBe(dataEncryptionKey.length);
      expect(Buffer.compare(decryptedKey, dataEncryptionKey)).toBe(0); // Buffers should be identical
    });

    test('should fail decryption with incorrect master key', async () => {
      // Arrange
      const encryptedKey = await EncryptionService.encryptKey(
        dataEncryptionKey,
        masterKey
      );
      const wrongMasterKey = crypto.randomBytes(32); // Different key

      // Act & Assert
      await expect(
        EncryptionService.decryptKey(encryptedKey, wrongMasterKey)
      ).rejects.toThrow(); // Should throw an error with wrong key
    });

    test('should fail decryption with tampered encrypted data', async () => {
      // Arrange
      const encryptedKey = await EncryptionService.encryptKey(
        dataEncryptionKey,
        masterKey
      );

      // Tamper with the encrypted data
      encryptedKey[encryptedKey.length - 5] =
        encryptedKey[encryptedKey.length - 5] ^ 0xff; // Flip bits

      // Act & Assert
      await expect(
        EncryptionService.decryptKey(encryptedKey, masterKey)
      ).rejects.toThrow(); // Should throw an error with tampered data
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
      expect(encryptedFile.length).toBeGreaterThan(testDocument.length); // Encrypted data is larger
      expect(decryptedFile).toBeInstanceOf(Buffer);
      expect(Buffer.compare(decryptedFile, testDocument)).toBe(0); // Original and decrypted should match
    });

    test('should fail decryption with incorrect key', async () => {
      // Arrange
      const encryptedFile = await EncryptionService.encryptFile(
        testDocument,
        dataEncryptionKey
      );
      const wrongKey = crypto.randomBytes(32); // Different key

      // Act & Assert
      await expect(
        EncryptionService.decryptFile(encryptedFile, wrongKey)
      ).rejects.toThrow(); // Should throw an error with wrong key
    });

    test('should fail decryption with tampered encrypted data', async () => {
      // Arrange
      const encryptedFile = await EncryptionService.encryptFile(
        testDocument,
        dataEncryptionKey
      );

      // Tamper with the encrypted data
      encryptedFile[encryptedFile.length - 10] =
        encryptedFile[encryptedFile.length - 10] ^ 0xff; // Flip bits

      // Act & Assert
      await expect(
        EncryptionService.decryptFile(encryptedFile, dataEncryptionKey)
      ).rejects.toThrow(); // Should throw an error with tampered data
    });

    test('should handle empty files', async () => {
      // Arrange
      const emptyFile = Buffer.from([]);

      // Act
      const encryptedFile = await EncryptionService.encryptFile(
        emptyFile,
        dataEncryptionKey
      );
      const decryptedFile = await EncryptionService.decryptFile(
        encryptedFile,
        dataEncryptionKey
      );

      // Assert
      expect(decryptedFile).toBeInstanceOf(Buffer);
      expect(decryptedFile.length).toBe(0); // Should be empty
    });

    test('should handle large files', async () => {
      // Arrange
      const largeFile = crypto.randomBytes(5 * 1024 * 1024); // 5MB file

      // Act
      const encryptedFile = await EncryptionService.encryptFile(
        largeFile,
        dataEncryptionKey
      );
      const decryptedFile = await EncryptionService.decryptFile(
        encryptedFile,
        dataEncryptionKey
      );

      // Assert
      expect(Buffer.compare(decryptedFile, largeFile)).toBe(0); // Original and decrypted should match
    });
  });

  describe('calculateHash', () => {
    test('should generate consistent hashes for the same document', async () => {
      // Act
      const hash1 = EncryptionService.calculateHash(testDocument);
      const hash2 = EncryptionService.calculateHash(testDocument);

      // Assert
      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different documents', async () => {
      // Arrange
      const differentDocument = crypto.randomBytes(2048);

      // Act
      const hash1 = EncryptionService.calculateHash(testDocument);
      const hash2 = EncryptionService.calculateHash(differentDocument);

      // Assert
      expect(hash1).not.toBe(hash2);
    });

    test('should generate a hash of expected format', async () => {
      // Act
      const hash = EncryptionService.calculateHash(testDocument);

      // Assert
      expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 produces 64 hex characters
    });
  });

  describe('error handling', () => {
    test('should handle invalid input types', () => {
      // Act & Assert
      expect(() => {
        EncryptionService.calculateHash('not a buffer');
      }).not.toThrow(); // String is converted to buffer internally by crypto

      expect(() => {
        EncryptionService.calculateHash(null);
      }).toThrow();

      expect(() => {
        EncryptionService.calculateHash(undefined);
      }).toThrow();
    });
  });
});
