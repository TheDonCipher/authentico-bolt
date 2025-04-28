# Deploying to Render

This document provides instructions for deploying the Authentico Frontend application to Render using Docker.

## Prerequisites

1. A Render account
2. Firebase project with Admin SDK credentials
3. The Authentico Backend deployed and running

## Environment Variables

The following environment variables need to be set in the Render dashboard:

### Firebase Client (Public) Variables

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase Admin Variables (Server-side only)

- `FIREBASE_TYPE` (usually "service_account")
- `FIREBASE_PROJECT_ID` (same as your Firebase project ID)
- `FIREBASE_PRIVATE_KEY_ID` (from your service account JSON)
- `FIREBASE_PRIVATE_KEY` (from your service account JSON)
- `FIREBASE_CLIENT_EMAIL` (from your service account JSON)
- `FIREBASE_CLIENT_ID` (from your service account JSON)
- `FIREBASE_CLIENT_X509_CERT_URL` (from your service account JSON)

### Other Variables

- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` (if using ThirdWeb)
- `NEXT_PUBLIC_API_URL` (URL to your backend API, e.g., https://authentico-backend.onrender.com/api)

## Deployment Steps

1. **Create a new Web Service in Render**

   - Select "Deploy from GitHub repository"
   - Connect your GitHub repository
   - Select the branch to deploy (usually `main`)

2. **Configure the Service**

   - Name: `authentico-frontend` (or your preferred name)
   - Environment: `Docker`
   - Region: Choose the region closest to your users
   - Branch: `main` (or your deployment branch)
   - Plan: Choose an appropriate plan (at least Starter for production)

3. **Set Environment Variables**

   - Add all the required environment variables listed above
   - For the Firebase Admin private key, make sure to:
     - Include the quotes around the key value: `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`
     - Replace newlines with `\n` (not `\\n`)
     - The key should start with `"-----BEGIN PRIVATE KEY-----\n` and end with `\n-----END PRIVATE KEY-----\n"`

4. **Advanced Options**

   - Health Check Path: `/api/health`
   - Auto-Deploy: Enable if you want automatic deployments on push

5. **Create Web Service**
   - Click "Create Web Service" to start the deployment

## Troubleshooting

If you encounter issues with the deployment:

1. **Check the build logs** for any errors
2. **Verify environment variables** are correctly set in the Render dashboard
3. **Check the Firebase Admin initialization** in the logs
4. **Test the health check endpoint** to ensure the application is running correctly

## Important Notes

- The Firebase Admin private key must be properly formatted with escaped newlines (`\n`) and surrounded by quotes
- The Docker build process uses the actual environment variables from Render during both build and runtime
- Environment variables are passed to Docker as build arguments using the `--build-arg` flag
- Make sure your backend API URL is correctly set and accessible from the frontend
- Both Firebase Admin (server-side) and Firebase Client (browser-side) environment variables must be set in the Render dashboard
- The build process is configured to handle environment variables properly for both build and runtime
- The same environment variables are used for both build and runtime to ensure consistency
