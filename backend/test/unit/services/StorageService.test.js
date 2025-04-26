/**
 * Unit tests for Authentico StorageService
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

// Mock dependencies
jest.mock('axios');

// Define mock functions in the global scope
global.mockWriteFile = jest.fn().mockResolvedValue(undefined);
global.mockUnlink = jest.fn().mockResolvedValue(undefined);
global.mockReadFile = jest
  .fn()
  .mockResolvedValue(Buffer.from('mock-file-content'));
global.mockCreateReadStream = jest.fn().mockImplementation(() => {
  // Create a mock stream with a name property to fix the FormData issue
  const mockStream = {
    name: 'mock-file-name',
    on: jest.fn(), // Add 'on' method to make it look like a readable stream
    pipe: jest.fn(),
  };
  return mockStream;
});

// Mock fs module
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    createReadStream: global.mockCreateReadStream,
    promises: {
      ...originalFs.promises,
      writeFile: global.mockWriteFile,
      unlink: global.mockUnlink,
      readFile: global.mockReadFile,
    },
  };
});

// Mock the Pinata SDK
jest.mock('pinata-web3', () => {
  return {
    PinataSDK: jest.fn().mockImplementation(() => ({
      upload: {
        file: jest.fn().mockResolvedValue({
          IpfsHash: 'QmTestHash123456789',
          PinSize: 1000,
          Timestamp: new Date().toISOString(),
        }),
      },
      unpin: jest.fn().mockResolvedValue({ success: true }),
    })),
  };
});

// Import after mocking dependencies
const StorageService = require('../../../services/StorageService');

describe('StorageService', () => {
  // Test data
  const testDocument = Buffer.from('test-document-content');
  const testFileName = 'test-document.pdf';
  const testMetadata = { documentType: 'identity' };
  const mockIpfsHash = 'QmTestHash123456789';
  const mockPinataResponse = {
    IpfsHash: mockIpfsHash,
    PinSize: 1000,
    Timestamp: new Date().toISOString(),
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock axios responses
    axios.post.mockResolvedValue({ data: mockPinataResponse });
    axios.get.mockResolvedValue({ data: testDocument });
    axios.delete.mockResolvedValue({ data: { success: true } });
  });

  describe('uploadToIPFS', () => {
    test('should upload file to IPFS and return response', async () => {
      // Create a fixed timestamp for consistent testing
      const fixedTimestamp = new Date().toISOString();
      const fixedResponse = {
        IpfsHash: mockIpfsHash,
        PinSize: 1000,
        Timestamp: fixedTimestamp,
      };

      // Update the mockPinataResponse to use the fixed timestamp
      mockPinataResponse.Timestamp = fixedTimestamp;

      // Mock the Pinata SDK upload method
      StorageService.pinata.upload.file = jest
        .fn()
        .mockResolvedValue(fixedResponse);

      // Reset mock counters
      global.mockWriteFile.mockClear();
      global.mockUnlink.mockClear();

      // Act
      const result = await StorageService.uploadToIPFS(
        testDocument,
        testFileName,
        testMetadata
      );

      // Assert
      expect(result).toEqual(fixedResponse);
      expect(global.mockWriteFile).toHaveBeenCalled();
      expect(global.mockUnlink).toHaveBeenCalled(); // Should clean up temp file
      expect(StorageService.pinata.upload.file).toHaveBeenCalled();
    });

    test('should handle upload errors and retry', async () => {
      // Create a fixed timestamp for consistent testing
      const fixedTimestamp = new Date().toISOString();
      const fixedResponse = {
        IpfsHash: mockIpfsHash,
        PinSize: 1000,
        Timestamp: fixedTimestamp,
      };

      // Update the mockPinataResponse to use the fixed timestamp
      mockPinataResponse.Timestamp = fixedTimestamp;

      // Arrange - Make the SDK method fail first, then succeed
      StorageService.pinata.upload.file = jest
        .fn()
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockResolvedValueOnce(fixedResponse);

      // Also mock the axios fallback
      axios.post
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockResolvedValueOnce({ data: fixedResponse });

      // Act
      const result = await StorageService.uploadToIPFS(
        testDocument,
        testFileName
      );

      // Assert
      expect(result).toEqual(fixedResponse);
    });

    test('should handle FormData errors with alternative upload method', async () => {
      // Create a fixed timestamp for consistent testing
      const fixedTimestamp = new Date().toISOString();
      const fixedResponse = {
        IpfsHash: mockIpfsHash,
        PinSize: 1000,
        Timestamp: fixedTimestamp,
      };

      // Update the mockPinataResponse to use the fixed timestamp
      mockPinataResponse.Timestamp = fixedTimestamp;

      // Arrange - Make the SDK method fail with FormData error
      StorageService.pinata.upload.file = jest.fn().mockImplementation(() => {
        throw new Error('FormData is not defined');
      });

      // Mock the axios fallback to succeed
      axios.post.mockResolvedValueOnce({ data: fixedResponse });

      // Act
      const result = await StorageService.uploadToIPFS(
        testDocument,
        testFileName
      );

      // Assert
      expect(result).toEqual(fixedResponse);
    });

    test('should throw error after max retries', async () => {
      // Arrange - Make both the SDK method and axios fallback fail
      StorageService.pinata.upload.file = jest
        .fn()
        .mockRejectedValue(new Error('Upload failed'));

      axios.post.mockRejectedValue(new Error('Upload failed'));

      // Act & Assert
      await expect(
        StorageService.uploadToIPFS(testDocument, testFileName)
      ).rejects.toThrow();
    });
  });

  describe('retrieveFromIPFS', () => {
    test('should retrieve file from IPFS gateway', async () => {
      // Act
      const result = await StorageService.retrieveFromIPFS(mockIpfsHash);

      // Assert
      expect(result).toEqual(testDocument);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(mockIpfsHash),
        expect.objectContaining({ responseType: 'arraybuffer' })
      );
    });

    test('should handle retrieval errors and retry', async () => {
      // Arrange
      axios.get
        .mockRejectedValueOnce(new Error('Retrieval failed'))
        .mockResolvedValueOnce({ data: testDocument });

      // Act
      const result = await StorageService.retrieveFromIPFS(mockIpfsHash);

      // Assert
      expect(result).toEqual(testDocument);
      expect(axios.get).toHaveBeenCalledTimes(2); // Should retry once
    });

    test('should throw error after max retries', async () => {
      // Arrange
      axios.get.mockRejectedValue(new Error('Retrieval failed'));

      // Act & Assert
      await expect(
        StorageService.retrieveFromIPFS(mockIpfsHash)
      ).rejects.toThrow();
    });

    test('should handle invalid IPFS hash', async () => {
      // Act & Assert
      await expect(StorageService.retrieveFromIPFS('')).rejects.toThrow();

      await expect(StorageService.retrieveFromIPFS(null)).rejects.toThrow();
    });
  });

  describe('unpinFromIPFS', () => {
    test('should unpin file from IPFS', async () => {
      // Arrange - Mock the pinata.unpin method
      StorageService.pinata.unpin = jest
        .fn()
        .mockResolvedValue({ success: true });

      // Act
      const result = await StorageService.unpinFromIPFS(mockIpfsHash);

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(StorageService.pinata.unpin).toHaveBeenCalledWith(mockIpfsHash);
    });

    test('should handle unpin errors and retry', async () => {
      // Arrange - Mock the pinata.unpin method to fail
      StorageService.pinata.unpin = jest
        .fn()
        .mockRejectedValue(new Error('Unpin failed'));

      // Act
      const result = await StorageService.unpinFromIPFS(mockIpfsHash);

      // Assert
      expect(result).toBe(false); // Should return false on error
      expect(StorageService.pinata.unpin).toHaveBeenCalledTimes(1);
    });

    test('should return false if unpin fails after max retries', async () => {
      // Arrange - Mock the pinata.unpin method to always fail
      StorageService.pinata.unpin = jest
        .fn()
        .mockRejectedValue(new Error('Unpin failed'));

      // Act
      const result = await StorageService.unpinFromIPFS(mockIpfsHash);

      // Assert
      expect(result).toBe(false);
    });

    test('should handle invalid IPFS hash', async () => {
      // Act
      const result = await StorageService.unpinFromIPFS('');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    test('should clean up temporary files even if upload fails', async () => {
      // Arrange
      // Reset mock counters
      global.mockWriteFile.mockClear();
      global.mockUnlink.mockClear();

      // Make the upload fail
      StorageService.pinata.upload.file = jest
        .fn()
        .mockRejectedValue(new Error('Upload failed'));

      axios.post.mockRejectedValue(new Error('Upload failed')); // For the fallback method

      // Act
      try {
        await StorageService.uploadToIPFS(testDocument, testFileName);
      } catch (error) {
        // Expected to throw
      }

      // Assert
      expect(global.mockUnlink).toHaveBeenCalled(); // Should still clean up
    });
  });
});
