/**
 * Secure storage utility for Authentico
 * This library provides secure storage mechanisms for sensitive data
 * with encryption and integrity validation.
 */

// Define storage error types
export interface StorageError {
  code: string;
  message: string;
}

/**
 * Get a secure encryption key
 * Derives a cryptographic key from the environment variable or a default value
 * @returns Promise resolving to a CryptoKey
 */
const getEncryptionKey = async (): Promise<CryptoKey> => {
  try {
    // Use environment variable or default
    const keyMaterial =
      process.env.NEXT_PUBLIC_ENCRYPTION_KEY ||
      'authentico-secure-storage-encryption-key';

    // Convert the string to a buffer
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);

    // Use SHA-256 to create a consistent key length
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);

    // Import the key for AES-GCM encryption
    return crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM' },
      false, // not extractable
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Error generating encryption key:', error);
    throw new Error('Failed to generate encryption key');
  }
};

/**
 * Encrypt data for secure storage using AES-GCM
 * @param data The data to encrypt
 * @returns Promise resolving to encrypted data string or null if encryption fails
 */
export const encrypt = async (data: any): Promise<string | null> => {
  if (!data) return null;

  try {
    // Get encryption key
    const key = await getEncryptionKey();

    // Serialize data
    const serialized = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(serialized);

    // Generate a random initialization vector (IV)
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for AES-GCM

    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      dataBuffer
    );

    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to base64 string
    const base64 = btoa(
      String.fromCharCode.apply(null, [...new Uint8Array(result)])
    );

    // Add a prefix to identify encrypted data
    return `encrypted-v2:${base64}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

/**
 * Decrypt data from secure storage
 * @param encryptedData The encrypted data string
 * @returns Promise resolving to decrypted data or null if decryption fails
 */
export const decrypt = async (encryptedData: string | null): Promise<any> => {
  if (!encryptedData) {
    return null;
  }

  // Handle legacy format for backward compatibility
  if (encryptedData.startsWith('encrypted:')) {
    try {
      // Extract encoded data
      const encoded = encryptedData.substring('encrypted:'.length);

      // Decode data
      const serialized = atob(encoded);

      // Parse data
      return JSON.parse(serialized);
    } catch (error) {
      console.error('Legacy decryption error:', error);
      return null;
    }
  }

  // Handle new format with Web Crypto API
  if (encryptedData.startsWith('encrypted-v2:')) {
    try {
      // Get encryption key
      const key = await getEncryptionKey();

      // Extract encoded data
      const base64 = encryptedData.substring('encrypted-v2:'.length);

      // Decode from base64
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Extract IV (first 12 bytes) and encrypted data
      const iv = bytes.slice(0, 12);
      const encryptedBytes = bytes.slice(12);

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        encryptedBytes
      );

      // Convert to string and parse JSON
      const decoder = new TextDecoder();
      const decryptedText = decoder.decode(decryptedBuffer);
      return JSON.parse(decryptedText);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  // Unknown format
  return null;
};

/**
 * Store data securely in localStorage
 * @param key The storage key
 * @param value The value to store
 * @returns Promise resolving to true if storage was successful, false otherwise
 */
export const setItem = async (key: string, value: any): Promise<boolean> => {
  if (!key) return false;

  try {
    // Encrypt the value
    const encryptedValue = await encrypt(value);

    if (!encryptedValue) {
      console.error('Failed to encrypt data for storage');
      return false;
    }

    // Store in localStorage
    localStorage.setItem(key, encryptedValue);

    return true;
  } catch (error) {
    console.error('Secure storage error:', error);
    return false;
  }
};

/**
 * Retrieve data securely from localStorage
 * @param key The storage key
 * @returns Promise resolving to the decrypted value or null if retrieval fails
 */
export const getItem = async (key: string): Promise<any> => {
  if (!key) return null;

  try {
    // Retrieve from localStorage
    const encryptedValue = localStorage.getItem(key);

    if (!encryptedValue) {
      return null;
    }

    // Decrypt the value
    return await decrypt(encryptedValue);
  } catch (error) {
    console.error('Secure storage retrieval error:', error);
    return null;
  }
};

/**
 * Remove data from localStorage
 * @param key The storage key
 * @returns True if removal was successful, false otherwise
 */
export const removeItem = (key: string): boolean => {
  if (!key) return false;

  try {
    // Remove from localStorage
    localStorage.removeItem(key);

    return true;
  } catch (error) {
    console.error('Secure storage removal error:', error);
    return false;
  }
};

/**
 * Clear all data from localStorage
 * @returns True if clear was successful, false otherwise
 */
export const clear = (): boolean => {
  try {
    // Clear localStorage
    localStorage.clear();

    return true;
  } catch (error) {
    console.error('Secure storage clear error:', error);
    return false;
  }
};

/**
 * Store sensitive data securely
 * @param key The storage key
 * @param value The sensitive value to store
 * @param expirationMs Expiration time in milliseconds
 * @returns Promise resolving to true if storage was successful, false otherwise
 */
export const storeSensitiveData = async (
  key: string,
  value: any,
  expirationMs: number = 3600000 // 1 hour default
): Promise<boolean> => {
  if (!key) return false;

  try {
    // Add expiration timestamp
    const data = {
      value,
      expires: Date.now() + expirationMs,
    };

    // Store encrypted data
    return await setItem(key, data);
  } catch (error) {
    console.error('Sensitive data storage error:', error);
    return false;
  }
};

/**
 * Retrieve sensitive data securely
 * @param key The storage key
 * @returns Promise resolving to the sensitive value or null if retrieval fails or data has expired
 */
export const getSensitiveData = async (key: string): Promise<any> => {
  if (!key) return null;

  try {
    // Retrieve data
    const data = await getItem(key);

    if (!data || !data.value) {
      return null;
    }

    // Check expiration
    if (data.expires && data.expires < Date.now()) {
      // Data has expired, remove it
      removeItem(key);
      return null;
    }

    return data.value;
  } catch (error) {
    console.error('Sensitive data retrieval error:', error);
    return null;
  }
};

/**
 * Check if secure storage is available
 * @returns Promise resolving to true if secure storage is available, false otherwise
 */
export const isSecureStorageAvailable = async (): Promise<boolean> => {
  try {
    // Check if Web Crypto API is available
    if (!crypto || !crypto.subtle) {
      console.warn('Web Crypto API is not available in this environment');
      return false;
    }

    const testKey = '__test_secure_storage__';
    const testValue = { test: 'test' };

    // Try to store and retrieve a test value
    await setItem(testKey, testValue);
    const retrievedValue = await getItem(testKey);
    await removeItem(testKey);

    return retrievedValue && retrievedValue.test === 'test';
  } catch (error) {
    console.error('Secure storage availability check error:', error);
    return false;
  }
};
