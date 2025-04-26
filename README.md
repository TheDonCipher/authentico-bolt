# Authentico

Authentico is a comprehensive document verification platform leveraging blockchain technology for secure and verifiable document management. Built as a monorepo with npm workspaces, it features a Next.js 14 frontend with App Router, a Node.js/Express backend, and Ethereum smart contracts deployed on the Sepolia testnet.

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Setup](#setup)
4. [Core Commands](#core-commands)
5. [Environment Variables](#environment-variables)
6. [Development](#development)
7. [Testing](#testing)
8. [Security Features](#security-features)
9. [Deployment](#deployment)
10. [Contributing](#contributing)

## Overview

Authentico provides a trustless, decentralized solution for document verification that:

- **Eliminates centralized authorities** for document verification
- **Reduces fraud** through immutable blockchain records
- **Simplifies document sharing** via secure links and QR codes
- **Protects document privacy** through end-to-end AES-256 encryption
- **Creates a network** of verified organizations that can validate documents

### Key Features

- **Secure Document Upload**: Users can upload documents that are encrypted and stored on IPFS via Pinata
- **Blockchain Anchoring**: Document metadata and hashes are anchored on the Ethereum Sepolia testnet
- **Document Verification**: Verified organizations can review and verify documents
- **Organization Verification**: Organizations can apply for verification status to become document verifiers
- **Secure Document Sharing**: Users can share verified documents via links and QR codes
- **Document Viewing**: Secure viewing of encrypted documents with proper authorization

## Project Structure

The Authentico project uses npm workspaces to manage the following packages:

```
authentico/
├── frontend/         # Next.js 14 application (App Router)
│   ├── app/          # Pages and components
│   ├── components/   # Reusable UI components
│   ├── lib/          # Utility functions and services
│   ├── public/       # Static assets
│   ├── test/         # Test files
│   ├── package.json  # Frontend dependencies
│   └── next.config.js # Next.js configuration
├── backend/          # Node.js backend service (Express)
│   ├── controllers/  # Request handlers
│   ├── middleware/   # Express middleware
│   ├── models/       # Data models
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── test/         # Test files
│   ├── index.js      # Main server file
│   └── package.json  # Backend dependencies
├── minimal-hardhat/  # Ethereum smart contracts (Hardhat)
│   ├── contracts/    # Solidity smart contracts
│   ├── scripts/      # Deployment scripts
│   ├── test/         # Contract test files
│   └── package.json  # Smart contract dependencies
├── scripts/          # Utility scripts for the project
├── docs/             # Project documentation
├── package.json      # Root package configuration & workspaces
├── tsconfig.json     # Root TypeScript configuration
├── docker-compose.yml # Docker Compose configuration
├── Dockerfile        # Root Dockerfile for multi-stage builds
└── README.md         # This file
```

- `frontend/`: Contains the Next.js user interface with components, contexts, and hooks.
- `backend/`: Contains the Node.js API service handling business logic, Firebase integration, and Pinata interaction.
- `minimal-hardhat/`: Contains the Solidity smart contracts and related scripts/tests.
- `scripts/`: Contains utility scripts for environment setup, deployment, and testing.
- `docs/`: Contains detailed documentation for various aspects of the project.
- Root-level files configure the monorepo, TypeScript, Docker, etc.

## Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd authentico
   ```

2. **Install dependencies:**
   Run the following command from the root directory. It will install dependencies for all workspaces (`frontend`, `backend`, `minimal-hardhat`).
   ```bash
   npm install
   ```

## Core Commands

These commands should be run from the **root** directory:

- `npm install` or `npm run install:all`: Installs all dependencies for all workspaces.
- `npm run dev`: Starts the frontend and backend in development mode.
- `npm run build`: Builds the frontend and backend for production.
- `npm run test`: Runs tests across all workspaces.
- `npm run format`: Formats code using Prettier.

## Environment Variables

Environment variables are crucial for configuring services like Firebase, Pinata, blockchain connections, and encryption.

### Setting Up Environment Variables

1. Copy the example environment files to create your own `.env` files:

   ```bash
   # Root directory
   cp .env.example .env

   # Frontend directory
   cp frontend/.env.example frontend/.env

   # Backend directory
   cp backend/.env.example backend/.env
   ```

2. Fill in the required values in each `.env` file. The example files contain placeholders and comments explaining each variable.

3. Validate your environment setup using:
  ```bash
  npm run validate:env
  ```

### Important Notes

- **Security**: Environment files (`.env`) are excluded from Git to prevent exposing sensitive information.
- **Required Variables**: Some variables are required for specific functionality:
  - `MASTER_KEY_SECRET`: Must be exactly 32 characters for AES-256 encryption
  - `BLOCKCHAIN_RPC_URL`: Ethereum RPC URL for blockchain interactions
  - `SPONSOR_WALLET_PRIVATE_KEY`: Private key for the sponsor wallet
  - Firebase and Pinata credentials
- **Frontend vs Backend**: Some variables need to be defined in both frontend and backend environments with different prefixes:
  - Backend: `GATEWAY_URL`, `PINATA_JWT`
  - Frontend: `NEXT_PUBLIC_GATEWAY_URL`, `NEXT_PUBLIC_PINATA_JWT`

Refer to `config/*.env.example` files and `docs/ENVIRONMENT_SETUP.md` for detailed information about environment variables.

### Files Not to Be Committed

The following files should never be committed to the repository:

- **Environment Files**: All `.env` files (except example files)
- **Service Account Files**: `firebase-service-account.json` and other credential files
- **Private Keys**: Any files containing private keys, secrets, or credentials
- **Build Artifacts**: Generated files like `/dist`, `/build`, `.next`, etc.
- **Smart Contract Artifacts**: Generated files in `/artifacts` and `/cache` directories
- **Node Modules**: All `node_modules` directories
- **Log Files**: All log files

The `.gitignore` file is configured to exclude these files from Git tracking.

## Development

To start all services for development, run the following command from the root directory:

```bash
npm run dev
```

This command uses `concurrently` to run the development scripts defined in the `package.json` of each workspace (`frontend`, `backend`, `minimal-hardhat`).

## Testing

Authentico includes comprehensive test suites to validate the functionality of the application across different environments.

### Running All Tests

To run tests across all packages that have a test script defined:

```bash
npm run test
```

### Test Coverage

The test suites cover the following key areas of the application:

1. **Authentication**: User registration, login, session management, and logout functionality.
2. **Document Management**: Document upload, encryption, IPFS storage, blockchain anchoring, and status transitions.
3. **Organization Flows**: Organization application, admin approval, and document verification.
4. **End-to-End Flows**: Complete user journeys from registration to document verification.

### Testing Tools

- **Jest**: For unit and integration tests
- **Cypress**: For end-to-end tests
- **Supertest**: For API testing

## Security Features

Authentico implements several security features to ensure the integrity and confidentiality of documents:

### Encryption

- **AES-256 Encryption**: All documents are encrypted using AES-256 before being uploaded to IPFS
- **Secure Key Management**: Encryption keys are securely managed and never exposed
- **End-to-End Encryption**: Documents remain encrypted throughout the verification process

### Blockchain Security

- **Immutable Records**: Document hashes and metadata are stored on the Ethereum blockchain
- **Verification Status**: Document verification status is recorded on-chain
- **Transaction Signing**: All blockchain transactions are securely signed using the sponsor wallet

### API Security

- **JWT Authentication**: API endpoints are secured using JSON Web Tokens
- **Role-Based Access Control**: Different user roles have different access permissions
- **Rate Limiting**: API endpoints are protected against abuse with rate limiting
- **Input Validation**: All user inputs are validated to prevent injection attacks

## Deployment

Authentico can be deployed using several methods:

### Vercel (Frontend)

The frontend can be deployed to Vercel with the following command:

```bash
npm run deploy:vercel
```

### Render (Backend)

The backend can be deployed to Render with the following command:

```bash
npm run deploy:render
```

### Docker

Both frontend and backend can be deployed using Docker:

```bash
npm run deploy:docker
```

Refer to the Docker configuration (`Dockerfile`, `docker-compose.yml`) and [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## Contributing

We welcome contributions to the Authentico project. Please follow these guidelines:

1. **Fork the repository** and create a new branch for your feature or bug fix
2. **Write tests** for your changes
3. **Ensure all tests pass** before submitting a pull request
4. **Update documentation** to reflect your changes
5. **Submit a pull request** with a clear description of your changes

For more detailed contribution guidelines, please refer to [CONTRIBUTING.md](docs/CONTRIBUTING.md).
