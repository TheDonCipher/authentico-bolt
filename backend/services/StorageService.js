/**
 * StorageService.js
 * Handles document storage on IPFS via Pinata
 */

const { PinataSDK } = require('pinata-web3');
const asyncRetry = require('async-retry');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

class StorageService {
  constructor() {
    this.pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
      pinataGateway: process.env.GATEWAY_URL,
    });

    this.retryOptions = {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 5000,
      onRetry: (error, attempt) => {
        console.log(
          `Pinata upload attempt ${attempt} failed: ${error.message}`
        );
      },
    };
  }

  /**
   * Upload a file buffer to IPFS via Pinata with retry logic
   * @param {Buffer} fileBuffer - The file buffer to upload
   * @param {string} fileName - The name of the file
   * @param {Object} metadata - Optional metadata for the file
   * @returns {Object} The Pinata upload response with CID
   */
  async uploadToIPFS(fileBuffer, fileName, metadata = {}) {
    // Create a temporary file
    const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${fileName}`);

    try {
      // Write the buffer to a temporary file
      await writeFile(tempFilePath, fileBuffer);

      // Upload to Pinata with retry logic
      return await asyncRetry(async () => {
        // Use the file path directly instead of creating a File object
        // since File is a browser API not available in Node.js
        const options = {
          pinataMetadata: {
            name: fileName,
            keyvalues: metadata,
          },
        };

        // Use the file path directly with Pinata SDK
        const result = await this.pinata.upload.file(tempFilePath, options);
        return result;
      }, this.retryOptions);
    } finally {
      // Clean up the temporary file
      try {
        await unlink(tempFilePath);
      } catch (error) {
        console.error(
          `Failed to delete temporary file ${tempFilePath}:`,
          error
        );
      }
    }
  }

  /**
   * Retrieve a file from IPFS via Pinata
   * @param {string} cid - The IPFS CID of the file
   * @returns {Buffer} The file buffer
   */
  async retrieveFromIPFS(cid) {
    try {
      // Use gateways instead of gateway based on the Pinata SDK documentation
      const response = await this.pinata.gateways.getFile(cid);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error(`Failed to retrieve file with CID ${cid}:`, error);
      throw error;
    }
  }

  /**
   * Unpin a file from IPFS via Pinata
   * @param {string} cid - The IPFS CID of the file to unpin
   * @returns {Object} The Pinata unpin response
   */
  async unpinFromIPFS(cid) {
    try {
      return await this.pinata.unpin.cid(cid);
    } catch (error) {
      console.error(`Failed to unpin file with CID ${cid}:`, error);
      throw error;
    }
  }
}

module.exports = new StorageService();
