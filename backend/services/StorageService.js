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
const readFile = promisify(fs.readFile);

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
        // Create options for Pinata upload
        const options = {
          pinataMetadata: {
            name: fileName,
            keyvalues: metadata,
          },
        };

        console.log(
          `Uploading file to Pinata: ${fileName} (${fileBuffer.length} bytes)`
        );

        try {
          // Use the correct method for Node.js environment
          // The SDK expects a file path string for Node.js, not a buffer or File object
          const result = await this.pinata.upload.file(tempFilePath, options);
          console.log(
            `Successfully uploaded file to Pinata with CID: ${result.IpfsHash}`
          );
          return result;
        } catch (error) {
          console.error(`Error in Pinata upload: ${error.message}`);
          // If the error is related to FormData/Blob, try alternative approach
          if (
            error.message.includes('FormData') ||
            error.message.includes('Blob')
          ) {
            console.log('Attempting alternative upload method...');
            // Use the raw file data approach
            const fileData = await readFile(tempFilePath);

            // Use the raw HTTP API approach as fallback
            const axios = require('axios');
            const FormData = require('form-data');

            // Create a proper readable stream from the file
            const stream = fs.createReadStream(tempFilePath);

            // Use the pinata.pinFileToIPFS method directly
            const pinataOptions = {
              pinataMetadata: {
                name: fileName,
                keyvalues: metadata,
              },
            };

            const form = new FormData();
            form.append('file', stream);
            form.append(
              'pinataMetadata',
              JSON.stringify(pinataOptions.pinataMetadata)
            );

            const pinataResponse = await axios.post(
              'https://api.pinata.cloud/pinning/pinFileToIPFS',
              form,
              {
                headers: {
                  Authorization: `Bearer ${process.env.PINATA_JWT}`,
                  ...form.getHeaders(),
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
              }
            );

            console.log(
              `Successfully uploaded file using alternative method: ${pinataResponse.data.IpfsHash}`
            );
            return pinataResponse.data;
          }
          throw error;
        }
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
      console.log(`Retrieving file with CID ${cid} from IPFS`);

      // Try using the Pinata API directly
      try {
        const axios = require('axios');
        const pinataApiKey = process.env.PINATA_API_KEY;
        const pinataSecretApiKey = process.env.PINATA_API_SECRET;
        const pinataJwt = process.env.PINATA_JWT;

        // Check if we have the necessary credentials
        if (!pinataJwt && (!pinataApiKey || !pinataSecretApiKey)) {
          throw new Error('Pinata credentials are not configured');
        }

        // Try the dedicated Pinata gateway with authentication
        const gatewayUrl = 'https://gateway.pinata.cloud';
        const fileUrl = `${gatewayUrl}/ipfs/${cid}`;

        console.log(`Requesting file from Pinata gateway: ${fileUrl}`);

        // Set up headers based on available credentials
        const headers = {};
        if (pinataJwt) {
          headers['Authorization'] = `Bearer ${pinataJwt}`;
        } else if (pinataApiKey && pinataSecretApiKey) {
          headers['pinata_api_key'] = pinataApiKey;
          headers['pinata_secret_api_key'] = pinataSecretApiKey;
        }

        const response = await axios.get(fileUrl, {
          headers,
          responseType: 'arraybuffer',
          timeout: 30000, // 30 second timeout
        });

        console.log(
          `Successfully retrieved file with CID ${cid} from Pinata gateway`
        );
        return Buffer.from(response.data);
      } catch (pinataError) {
        console.error(
          `Error retrieving file from Pinata gateway: ${pinataError.message}`
        );

        // Try using the custom gateway if configured
        try {
          const axios = require('axios');
          const customGatewayUrl = process.env.GATEWAY_URL;

          if (customGatewayUrl) {
            const fileUrl = `${customGatewayUrl}/ipfs/${cid}`;
            console.log(`Trying custom gateway: ${fileUrl}`);

            const response = await axios.get(fileUrl, {
              responseType: 'arraybuffer',
              timeout: 30000, // 30 second timeout
            });

            console.log(
              `Successfully retrieved file with CID ${cid} using custom gateway`
            );
            return Buffer.from(response.data);
          }
        } catch (customGatewayError) {
          console.error(
            `Failed to retrieve from custom gateway: ${customGatewayError.message}`
          );
        }

        // Try using public IPFS gateways as a fallback
        console.log(`Falling back to public IPFS gateways for CID ${cid}`);
        const axios = require('axios');
        const publicGateways = [
          'https://ipfs.io/ipfs/',
          'https://cloudflare-ipfs.com/ipfs/',
          'https://dweb.link/ipfs/',
          'https://ipfs.fleek.co/ipfs/',
        ];

        // Try each gateway until one works
        for (const gateway of publicGateways) {
          try {
            const fileUrl = `${gateway}${cid}`;
            console.log(`Trying public gateway: ${fileUrl}`);

            const response = await axios.get(fileUrl, {
              responseType: 'arraybuffer',
              timeout: 30000, // 30 second timeout
            });

            console.log(
              `Successfully retrieved file with CID ${cid} using public gateway ${gateway}`
            );
            return Buffer.from(response.data);
          } catch (gatewayError) {
            console.error(
              `Failed to retrieve from gateway ${gateway}: ${gatewayError.message}`
            );
            // Continue to the next gateway
          }
        }

        // If we get here, all gateways failed
        throw new Error(`All IPFS gateways failed to retrieve CID ${cid}`);
      }
    } catch (error) {
      console.error(`Failed to retrieve file with CID ${cid}:`, error);
      throw new Error(`Failed to retrieve file from IPFS: ${error.message}`);
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
