# Authentico Backend Tests

## Overview

This directory contains comprehensive test suites for the Authentico backend services. The tests are organized into different categories to ensure thorough coverage of all backend functionalities, from individual components to end-to-end workflows.

## Test Structure

The test directory is organized into the following subdirectories:

- `unit/`: Tests for individual components in isolation
- `integration/`: Tests for interactions between components
- `security/`: Tests focused on security aspects
- `e2e/`: End-to-end tests for complete workflows
- `mocks/`: Mock implementations for testing
- `utils/`: Utility functions for testing

## Test Categories

### Unit Tests

Unit tests focus on testing individual components in isolation, mocking any dependencies. These tests ensure that each component functions correctly on its own.

**Directory**: `test/unit/`

**Key Test Files**:
- `services/EncryptionService.test.js`: Tests for the encryption and decryption functionality
- `services/StorageService.test.js`: Tests for IPFS storage via Pinata
- `services/BlockchainService.test.js`: Tests for blockchain interactions
- `utils/validators.test.js`: Tests for input validation functions

**Running Unit Tests**:
```bash
npm run test:unit
```

### Integration Tests

Integration tests verify that different components work together correctly. These tests focus on the interactions between services, controllers, and external dependencies.

**Directory**: `test/integration/`

**Key Test Files**:
- `routes/documentRoutes.test.js`: Tests for document API endpoints
- `routes/authRoutes.test.js`: Tests for authentication API endpoints
- `routes/organizationRoutes.test.js`: Tests for organization API endpoints
- `services/DocumentService.test.js`: Tests for document service with real dependencies

**Running Integration Tests**:
```bash
npm run test:integration
```

### Security Tests

Security tests focus on identifying and preventing security vulnerabilities in the application. These tests cover aspects such as input validation, authentication, authorization, and data protection.

**Directory**: `test/security/`

**Key Test Files**:
- `auth/tokenValidation.test.js`: Tests for token validation and authentication
- `api/inputValidation.test.js`: Tests for API input validation
- `encryption/documentEncryption.test.js`: Tests for document encryption security
- `api/rateLimit.test.js`: Tests for API rate limiting

**Running Security Tests**:
```bash
npm run test:security
```

### End-to-End Tests

End-to-end tests verify complete workflows from start to finish, ensuring that all components work together correctly in real-world scenarios.

**Directory**: `test/e2e/`

**Key Test Files**:
- `document/uploadVerifyFlow.test.js`: Tests for the complete document upload and verification flow
- `organization/verificationFlow.test.js`: Tests for the organization verification flow
- `auth/registrationLoginFlow.test.js`: Tests for the user registration and login flow

**Running E2E Tests**:
```bash
npm run test:e2e
```

## Mock Implementations

The `test/mocks/` directory contains mock implementations of services and dependencies used in testing. These mocks simulate the behavior of real services without actually calling external APIs or services.

**Key Mock Files**:
- `services.js`: Mock implementations of backend services
- `firebase.js`: Mock implementation of Firebase services
- `pinata.js`: Mock implementation of Pinata IPFS service
- `blockchain.js`: Mock implementation of blockchain service

## Test Utilities

The `test/utils/` directory contains utility functions and helpers used across different test suites.

**Key Utility Files**:
- `testUtils.js`: General utility functions for testing
- `securityTestUtils.js`: Utilities for security testing
- `fixtureLoader.js`: Utilities for loading test fixtures
- `dbSetup.js`: Utilities for setting up test databases

## Running Tests

### Running All Tests

To run all tests:

```bash
npm run test
```

### Running Specific Test Suites

To run specific test suites:

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run security tests
npm run test:security

# Run end-to-end tests
npm run test:e2e
```

### Running Individual Test Files

To run individual test files:

```bash
npx jest test/unit/services/EncryptionService.test.js
```

### Running Tests with Coverage

To run tests with coverage reporting:

```bash
npm run test:coverage
```

## Continuous Integration

Tests are automatically run as part of the continuous integration (CI) pipeline. The CI pipeline is configured to run the simplified and edge case tests and generate a coverage report for each pull request and merge to the main branch.

The CI pipeline uses the `npm run test:complete` script, which runs the simplified and edge case tests with coverage. This ensures that the core functionality is tested reliably without being affected by potentially flaky tests.

The CI pipeline will fail if any tests fail or if the coverage falls below the configured threshold.

## Recommended Workflow

For day-to-day development, we recommend using the following workflow:

1. Write unit tests for new components or features
2. Run unit tests to ensure individual components work correctly
3. Write integration tests for component interactions
4. Run integration tests to ensure components work together correctly
5. Write security tests for security-critical features
6. Run security tests to ensure security requirements are met
7. Write end-to-end tests for complete workflows
8. Run end-to-end tests to ensure the entire system works correctly
9. Run all tests with coverage to ensure adequate test coverage

## Writing Tests

When writing tests, follow these guidelines:

1. **Isolation**: Unit tests should test components in isolation, mocking all dependencies
2. **Coverage**: Aim for high test coverage, especially for critical components
3. **Edge Cases**: Test edge cases and error conditions
4. **Security**: Include security tests for security-critical features
5. **Performance**: Consider performance implications in integration and end-to-end tests
6. **Readability**: Write clear, readable tests with descriptive names
7. **Maintainability**: Keep tests maintainable by using common utilities and patterns

## Environment Variables

Tests may require specific environment variables to be set. These variables can be set in a `.env.test` file in the project root directory. The test runner will automatically load these variables.

Key environment variables for testing:

- `MASTER_KEY_SECRET`: A 32-character string used for encryption testing
- `PINATA_JWT`: A valid Pinata JWT for IPFS testing
- `BLOCKCHAIN_RPC_URL`: A valid Ethereum RPC URL for blockchain testing
- `SPONSOR_WALLET_PRIVATE_KEY`: A valid Ethereum private key for blockchain testing

For security tests, additional environment variables may be required. Refer to the specific test files for details.

## Troubleshooting

If tests are failing, check the following:

1. **Environment Variables**: Ensure all required environment variables are set
2. **Dependencies**: Ensure all dependencies are installed
3. **Mocks**: Check that mock implementations are working correctly
4. **External Services**: For integration and end-to-end tests, ensure external services are available
5. **Test Data**: Ensure test data is correctly set up

For specific test failures, refer to the error messages and test logs for details.

## Contributing

When contributing new tests or modifying existing tests, follow these guidelines:

1. **Follow Existing Patterns**: Follow the existing test patterns and organization
2. **Document Tests**: Document the purpose and requirements of tests
3. **Keep Tests Fast**: Optimize tests for speed, especially unit tests
4. **Avoid Flaky Tests**: Avoid tests that may fail intermittently
5. **Test Real Behavior**: Test the actual behavior of components, not implementation details

For more information on contributing to the Authentico project, refer to the [CONTRIBUTING.md](../../docs/CONTRIBUTING.md) file.
