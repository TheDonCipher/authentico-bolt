# Frontend Deployment Guide

This guide provides instructions for deploying the Authentico frontend to Vercel and Netlify.

## Prerequisites

Before deploying, ensure you have:

1. A Vercel or Netlify account
2. All required environment variables ready
3. The necessary PostCSS dependencies installed

## Environment Setup

1. Create a production environment file:
   ```bash
   cp .env.production.example .env.production
   ```

2. Edit the `.env.production` file with your actual production values.

## Vercel Deployment

### Using Vercel CLI

1. Install the Vercel CLI if you haven't already:
   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```

3. Run the prepare:deploy script to ensure all dependencies are installed:
   ```bash
   npm run prepare:deploy
   ```

4. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

### Using Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).

2. Log in to the [Vercel Dashboard](https://vercel.com/dashboard).

3. Click "New Project" and import your repository.

4. Configure the project:
   - Framework Preset: "Next.js"
   - Root Directory: "frontend" (if deploying from the root repository)
   - Build Command: "npm run build:vercel"
   - Output Directory: ".next"

5. Add all environment variables from your `.env.production` file.

6. Click "Deploy".

## Netlify Deployment

### Using Netlify CLI

1. Install the Netlify CLI if you haven't already:
   ```bash
   npm install -g netlify-cli
   ```

2. Log in to Netlify:
   ```bash
   netlify login
   ```

3. Run the prepare:deploy script to ensure all dependencies are installed:
   ```bash
   npm run prepare:deploy
   ```

4. Deploy to Netlify:
   ```bash
   netlify deploy --prod
   ```

### Using Netlify Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).

2. Log in to the [Netlify Dashboard](https://app.netlify.com/).

3. Click "New site from Git" and import your repository.

4. Configure the build settings:
   - Base directory: "frontend" (if deploying from the root repository)
   - Build command: "npm run build:netlify"
   - Publish directory: ".next"

5. Add all environment variables from your `.env.production` file.

6. Click "Deploy site".

## Troubleshooting

### PostCSS Dependency Issues

If you encounter PostCSS-related errors during build:

```bash
npm run prepare:deploy
```

This will install all required PostCSS dependencies.

### Environment Variable Issues

If environment variables aren't being recognized:

1. Double-check that all required variables are set in the deployment platform
2. Ensure variable names match exactly what's expected in the code
3. For Netlify, make sure the variables are set at the site level, not just in the `.env` file

### Build Errors

For general build errors:

1. Check the build logs for specific error messages
2. Ensure all required dependencies are installed
3. Verify that the Next.js configuration is compatible with your deployment platform

## Post-Deployment Verification

After deploying, verify that:

1. The frontend can connect to the backend API
2. User authentication works correctly
3. Document uploads and verification function properly
4. Blockchain transactions are being recorded
