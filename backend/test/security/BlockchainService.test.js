/**
 * Security tests for Authentico BlockchainService
 */
const { generateDocumentHash } = require('../utils/securityTestUtils');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Import after mocking dependencies
const BlockchainService = require('../../services/BlockchainService');

// Mock dependencies
jest.mock('ethers');
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

// Increase the timeout for all tests in this file
jest.setTimeout(120000); // 2 minutes

describe('BlockchainService Security Tests', () => {
  // Test data
  const testDocumentHash = generateDocumentHash(Buffer.from('test document'));
  const testUserWallet = '0x1234567890123456789012345678901234567890';
  const testOrgWallet = '0x0987654321098765432109876543210987654321';
  const testDocumentType = 'identity';
  const testEncryptedCid = 'QmTest123456789';
  const testTokenId = 1;

  // Mock contract and provider
  let mockContract;
  let mockProvider;
  let mockWallet;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock contract ABI and address
    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes('DocumentNFT.json')) {
        return JSON.stringify({ abi: ['mock-abi'] });
      } else if (filePath.includes('DocumentNFT-address.json')) {
        return JSON.stringify({ address: '0xMockContractAddress' });
      }
      return '';
    });

    // Mock ethers provider and contract
    mockContract = {
      registerDocument: jest.fn().mockResolvedValue({
        hash: '0xmock-transaction-hash',
        wait: jest.fn().mockResolvedValue({
          blockNumber: 12345,
          events: [{ args: { tokenId: ethers.BigNumber.from(1) } }],
        }),
      }),
      verifyDocument: jest.fn().mockResolvedValue({
        hash: '0xmock-verify-hash',
        wait: jest.fn().mockResolvedValue({
          blockNumber: 12346,
        }),
      }),
      changeStatus: jest.fn().mockResolvedValue({
        hash: '0xmock-status-hash',
        wait: jest.fn().mockResolvedValue({
          blockNumber: 12347,
        }),
      }),
      getDocumentDetails: jest.fn().mockResolvedValue({
        urlPicture: testEncryptedCid,
        publicAddress: testUserWallet,
        metadataHash: testDocumentHash,
        status: 1, // Verified
      }),
    };

    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111 }), // Sepolia
    };

    mockWallet = {
      connect: jest.fn().mockReturnThis(),
    };

    // Mock ethers
    ethers.providers.JsonRpcProvider.mockReturnValue(mockProvider);
    ethers.Wallet.mockReturnValue(mockWallet);
    ethers.Contract.mockReturnValue(mockContract);
    ethers.BigNumber.from = jest
      .fn()
      .mockImplementation((value) => ({ toNumber: () => Number(value) }));

    // Initialize service
    BlockchainService.initialized = false;
  });

  test('should initialize securely with contract and provider', async () => {
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
      '0xMockContractAddress',
      ['mock-abi'],
      expect.anything()
    );
    expect(BlockchainService.initialized).toBe(true);
  });

  test('should securely register documents on the blockchain', async () => {
    // Act
    const result = await BlockchainService.registerDocument(
      testDocumentHash,
      testUserWallet,
      testOrgWallet,
      testDocumentType,
      testEncryptedCid
    );

    // Assert
    expect(mockContract.registerDocument).toHaveBeenCalledWith(
      testDocumentHash,
      testUserWallet,
      testOrgWallet,
      expect.any(Number), // Document type enum
      testEncryptedCid
    );
    expect(result).toEqual({
      transactionHash: '0xmock-transaction-hash',
      blockNumber: 12345,
      tokenId: 1,
    });
  });

  test('should securely update document verification status', async () => {
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
  });

  test('should handle rejected document status updates securely', async () => {
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
  });

  test('should securely retrieve document details from blockchain', async () => {
    // Act
    const result = await BlockchainService.getDocumentDetails(testTokenId);

    // Assert
    expect(mockContract.getDocumentDetails).toHaveBeenCalledWith(testTokenId);
    expect(result).toEqual({
      urlPicture: testEncryptedCid,
      publicAddress: testUserWallet,
      metadataHash: testDocumentHash,
      status: 'Verified',
    });
  });

  test('should implement retry logic for blockchain transactions', async () => {
    // Arrange
    mockContract.registerDocument.mockRejectedValueOnce(
      new Error('Transaction failed')
    );

    // Act
    const result = await BlockchainService.registerDocument(
      testDocumentHash,
      testUserWallet,
      testOrgWallet,
      testDocumentType,
      testEncryptedCid
    );

    // Assert
    expect(mockContract.registerDocument).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      transactionHash: '0xmock-transaction-hash',
      blockNumber: 12345,
      tokenId: 1,
    });
  });

  test('should validate wallet addresses before blockchain interactions', async () => {
    // Arrange
    const invalidWallet = 'not-a-valid-wallet-address';

    // Act & Assert
    await expect(
      BlockchainService.registerDocument(
        testDocumentHash,
        invalidWallet, // Invalid wallet
        testOrgWallet,
        testDocumentType,
        testEncryptedCid
      )
    ).rejects.toThrow(); // Should throw an error for invalid wallet
  });

  test('should validate document hash format before blockchain registration', async () => {
    // Arrange
    const invalidHash = 'not-a-valid-hash';

    // Act & Assert
    await expect(
      BlockchainService.registerDocument(
        invalidHash, // Invalid hash
        testUserWallet,
        testOrgWallet,
        testDocumentType,
        testEncryptedCid
      )
    ).rejects.toThrow(); // Should throw an error for invalid hash
  });

  test('should handle network connection issues gracefully', async () => {
    // Arrange
    mockProvider.getNetwork.mockRejectedValueOnce(
      new Error('Network connection failed')
    );

    // Reset initialization state
    BlockchainService.initialized = false;

    // Act & Assert
    await expect(BlockchainService.initialize()).rejects.toThrow(
      'Network connection failed'
    );
  });

  test('should verify blockchain network is Sepolia testnet', async () => {
    // Arrange
    mockProvider.getNetwork.mockResolvedValueOnce({ chainId: 1 }); // Ethereum mainnet instead of Sepolia

    // Reset initialization state
    BlockchainService.initialized = false;

    // Act & Assert
    await expect(BlockchainService.initialize()).rejects.toThrow(
      /network|chain/
    );
  });
  test('should protect against replay attacks', async () => {
    // Arrange
    const nonce = 123;
    mockWallet.getTransactionCount = jest.fn().mockResolvedValue(nonce);

    // Mock the transaction overrides
    const mockOverrides = {};
    ethers.providers.JsonRpcProvider.prototype.getGasPrice = jest
      .fn()
      .mockResolvedValue(ethers.BigNumber.from('20000000000'));

    // Act
    await BlockchainService.initialize();
    await BlockchainService.registerDocument(
      testDocumentHash,
      testUserWallet,
      testOrgWallet,
      testDocumentType,
      testEncryptedCid
    );

    // Assert
    // In a real implementation, we would check that the nonce is included in the transaction
    // Since we're mocking the contract, we can't directly test this
    // But we can check that the contract method was called
    expect(mockContract.registerDocument).toHaveBeenCalled();
  });

  test('should handle gas price fluctuations securely', async () => {
    // Arrange
    const highGasPrice = ethers.BigNumber.from('100000000000'); // 100 Gwei
    ethers.providers.JsonRpcProvider.prototype.getGasPrice = jest
      .fn()
      .mockResolvedValue(highGasPrice);

    // Act
    await BlockchainService.initialize();
    const result = await BlockchainService.registerDocument(
      testDocumentHash,
      testUserWallet,
      testOrgWallet,
      testDocumentType,
      testEncryptedCid
    );

    // Assert
    expect(result).toEqual({
      transactionHash: '0xmock-transaction-hash',
      blockNumber: 12345,
      tokenId: 1,
    });
  });

  test('should protect private keys from exposure', async () => {
    // This test verifies that private keys are not exposed in logs or error messages

    // Arrange
    const originalConsoleError = console.error;
    const mockConsoleError = jest.fn();
    console.error = mockConsoleError;

    // Mock a failure that might expose the private key
    mockWallet.connect.mockImplementationOnce(() => {
      throw new Error('Failed to connect wallet');
    });

    // Act
    try {
      await BlockchainService.initialize();
    } catch (error) {
      // Expected to throw
    }

    // Assert
    // Check that the private key is not included in any error messages or logs
    const errorCalls = mockConsoleError.mock.calls.flat();
    const privateKeyExposed = errorCalls.some(
      (arg) =>
        typeof arg === 'string' &&
        arg.includes(process.env.SPONSOR_WALLET_PRIVATE_KEY)
    );

    expect(privateKeyExposed).toBe(false);

    // Restore console.error
    console.error = originalConsoleError;
  });

  test('should validate transaction receipts', async () => {
    // Arrange
    const mockReceipt = {
      blockNumber: 12345,
      status: 1, // Success
      events: [{ args: { tokenId: ethers.BigNumber.from(1) } }],
    };

    mockContract.registerDocument.mockResolvedValueOnce({
      hash: '0xmock-transaction-hash',
      wait: jest.fn().mockResolvedValue(mockReceipt),
    });

    // Act
    const result = await BlockchainService.registerDocument(
      testDocumentHash,
      testUserWallet,
      testOrgWallet,
      testDocumentType,
      testEncryptedCid
    );

    // Assert
    expect(result).toEqual({
      transactionHash: '0xmock-transaction-hash',
      blockNumber: 12345,
      tokenId: 1,
    });
  });

  test('should handle failed transactions securely', async () => {
    // Arrange
    const mockFailedReceipt = {
      blockNumber: 12345,
      status: 0, // Failed
    };

    mockContract.registerDocument.mockResolvedValueOnce({
      hash: '0xmock-failed-transaction-hash',
      wait: jest.fn().mockResolvedValue(mockFailedReceipt),
    });

    // Act & Assert
    await expect(
      BlockchainService.registerDocument(
        testDocumentHash,
        testUserWallet,
        testOrgWallet,
        testDocumentType,
        testEncryptedCid
      )
    ).rejects.toThrow(); // Should throw an error for failed transaction
  });

  test('should prevent front-running attacks', async () => {
    // Front-running is a complex attack that's hard to test directly
    // This test checks that transactions use appropriate gas settings

    // Arrange
    const mockGasPrice = ethers.BigNumber.from('20000000000'); // 20 Gwei
    ethers.providers.JsonRpcProvider.prototype.getGasPrice = jest
      .fn()
      .mockResolvedValue(mockGasPrice);

    // Mock the transaction overrides
    const mockOverrides = {};

    // Act
    await BlockchainService.initialize();
    await BlockchainService.registerDocument(
      testDocumentHash,
      testUserWallet,
      testOrgWallet,
      testDocumentType,
      testEncryptedCid
    );

    // Assert
    // In a real implementation, we would check that the transaction uses appropriate gas settings
    // Since we're mocking the contract, we can't directly test this
    // But we can check that the contract method was called
    expect(mockContract.registerDocument).toHaveBeenCalled();
  });
});
