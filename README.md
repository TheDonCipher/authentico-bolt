# Authentico

Authentico is a blockchain-based document verification platform built as a monorepo using Lerna, Next.js, NestJS, and Foundry for smart contract development.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Setup](#setup)
3. [Development Strategies](#development-strategies)
   - [Lerna](#lerna)
   - [Docker](#docker)
   - [GitHub Workflows](#github-workflows)
4. [Configuration Files](#configuration-files)
5. [Development Guides](#development-guides)
6. [Testing](#testing)
7. [Deployment](#deployment)

## Project Structure

The Authentico project is structured as follows:

```
authentico/
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml
│       ├── backend-ci.yml
│       └── smart-contracts-ci.yml
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── next.config.js
├── backend/
│   ├── document-service/
│   │   ├── src/
│   │   ├── test/
│   │   ├── prisma/
│   │   └── package.json
│   ├── verification-service/
│   │   ├── src/
│   │   ├── test/
│   │   ├── prisma/
│   │   └── package.json
│   └── user-service/
│       ├── src/
│       ├── test/
│       ├── prisma/
│       └── package.json
├── smart-contracts/
│   ├── src/
│   ├── test/
│   ├── script/
│   └── package.json
├── package.json
├── lerna.json
├── tsconfig.json
├── docker-compose.yml
└── README.md
```

- `frontend/`: Next.js 14 application with App Router
- `backend/`: NestJS microservices (document-service, verification-service, user-service)
- `smart-contracts/`: Foundry project for Ethereum smart contracts
- Root-level configuration files for the monorepo setup

## Setup

1. Clone the repository:

   ```
   git clone <repository-url>
   cd authentico
   ```

2. Install dependencies:

   ```
   npm install
   npx lerna bootstrap
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in each service directory and the root
   - Fill in the necessary environment variables

4. Start the development servers:

   ```
   npm run dev
   ```

## Development Strategies

### Lerna

We use Lerna to manage our monorepo structure. Here are some common commands:

- Run a command across all packages:

  ```
  npx lerna run <command>
  ```

- Run a command for specific packages:

  ```
  npx lerna run <command> --scope=@authentico/<package-name>
  ```

- Add a dependency to a specific package:

  ```
  npx lerna add <package-name> --scope=@authentico/<service-name>
  ```

### Docker

Docker is used for consistent development environments and easier deployment:

- Start all services:

  ```
  docker-compose up
  ```

- Rebuild containers after changes:

  ```
  docker-compose up --build
  ```

### GitHub Workflows

We use GitHub Actions for CI/CD. The workflows are defined in `.github/workflows/`:

- `frontend-ci.yml`: Runs on pushes/PRs to the frontend directory
- `backend-ci.yml`: Runs on pushes/PRs to the backend directory
- `smart-contracts-ci.yml`: Runs on pushes/PRs to the smart-contracts directory

These workflows automatically run tests and build processes.

## Configuration Files

1. `package.json` (root):
   - Defines workspaces for Lerna
   - Contains scripts for running all services concurrently
   - Lists dev dependencies for the monorepo

2. `tsconfig.json`:
   - Root TypeScript configuration
   - Sets common options for all TypeScript files in the project

3. `lerna.json`:
   - Configures Lerna for monorepo management
   - Sets independent versioning for packages
   - Defines package locations and Lerna command options

4. `docker-compose.yml`:
   - Defines Docker services for local development
   - Includes services for frontend, backend microservices, and PostgreSQL

5. `Foundry.toml`:
   - Configuration for the Foundry Ethereum development environment
   - Specifies directories, remappings, and network settings for smart contracts

## Development Guides

1. Frontend Development:
   - Navigate to `frontend/`
   - Run `npm run dev` for development
   - Follow Next.js 14 and React best practices

2. Backend Services:
   - Navigate to the specific service directory (e.g., `backend/document-service/`)
   - Run `npm run start:dev` for development
   - Follow NestJS and Prisma best practices

3. Smart Contract Development:
   - Navigate to `smart-contracts/`
   - Use Foundry commands:
     - Compile: `forge build`
     - Test: `forge test`

## Testing

- Run tests for all packages:

  ```
  npm test
  ```

- Run tests for a specific package:

  ```
  cd <package-directory>
  npm test
  ```

## Deployment

(Add specific deployment instructions based on your infrastructure setup)

Remember to keep your `.env` files updated with the necessary environment variables, especially for database connections and blockchain network configurations.

For any questions or issues, please contact the project lead or open an issue in the GitHub repository.
