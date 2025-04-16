# Authentico Test Scripts

This directory contains comprehensive test scripts for validating the functionality of the Authentico application across different environments. These scripts simulate real-world user interactions and data flows to ensure the application works as expected.

## Setup

1. Install dependencies:

   ```bash
   cd test-scripts
   npm install
   ```

2. Create environment configuration files:

   ```bash
   # Copy the example configuration file
   cp .env.example .env.development

   # For staging and production environments
   cp .env.example .env.staging
   cp .env.example .env.production
   ```

3. Edit the environment files with your specific configuration values. The following variables are required:

   ```
   # API and Frontend URLs
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

   # Test Wallet (optional, will create a random one if not provided)
   TEST_WALLET_PRIVATE_KEY=your_test_wallet_private_key

   # Admin Wallet (required for admin tests)
   ADMIN_WALLET_PRIVATE_KEY=your_admin_wallet_private_key

   # Organization ID for document verification tests
   TEST_VERIFYING_ORG_ID=your_verifying_org_id

   # Firebase Configuration (required for seeding test data)
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email

   # Pinata Configuration (required for document uploads)
   PINATA_JWT=your_pinata_jwt
   GATEWAY_URL=your_gateway_url

   # Encryption Configuration
   MASTER_KEY_SECRET=your_32_character_master_key

   # Blockchain Configuration
   BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
   CHAIN_ID=11155111  # Sepolia testnet

   # Document Contract Address
   DOCUMENT_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
   ```

   Note: If you don't provide Firebase credentials in the environment variables, the seeding script will try to use the `firebase-service-account.json` file in the project root directory.

## Seeding Test Data

Before running the tests, you can seed the Firestore database, Pinata, and other data sources with test data using the seeding script:

```bash
npm run seed-data:dev
npm run seed-data:staging
npm run seed-data:prod
```

The seeding script will:

1. Create test users (individual and organization) in Firestore
2. Create test organization applications and details
3. Create and upload test documents to Pinata
4. Create document records in Firestore with proper status tracking
5. Generate a `.env.test` file with the test data for use in tests

Note: When running the full test suite with `npm run test:dev`, the seeding script will be run automatically before the tests.

## Available Test Suites

### Environment Verification

Verifies that all required environment variables are set and that the configuration is valid.

```bash
npm run verify-env:dev
npm run verify-env:staging
npm run verify-env:prod
```

### Authentication Test Suite

Tests all aspects of user authentication, including registration, login, session management, token validation, and logout functionality. Updated to use Firebase ID tokens for authentication.

```bash
npm run test:auth:dev
npm run test:auth:staging
npm run test:auth:prod
```

### Document Management Test Suite

Tests document upload, encryption, IPFS storage via Pinata, blockchain anchoring, and document status transitions. Includes verification of document status changes.

```bash
npm run test:document:dev
npm run test:document:staging
npm run test:document:prod
```

### Organization Flow Test Suite

Tests organization-related flows, including application submission, admin approval, organization verification status tracking, and document verification by organizations.

```bash
npm run test:organization:dev
npm run test:organization:staging
npm run test:organization:prod
```

### End-to-End Test Suite

Tests a complete end-to-end flow from individual user registration to document verification by an organization. Includes all status transitions and verification steps.

```bash
npm run test:e2e:dev
npm run test:e2e:staging
npm run test:e2e:prod
```

### Run All Tests

Runs all test suites in sequence.

```bash
npm run test:dev
npm run test:staging
npm run test:prod
```

## Test Results

Each test script will output detailed results, including:

- Which tests passed, failed, or were skipped
- Error messages for failed tests
- A summary of test results

If any tests fail, the script will exit with a non-zero exit code, making it suitable for CI/CD pipelines.

## Test Coverage

The test suites cover the following key areas of the application:

### Authentication

- User registration (individual and organization)
- Login with wallet using Thirdweb
- Firebase ID token exchange and validation
- Session management and token validation
- Logout functionality
- Admin access control

### Document Management

- Document upload and encryption with AES-256
- IPFS storage via Pinata with proper gateway URL
- Blockchain anchoring on Sepolia testnet
- Document status transitions and tracking
- Document verification by organizations

### User Flows

- Individual user document submission with organization selection
- Organization verification application process
- Organization verification status tracking
- Organization verification of documents with feedback
- Admin approval of organization applications
- End-to-end user journey with status updates

## Troubleshooting

### Authentication Issues

- Verify that Firebase is properly configured
- Check that the wallet address is registered in the system
- Ensure the auth token is valid and not expired
- Verify that the admin wallet address matches the expected value

### Document Upload Issues

- Verify that Pinata is properly configured
- Check that the verifying organization ID is valid
- Ensure the blockchain RPC URL is accessible
- Verify that the sponsor wallet has sufficient ETH for transactions

### Organization Issues

- Ensure the organization application process is working
- Verify that admin approval functionality is accessible
- Check that organization verification permissions are correct

### Environment Issues

- Make sure all required environment variables are set
- Check that the API URL is correct and accessible
- Verify that the frontend URL is correct and accessible
- Ensure the blockchain configuration is valid for the target environment
