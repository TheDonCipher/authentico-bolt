# Authentico Utility Scripts

## Overview

This directory contains a collection of utility scripts designed to facilitate the development, deployment, and maintenance of the Authentico platform. These scripts are written in JavaScript and shell scripting languages and are intended to be executed from the project root directory unless otherwise specified.

The scripts are logically organized by function to enhance clarity and ease of use:

- **Environment Management**: Scripts for setting up and validating environment configurations across different parts of the application.
- **Database Management**: Scripts for database seeding, applying migrations, and deploying security rules and indexes to Firestore.
- **Key Generation**: Scripts for generating cryptographic keys required for secure operations, including master keys for encryption.
- **Deployment Automation**: Scripts that automate the deployment process to various hosting platforms like Vercel, Render, and Firebase Hosting.
- **Testing and Verification**: Scripts for verifying successful deployments and testing platform functionalities post-deployment.
- **Utility and Setup**: Miscellaneous scripts for setup tasks, dependency installations, and environment preparations.

## Script Index

This section provides a detailed overview of each script, including its purpose, functionality, usage instructions, and prerequisites.

### Database Scripts

#### `seed-verified-organizations.js`

- **Purpose**: Seeds the Firestore database with pre-verified organizations for development and testing.
- **Functionality**: Uses the Firebase Admin SDK to programmatically add verified organization data to the `organizations` collection in Firestore. This is useful for populating the database with test data to simulate real-world scenarios during development.
- **Usage**:
  ```bash
  npm run seed:verified-orgs
  ```
- **Prerequisites**: Firebase Admin SDK must be configured with valid service account credentials. Ensure the Firebase project is properly set up and accessible.

#### `update-firestore-rules.js`

- **Purpose**: Deploys updated Firestore security rules to the Firebase project.
- **Functionality**: Leverages the Firebase CLI to deploy security rules defined in `firestore.rules`. This script ensures that database access is controlled according to the defined security rules, protecting data integrity and access.
- **Usage**:
  ```bash
  npm run deploy:rules
  ```
- **Prerequisites**: Firebase CLI must be installed, configured, and authenticated with the Firebase project. Ensure you have the necessary permissions to deploy Firestore rules.

#### `create-firestore-indexes.js`

- **Purpose**: Creates composite indexes in Firestore to optimize query performance.
- **Functionality**: Deploys composite indexes to Firestore as specified in `firestore.indexes.json` using the Firebase CLI. Indexes are crucial for optimizing complex queries, reducing latency, and improving application performance.
- **Usage**:
  ```bash
  npm run deploy:indexes
  ```
- **Prerequisites**: Firebase CLI must be installed, configured, and authenticated with the Firebase project. Ensure you have permissions to create indexes in Firestore.

#### `run-migration.js`

- **Purpose**: Executes database migration scripts for schema updates or data transformations.
- **Functionality**: Executes database migration scripts located in the `backend/migrations` directory. These scripts are used to apply changes to the database schema, modify data, or perform database upgrades in a controlled and versioned manner.
- **Usage**:
  ```bash
  npm run migrate:db
  ```
- **Prerequisites**: Database configuration must be correctly set up, and migration scripts must be prepared in the `backend/migrations` directory. Ensure that backup procedures are in place before running migrations on production databases.

#### `migrate-organization-verification.js`

- **Purpose**: Runs specific migration tasks related to organization verification data in Firestore.
- **Functionality**: Executes migration scripts specifically designed for handling organization verification data. This ensures data integrity and consistency during updates or schema changes related to organization verification processes.
- **Usage**:
  ```bash
  npm run migrate:org-verification
  ```
- **Prerequisites**: Specific prerequisites may apply depending on the migration script. Refer to the script details and migration documentation for specific requirements.

### Environment Scripts

#### `validate-env.js`

- **Purpose**: Validates the presence and correctness of critical environment variables across the frontend, backend, and root directories.
- **Functionality**: Checks for the existence and validity of essential environment variables required for the application to run correctly in different environments. This script helps catch configuration errors early in the development and deployment process.
- **Usage**:
  ```bash
  npm run validate:env
  ```
- **Prerequisites**: `.env` files should be present in the frontend, backend, and root directories for validation. Ensure that all necessary environment variables are defined in these files.

#### `setup-env.js`

- **Purpose**: Sets up the environment by creating `.env` files from `.env.example` templates if they don't exist.
- **Functionality**: Automatically copies `.env.example` to `.env` in the current directory if a `.env` file is not already present. This simplifies initial setup and ensures that default environment configurations are in place.
- **Usage**:
  ```bash
  npm run setup:env
  ```
- **Prerequisites**: `.env.example` template files must be available in the respective directories.

### Key Generation Scripts

#### `generate-master-key.js`

- **Purpose**: Generates a new master key for cryptographic operations, such as encryption and decryption.
- **Functionality**: Generates a cryptographically secure 32-character key and outputs it to the console. This key is intended for use as a master key for AES-256 encryption and should be securely stored and managed.
- **Usage**:
  ```bash
  npm run generate:master-key
  ```
- **Prerequisites**: None. Ensure the generated key is stored securely and is not exposed in public repositories or insecure locations.

#### `generate-fixed-master-key.js`

- **Purpose**: Generates a predefined, fixed master key for development and testing environments. **Not intended for production use.**
- **Functionality**: Creates a fixed, non-random master key and outputs it to the console. This is useful for development and testing where a consistent key is needed for reproducible tests and local development setups.
- **Usage**:
  ```bash
  npm run generate:fixed-master-key
  ```
- **Prerequisites**: None. **Warning**: This script generates a non-secure, fixed key and should ONLY be used in development or testing environments. Never use fixed keys in production.

### Deployment Scripts

#### `deploy.sh` and `deploy.ps1`

- **Purpose**: Automates the deployment of the Authentico platform to hosting platforms.
- **Functionality**: These scripts automate the deployment process to platforms such as Vercel, Render, and Firebase Hosting. They handle build processes, configuration management, and deployment steps, streamlining the release process. `deploy.sh` is for Linux/macOS, and `deploy.ps1` is for Windows.
- **Usage**:
  ```bash
  ./scripts/deploy.sh   # For Linux or macOS
  ./scripts/deploy.ps1  # For Windows
  ```
- **Prerequisites**: Command-line interfaces for the target hosting platforms (e.g., Vercel CLI, Render CLI, Firebase CLI) must be installed, configured, and authenticated. Ensure that environment variables and deployment configurations are correctly set up for the target platform.

#### `verify-deployment.js`

- **Purpose**: Verifies that a deployment was successful and that the deployed platform is functioning correctly.
- **Functionality**: Performs post-deployment checks to ensure that the deployment process completed without errors and verifies the availability and functionality of the API, frontend, and other critical services. This may include checking service endpoints, database connections, and key functionalities.
- **Usage**:
  ```bash
  npm run verify:deployment
  ```
- **Prerequisites**: An instance of the Authentico platform must be deployed and accessible. Ensure that the deployed environment is reachable and that necessary services are running.

### Utility Scripts

#### `install-postcss-deps.js`

- **Purpose**: Installs PostCSS dependencies required for styling and CSS processing in the frontend.
- **Functionality**: Installs necessary PostCSS packages used for CSS transformations and optimizations in the frontend application. This script ensures that all required PostCSS plugins and dependencies are installed for frontend styling.
- **Usage**:
  ```bash
  npm run install:postcss
  ```
- **Prerequisites**: Node.js and npm must be installed. This script should be run from the project root or frontend directory where `package.json` is located.

#### `setup-firebase-env.js`

- **Purpose**: Sets up the Firebase environment for local development using Firebase emulators.
- **Functionality**: Configures Firebase emulators and sets up necessary environment variables to facilitate local Firebase development. This allows developers to test Firebase functionalities locally without deploying to a live Firebase project.
- **Usage**:
  ```bash
  npm run setup:firebase-env
  ```
- **Prerequisites**: Firebase CLI must be installed, and Firebase emulators must be set up in the project. Ensure Firebase emulator suite is properly initialized and configured.

## Running Scripts

Most scripts are designed to be executed as npm scripts, defined in the `package.json` file. Use `npm run <script-name>` to execute them. Shell scripts (`.sh` and `.ps1`) require execute permissions and may depend on specific command-line tools available in the environment. Ensure scripts are executed from the project root directory unless specified otherwise.

## Contributing

When contributing to these scripts, adhere to these guidelines:

- **Documentation**: Ensure all scripts are well-documented, including script purpose, functionality, parameters, and return values. Update `README.md` to reflect any changes or additions.
- **Consistency**: Follow the project's coding style and conventions (e.g., JavaScript style guides, shell scripting best practices) to maintain consistency across all scripts.
- **Error Handling**: Implement robust error handling to manage failures gracefully and provide informative error messages.
- **Testing**: Implement tests (unit or integration tests where applicable) to ensure script reliability and correctness.
- **Security**: Be mindful of security implications, especially when handling keys, credentials, or sensitive data. Avoid hardcoding sensitive information and use environment variables or secure configuration methods.

For detailed information on specific scripts, refer to the comments within each script file and related documentation in the project.
