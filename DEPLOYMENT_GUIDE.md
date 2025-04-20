# Authentico Deployment Guide

This guide provides step-by-step instructions for deploying the Authentico platform to production environments.

## Prerequisites

Before deploying, ensure you have:

1. A Firebase project set up with Firestore
2. A Pinata account for IPFS storage
3. Access to the Sepolia testnet for blockchain operations
4. A 32-character master key for encryption

## Environment Setup

### 1. Create Production Environment Files

For the frontend:
```bash
cp frontend/.env.production.example frontend/.env.production
```

For the backend:
```bash
cp backend/.env.production.example backend/.env.production
```

### 2. Fill in Environment Variables

Edit both `.env.production` files with your actual production values:

- Firebase credentials
- Pinata JWT and gateway URL
- API URLs (frontend pointing to backend)
- ThirdWeb client ID
- Blockchain RPC URL and wallet private key
- Master key secret (must be exactly 32 characters)

## Frontend Deployment

### Netlify Deployment

1. **Prepare for Netlify:**

   Ensure your `netlify.toml` file is in the root directory with the correct configuration:

   ```toml
   [build]
     base = "frontend"
     publish = ".next"
     command = "npm run build:netlify"
   
   [build.environment]
     NODE_VERSION = "18"
     NPM_VERSION = "9"
   
   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

2. **Deploy to Netlify:**

   ```bash
   # Install Netlify CLI if not already installed
   npm install -g netlify-cli
   
   # Login to Netlify
   netlify login
   
   # Deploy
   netlify deploy --prod
   ```

3. **Set Environment Variables in Netlify Dashboard:**

   Go to Site settings > Environment variables and add all variables from your `frontend/.env.production` file.

### Vercel Deployment

1. **Prepare for Vercel:**

   Ensure your `vercel.json` file is in the root directory with the correct configuration.

2. **Deploy to Vercel:**

   ```bash
   # Install Vercel CLI if not already installed
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel --prod
   ```

3. **Set Environment Variables in Vercel Dashboard:**

   Go to Project settings > Environment Variables and add all variables from your `frontend/.env.production` file.

## Backend Deployment

### Render.com Deployment

1. **Prepare for Render:**

   Ensure your `render.yaml` file is in the backend directory with the correct configuration.

2. **Deploy to Render:**

   - Create a new Web Service in the Render dashboard
   - Connect your GitHub repository
   - Set the build command to `npm install`
   - Set the start command to `node index.js`
   - Set the environment variables from your `backend/.env.production` file

3. **Set Environment Variables in Render Dashboard:**

   Go to Environment > Environment Variables and add all variables from your `backend/.env.production` file.

## Post-Deployment Verification

After deploying both frontend and backend, verify:

1. The frontend can connect to the backend API
2. User authentication works correctly
3. Document uploads and verification function properly
4. Blockchain transactions are being recorded

## Troubleshooting Common Issues

### PostCSS Dependency Issues

If you encounter PostCSS-related errors during build:

```bash
# From the frontend directory
npm install postcss-import postcss-nesting tailwindcss-animate
```

### Environment Variable Issues

If environment variables aren't being recognized:

1. Double-check that all required variables are set in the deployment platform
2. Ensure variable names match exactly what's expected in the code
3. For Netlify, make sure the variables are set at the site level, not just in the `.env` file

### API Connection Issues

If the frontend can't connect to the backend:

1. Verify the `NEXT_PUBLIC_API_URL` is set correctly
2. Check CORS settings in the backend to allow requests from the frontend domain
3. Test the API endpoints directly to ensure they're accessible

## Maintenance and Updates

After deployment, to update your application:

1. Make changes to your codebase
2. Test locally
3. Push to your repository
4. The deployment platform should automatically rebuild and deploy the changes

For manual deployments, repeat the deployment steps above.
