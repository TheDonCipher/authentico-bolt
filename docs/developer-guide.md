# Authentico Developer Guide

This guide provides information for developers working on the Authentico project. It covers the project structure, key components, and common development tasks.

## Project Overview

Authentico is a blockchain-based document verification platform that allows users to upload, verify, and share documents securely. It uses the following technologies:

- **Frontend**: Next.js, React, TypeScript
- **Backend**: Node.js, Express
- **Database**: Firebase Firestore
- **Blockchain**: Ethereum (Sepolia testnet)
- **Storage**: IPFS/Pinata
- **Authentication**: Firebase Authentication, Wallet Connect

## Project Structure

The project is organized into the following directories:

- `frontend`: Next.js frontend application
  - `app`: Next.js app directory
    - `components`: React components
    - `contexts`: React contexts
    - `hooks`: Custom React hooks
    - `styles`: CSS styles
  - `lib`: Utility functions and services
    - `api`: API client and related utilities
    - `services`: Service classes for business logic
    - `validation`: Validation utilities
  - `public`: Static assets
  - `test`: Test files
- `backend`: Express backend application
  - `controllers`: Request handlers
  - `middleware`: Express middleware
  - `models`: Data models
  - `routes`: API routes
  - `services`: Business logic
  - `utils`: Utility functions
- `minimal-hardhat`: Hardhat project for smart contracts
  - `contracts`: Solidity smart contracts
  - `scripts`: Deployment scripts
  - `test`: Contract test files
- `docs`: Documentation files

## Key Components

### API Client

The API client provides a secure way to make API requests. It handles authentication, CSRF protection, rate limiting, and error handling.

```typescript
import { get, post, put, del, uploadFile } from '../lib/api/secure-api-client';

// Make a GET request
const user = await get('/auth/me');

// Make a POST request
const response = await post('/auth/login', { email, password });

// Make a PUT request
const updatedUser = await put('/auth/profile', { name: 'New Name' });

// Make a DELETE request
await del('/documents/123');

// Upload a file
const result = await uploadFile('/documents/upload', formData);
```

### Service Classes

Service classes provide business logic for different parts of the application. They use dependency injection to make them more testable.

```typescript
import { authService, documentService } from '../lib/services/service-factory';

// Use the authentication service
const user = await authService.loginWithEmailPassword(email, password);

// Use the document service
const document = await documentService.getDocumentById('123');
```

### Error Handling

The application uses custom error types for better error handling. It also provides utilities for converting errors and displaying user-friendly error messages.

```typescript
import { ValidationError, AuthenticationError } from '../lib/api/error-types';

try {
  // Do something that might throw an error
  await authService.loginWithEmailPassword(email, password);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
    console.error('Validation error:', error.message);
  } else if (error instanceof AuthenticationError) {
    // Handle authentication error
    console.error('Authentication error:', error.message);
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

## Common Development Tasks

### Adding a New API Endpoint

1. Add the endpoint to the backend:
   - Create a new controller function in `backend/controllers`
   - Add a new route in `backend/routes`
   - Add any necessary middleware in `backend/middleware`

2. Add the endpoint to the frontend:
   - Create a new method in the appropriate service class in `frontend/lib/services`
   - Use the API client to make the request

### Adding a New Component

1. Create a new component file in `frontend/app/components`
2. Import and use the component in other components or pages
3. Add tests for the component in `frontend/test/components`

### Adding a New Page

1. Create a new page file in `frontend/app`
2. Add the page to the navigation if necessary
3. Add tests for the page in `frontend/test/pages`

### Adding a New Service

1. Create a new service class in `frontend/lib/services`
2. Add the service to the service factory in `frontend/lib/services/service-factory.ts`
3. Add tests for the service in `frontend/test/lib/services`

### Running Tests

```bash
# Run all tests
npm run test:all

# Run specific tests
npm test -- test/lib/validation-util.test.ts

# Run tests with coverage
npm run test:coverage
```

### Building and Deploying

```bash
# Build the frontend
cd frontend
npm run build

# Build the backend
cd backend
npm run build

# Deploy to Vercel (frontend)
cd frontend
vercel

# Deploy to Render (backend)
cd backend
npm run deploy
```

## Best Practices

### Code Style

- Use TypeScript for type safety
- Use ESLint and Prettier for code formatting
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use meaningful variable and function names
- Add JSDoc comments to functions and classes

### Testing

- Write unit tests for all functions and components
- Write integration tests for API endpoints
- Write end-to-end tests for user flows
- Use Jest and React Testing Library for testing
- Aim for high test coverage

### Error Handling

- Use custom error types for better error handling
- Provide user-friendly error messages
- Log errors for debugging
- Handle errors at the appropriate level
- See the [Error Handling Guidelines](./error-handling-guidelines.md) for more details

### Security

- Validate all user input
- Use CSRF protection for API requests
- Use rate limiting to prevent abuse
- Use secure storage for sensitive data
- Follow the [OWASP Top 10](https://owasp.org/www-project-top-ten/) security guidelines

## Troubleshooting

### Common Issues

- **API requests failing**: Check that you're using the correct API endpoint and that you're authenticated
- **Tests failing**: Check that you're using the correct mock implementations
- **Build failing**: Check for TypeScript errors and missing dependencies
- **Deployment failing**: Check that you have the correct environment variables

### Getting Help

- Check the [documentation](./README.md)
- Check the [error handling guidelines](./error-handling-guidelines.md)
- Ask for help in the team chat
- Create an issue on GitHub

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Ethereum Documentation](https://ethereum.org/en/developers/docs/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [Pinata Documentation](https://docs.pinata.cloud/)
