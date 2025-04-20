# Deploying Authentico to Netlify

This document provides instructions for deploying the Authentico platform to Netlify.

## Prerequisites

- A Netlify account
- Git repository with your Authentico codebase

## Deployment Steps

### 1. Connect Your Repository to Netlify

1. Log in to your Netlify account
2. Click "New site from Git"
3. Select your Git provider (GitHub, GitLab, or Bitbucket)
4. Authorize Netlify to access your repositories
5. Select the Authentico repository

### 2. Configure Build Settings

The repository includes a `netlify.toml` file that configures most settings automatically, but verify the following:

- **Base directory**: `frontend`
- **Build command**: `npm run build:netlify`
- **Publish directory**: `.next`

### 3. Environment Variables

Add the following environment variables in the Netlify UI (Site settings > Build & deploy > Environment):

```
NODE_ENV=production
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_API_URL=your_backend_api_url
NEXT_PUBLIC_ADMIN_WALLET_ADDRESS=your_admin_wallet_address
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
```

**Important**: For the `FIREBASE_PRIVATE_KEY`, make sure to enter it exactly as it appears in your `.env.production` file, including the newline characters (`\n`).

### 4. Deploy

Click "Deploy site" to start the deployment process. Netlify will clone your repository, run the build command, and deploy the site.

### 5. Custom Domain (Optional)

To set up a custom domain:

1. Go to Site settings > Domain management
2. Click "Add custom domain"
3. Follow the instructions to configure your domain

## Troubleshooting

If you encounter build errors:

1. Check the build logs for specific error messages
2. Verify that all environment variables are correctly set
3. Make sure the PostCSS dependencies are properly installed
4. Check that the Next.js configuration is compatible with Netlify

For persistent issues, you can try:

```bash
# From the frontend directory
npm install postcss-import postcss-nesting
npm run build
```

Then deploy the site manually using the Netlify CLI:

```bash
npm install -g netlify-cli
netlify deploy --prod
```
