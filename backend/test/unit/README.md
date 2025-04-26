# Authentico Backend Unit Tests

This directory contains unit tests for the Authentico backend components. Unit tests focus on testing individual components in isolation, mocking any dependencies.

## Directory Structure

- `services/` - Tests for service classes (EncryptionService, StorageService, BlockchainService, etc.)
- `routes/` - Tests for API routes (documentRoutes, orgRoutes, authRoutes, etc.)
- `middleware/` - Tests for middleware functions (authMiddleware, rateLimiting, etc.)
- `utils/` - Tests for utility functions

## Running Tests

To run all unit tests:

```bash
npm run test:unit
```

To run tests for a specific component:

```bash
npx jest test/unit/services/EncryptionService.test.js
```

## Writing Unit Tests

When writing unit tests:

1. Focus on testing a single function, class, or module in isolation
2. Mock all dependencies to isolate the unit being tested
3. Test all possible inputs, outputs, and edge cases
4. Test error handling and validation
5. Aim for high code coverage

## Example Test Structure

```javascript
describe('ServiceName', () => {
  // Setup before tests
  beforeEach(() => {
    // Reset mocks, create test data, etc.
  });

  // Group tests by method/functionality
  describe('methodName', () => {
    test('should handle valid input correctly', async () => {
      // Arrange - set up test data
      // Act - call the method
      // Assert - verify the results
    });

    test('should handle invalid input correctly', async () => {
      // Arrange
      // Act
      // Assert
    });

    test('should handle edge cases', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```
