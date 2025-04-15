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

-   `frontend/`: Contains the Next.js user interface.
-   `backend/`: Contains the Node.js API service handling business logic, Firebase integration, and Pinata interaction.
-   `smart-contracts/`: Contains the Solidity smart contracts and related scripts/tests.
-   Root-level files configure the monorepo, TypeScript, Docker, etc.

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

-   `npm install` or `npm run install:all`: Installs all dependencies for all workspaces.
-   `npm run dev`: Starts the frontend, backend, and any smart contract compilation/watch processes concurrently in development mode.
-   `npm run build`: Builds all workspaces for production (if a build script is present in their `package.json`).
-   `npm run test`: Runs tests in all workspaces (if a test script is present).
-   `npm run format`: Formats code across the entire project using Prettier.

## Environment Variables

Environment variables are crucial for configuring services like Firebase, Pinata, and database connections.

1.  Copy the `sample.env` file to `.env` in the following directories:
    *   `frontend/`
    *   `backend/`
    *   *(Optional)* Root directory (`./`) if needed for root-level scripts or Docker.
2.  Fill in the required values in each `.env` file. Refer to the specific READMEs in `frontend/` and `backend/` for details on required variables.

## Development

To start all services for development, run the following command from the root directory:

```bash
npm run dev
```

This command uses `concurrently` to run the development scripts defined in the `package.json` of each workspace (`frontend`, `backend`, `smart-contracts`).

## Testing

To run tests across all packages that have a test script defined:

```bash
npm run test
```

## Deployment

Refer to the Docker configuration (`Dockerfile`, `docker-compose.yml`) and potentially specific deployment guides for deploying the application. The Docker setup aims to build and run the frontend and backend services.
