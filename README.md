# Authentico

Authentico is a blockchain-based document verification platform built as a monorepo using npm workspaces. It includes a Next.js frontend, a Node.js backend, and Ethereum smart contracts.

## Table of Contents

1.  [Project Structure](#project-structure)
2.  [Setup](#setup)
3.  [Core Commands](#core-commands)
4.  [Environment Variables](#environment-variables)
5.  [Development](#development)
6.  [Testing](#testing)
7.  [Deployment](#deployment)

## Project Structure

The Authentico project uses npm workspaces to manage the following packages:

```
authentico/
├── frontend/         # Next.js 14 application (App Router)
│   ├── app/
│   ├── public/
│   ├── package.json
│   └── next.config.js
├── backend/          # Node.js backend service (Express/Other)
│   ├── index.js
│   ├── users.js
│   └── package.json
├── smart-contracts/  # Ethereum smart contracts (Hardhat/Other)
│   ├── contracts/
│   ├── test/
│   └── package.json
├── package.json      # Root package configuration & workspaces
├── tsconfig.json     # Root TypeScript configuration
├── docker-compose.yml # Docker Compose configuration
├── Dockerfile        # Root Dockerfile (potentially for multi-stage builds)
└── README.md         # This file
```

- `frontend/`: Contains the Next.js user interface.
- `backend/`: Contains the Node.js API service handling business logic, Firebase integration, and Pinata interaction.
- `smart-contracts/`: Contains the Solidity smart contracts and related scripts/tests.
- Root-level files configure the monorepo, TypeScript, Docker, etc.

## Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd authentico
    ```

2.  **Install dependencies:**
    Run the following command from the root directory. It will install dependencies for all workspaces (`frontend`, `backend`, `smart-contracts`).
    ```bash
    npm install
    # or use the explicit script:
    # npm run install:all
    ```

## Core Commands

These commands should be run from the **root** directory:

- `npm install` or `npm run install:all`: Installs all dependencies for all workspaces.
- `npm run dev`: Starts the frontend, backend, and any smart contract compilation/watch processes concurrently in development mode.
- `npm run build`: Builds all workspaces for production (if a build script is present in their `package.json`).
- `npm run test`: Runs tests in all workspaces (if a test script is present).
- `npm run format`: Formats code across the entire project using Prettier.

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

3. You can also use the setup script to copy the appropriate environment files:

   ```bash
   # For development environment
   npm run setup:env:dev

   # For production environment
   npm run setup:env:prod
   ```

4. Validate your environment setup using:
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

Refer to `ENVIRONMENT_SETUP.md` for detailed information about all required environment variables.

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

This command uses `concurrently` to run the development scripts defined in the `package.json` of each workspace (`frontend`, `backend`, `smart-contracts`).

## Testing

Authentico includes comprehensive test suites to validate the functionality of the application across different environments.

### Running All Tests

To run tests across all packages that have a test script defined:

```bash
npm run test
```

### Running Specific Test Suites

The project includes specialized test scripts for different aspects of the application:

```bash
# Run environment verification tests
npm run test:verify-env:dev

# Run authentication tests
npm run test:auth:dev

# Run document management tests
npm run test:document:dev

# Run organization flow tests
npm run test:organization:dev

# Run end-to-end tests
npm run test:e2e:dev
```

Replace `dev` with `staging` or `prod` to run tests in different environments.

### Test Coverage

The test suites cover the following key areas of the application:

1. **Authentication**: User registration, login, session management, and logout functionality.
2. **Document Management**: Document upload, encryption, IPFS storage, blockchain anchoring, and status transitions.
3. **Organization Flows**: Organization application, admin approval, and document verification.
4. **End-to-End Flows**: Complete user journeys from registration to document verification.

For more detailed information about the test scripts, see the [test-scripts/README.md](test-scripts/README.md) file.

## Deployment

Refer to the Docker configuration (`Dockerfile`, `docker-compose.yml`) and potentially specific deployment guides for deploying the application. The Docker setup aims to build and run the frontend and backend services.
