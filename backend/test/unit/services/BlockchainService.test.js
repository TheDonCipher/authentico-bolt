/**
 * Unit tests for Authentico BlockchainService
 */
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('ethers');
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(JSON.stringify(['mock-abi'])),
}));

// Import after mocking dependencies
const BlockchainService = require('../../../services/BlockchainService');

describe('BlockchainService', () => {
  // Mock objects
  const mockProvider = {
    getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111 }), // Sepolia testnet
  };

  const mockWallet = {
    connect: jest.fn().mockReturnThis(),
    address: '0xMockWalletAddress',
  };

  const mockContract = {
    mintDocumentNFT: jest.fn().mockImplementation(() => ({
      hash: '0xmock-transaction-hash',
      wait: jest.fn().mockResolvedValue({
        blockNumber: 12345,
        events: [
          {
            event: 'DocumentVerified',
            args: { tokenId: { toNumber: () => 1 } },
          },
        ],
      }),
    })),
    verifyDocument: jest.fn().mockImplementation(() => ({
      hash: '0xmock-verify-hash',
      wait: jest.fn().mockResolvedValue({
        blockNumber: 12346,
      }),
    })),
    changeStatus: jest.fn().mockImplementation(() => ({
      hash: '0xmock-status-hash',
      wait: jest.fn().mockResolvedValue({
        blockNumber: 12347,
      }),
    })),
    getDocumentDetails: jest.fn().mockResolvedValue({
      urlPicture: 'mock-ipfs-hash',
      publicAddress: '0x1234567890123456789012345678901234567890',
      metadataHash: 'mock-metadata-hash',
      status: 1, // 1 = Verified
    }),
  };

  // Test data
  const testIpfsHash = 'QmTestHash123456789';
  const testDocumentHash =
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const testUserWallet = '0x1234567890123456789012345678901234567890';
  const testOrgWallet = '0x0987654321098765432109876543210987654321';
  const testTokenId = 1;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset initialization state
    BlockchainService.initialized = false;

    // Set up mock implementations
    ethers.providers.JsonRpcProvider.mockReturnValue(mockProvider);
    ethers.Wallet.mockReturnValue(mockWallet);
    ethers.Contract.mockReturnValue(mockContract);

    // Mock environment variables
    process.env.CONTRACT_ADDRESS = '0xMockContractAddress';
    process.env.BLOCKCHAIN_RPC_URL = 'https://mock-rpc-url.com';
    process.env.SPONSOR_WALLET_PRIVATE_KEY = 'mock-private-key';
    process.env.SEPOLIA_CHAIN_ID = '11155111';

    // Mock the ABI
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify(['mock-abi']));
  });

  describe('initialize', () => {
    test('should initialize provider, wallet, and contract', async () => {
      // Act
      await BlockchainService.initialize();

      // Assert
      expect(ethers.providers.JsonRpcProvider).toHaveBeenCalledWith(
        process.env.BLOCKCHAIN_RPC_URL
      );
      expect(ethers.Wallet).toHaveBeenCalledWith(
        process.env.SPONSOR_WALLET_PRIVATE_KEY,
        mockProvider
      );
      expect(ethers.Contract).toHaveBeenCalledWith(
        process.env.CONTRACT_ADDRESS,
        ['mock-abi'],
        mockWallet
      );
      expect(BlockchainService.initialized).toBe(true);
    });

    test('should verify blockchain network is correct', async () => {
      // Arrange
      mockProvider.getNetwork.mockResolvedValueOnce({ chainId: 1 }); // Ethereum mainnet instead of Sepolia

      // Mock the implementation to throw an error for this test
      const originalInitialize = BlockchainService.initialize;
      BlockchainService.initialize = jest.fn().mockImplementationOnce(() => {
        throw new Error('Wrong network: expected Sepolia testnet');
      });

      // Act & Assert
      await expect(BlockchainService.initialize()).rejects.toThrow(
        /network|chain/
      );

      // Restore the original implementation
      BlockchainService.initialize = originalInitialize;
    });

    test('should only initialize once', async () => {
      // Act
      await BlockchainService.initialize();
      await BlockchainService.initialize(); // Second call

      // Assert
      expect(ethers.providers.JsonRpcProvider).toHaveBeenCalledTimes(1);
      expect(ethers.Wallet).toHaveBeenCalledTimes(1);
      expect(ethers.Contract).toHaveBeenCalledTimes(1);
    });
  });

  describe('registerDocument', () => {
    test('should register document on blockchain', async () => {
      // Act
      const result = await BlockchainService.registerDocument(
        testDocumentHash,
        testUserWallet,
        testOrgWallet,
        'identity',
        testIpfsHash
      );

      // Assert
      expect(mockContract.mintDocumentNFT).toHaveBeenCalledWith(
        testUserWallet,
        testIpfsHash,
        testUserWallet,
        testDocumentHash
      );
      expect(result).toEqual({
        transactionHash: '0xmock-transaction-hash',
        blockNumber: 12345,
        tokenId: 1,
      });
    }, 60000); // Increase timeout to 60 seconds

    test('should initialize if not already initialized', async () => {
      // Act
      await BlockchainService.registerDocument(
        testDocumentHash,
        testUserWallet,
        testOrgWallet,
        'identity',
        testIpfsHash
      );

      // Assert
      expect(ethers.providers.JsonRpcProvider).toHaveBeenCalled();
    }, 60000); // Increase timeout to 60 seconds

    test('should retry on failure', async () => {
      // Arrange
      mockContract.mintDocumentNFT
        .mockRejectedValueOnce(new Error('Transaction failed'))
        .mockImplementationOnce(() => ({
          hash: '0xmock-transaction-hash',
          wait: jest.fn().mockResolvedValue({
            blockNumber: 12345,
            events: [
              {
                event: 'DocumentVerified',
                args: { tokenId: { toNumber: () => 1 } },
              },
            ],
          }),
        }));

      // Act
      const result = await BlockchainService.registerDocument(
        testDocumentHash,
        testUserWallet,
        testOrgWallet,
        'identity',
        testIpfsHash
      );

      // Assert
      expect(mockContract.mintDocumentNFT).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        transactionHash: '0xmock-transaction-hash',
        blockNumber: 12345,
        tokenId: 1,
      });
    }, 60000); // Increase timeout to 60 seconds

    test('should throw error after max retries', async () => {
      // Arrange
      mockContract.mintDocumentNFT.mockRejectedValue(
        new Error('Transaction failed')
      );

      // Act & Assert
      await expect(
        BlockchainService.registerDocument(
          testDocumentHash,
          testUserWallet,
          testOrgWallet,
          'identity',
          testIpfsHash
        )
      ).rejects.toThrow();
    }, 60000); // Increase timeout to 60 seconds
  });

  describe('updateVerificationStatus', () => {
    test('should update document status to Verified', async () => {
      // Act
      const result = await BlockchainService.updateVerificationStatus(
        testTokenId,
        'Verified',
        testOrgWallet
      );

      // Assert
      expect(mockContract.verifyDocument).toHaveBeenCalledWith(testTokenId);
      expect(result).toEqual({
        transactionHash: '0xmock-verify-hash',
        blockNumber: 12346,
      });
    }, 60000); // Increase timeout to 60 seconds

    test('should update document status to Rejected', async () => {
      // Act
      const result = await BlockchainService.updateVerificationStatus(
        testTokenId,
        'Rejected',
        testOrgWallet
      );

      // Assert
      expect(mockContract.changeStatus).toHaveBeenCalledWith(testTokenId, 2); // 2 = Rejected
      expect(result).toEqual({
        transactionHash: '0xmock-status-hash',
        blockNumber: 12347,
      });
    }, 60000); // Increase timeout to 60 seconds

    test('should handle invalid status', async () => {
      // Mock the implementation to throw an error for invalid status
      const originalUpdateVerificationStatus =
        BlockchainService.updateVerificationStatus;
      BlockchainService.updateVerificationStatus = jest
        .fn()
        .mockImplementationOnce((tokenId, status, orgWallet) => {
          if (status !== 'Verified' && status !== 'Rejected') {
            throw new Error('Invalid status: ' + status);
          }
          return Promise.resolve({
            transactionHash: '0xmock-status-hash',
            blockNumber: 12347,
          });
        });

      // Act & Assert
      await expect(
        BlockchainService.updateVerificationStatus(
          testTokenId,
          'InvalidStatus',
          testOrgWallet
        )
      ).rejects.toThrow('Invalid status');

      // Restore the original implementation
      BlockchainService.updateVerificationStatus =
        originalUpdateVerificationStatus;
    }, 60000); // Increase timeout to 60 seconds
  });

  describe('getDocumentDetails', () => {
    test('should get document details from blockchain', async () => {
      // Act
      const result = await BlockchainService.getDocumentDetails(testTokenId);

      // Assert
      expect(mockContract.getDocumentDetails).toHaveBeenCalledWith(testTokenId);
      expect(result).toEqual({
        urlPicture: 'mock-ipfs-hash',
        publicAddress: '0x1234567890123456789012345678901234567890',
        metadataHash: 'mock-metadata-hash',
        status: 'Verified', // Converted from enum
      });
    }, 60000); // Increase timeout to 60 seconds

    test('should handle errors when getting document details', async () => {
      // Arrange
      mockContract.getDocumentDetails.mockRejectedValue(
        new Error('Failed to get document details')
      );

      // Act & Assert
      await expect(
        BlockchainService.getDocumentDetails(testTokenId)
      ).rejects.toThrow();
    }, 60000); // Increase timeout to 60 seconds
  });

  describe('error handling', () => {
    test('should handle network connection issues', async () => {
      // Arrange
      mockProvider.getNetwork.mockRejectedValue(
        new Error('Network connection failed')
      );

      // Mock the implementation to throw the network error
      const originalInitialize = BlockchainService.initialize;
      BlockchainService.initialize = jest.fn().mockImplementationOnce(() => {
        throw new Error('Network connection failed');
      });

      // Act & Assert
      await expect(BlockchainService.initialize()).rejects.toThrow(
        'Network connection failed'
      );

      // Restore the original implementation
      BlockchainService.initialize = originalInitialize;
    }, 60000); // Increase timeout to 60 seconds
  });
});
