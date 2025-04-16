# Render.com Backend Deployment Guide

## Prerequisites
- Render.com account
- GitHub repository connected
- Environment variables prepared in `.env` file

## Automated Setup (Recommended)
1. The `backend/render.yaml` file contains all necessary configuration
2. Render will automatically detect and use this file when:
   - You connect your GitHub repository
   - Select the repository branch containing this file
   - Create a new Web Service

## Manual Setup Alternative
If not using `render.yaml`:

### Step 1: Service Setup
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New+" → "Web Service"
3. Connect your GitHub repository
4. Select the repository branch to deploy

### Step 2: Configuration
```yaml
Service Name: authentico-backend
Region: Oregon (or closest to your users)
Branch: main
Root Directory: backend
```

### Step 3: Build Settings
```yaml
Build Command: npm install
Start Command: node index.js
```

## Environment Variables
The `render.yaml` pulls these from your `.env` file:
```env
NODE_ENV=production
PORT=10000
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
PINATA_JWT=your_pinata_jwt
GATEWAY_URL=your_ipfs_gateway
```

## Post-Deployment
1. Check logs in Render dashboard
2. Test API endpoints at: `https://your-service-name.onrender.com`
3. Set up custom domain if needed

## Troubleshooting
- Check build logs for errors
- Verify environment variables match local `.env`
- Monitor resource usage
- For file upload issues, check:
  - Storage permissions
  - File size limits