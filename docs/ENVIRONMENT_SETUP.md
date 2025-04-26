# Authentico Environment Setup Guide

This document provides detailed instructions for setting up and configuring the Authentico application across different environments (development, staging, and production).

## Environment Configuration

Authentico uses environment variables to configure various aspects of the application, including:

- Firebase authentication
- Pinata IPFS storage
- Blockchain integration
- Server configuration
- API endpoints

## Environment Files

The application uses `.env` files to manage environment variables. These files should be created in the following locations:

1. Root directory (`./.env`)
2. Frontend directory (`./frontend/.env`)
3. Backend directory (`./backend/.env`)

Example files are provided (`.env.example`) in each directory to serve as templates.

## Setting Up Development Environment

Follow these steps to set up your development environment:

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd authentico-bolt
   ```

2. **Copy environment files**:
   ```bash
   # Root directory
   cp .env.example .env
   
   # Frontend directory
   cp frontend/.env.example frontend/.env
   
   # Backend directory
   cp backend/.env.example backend/.env
   ```

3. **Fill in environment variables**:
   Edit each `.env` file and fill in the required values. See the "Required Environment Variables" section below for details.

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Validate environment setup**:
   ```bash
   npm run validate:env:dev
   ```

6. **Start development servers**:
   ```bash
   npm run dev
   ```

## Required Environment Variables

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment type | `development` |
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | ThirdWeb client ID | `your_thirdweb_client_id` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | `your_firebase_api_key` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789012` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | `1:123456789012:web:abcdef1234567890` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Measurement ID (optional) | `G-MEASUREMENT_ID` |
| `NEXT_PUBLIC_WEBSOCKET_URL` | WebSocket URL | `ws://localhost:8080` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8080/api` |

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment type | `development` |
| `PORT` | Server port | `8080` |
| Firebase Admin SDK variables | Firebase Admin SDK configuration |  |
| `PINATA_JWT` | Pinata JWT token | `your_pinata_jwt_token` |
| `GATEWAY_URL` | Pinata gateway URL | `https://fuchsia-fantastic-python-686.mypinata.cloud` |
| `BLOCKCHAIN_RPC_URL` | Blockchain RPC URL | `https://sepolia.infura.io/v3/your_infura_key` |
| `SPONSOR_WALLET_PRIVATE_KEY` | Sponsor wallet private key | `your_private_key` |
| `MASTER_KEY_SECRET` | Master key for encryption | `your_32_character_master_key_secret` |

## Environment-Specific Configuration

### Development Environment

- `NODE_ENV` should be set to `development`
- `PORT` should be set to `8080`
- `NEXT_PUBLIC_API_URL` should be set to `http://localhost:8080/api`

### Production Environment

- `NODE_ENV` should be set to `production`
- `PORT` should be set to `10000` for Render deployment
- `NEXT_PUBLIC_API_URL` should be set to your production backend URL (e.g., `https://authentico-backend.onrender.com/api`)

## Deployment Configuration

### Vercel (Frontend)

When deploying to Vercel, add the frontend environment variables in the Vercel project settings. The following variables are required:

- `NODE_ENV` = `production`
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_API_URL` (set to your production backend URL)

### Render (Backend)`

When deploying to Render, add the backend environment variables in the Render environment settings. The following variables are required:

- `NODE_ENV` = `production`
- `PORT` = `10000`
- All Firebase Admin SDK variables
- All Pinata configuration variables
- All Blockchain configuration variables
- `MASTER_KEY_SECRET`

## Validating Environment Setup

You can validate your environment setup using the provided validation script:

```bash
# Validate current environment
npm run validate:env

# Validate development environment
npm run validate:env:dev

# Validate production environment
npm run validate:env:prod
```

## Troubleshooting

If you encounter issues with environment variables:

1. Check that all required variables are set in the appropriate `.env` files
2. Verify that the values are correct (no typos, proper formatting)
3. Ensure that the `.env` files are in the correct locations
4. Run the validation script to identify missing or incorrect variables
5. Check the application logs for specific error messages

For Firebase-specific issues, verify that your Firebase project is properly configured and that the service account has the necessary permissions.

For Pinata-specific issues, verify that your Pinata JWT token is valid and that the gateway URL is correct.

For blockchain-specific issues, verify that your RPC URL is accessible and that your sponsor wallet has sufficient funds.
