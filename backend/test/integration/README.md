# Authentico Backend Integration Tests

This directory contains integration tests for the Authentico backend. Integration tests focus on testing the interaction between multiple components, ensuring they work together correctly.

## Directory Structure

- `api/` - Tests for API endpoints, testing the full request-response cycle
- `services/` - Tests for service interactions, testing how services work together

## Running Tests

To run all integration tests:

```bash
npm run test:integration
```

To run tests for a specific integration area:

```bash
npx jest test/integration/api/documents.test.js
```

## Writing Integration Tests

When writing integration tests:

1. Focus on testing the interaction between components
2. Use supertest for API endpoint testing
3. Mock external dependencies (like blockchain, IPFS) but not internal ones
4. Test complete workflows (e.g., document upload → verification → retrieval)
5. Test error handling and edge cases in integrated scenarios

## Example Test Structure

```javascript
describe('Document API Integration', () => {
  // Setup before tests
  beforeEach(() => {
    // Reset mocks, create test data, etc.
  });

  // Test complete workflows
  test('should upload, process, and retrieve a document', async () => {
    // Arrange - set up test data
    
    // Act - perform the complete workflow
    // 1. Upload document
    // 2. Process document
    // 3. Retrieve document
    
    // Assert - verify the results at each step
  });

  // Test error handling
  test('should handle errors in the document processing workflow', async () => {
    // Arrange - set up test data with error condition
    
    // Act - perform the workflow that will encounter an error
    
    // Assert - verify error handling
  });
});
```
