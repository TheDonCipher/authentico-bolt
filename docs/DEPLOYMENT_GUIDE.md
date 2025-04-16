# Authentico Deployment Guide

This document provides detailed instructions for deploying the Authentico application to production environments.

## Prerequisites

Before deploying, ensure you have:

1. A Firebase project set up with authentication and Firestore
2. A Pinata account with a JWT token
3. A Sepolia testnet wallet with ETH for transactions
4. A Vercel account (for frontend deployment)
5. A Render account (for backend deployment)

## Environment Setup

1. Set up the production environment variables:
   ```bash
   npm run setup:env:prod
   ```

2. Edit the `.env` files in the root, frontend, and backend directories to include your actual production values.

3. Validate the environment configuration:
   ```bash
   npm run validate:env:prod
   ```

## Frontend Deployment (Vercel)

### Option 1: Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the frontend:
   ```bash
   cd frontend
   vercel --prod
   ```

### Option 2: Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).

2. Log in to the [Vercel Dashboard](https://vercel.com/dashboard).

3. Click "New Project" and import your repository.

4. Configure the project:
   - Set the framework preset to "Next.js"
   - Set the root directory to "frontend"
   - Add all environment variables from your frontend/.env file

5. Click "Deploy".

### Environment Variables for Vercel

Add the following environment variables in the Vercel project settings:

- `NODE_ENV` = `production`
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_API_URL` (set to your production backend URL, e.g., `https://authentico-backend.onrender.com/api`)

## Backend Deployment (Render)

### Option 1: Render Dashboard with render.yaml

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).

2. Log in to the [Render Dashboard](https://dashboard.render.com/).

3. Click "New" and select "Blueprint".

4. Connect your repository and select the branch containing your code.

5. Render will automatically detect the `render.yaml` file in the backend directory and configure the service.

6. Review the configuration and click "Apply".

### Option 2: Manual Setup

1. Log in to the [Render Dashboard](https://dashboard.render.com/).

2. Click "New" and select "Web Service".

3. Connect your repository and select the branch containing your code.

4. Configure the service:
   - Name: `authentico-backend`
   - Root Directory: `backend`
   - Environment: `Node`
   - Region: Choose the region closest to your users
   - Branch: Your main branch
   - Build Command: `npm install`
   - Start Command: `node index.js`

5. Add all environment variables from your backend/.env file.

6. Click "Create Web Service".

### Environment Variables for Render

Add the following environment variables in the Render environment settings:

- `NODE_ENV` = `production`
- `PORT` = `10000`
- All Firebase Admin SDK variables
- All Pinata configuration variables
- All Blockchain configuration variables
- `MASTER_KEY_SECRET`

## Docker Deployment (Alternative)

You can also deploy the application using Docker:

1. Build the Docker images:
   ```bash
   docker-compose build
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

## Post-Deployment Verification

After deploying, verify that:

1. The frontend can connect to the backend
2. User authentication works
3. Document uploads work
4. Blockchain transactions work

## Troubleshooting

### Frontend Issues

- Check the Vercel deployment logs for errors
- Verify that the `NEXT_PUBLIC_API_URL` is correct and accessible
- Check browser console for JavaScript errors

### Backend Issues

- Check the Render logs for errors
- Verify that all environment variables are set correctly
- Check that the Firebase service account has the necessary permissions
- Verify that the Pinata JWT token is valid

### Connection Issues

- Ensure CORS is properly configured in the backend
- Check that the frontend is using the correct API URL
- Verify that the backend is accessible from the frontend's domain

## Rollback Procedure

If you need to rollback to a previous version:

### Vercel (Frontend)

1. Go to the Vercel Dashboard
2. Select your project
3. Go to the "Deployments" tab
4. Find the previous working deployment
5. Click the three dots menu and select "Promote to Production"

### Render (Backend)

1. Go to the Render Dashboard
2. Select your service
3. Go to the "Deploys" tab
4. Find the previous working deployment
5. Click "Manual Deploy" and select "Deploy previous build"
