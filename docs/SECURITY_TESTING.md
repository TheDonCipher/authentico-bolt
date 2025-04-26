# Authentico Security Testing Guide

This document provides guidance on running and extending the security tests for the Authentico platform.

## Overview

The security testing suite is designed to identify and prevent common vulnerabilities in the Authentico platform, with a focus on:

1. **Authentication & Authorization**
   - Wallet-based authentication security
   - Token handling and validation
   - Access control for protected resources

2. **Document Security**
   - Secure document encryption/decryption
   - Proper validation of document uploads
   - Protection against unauthorized access

3. **Blockchain Interactions**
   - Secure handling of wallet private keys
   - Validation of blockchain transactions
   - Protection against common blockchain vulnerabilities

4. **API Security**
   - Input validation and sanitization
   - Protection against injection attacks
   - Secure handling of sensitive data

## Running Security Tests

### Backend Security Tests

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Run all security tests
npm run test:security

# Run specific security test file
npx jest test/security/EncryptionService.test.js

# Run with coverage report
npm run test:coverage
```

### Frontend Security Tests

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Run all security tests
npm run test:security

# Run specific security test file
npx jest test/security/WalletConnectionModal.test.tsx

# Run with coverage report
npm run test:coverage
```

## Test Structure

The security tests are organized by component and security concern:

### Backend Tests

- `test/security/authMiddleware.test.js` - Tests for authentication middleware
- `test/security/EncryptionService.test.js` - Tests for document encryption/decryption
- `test/security/StorageService.test.js` - Tests for IPFS/Pinata interactions
- `test/security/BlockchainService.test.js` - Tests for blockchain interactions
- `test/security/documentRoutes.test.js` - Tests for document API endpoints
- `test/security/orgRoutes.test.js` - Tests for organization API endpoints
- `test/security/authRoutes.test.js` - Tests for authentication API endpoints

### Frontend Tests

- `test/security/DocumentUploadDialog.test.tsx` - Tests for document upload security
- `test/security/WalletConnectionModal.test.tsx` - Tests for wallet connection security
- `test/security/AuthContext.test.tsx` - Tests for authentication context security

## Key Security Concerns Addressed

### 1. Document Encryption

The tests verify that:
- AES-256-GCM encryption is properly implemented
- Encryption keys are securely generated and managed
- Document encryption/decryption works correctly
- Tampering with encrypted data is detected

### 2. Authentication

The tests verify that:
- Wallet addresses are properly validated
- Authentication tokens are securely handled
- Token expiration is properly enforced
- Authorization checks are properly implemented

### 3. Input Validation

The tests verify that:
- Document uploads are properly validated (size, type)
- API inputs are sanitized to prevent injection attacks
- Error handling doesn't expose sensitive information

### 4. Blockchain Security

The tests verify that:
- Blockchain transactions are properly validated
- Smart contract interactions are secure
- Wallet private keys are properly protected

## Extending the Tests

To add new security tests:

1. Create a new test file in the appropriate directory:
   - Backend: `backend/test/security/`
   - Frontend: `frontend/test/security/`

2. Follow the existing test patterns for consistency

3. Focus on security-specific concerns rather than general functionality

4. Use the provided mock services and utilities

## Security Best Practices

When developing new features, follow these security best practices:

1. **Always validate user input** - Never trust client-side data
2. **Use proper authentication** - Verify user identity for all protected operations
3. **Implement authorization checks** - Verify user permissions for all operations
4. **Secure sensitive data** - Encrypt sensitive data at rest and in transit
5. **Implement proper error handling** - Don't expose sensitive information in error messages
6. **Use secure dependencies** - Keep dependencies updated and use secure versions
7. **Follow the principle of least privilege** - Only grant necessary permissions

## Continuous Security Testing

It's recommended to run security tests:
- Before each deployment
- After significant changes to authentication or document handling
- When updating dependencies related to security
- As part of the CI/CD pipeline

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web3 Security Guidelines](https://github.com/ConsenSys/smart-contract-best-practices)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
