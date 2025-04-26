# Authentico Cypress Test Suite

This directory contains end-to-end tests for the Authentico application using Cypress.

## Test Structure

The tests are organized into the following directories:

- `integration/basic/` - Basic tests that work with generic selectors
- `integration/auth/` - Tests for authentication flows
- `integration/document/` - Tests for document management flows
- `integration/organization/` - Tests for organization management flows
- `integration/admin/` - Tests for admin workflows
- `integration/security/` - Tests for security measures
- `fixtures/` - Test data fixtures
- `support/` - Cypress support files and custom commands

## Running Tests

To open Cypress and run tests interactively:

```bash
npm run cypress:open
```

To run all Cypress tests in headless mode:

```bash
npm run cypress:run
```

To run specific test files or directories:

```bash
npm run cypress:run -- --spec "cypress/integration/auth/**/*.spec.ts"
```

### Using the Provided Scripts

We've added batch scripts to make running tests easier:

```bash
# Run basic tests only (these are more likely to pass)
./run-basic-tests.bat

# Run all tests in sequence with better error handling
./run-cypress-tests.bat
```

## Test Fixtures

The test fixtures include:

- `users.json` - Test user data for different user types
- `documents.json` - Test document data with different statuses
- `organizations.json` - Test organization data and applications
- `test-document.pdf` - Sample PDF document for upload tests

## Custom Commands

The test suite includes custom commands to simplify common operations:

- `mockWalletConnection` - Mocks the blockchain wallet connection
- `loginAsIndividual` - Logs in as an individual user
- `loginAsOrganization` - Logs in as an organization user
- `loginAsAdmin` - Logs in as an admin user
- `uploadDocument` - Uploads a document
- `verifyDocument` - Verifies a document (for organization users)
- `applyForVerification` - Applies for organization verification
- `reviewOrganizationApplication` - Reviews an organization application (for admin)

## Test Coverage

The test suite covers the following key areas:

### Basic Tests

- Homepage functionality
- Basic authentication UI
- Document page accessibility
- Responsive design
- Navigation and layout

### Authentication Flows

- Individual and organization user registration
- Wallet-based login
- Session management and logout
- Authorization for different user roles

### Document Management

- Document upload with encryption
- IPFS storage integration
- Blockchain anchoring and transaction verification
- Document status updates and verification flows
- Document sharing and access control

### Organization Management

- Organization verification application
- Application review process
- Document verification permissions

### Admin Dashboard

- Organization application management
- Platform statistics and monitoring
- Document management and audit trails

### Security Measures

- CSRF protection
- XSS prevention
- Rate limiting
- Authorization checks
- Secure headers
- Input validation

## Best Practices

When writing or modifying tests:

1. Use the custom commands to simplify common operations
2. Use fixtures for test data to keep tests consistent
3. Mock API responses to test both success and failure scenarios
4. Test complete user journeys from start to finish
5. Include tests for error handling and edge cases
6. Keep tests independent and avoid dependencies between tests
7. Use resilient selectors that can handle UI changes
8. Implement proper error handling in tests
9. Add fallback strategies when elements aren't found
10. Use longer timeouts for network operations

## Troubleshooting

If tests are failing, check the following:

1. Make sure the application is running at the configured `baseUrl` (http://localhost:3000)
2. Check that the test fixtures match the expected data structure
3. Verify that the selectors used in tests match the actual elements in the application
4. Look for timing issues - increase timeouts if necessary
5. Check for changes in API responses that might affect the tests
6. Review the screenshots in the `cypress/screenshots` directory for visual clues
7. Check if the wallet connection modal is being properly detected
8. Verify that the test is using the correct selectors for your UI components
9. Try running the basic tests first to isolate issues

For more detailed debugging, run tests in interactive mode with `npm run cypress:open`.

### Common Issues and Solutions

#### Modal Detection Issues

If tests are failing with `Expected to find element: 'div[role="dialog"]', but never found it`, check:

- The actual structure of your modal in the DOM
- Try using alternative selectors like `.fixed.inset-0.z-50`
- Use the updated custom commands that handle multiple modal structures

#### Element Interaction Issues

If elements are being covered by other elements:

- Use `{ force: true }` with click operations
- Make sure modals or overlays are properly handled
- Check z-index issues in your CSS

#### Network Request Timeouts

If tests are timing out waiting for network requests:

- Increase the timeout values in the wait commands
- Make sure your API mocks are correctly configured
- Check that the API endpoints match what the application is actually calling
