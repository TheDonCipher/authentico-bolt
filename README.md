# Authentico

Authentico is a blockchain-based document verification platform built as a monorepo using Lerna, Next.js, NestJS, and Hardhat for smart contract development.

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
   
   ```

3. Set up environment variables:
   - Copy `sample.env` to `.env` in each service directory and the root
   - Fill in the necessary environment variables

4. Start the development servers:

   ```
   npm run start

   open another terminal run

   1. cd backend

   2. nodemon
   ```

