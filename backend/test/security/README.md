# Authentico Backend Security Testing Suite

This directory contains comprehensive security tests for the Authentico backend services and API endpoints. The tests focus on security-critical features like wallet-based authentication, document encryption, and blockchain interactions.

## Test Structure

The security tests are organized by component and security concern:

### Authentication & Authorization
- `authMiddleware.test.js` - Tests for authentication middleware
- `tokenValidation.test.js` - Tests for JWT token validation and security
- `authRoutes.test.js` - Tests for authentication API endpoints

### Document Security
- `EncryptionService.test.js` - Tests for document encryption/decryption
- `documentSecurity.test.js` - Tests for document security features
- `documentRoutes.test.js` - Tests for document API endpoints

### API Security
- `rateLimiting.test.js` - Tests for rate limiting middleware
- `securityHeaders.test.js` - Tests for security headers middleware
- `inputValidation.test.js` - Tests for input validation and sanitization

### Service Integration
- `StorageService.test.js` - Tests for IPFS/Pinata interactions
- `BlockchainService.test.js` - Tests for blockchain interactions
- `NotificationService.test.js` - Tests for notification service security

## Running Tests

You can run the tests using the following npm scripts:

```bash
# Run all security tests
npm run test:security

# Run specific test categories
npm run test:security:auth        # Authentication tests
npm run test:security:document    # Document security tests
npm run test:security:api         # API security tests
npm run test:security:services    # Service integration tests

# Run with coverage report
npm run test:coverage
```

## Test Utilities

The tests use utilities from:
- `test/utils/securityTestUtils.js` - Security-specific test utilities
- `test/mocks/services.js` - Mock implementations of services

## Security Features Tested

### Authentication & Authorization
- Wallet-based authentication flows
- JWT token validation and management
- Access control for protected endpoints
- Session management security

### Document Security
- Document encryption/decryption using AES-256
- IPFS storage validation
- Blockchain transaction security
- Document hash verification

### API Security
- Input validation for all routes
- Rate limiting implementation
- CSRF protection
- Security headers validation

### Service Integration
- Firebase Admin SDK interactions
- Pinata IPFS storage operations
- Blockchain service reliability
- Notification service security

## Adding New Tests

To add new security tests:

1. Create a new test file in this directory
2. Import the necessary utilities and mocks
3. Write tests that focus on security aspects
4. Run the tests to ensure they pass

## Best Practices

When writing security tests:

- Focus on edge cases and potential attack vectors
- Test both positive and negative scenarios
- Ensure proper error handling
- Validate that sensitive data is properly protected
- Test for common security vulnerabilities (OWASP Top 10)

## Environment Setup

The tests use environment variables defined in `test/setupEnv.js`. Make sure this file is properly configured before running the tests.
