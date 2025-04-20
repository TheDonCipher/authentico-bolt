# Authentico Frontend Deployment

This document provides a quick reference for deploying the Authentico frontend to Vercel and Netlify.

## Quick Start

1. **Prepare environment file:**

   ```bash
   # Copy example file
   cp .env.production.example .env.production
   
   # Edit the file with your production values
   ```

2. **Install dependencies and verify deployment:**

   ```bash
   # Install all dependencies
   npm install
   
   # Install PostCSS dependencies specifically
   npm run install:postcss-deps
   
   # Verify deployment configuration
   npm run verify:deployment
   ```

3. **Deploy:**

   ```bash
   # For Netlify deployment
   netlify deploy --prod
   
   # For Vercel deployment
   vercel --prod
   ```

## Common Issues and Solutions

### PostCSS Dependency Issues

If you encounter PostCSS-related errors during build:

```bash
npm run install:postcss-deps
```

### Environment Variable Issues

If environment variables aren't being recognized:

1. Ensure all variables are set in your deployment platform's dashboard
2. Check that the variable names match exactly what's expected in the code

### Build Errors

For general build errors:

1. Check the build logs for specific error messages
2. Run `npm run prepare:deploy` to prepare for deployment
3. Verify that all required files are present with `npm run verify:deployment`

## Deployment Platforms

### Netlify

- **Dashboard:** https://app.netlify.com/
- **Documentation:** https://docs.netlify.com/

### Vercel

- **Dashboard:** https://vercel.com/dashboard
- **Documentation:** https://vercel.com/docs

## For More Information

See the full [Deployment Guide](./DEPLOYMENT.md) for detailed instructions.
