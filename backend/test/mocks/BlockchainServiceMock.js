/**
 * Mock BlockchainService for testing
 */

class BlockchainServiceMock {
  constructor() {
    this.initialized = false;
    this.retryOptions = {
      retries: 5,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 30000,
      onRetry: (error, attempt) => {
        console.log(`Blockchain transaction attempt ${attempt} failed: ${error.message}`);
      },
    };
  }

  /**
   * Initialize the blockchain service with contract and provider
   */
  async initialize() {
    if (this.initialized) return;
    
    // Mock initialization
    this.contract = {
      mintDocumentNFT: jest.fn().mockResolvedValue({
        hash: '0xmocktxhash',
        wait: jest.fn().mockResolvedValue({
          blockNumber: 123456,
          events: [
            {
              event: 'DocumentVerified',
              args: {
                tokenId: { toNumber: () => 1 }
              }
            }
          ]
        })
      }),
      verifyDocument: jest.fn().mockResolvedValue({
        hash: '0xmocktxhash',
        wait: jest.fn().mockResolvedValue({
          blockNumber: 123456
        })
      }),
      changeStatus: jest.fn().mockResolvedValue({
        hash: '0xmocktxhash',
        wait: jest.fn().mockResolvedValue({
          blockNumber: 123456
        })
      }),
      getDocumentDetails: jest.fn().mockResolvedValue({
        urlPicture: 'mock-ipfs-hash',
        publicAddress: '0x1234567890123456789012345678901234567890',
        metadataHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 1 // Verified
      })
    };
    
    this.provider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111 }), // Sepolia testnet
      getGasPrice: jest.fn().mockResolvedValue({ _hex: '0x4a817c800', _isBigNumber: true }), // 20 gwei
    };
    
    this.wallet = {
      address: '0x1234567890123456789012345678901234567890',
      getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
    };
    
    this.initialized = true;
  }

  /**
   * Register a document on the blockchain
   */
  async registerDocument(documentHash, userWalletAddress, orgWalletAddress, documentType, encryptedCid) {
    await this.initialize();
    
    // Validate wallet addresses
    if (!this.isValidWalletAddress(userWalletAddress)) {
      throw new Error('Invalid user wallet address');
    }
    
    if (!this.isValidWalletAddress(orgWalletAddress)) {
      throw new Error('Invalid organization wallet address');
    }
    
    // Validate document hash
    if (!this.isValidDocumentHash(documentHash)) {
      throw new Error('Invalid document hash format');
    }
    
    // Call the mock contract
    const tx = await this.contract.mintDocumentNFT(
      userWalletAddress,
      encryptedCid,
      userWalletAddress,
      documentHash
    );
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    // Extract the token ID from the event logs
    const event = receipt.events.find(event => event.event === 'DocumentVerified');
    const tokenId = event.args.tokenId.toNumber();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      tokenId: tokenId
    };
  }

  /**
   * Update the verification status of a document on the blockchain
   */
  async updateVerificationStatus(tokenId, status, orgWalletAddress) {
    await this.initialize();
    
    // Validate wallet address
    if (!this.isValidWalletAddress(orgWalletAddress)) {
      throw new Error('Invalid organization wallet address');
    }
    
    let tx;
    
    // Convert status string to enum value
    const statusEnum = status === 'Verified' ? 1 : status === 'Rejected' ? 2 : 0;
    
    if (status === 'Verified') {
      // Call the verifyDocument function
      tx = await this.contract.verifyDocument(tokenId);
    } else {
      // Call the changeStatus function
      tx = await this.contract.changeStatus(tokenId, statusEnum);
    }
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  }

  /**
   * Get document details from the blockchain
   */
  async getDocumentDetails(tokenId) {
    await this.initialize();
    
    const details = await this.contract.getDocumentDetails(tokenId);
    
    // Convert the returned struct to a more usable object
    return {
      urlPicture: details.urlPicture,
      publicAddress: details.publicAddress,
      metadataHash: details.metadataHash,
      status: ['New', 'Verified', 'Rejected'][details.status] // Convert enum to string
    };
  }
  
  /**
   * Validate wallet address format
   */
  isValidWalletAddress(address) {
    if (typeof address !== 'string') return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  
  /**
   * Validate document hash format
   */
  isValidDocumentHash(hash) {
    if (typeof hash !== 'string') return false;
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }
}

module.exports = new BlockchainServiceMock();
