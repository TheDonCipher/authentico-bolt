# Authentico Deployment Guide

This document provides a comprehensive guide for deploying the Authentico application to various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Options](#deployment-options)
   - [Vercel (Frontend)](#vercel-frontend)
   - [Render.com (Backend)](#rendercom-backend)
   - [Docker](#docker)
4. [Deployment Scripts](#deployment-scripts)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. A Firebase project set up with authentication and Firestore
2. A Pinata account with a JWT token
3. A Sepolia testnet wallet with ETH for transactions
4. A Vercel account (for frontend deployment)
5. A Render account (for backend deployment)
6. Docker and Docker Compose installed (for containerized deployment)

## Environment Setup

1. Set up the production environment variables:

   ```bash
   # Copy the production environment files
   npm run setup:env:prod
   ```

2. Edit the `.env` files in the frontend and backend directories to include your actual production values.

3. Validate the environment configuration:
   ```bash
   npm run validate:env:prod
   ```

## Deployment Options

### Vercel (Frontend)

#### Using Deployment Script

```bash
npm run deploy:vercel
```

#### Manual Deployment

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).

2. Log in to the [Vercel Dashboard](https://vercel.com/dashboard).

3. Click "New Project" and import your repository.

4. Configure the project:

   - Framework Preset: "Next.js"
   - Root Directory: "frontend"
   - Build Command: "npm run build"
   - Output Directory: ".next"

5. Add all environment variables from your `frontend/.env.production` file.

6. Click "Deploy".

### Render.com (Backend)

#### Using Deployment Script

```bash
npm run deploy:render
```

This will prepare the environment for Render deployment. You'll still need to complete the deployment through the Render Dashboard.

#### Manual Deployment

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).

2. Log in to the [Render Dashboard](https://dashboard.render.com/).

3. Click "New" and select "Blueprint" to use the `render.yaml` configuration.

4. Connect your repository and select the branch containing the `render.yaml` file.

5. Review the configuration and click "Apply".

6. Add all environment variables from your `backend/.env.production` file.

### Docker

#### Using Deployment Script

```bash
npm run deploy:docker
```

#### Manual Deployment

1. Ensure your environment files are set up:

   ```bash
   cp frontend/.env.production frontend/.env
   cp backend/.env.production backend/.env
   ```

2. Edit the `.env` files with your actual production values.

3. Build the Docker images:

   ```bash
   docker-compose build
   ```

4. Start the services:

   ```bash
   docker-compose up -d
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8080

## Deployment Scripts

The project includes deployment scripts to simplify the deployment process:

- `npm run deploy` - Interactive deployment script
- `npm run deploy:vercel` - Deploy frontend to Vercel
- `npm run deploy:render` - Prepare backend for Render deployment
- `npm run deploy:docker` - Deploy using Docker
- `npm run deploy:build` - Build the application for production
- `npm run install:postcss-deps` - Install required PostCSS dependencies
- `npm run verify:deployment` - Verify deployment configuration
- `npm run prepare:deploy` - Prepare for deployment (validates env, installs deps, verifies config)

For Windows users, these scripts use PowerShell. For Linux/Mac users, use the bash script:

```bash
# Make the script executable
chmod +x scripts/deploy.sh

# Run the script
./scripts/deploy.sh --env prod --target docker --build --deploy
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
- If you encounter PostCSS-related errors during build, run:
  ```bash
  # From the project root
  npm run install:postcss-deps
  ```
- For Next.js build errors, ensure all required dependencies are installed:
  ```bash
  cd frontend
  npm install postcss-import postcss-nesting tailwindcss-animate
  ```

### Backend Issues

- Check the Render logs for errors
- Verify that all environment variables are set correctly
- Check that the Firebase service account has the necessary permissions
- Verify that the Pinata JWT token is valid

### Docker Issues

- Check container logs: `docker-compose logs`
- Verify that the containers are running: `docker-compose ps`
- Check that the environment variables are correctly set in the `.env` files

For more detailed information, refer to:

- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) - Docker-specific deployment guide
