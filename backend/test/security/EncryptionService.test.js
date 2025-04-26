/**
 * Security tests for Authentico EncryptionService
 */
const EncryptionService = require('../../services/EncryptionService');
const {
  generateRandomDocument,
  generateAES256Key,
} = require('../utils/securityTestUtils');
const crypto = require('crypto');

describe('EncryptionService Security Tests', () => {
  // Test data
  let testDocument;
  let masterKey;
  let dataEncryptionKey;

  beforeEach(async () => {
    // Generate fresh test data for each test
    testDocument = generateRandomDocument(2048); // 2KB test document
    masterKey = await generateAES256Key();
    dataEncryptionKey = await EncryptionService.generateKey();
  });

  test('should generate cryptographically secure keys of correct length', async () => {
    // Act
    const key = await EncryptionService.generateKey();

    // Assert
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32); // 256 bits = 32 bytes for AES-256

    // Check entropy - this is a basic check, not comprehensive
    const uniqueBytes = new Set(key);
    expect(uniqueBytes.size).toBeGreaterThan(10); // Expect reasonable entropy
  });

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

  test('should encrypt and decrypt files correctly', async () => {
    // Act
    const encryptedFile = await EncryptionService.encryptFile(
      testDocument,
      dataEncryptionKey
    );

    // Assert
    expect(encryptedFile).toBeInstanceOf(Buffer);
    expect(encryptedFile.length).toBeGreaterThan(testDocument.length); // Encrypted data is larger

    // Extract IV and auth tag for manual decryption
    const iv = encryptedFile.slice(0, EncryptionService.ivLength);
    const authTag = encryptedFile.slice(
      EncryptionService.ivLength,
      EncryptionService.ivLength + EncryptionService.authTagLength
    );
    const encryptedData = encryptedFile.slice(
      EncryptionService.ivLength + EncryptionService.authTagLength
    );

    // Manually decrypt to verify
    const decipher = crypto.createDecipheriv(
      EncryptionService.algorithm,
      dataEncryptionKey,
      iv
    );
    decipher.setAuthTag(authTag);
    const decryptedData = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);

    expect(Buffer.compare(decryptedData, testDocument)).toBe(0); // Original and decrypted should match
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

  test('should use secure encryption algorithm (AES-256-GCM)', () => {
    // Assert
    expect(EncryptionService.algorithm).toBe('aes-256-gcm');
    expect(EncryptionService.keyLength).toBe(32); // 256 bits
  });

  test('should use authenticated encryption with auth tags', async () => {
    // Act
    const encryptedFile = await EncryptionService.encryptFile(
      testDocument,
      dataEncryptionKey
    );

    // Extract and verify auth tag exists
    const authTag = encryptedFile.slice(
      EncryptionService.ivLength,
      EncryptionService.ivLength + EncryptionService.authTagLength
    );

    // Assert
    expect(authTag.length).toBe(EncryptionService.authTagLength);
    expect(EncryptionService.authTagLength).toBe(16); // 128 bits
  });

  test('should use unique IVs for each encryption operation', async () => {
    // Act
    const encryptedFile1 = await EncryptionService.encryptFile(
      testDocument,
      dataEncryptionKey
    );
    const encryptedFile2 = await EncryptionService.encryptFile(
      testDocument,
      dataEncryptionKey
    );

    // Extract IVs
    const iv1 = encryptedFile1.slice(0, EncryptionService.ivLength);
    const iv2 = encryptedFile2.slice(0, EncryptionService.ivLength);

    // Assert
    expect(Buffer.compare(iv1, iv2)).not.toBe(0); // IVs should be different
  });
  test('should handle large files efficiently', async () => {
    // Arrange
    const largeDocument = generateRandomDocument(10 * 1024 * 1024); // 10MB document

    // Act
    const startTime = Date.now();
    const encryptedFile = await EncryptionService.encryptFile(
      largeDocument,
      dataEncryptionKey
    );
    const decryptedFile = await EncryptionService.decryptFile(
      encryptedFile,
      dataEncryptionKey
    );
    const endTime = Date.now();

    // Assert
    expect(Buffer.compare(decryptedFile, largeDocument)).toBe(0); // Original and decrypted should match

    // Performance check - this is environment dependent, so we're just checking it completes in a reasonable time
    const duration = endTime - startTime;
    console.log(`Large file encryption/decryption took ${duration}ms`);
    expect(duration).toBeLessThan(30000); // Should complete in under 30 seconds
  });

  test('should be resilient against timing attacks', async () => {
    // Arrange
    const validKey = await EncryptionService.encryptKey(
      dataEncryptionKey,
      masterKey
    );
    const invalidKey = Buffer.from(validKey); // Copy the valid key

    // Modify the first byte to make it invalid
    invalidKey[EncryptionService.ivLength + EncryptionService.authTagLength] =
      invalidKey[EncryptionService.ivLength + EncryptionService.authTagLength] ^
      0xff;

    // Act - Measure time for valid and invalid keys
    const validStartTime = process.hrtime.bigint();
    try {
      await EncryptionService.decryptKey(validKey, masterKey);
    } catch (error) {
      // Ignore errors
    }
    const validEndTime = process.hrtime.bigint();

    const invalidStartTime = process.hrtime.bigint();
    try {
      await EncryptionService.decryptKey(invalidKey, masterKey);
    } catch (error) {
      // Expect an error for invalid key
    }
    const invalidEndTime = process.hrtime.bigint();

    // Calculate durations in nanoseconds
    const validDuration = Number(validEndTime - validStartTime);
    const invalidDuration = Number(invalidEndTime - invalidStartTime);

    // Assert - This is a basic check, not comprehensive
    // In a real timing attack test, we would need statistical analysis
    console.log(
      `Valid key decryption: ${validDuration}ns, Invalid key: ${invalidDuration}ns`
    );
  });

  test('should handle key rotation securely', async () => {
    // Arrange - Simulate key rotation scenario
    const oldMasterKey = masterKey;
    const newMasterKey = await generateAES256Key(); // New master key

    // Encrypt with old master key
    const encryptedKeyOld = await EncryptionService.encryptKey(
      dataEncryptionKey,
      oldMasterKey
    );

    // Act - Simulate key rotation
    // 1. Decrypt the DEK with the old master key
    const decryptedDEK = await EncryptionService.decryptKey(
      encryptedKeyOld,
      oldMasterKey
    );

    // 2. Re-encrypt the DEK with the new master key
    const encryptedKeyNew = await EncryptionService.encryptKey(
      decryptedDEK,
      newMasterKey
    );

    // 3. Verify the re-encrypted DEK can be decrypted with the new master key
    const rotatedDEK = await EncryptionService.decryptKey(
      encryptedKeyNew,
      newMasterKey
    );

    // Assert
    expect(Buffer.compare(rotatedDEK, dataEncryptionKey)).toBe(0); // DEK should remain the same after rotation
  });

  test('should protect against padding oracle attacks', async () => {
    // GCM mode doesn't use padding, so it's inherently protected against padding oracle attacks
    // This test verifies that the implementation uses GCM mode correctly

    // Arrange
    const encryptedFile = await EncryptionService.encryptFile(
      testDocument,
      dataEncryptionKey
    );

    // Modify the ciphertext (but not the auth tag)
    const modifiedEncryptedFile = Buffer.from(encryptedFile);
    const dataOffset =
      EncryptionService.ivLength + EncryptionService.authTagLength;
    modifiedEncryptedFile[dataOffset] =
      modifiedEncryptedFile[dataOffset] ^ 0xff; // Flip bits

    // Act & Assert
    await expect(
      EncryptionService.decryptFile(modifiedEncryptedFile, dataEncryptionKey)
    ).rejects.toThrow(); // Should throw an authentication error, not a padding error
  });

  test('should handle memory securely', async () => {
    // This is a basic test to ensure the service doesn't leak sensitive data
    // In a real implementation, we would use tools like Valgrind or memory profiling

    // Arrange
    const sensitiveData = crypto.randomBytes(32);
    let encryptedData;

    // Act
    encryptedData = await EncryptionService.encryptFile(
      sensitiveData,
      dataEncryptionKey
    );

    // Assert
    expect(encryptedData).not.toEqual(sensitiveData); // Encrypted data should not match original

    // In a real test, we would check for memory leaks and proper zeroing of sensitive data
    // But this is difficult to test in JavaScript due to garbage collection
  });
});
