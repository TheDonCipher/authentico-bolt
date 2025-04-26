# Running Authentico Backend Tests

This document provides instructions for running the Authentico backend tests.

## Quick Start

### Run All Tests

To run all tests, including simplified tests, edge case tests, unit tests, integration tests, and generate a coverage report:

```bash
# Using npm script
npm run test:complete

# Using PowerShell script (Windows)
.\run-all-tests.ps1

# Using Bash script (Linux/macOS)
./run-all-tests.sh
```

### Run Specific Test Suites

```bash
# Run only simplified tests (faster, more reliable)
npm run test:simplified

# Run only edge case tests
npm run test:edge

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only security tests
npm run test:security

# Generate coverage report
npm run test:coverage
```

## Test Categories

### Simplified Tests

These tests are simplified versions of the full test suite. They are faster and more reliable, making them ideal for quick verification during development.

```bash
npm run test:simplified
```

### Edge Case Tests

These tests focus on edge cases and unusual inputs to ensure the application handles them correctly.

```bash
npm run test:edge
```

### Unit Tests

Unit tests verify that individual components work correctly in isolation.

```bash
# Run all unit tests
npm run test:unit

# Run only service unit tests
npm run test:unit:services

# Run only route unit tests
npm run test:unit:routes

# Run only middleware unit tests
npm run test:unit:middleware
```

### Integration Tests

Integration tests verify that different components work together correctly.

```bash
# Run all integration tests
npm run test:integration

# Run only API integration tests
npm run test:integration:api

# Run only service integration tests
npm run test:integration:services
```

### Security Tests

Security tests focus on verifying that the application is secure against common vulnerabilities.

```bash
npm run test:security
```

## Running Individual Test Files

To run a specific test file:

```bash
npx jest path/to/test/file.test.js
```

For example:

```bash
npx jest test/unit/services/EncryptionService.test.js
```

## Test Options

### Watch Mode

To run tests in watch mode (automatically re-run when files change):

```bash
npm test -- --watch
```

### Verbose Output

To run tests with verbose output:

```bash
npm test -- --verbose
```

### Filter Tests

To run only tests that match a pattern:

```bash
npm test -- -t "pattern"
```

For example, to run only tests with "encrypt" in the name:

```bash
npm test -- -t "encrypt"
```

## Troubleshooting

### Tests Failing Due to Timeouts

If tests are failing due to timeouts, you can increase the timeout:

```bash
npm test -- --testTimeout=60000
```

This sets the timeout to 60 seconds.

### Tests Hanging

If tests are hanging, you can force them to exit after completion:

```bash
npm test -- --forceExit
```

### Memory Issues

If you're experiencing memory issues when running tests, you can limit the number of workers:

```bash
npm test -- --maxWorkers=2
```

## Continuous Integration

The tests are automatically run in the CI/CD pipeline using GitHub Actions. The workflow is defined in `.github/workflows/backend-tests.yml`.

To run the same tests that are run in CI locally:

```bash
npm run test:all
```
