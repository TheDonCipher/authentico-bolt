# Authentico Testing Guide

This guide provides comprehensive instructions for testing the core features of the Authentico application—user authentication and document upload—across all environments.

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Environment Setup](#environment-setup)
3. [Running Tests](#running-tests)
4. [Manual Testing](#manual-testing)
5. [Troubleshooting](#troubleshooting)

## Testing Overview

The Authentico testing framework is designed to verify the functionality of:

1. **User Authentication**
   - Registration (individual and organization)
   - Login with wallet
   - Session management
   - Logout

2. **Document Upload**
   - File encryption
   - IPFS storage via Pinata
   - Blockchain anchoring
   - Status updates

3. **Environment Configuration**
   - Firebase setup
   - Pinata/IPFS configuration
   - Blockchain configuration
   - Encryption key validation

## Environment Setup

### Prerequisites

1. Node.js v16+ and npm
2. Firebase project with authentication and Firestore
3. Pinata account with JWT token
4. Sepolia testnet wallet with ETH

### Setting Up Test Environment

1. Install test dependencies:
   ```bash
   cd test-scripts
   npm install
   ```

2. Create environment-specific configuration files:
   ```bash
   # For development testing
   cp .env.example .env.development
   
   # For staging testing
   cp .env.example .env.staging
   
   # For production testing
   cp .env.example .env.production
   ```

3. Edit the environment files with your actual configuration values.

4. Validate environment configuration:
   ```bash
   npm run test:verify-env:dev
   ```

## Running Tests

### Automated Tests

The testing framework includes several scripts for testing different aspects of the application:

#### 1. Environment Verification

```bash
# Verify development environment
npm run test:verify-env:dev

# Verify staging environment
npm run test:verify-env:staging

# Verify production environment
npm run test:verify-env:prod
```

#### 2. Authentication Testing

```bash
# Test authentication in development
npm run test:auth:dev

# Test authentication in staging
npm run test:auth:staging

# Test authentication in production
npm run test:auth:prod
```

#### 3. Document Upload Testing

```bash
# Test document upload in development
npm run test:document:dev

# Test document upload in staging
npm run test:document:staging

# Test document upload in production
npm run test:document:prod
```

#### 4. Run All Tests

```bash
# Run all tests in development
npm run test:all:dev

# Run all tests in staging
npm run test:all:staging

# Run all tests in production
npm run test:all:prod
```

### Test Results

Each test script will output detailed results, including:
- Which tests passed, failed, or were skipped
- Error messages for failed tests
- A summary of test results

If any tests fail, the script will exit with a non-zero exit code, making it suitable for CI/CD pipelines.

## Manual Testing

In addition to automated tests, manual testing should be performed to verify the user experience:

### Authentication Testing Checklist

- [ ] User can register as an individual
- [ ] User can register as an organization
- [ ] User can connect wallet and login
- [ ] User session persists after page refresh
- [ ] User can logout
- [ ] Appropriate error messages are displayed for invalid inputs
- [ ] Loading states are displayed during authentication processes

### Document Upload Testing Checklist

- [ ] User can select a document to upload
- [ ] User can select a verifying organization
- [ ] Upload progress is displayed
- [ ] Success/error messages are displayed
- [ ] Document appears in user's document list
- [ ] Document status updates correctly
- [ ] Document details can be viewed

## Troubleshooting

### Common Issues

#### Authentication Issues

- **Firebase Configuration**: Verify that Firebase is properly configured in your environment files.
- **Wallet Connection**: Ensure that the wallet is properly connected and has the correct network (Sepolia).
- **Token Expiration**: Firebase tokens expire after 1 hour by default. If tests fail due to token expiration, generate a new token.

#### Document Upload Issues

- **File Size**: Ensure that test files are under the 10MB limit.
- **Pinata Configuration**: Verify that the Pinata JWT token is valid and has the necessary permissions.
- **Blockchain Issues**: Check that the sponsor wallet has sufficient ETH for transactions.
- **IPFS Gateway**: Verify that the gateway URL is correct (should be `fuchsia-fantastic-python-686.mypinata.cloud`).

#### Environment Issues

- **Missing Variables**: Ensure all required environment variables are set.
- **API Connectivity**: Verify that the API URL is accessible from your testing environment.
- **Master Key**: The master key must be exactly 32 characters for AES-256 encryption.

### Getting Help

If you encounter issues that aren't covered in this guide:

1. Check the application logs for detailed error messages
2. Review the Firebase console for authentication issues
3. Check the Pinata dashboard for IPFS storage issues
4. Use a blockchain explorer (like Etherscan for Sepolia) to verify transactions

## Continuous Integration

For CI/CD pipelines, you can use the following commands to run tests:

```yaml
# Example GitHub Actions workflow
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      - run: npm ci
      - run: npm run test:verify-env:dev
      - run: npm run test:auth:dev
      - run: npm run test:document:dev
```

Make sure to set up the necessary environment variables in your CI/CD environment.
