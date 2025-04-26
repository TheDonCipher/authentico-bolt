/**
 * Edge case tests for Authentico EncryptionService
 */
const crypto = require('crypto');
const EncryptionService = require('../../../services/EncryptionService');

describe('EncryptionService Edge Cases', () => {
  describe('encryptFile and decryptFile', () => {
    test('should handle empty files', async () => {
      // Arrange
      const emptyFile = Buffer.from('');
      const key = await EncryptionService.generateKey();

      // Act
      const encryptedFile = await EncryptionService.encryptFile(emptyFile, key);
      const decryptedFile = await EncryptionService.decryptFile(
        encryptedFile,
        key
      );

      // Assert
      expect(encryptedFile).toBeInstanceOf(Buffer);
      expect(encryptedFile.length).toBeGreaterThan(0); // Even empty files have IV and auth tag
      expect(decryptedFile).toBeInstanceOf(Buffer);
      expect(decryptedFile.length).toBe(0);
    });

    test('should handle very large files', async () => {
      // Arrange
      const largeFile = crypto.randomBytes(10 * 1024 * 1024); // 10MB
      const key = await EncryptionService.generateKey();

      // Act
      const encryptedFile = await EncryptionService.encryptFile(largeFile, key);
      const decryptedFile = await EncryptionService.decryptFile(
        encryptedFile,
        key
      );

      // Assert
      expect(encryptedFile).toBeInstanceOf(Buffer);
      expect(encryptedFile.length).toBeGreaterThan(largeFile.length);
      expect(decryptedFile).toBeInstanceOf(Buffer);
      expect(Buffer.compare(decryptedFile, largeFile)).toBe(0);
    });

    test('should handle binary data with null bytes', async () => {
      // Arrange
      const binaryData = Buffer.from([
        0x00, 0x01, 0x02, 0x00, 0x03, 0x04, 0x00,
      ]);
      const key = await EncryptionService.generateKey();

      // Act
      const encryptedData = await EncryptionService.encryptFile(
        binaryData,
        key
      );
      const decryptedData = await EncryptionService.decryptFile(
        encryptedData,
        key
      );

      // Assert
      expect(encryptedData).toBeInstanceOf(Buffer);
      expect(decryptedData).toBeInstanceOf(Buffer);
      expect(Buffer.compare(decryptedData, binaryData)).toBe(0);
    });

    test('should handle Unicode characters', async () => {
      // Arrange
      const unicodeText = Buffer.from('こんにちは世界! 😀🔒🌍', 'utf8');
      const key = await EncryptionService.generateKey();

      // Act
      const encryptedData = await EncryptionService.encryptFile(
        unicodeText,
        key
      );
      const decryptedData = await EncryptionService.decryptFile(
        encryptedData,
        key
      );

      // Assert
      expect(encryptedData).toBeInstanceOf(Buffer);
      expect(decryptedData).toBeInstanceOf(Buffer);
      expect(Buffer.compare(decryptedData, unicodeText)).toBe(0);
      expect(decryptedData.toString('utf8')).toBe('こんにちは世界! 😀🔒🌍');
    });
  });

  describe('encryptKey and decryptKey', () => {
    test('should handle different master key lengths', async () => {
      // Arrange
      const dataKey = await EncryptionService.generateKey(); // 32 bytes
      const shortMasterKey = crypto.randomBytes(16); // 16 bytes
      const longMasterKey = crypto.randomBytes(64); // 64 bytes

      // Act & Assert - Should throw error for invalid master key length
      await expect(
        EncryptionService.encryptKey(dataKey, shortMasterKey)
      ).rejects.toThrow();

      await expect(
        EncryptionService.encryptKey(dataKey, longMasterKey)
      ).rejects.toThrow();
    });

    test('should handle different data key lengths', async () => {
      // Arrange
      const shortDataKey = crypto.randomBytes(16); // 16 bytes
      const longDataKey = crypto.randomBytes(64); // 64 bytes
      const masterKey = crypto.randomBytes(32); // 32 bytes

      // Act & Assert - Should handle different data key lengths
      const encryptedShortKey = await EncryptionService.encryptKey(
        shortDataKey,
        masterKey
      );
      const decryptedShortKey = await EncryptionService.decryptKey(
        encryptedShortKey,
        masterKey
      );
      expect(Buffer.compare(decryptedShortKey, shortDataKey)).toBe(0);

      const encryptedLongKey = await EncryptionService.encryptKey(
        longDataKey,
        masterKey
      );
      const decryptedLongKey = await EncryptionService.decryptKey(
        encryptedLongKey,
        masterKey
      );
      expect(Buffer.compare(decryptedLongKey, longDataKey)).toBe(0);
    });
  });

  describe('calculateHash', () => {
    test('should generate consistent hashes for the same input', () => {
      // Arrange
      const input1 = Buffer.from('test data');
      const input2 = Buffer.from('test data');
      const input3 = Buffer.from('different data');

      // Act
      const hash1 = EncryptionService.calculateHash(input1);
      const hash2 = EncryptionService.calculateHash(input2);
      const hash3 = EncryptionService.calculateHash(input3);

      // Assert
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });

    test('should handle empty input', () => {
      // Arrange
      const emptyInput = Buffer.from('');

      // Act
      const hash = EncryptionService.calculateHash(emptyInput);

      // Assert
      expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash is 64 hex chars
      expect(hash).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      ); // Known SHA-256 hash of empty string
    });

    test('should handle very large input', () => {
      // Arrange
      const largeInput = crypto.randomBytes(10 * 1024 * 1024); // 10MB

      // Act
      const hash = EncryptionService.calculateHash(largeInput);

      // Assert
      expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash is 64 hex chars
    });
  });

  describe('error handling', () => {
    test('should handle tampering with encrypted data', async () => {
      // Arrange
      const originalData = Buffer.from('sensitive information');
      const key = await EncryptionService.generateKey();
      const encryptedData = await EncryptionService.encryptFile(
        originalData,
        key
      );

      // Tamper with the encrypted data
      encryptedData[encryptedData.length - 10] ^= 0xff; // Flip some bits

      // Act & Assert
      await expect(
        EncryptionService.decryptFile(encryptedData, key)
      ).rejects.toThrow();
    });

    test('should handle tampering with encrypted key', async () => {
      // Arrange
      const dataKey = await EncryptionService.generateKey();
      const masterKey = crypto.randomBytes(32);
      const encryptedKey = await EncryptionService.encryptKey(
        dataKey,
        masterKey
      );

      // Tamper with the encrypted key
      encryptedKey[encryptedKey.length - 10] ^= 0xff; // Flip some bits

      // Act & Assert
      await expect(
        EncryptionService.decryptKey(encryptedKey, masterKey)
      ).rejects.toThrow();
    });

    test('should handle invalid input types', async () => {
      // The EncryptionService might be automatically converting strings to buffers
      // Let's test with objects instead which can't be converted

      // Act & Assert
      await expect(
        EncryptionService.encryptFile({}, await EncryptionService.generateKey())
      ).rejects.toThrow();

      await expect(
        EncryptionService.encryptFile(Buffer.from('valid'), {})
      ).rejects.toThrow();

      await expect(
        EncryptionService.decryptFile({}, await EncryptionService.generateKey())
      ).rejects.toThrow();

      await expect(
        EncryptionService.decryptFile(Buffer.from('valid'), {})
      ).rejects.toThrow();

      expect(() => {
        EncryptionService.calculateHash({});
      }).toThrow();
    });
  });
});
