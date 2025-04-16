/**
 * Simple test script for document upload
 */
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file in the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const apiUrl = 'http://localhost:3001/api';

// Test wallet address
const walletAddress = '0x1234567890123456789012345678901234567890';

async function runTest() {
  try {
    console.log('Starting simple document upload test...');

    // Create a small test file
    const testFilePath = './test-document.txt';
    fs.writeFileSync(
      testFilePath,
      'This is a test document for upload testing.'
    );

    // Create form data
    const form = new FormData();
    form.append('document_file', fs.createReadStream(testFilePath));
    form.append('documentName', 'Test Document');
    form.append('documentType', 'identity');
    form.append('verifyingOrgId', 'org1');

    // Use a hardcoded token for testing
    const token =
      'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg1NzA4MWNhOWNiYjM3YzIzNDk4ZGQzOTQzYmYzNzFhMDU4ODNkMjgiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiVGVzdCBVc2VyIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2F1dGhlbnRpY28tYmFja2VuZCIsImF1ZCI6ImF1dGhlbnRpY28tYmFja2VuZCIsImF1dGhfdGltZSI6MTc0NDc0ODk4OSwidXNlcl9pZCI6ImZnc0h4R09UcjdXdW9MTnoyOUdHcHNKWGtkNjMiLCJzdWIiOiJmZ3NIeEdPVHI3V3VvTE56MjlHR3BzSlhrZDYzIiwiaWF0IjoxNzQ0NzQ4OTg5LCJleHAiOjE3NDQ3NTI1ODksImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnt9LCJzaWduX2luX3Byb3ZpZGVyIjoiY3VzdG9tIn19.RKQxLPR2n42aiJpkUfZ-4mCtLf8QBNctu-kTiBcNcGleiqtSDzFrPR2EWcLFX5EsbB5G3IWIEQ-j92K8epa-TQVvnau5cLYy4dxo8HtWV18_uH0Ll2OIwjwezAnuSGs7lqRvgMTewqbzAJ87JX8P7sXnabIsuviRpMUhH-uKoiV9ALMM1qWlMBGzME3iwJFjHSst34W5DOk8A3F1ikTG67QSLtT73pVVHK20xeBOFyjn0M4tcAFNT8TGK2hqLO5BhHqps7AQ0e1wjPzUZLF3ZY9VDSo40CKIpn1dT6rbCMm0wfix3ytLX2Yz4t9-tYa2HrubCd_Y_LIApg5D1DxpPQ';

    // Upload the document
    const response = await axios.post(`${apiUrl}/documents/upload`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log('Document upload response:', response.data);

    // Clean up
    fs.unlinkSync(testFilePath);

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

runTest();
