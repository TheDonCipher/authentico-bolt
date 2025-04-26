/**
 * BlockchainService.js
 * Handles interactions with the blockchain for document registration and verification
 */

const { ethers } = require('ethers');
const asyncRetry = require('async-retry');
const fs = require('fs');
const path = require('path');

class BlockchainService {
  constructor() {
    this.initialized = false;
    this.retryOptions = {
      retries: 5,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 30000,
      onRetry: (error, attempt) => {
        console.log(
          `Blockchain transaction attempt ${attempt} failed: ${error.message}`
        );
      },
    };
  }

  /**
   * Initialize the blockchain service with contract and provider
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Use contract address from environment variable if available, otherwise try to load from file
      let contractAddress = process.env.CONTRACT_ADDRESS;
      let contractAbi;

      try {
        // Try to load from files if environment variable is not set
        if (!contractAddress) {
          const contractDataPath = path.join(
            __dirname,
            '../contractsData/DocumentNFT.json'
          );
          const contractAddressPath = path.join(
            __dirname,
            '../contractsData/DocumentNFT-address.json'
          );

          const contractData = JSON.parse(
            fs.readFileSync(contractDataPath, 'utf8')
          );
          contractAbi = contractData.abi;
          contractAddress = JSON.parse(
            fs.readFileSync(contractAddressPath, 'utf8')
          ).address;
        } else {
          // If CONTRACT_ADDRESS is set, try to load just the ABI from file
          const contractDataPath = path.join(
            __dirname,
            '../contractsData/DocumentNFT.json'
          );
          const contractData = JSON.parse(
            fs.readFileSync(contractDataPath, 'utf8')
          );
          contractAbi = contractData.abi;
        }
      } catch (fileError) {
        console.warn(
          'Could not load contract data from files:',
          fileError.message
        );
        // For tests, use a mock ABI if files are not available
        contractAbi = ['mock-abi'];
      }

      // Set up provider and signer
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.BLOCKCHAIN_RPC_URL
      );

      // Verify we're on the correct network (Sepolia testnet)
      const network = await provider.getNetwork();
      const expectedChainId = parseInt(
        process.env.SEPOLIA_CHAIN_ID || '11155111'
      );

      if (network.chainId !== expectedChainId) {
        throw new Error(
          `Wrong network: expected Sepolia testnet (chainId: ${expectedChainId}), got chainId: ${network.chainId}`
        );
      }

      // Use private key from environment variables for the sponsor wallet
      const wallet = new ethers.Wallet(
        process.env.SPONSOR_WALLET_PRIVATE_KEY,
        provider
      );

      // Create contract instance
      this.contract = new ethers.Contract(contractAddress, contractAbi, wallet);
      this.provider = provider;
      this.wallet = wallet;
      this.initialized = true;

      console.log('BlockchainService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize BlockchainService:', error);
      throw error;
    }
  }

  /**
   * Register a document on the blockchain
   * @param {string} documentHash - SHA-256 hash of the original document
   * @param {string} userWalletAddress - User's wallet address
   * @param {string} orgWalletAddress - Organization's wallet address
   * @param {string} documentType - Type of the document
   * @param {string} encryptedCid - IPFS CID of the encrypted document
   * @returns {Object} Transaction receipt and token ID
   */
  async registerDocument(
    documentHash,
    userWalletAddress,
    orgWalletAddress,
    documentType,
    encryptedCid
  ) {
    await this.initialize();

    return await asyncRetry(async () => {
      try {
        // Call the mintDocumentNFT function on the smart contract
        const tx = await this.contract.mintDocumentNFT(
          userWalletAddress,
          encryptedCid,
          userWalletAddress,
          documentHash
        );

        console.log(`Transaction submitted: ${tx.hash}`);

        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

        // Extract the token ID from the event logs
        const event = receipt.events.find(
          (event) => event.event === 'DocumentVerified'
        );
        const tokenId = event.args.tokenId.toNumber();

        return {
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          tokenId: tokenId,
        };
      } catch (error) {
        console.error('Error registering document on blockchain:', error);
        throw error;
      }
    }, this.retryOptions);
  }

  /**
   * Update the verification status of a document on the blockchain
   * @param {number} tokenId - The token ID of the document
   * @param {string} status - The new verification status (Verified/Rejected)
   * @param {string} orgWalletAddress - Organization's wallet address for verification
   * @returns {Object} Transaction receipt
   */
  async updateVerificationStatus(tokenId, status, orgWalletAddress) {
    await this.initialize();

    // Validate status
    if (status !== 'Verified' && status !== 'Rejected') {
      throw new Error('Invalid status: ' + status);
    }

    return await asyncRetry(async () => {
      try {
        let tx;

        // Convert status string to enum value
        const statusEnum =
          status === 'Verified' ? 1 : status === 'Rejected' ? 2 : 0;

        if (status === 'Verified') {
          // Call the verifyDocument function
          tx = await this.contract.verifyDocument(tokenId);
        } else {
          // Call the changeStatus function
          tx = await this.contract.changeStatus(tokenId, statusEnum);
        }

        console.log(`Status update transaction submitted: ${tx.hash}`);

        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        console.log(`Status update confirmed in block ${receipt.blockNumber}`);

        return {
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
        };
      } catch (error) {
        console.error(
          'Error updating verification status on blockchain:',
          error
        );
        throw error;
      }
    }, this.retryOptions);
  }

  /**
   * Get document details from the blockchain
   * @param {number} tokenId - The token ID of the document
   * @returns {Object} Document details from the blockchain
   */
  async getDocumentDetails(tokenId) {
    await this.initialize();

    try {
      const details = await this.contract.getDocumentDetails(tokenId);

      // Convert the returned struct to a more usable object
      return {
        urlPicture: details.urlPicture,
        publicAddress: details.publicAddress,
        metadataHash: details.metadataHash,
        status: ['New', 'Verified', 'Rejected'][details.status], // Convert enum to string
      };
    } catch (error) {
      console.error(
        `Error getting document details for token ${tokenId}:`,
        error
      );
      throw error;
    }
  }
}

module.exports = new BlockchainService();
