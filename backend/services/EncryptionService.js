/**
 * EncryptionService.js
 * Handles document encryption and decryption using AES-256
 */

const crypto = require('crypto');
const { promisify } = require('util');

class EncryptionService {
  constructor() {
    // AES-256-GCM is a secure encryption algorithm with authentication
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.authTagLength = 16; // 128 bits
  }

  /**
   * Generate a new data encryption key (DEK)
   * @returns {Buffer} The generated key
   */
  async generateKey() {
    const randomBytes = promisify(crypto.randomBytes);
    return await randomBytes(this.keyLength);
  }

  /**
   * Encrypt a data encryption key (DEK) with a master key
   * In a production environment, this would use a KMS service
   * @param {Buffer} dek - The data encryption key to encrypt
   * @param {Buffer} masterKey - The master key used for encryption
   * @returns {Buffer} The encrypted DEK
   */
  async encryptKey(dek, masterKey) {
    const iv = await promisify(crypto.randomBytes)(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, masterKey, iv);

    const encryptedDek = Buffer.concat([cipher.update(dek), cipher.final()]);

    const authTag = cipher.getAuthTag();

    // Format: IV + AuthTag + EncryptedDEK
    return Buffer.concat([iv, authTag, encryptedDek]);
  }

  /**
   * Decrypt an encrypted data encryption key (DEK) with a master key
   * In a production environment, this would use a KMS service
   * @param {Buffer} encryptedDek - The encrypted DEK
   * @param {Buffer} masterKey - The master key used for decryption
   * @returns {Buffer} The decrypted DEK
   */
  async decryptKey(encryptedDek, masterKey) {
    const iv = encryptedDek.slice(0, this.ivLength);
    const authTag = encryptedDek.slice(
      this.ivLength,
      this.ivLength + this.authTagLength
    );
    const encryptedData = encryptedDek.slice(
      this.ivLength + this.authTagLength
    );

    const decipher = crypto.createDecipheriv(this.algorithm, masterKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  }

  /**
   * Encrypt a file buffer using a data encryption key
   * @param {Buffer} fileBuffer - The file buffer to encrypt
   * @param {Buffer} key - The encryption key
   * @returns {Object} Object containing the encrypted data, IV, and auth tag
   */
  async encryptFile(fileBuffer, key) {
    const iv = await promisify(crypto.randomBytes)(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    const encryptedData = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    // Format: IV + AuthTag + EncryptedData
    return Buffer.concat([iv, authTag, encryptedData]);
  }

  /**
   * Decrypt an encrypted file buffer using a data encryption key
   * @param {Buffer} encryptedBuffer - The encrypted file buffer
   * @param {Buffer} key - The decryption key
   * @returns {Buffer} The decrypted file buffer
   */
  async decryptFile(encryptedBuffer, key) {
    const iv = encryptedBuffer.slice(0, this.ivLength);
    const authTag = encryptedBuffer.slice(
      this.ivLength,
      this.ivLength + this.authTagLength
    );
    const encryptedData = encryptedBuffer.slice(
      this.ivLength + this.authTagLength
    );

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  }

  /**
   * Calculate SHA-256 hash of a file buffer
   * @param {Buffer} fileBuffer - The file buffer to hash
   * @returns {string} The hex-encoded hash
   */
  calculateHash(fileBuffer) {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }
}

module.exports = EncryptionService;
