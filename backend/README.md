# Authentico Backend Service - Node.js with Express.js

## Overview

The Authentico Backend Service is a critical component of the Authentico platform, developed using Node.js and Express.js. It delivers essential backend functionalities, including secure user authentication, comprehensive document and organization verification processes, robust API security measures, and seamless Pinata IPFS integration for decentralized storage solutions. Engineered for scalability, security, and high performance, it robustly supports the frontend application, ensuring a dependable and efficient platform experience.

### Key Features

- **Enhanced Security Framework**: Employs Firebase Authentication for secure user registration, login, and session management. Utilizes JWT for API security and implements role-based access control to efficiently manage and enforce user permissions.
- **Advanced Document Management System**: Provides RESTful APIs for secure document upload, efficient retrieval, and decentralized storage via Pinata IPFS. Features include document versioning, comprehensive metadata management, and granular access controls to ensure data integrity and security.
- **Streamlined Organization Verification Workflow**: Manages the entire lifecycle of organization verification, from initial request submission to final verification completion. Integrates automated and manual verification steps, ensures secure handling of sensitive data, and maintains detailed, auditable trails of all verification activities.
- **Robust API Security and Token Management**: Implements JWT (JSON Web Tokens) for strong API security, including functionalities to generate, verify, and manage API tokens. Incorporates rate limiting, CORS policies, and comprehensive protection mechanisms against common web vulnerabilities to safeguard API access.
- **Comprehensive REST API**: Offers a suite of well-documented RESTful API endpoints designed for seamless integration with frontend and admin interfaces. Covers essential functionalities for managing documents, organizations, users, tokens, and verifications.
- **Proactive Health Monitoring and Detailed Logging**: Includes a dedicated `/api/health` endpoint for immediate service health status checks. Implements detailed logging using Winston to capture API requests, errors, and critical system events.
- **Blockchain Integration**: Connects to the Ethereum blockchain (Sepolia testnet) via ethers.js for document anchoring and verification.
- **Document Encryption**: Implements AES-256 encryption for secure document storage and transmission.
- **Real-time Communication Capabilities**: Enables real-time updates and notifications through WebSocket communication, significantly enhancing user experience and system responsiveness by providing immediate feedback and updates.

### Technology Stack

**Core Framework**
- **Node.js**: Foundational JavaScript runtime for scalable backend services.
- **Express.js**: Minimalist Node.js web framework for robust REST APIs.

**Database & Storage**
- **Firebase Firestore**: NoSQL database for storing user profiles, document metadata, and organization details.
- **Firebase Admin SDK**: For secure user management and data handling.
- **Pinata IPFS API**: For decentralized document storage.

**Blockchain Integration**
- **ethers.js**: Library for interacting with the Ethereum blockchain.
- **Sepolia Testnet**: Ethereum testnet for development and testing.

**Security & Utilities**
- **JWT (jsonwebtoken)**: For API security and token management.
- **helmet**: Security middleware for protection against web vulnerabilities.
- **cors**: For Cross-Origin Resource Sharing (CORS) support.
- **dotenv**: For environment variable management.
- **axios**: HTTP client for external API requests.
- **crypto**: Node.js crypto module for encryption/decryption.

**Testing & Logging**
- **jest**: JavaScript testing framework for unit and integration tests.
- **supertest**: HTTP assertions for testing.
- **Winston**: Versatile logging library for application monitoring.

## Getting Started

### Prerequisites

- **Node.js (>=18.x) and npm (>=8.x) or yarn (>=1.22)**: Ensure that Node.js version 18 or higher and npm version 8 or higher (or yarn version 1.22 or higher) are installed on your system.
- **Firebase Project**: A Firebase project must be set up with Authentication and Firestore enabled. Obtain the service account JSON file for Firebase Admin SDK integration.
- **Pinata Account**: A Pinata account is required for IPFS integration. You will need your Pinata API Key, Secret, and JWT.
- **Ethereum Wallet**: A wallet with Sepolia testnet ETH for blockchain interactions.

### Environment Setup

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd authentico
   ```

2. **Copy Configuration Template**:
   ```bash
   cp config/development.env.example backend/.env
   ```

3. **Configure `.env`**:
   Modify the `.env` file in the `backend/` directory to configure Firebase, Pinata API, and other essential environment variables.

   **Environment Variables**:
   
   Refer to `config/development.env.example` and `config/production.env.example` for example configurations.

   **Firebase Configuration**
   - `FIREBASE_PROJECT_ID`: Firebase project ID.
   - `FIREBASE_PRIVATE_KEY`: Firebase private key (base64 encoded).
   - `FIREBASE_CLIENT_EMAIL`: Firebase client email.

   **Pinata Configuration**
   - `PINATA_JWT`: Pinata API JWT.
   - `PINATA_API_KEY`: Pinata API Key.
   - `PINATA_API_SECRET`: Pinata API Secret.
   - `GATEWAY_URL`: Pinata gateway URL.

   **Security**
   - `MASTER_KEY_SECRET`: 32-character secret key for AES-256 encryption.

   **Server Configuration**
   - `PORT`: Server port (default: `8080`).
   - `NODE_ENV`: Environment mode (`development` or `production`).

   **Blockchain Configuration**
   - `BLOCKCHAIN_RPC_URL`: Ethereum RPC URL.
   - `SPONSOR_WALLET_PRIVATE_KEY`: Sponsor wallet private key.
   - `CONTRACT_ADDRESS`: Address of the deployed smart contract.
   - `SEPOLIA_CHAIN_ID`: Sepolia testnet chain ID (default: `11155111`).

   **Security Configuration Notes**:
   - `MASTER_KEY_SECRET`: This secret must be exactly 32 characters to ensure the security of AES-256 encryption. Generate a strong, unique key.
   - `FIREBASE_PRIVATE_KEY`: Ensure the Firebase private key is correctly base64 encoded to prevent integration issues and maintain security.

### Installation

1. **Install Dependencies**:
   From the project root directory, run:
   ```bash
   npm install
   ```
   
   or from the backend directory:
   ```bash
   cd backend
   npm install
   ```

## Development and Usage

### Run in Development Mode

To start the backend service in development mode, execute the following command from the project root directory:
```bash
npm run dev:backend
```

or from the backend directory:
```bash
cd backend
npm run dev
```

This command starts the server at `http://localhost:<PORT>` (default port is 8080). The server is configured for hot-reloading, automatically restarting upon file changes to streamline development.

### API Endpoints

The backend service offers a comprehensive suite of API endpoints for managing users, documents, organizations, and verifications. Below is a detailed list of available endpoints:

**Authentication**
- `POST /api/auth/register`: Registers a new user in the system.
- `POST /api/auth/login`: Authenticates an existing user and returns a session token.
- `POST /api/auth/logout`: Logs out the current user.
- `GET /api/auth/me`: Retrieves the current user's profile.
- `POST /api/auth/verify-token`: Verifies the validity of an authentication token.

**Documents**
- `POST /api/documents/upload`: Uploads a document to IPFS and stores metadata (requires authentication).
- `GET /api/documents`: Retrieves a list of documents associated with the authenticated user (requires authentication).
- `GET /api/documents/:documentId`: Retrieves a specific document by its ID (requires authentication).
- `DELETE /api/documents/:documentId`: Deletes a document by its ID (admin or document owner, requires authentication).
- `PUT /api/documents/:documentId/verify`: Updates the verification status of a document (admin or verifying organization, requires authentication).
- `GET /api/documents/shared/:shareId`: Retrieves a shared document using its share ID (publicly accessible).

**Organizations**
- `POST /api/organizations/apply`: Submits an organization verification application (requires authentication).
- `GET /api/organizations/verified`: Retrieves a list of verified organizations (publicly accessible).
- `GET /api/organizations/:organizationId`: Retrieves detailed information for a specific organization by ID (publicly accessible).
- `PUT /api/organizations/:organizationId`: Updates information for a specific organization (admin only, requires authentication).
- `DELETE /api/organizations/:organizationId`: Deletes an organization by its ID (admin only, requires authentication).
- `PUT /api/organizations/:organizationId/verify`: Updates the verification status of an organization (admin only, requires authentication).

**Verification**
- `POST /api/verify/document`: Initiates the document verification process (requires authentication).
- `GET /api/verify/document/:verificationId`: Retrieves the verification status of a document using its verification ID (requires authentication).
- `PUT /api/verify/document/:verificationId`: Updates the verification status of a document (admin or verifying organization, requires authentication).
- `POST /api/verify/organization`: Initiates the organization verification process (requires authentication).
- `GET /api/verify/organization/:verificationId`: Retrieves the verification status of an organization using its verification ID (publicly accessible).
- `PUT /api/verify/organization/:verificationId`: Updates the verification status of an organization (admin only, requires authentication).

**Admin**
- `GET /api/admin/users`: Retrieves a list of all users in the system (admin only, requires authentication).
- `GET /api/admin/users/:userId`: Retrieves detailed information for a specific user by ID (admin only, requires authentication).
- `DELETE /api/admin/users/:userId`: Deletes a user by their ID (admin only, requires authentication).
- `GET /api/admin/organizations`: Retrieves a list of all organizations in the system (admin only, requires authentication).
- `GET /api/admin/documents`: Retrieves a list of all documents in the system (admin only, requires authentication).
- `GET /api/admin/system-health`: Retrieves system health information (admin only, requires authentication).

**Health Check**
- `GET /api/health`: A public endpoint for checking the service's health status.

**Endpoint Notes**:
- Authentication is handled via Firebase ID tokens passed in the `Authorization` header.
- Admin endpoints are restricted to users with the admin role.
- Organization verification endpoints are restricted to verified organizations.

### Project Structure

The backend service is organized into the following directory structure:

```
backend/
├── controllers/     # Request handlers for different API endpoints
├── middleware/      # Express middleware for authentication, error handling, etc.
├── models/          # Data models and schemas
├── routes/          # API route definitions
│   ├── authRoutes.js
│   ├── documentRoutes.js
│   ├── organizationRoutes.js
│   └── verificationRoutes.js
├── services/        # Business logic and external service integrations
│   ├── BlockchainService.js
│   ├── EncryptionService.js
│   ├── StorageService.js
│   └── VerificationService.js
├── utils/           # Utility functions and helpers
├── test/            # Test files
│   ├── unit/        # Unit tests
│   ├── integration/ # Integration tests
│   └── security/    # Security tests
├── index.js         # Main application entry point
└── package.json     # Dependencies and scripts
```

### Integrations

- **Firebase**: Provides comprehensive authentication services and backend functionalities via the Firebase Admin SDK.
- **Pinata**: Enables decentralized and secure document storage using IPFS.
- **Ethereum Blockchain**: Anchors document metadata and verification status on the Sepolia testnet.

## Testing

The Authentico Backend includes a comprehensive test suite to ensure code reliability, functionality, and security. The tests are organized into several categories:

- **Unit Tests**: Test individual components in isolation, such as services and utility functions.
- **Integration Tests**: Test the interaction between different parts of the application, such as API endpoints and database operations.
- **Security Tests**: Test for potential security vulnerabilities, such as input validation, authentication, and authorization.

To run the tests, use the following commands:

```bash
# Run all tests
npm run test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run security tests
npm run test:security

# Run tests with coverage report
npm run test:coverage
```

## Deployment

The Authentico Backend can be deployed to various hosting platforms, with Render being the recommended option for Node.js applications.

### Render Deployment

1. **Prepare for Deployment**:
   ```bash
   npm run build
   ```

2. **Deploy to Render**:
   ```bash
   npm run deploy:render
   ```

   Alternatively, you can deploy directly from the Render dashboard by connecting your GitHub repository.

3. **Environment Variables**:
   Make sure to set all the required environment variables in the Render dashboard.

### Docker Deployment

The Authentico Backend can also be deployed using Docker:

```bash
# Build the Docker image
docker build -t authentico-backend -f Dockerfile --target backend-prod .

# Run the Docker container
docker run -p 8080:8080 authentico-backend
```

For more detailed deployment instructions, refer to the [DEPLOYMENT_GUIDE.md](../docs/DEPLOYMENT_GUIDE.md) in the project documentation.

## Contribution

Contributions to the Authentico Backend Service are highly encouraged. Please adhere to the following guidelines when contributing:

- **Coding Standards**: Maintain code consistency by following ESLint configurations and project-specific coding conventions. Ensure code is clean, well-commented, and adheres to project standards.
- **Commit Messages**: Write clear, concise, and descriptive commit messages, following a conventional format to ensure a well-documented and easily understandable commit history.
- **Testing**: Develop comprehensive unit and integration tests for all new features and changes. Aim for high test coverage to ensure the reliability and stability of the codebase.
- **Pull Requests**: Submit well-structured pull requests with detailed descriptions of the changes. Ensure pull requests are focused and address specific issues or features. All pull requests will undergo review by project maintainers before merging.
- **Documentation**: Update all relevant documentation, including API documentation, README files, and any other pertinent documentation, to accurately reflect changes in code or functionality.

For more detailed contribution guidelines, please refer to [CONTRIBUTING.md](../docs/CONTRIBUTING.md) in the project documentation.

## License

The Authentico Backend Service is proprietary software. License details are available in the `LICENSE` file. All rights reserved under the Authentico license.
