# CORS and API Connection Fix

This document explains how to fix CORS issues and API connection problems between the frontend and backend.

## Changes Made

1. **Updated CORS Configuration in Backend**
   - Modified `backend/index.js` to use a more flexible CORS configuration
   - Added support for multiple frontend origins
   - Improved error handling and debugging for CORS issues

2. **Updated API Client in Frontend**
   - Added `withCredentials: true` to the axios client configuration
   - This ensures cookies and authentication headers are properly sent with cross-origin requests

3. **Updated Environment Files**
   - Updated `.env.production` files for both frontend and backend
   - Ensured the correct API URLs are set for production

## Deployment Instructions

### Backend (Render.com)

1. **Update Environment Variables**
   - Log in to your Render.com dashboard
   - Go to your backend service
   - Add/update the following environment variables:
     - `NODE_ENV`: `production`
     - `PORT`: `10000`
     - `FRONTEND_URL`: `https://authentico-demov2.vercel.app` (or your actual frontend URL)

2. **Redeploy the Backend**
   - In the Render.com dashboard, click "Manual Deploy" > "Deploy latest commit"
   - This will apply the new CORS configuration

### Frontend (Netlify)

1. **Update Environment Variables**
   - Log in to your Netlify dashboard
   - Go to your site settings > Build & deploy > Environment
   - Add/update the following environment variables:
     - `NODE_ENV`: `production`
     - `NEXT_PUBLIC_API_URL`: `https://authentico-backend.onrender.com/api`

2. **Redeploy the Frontend**
   - In the Netlify dashboard, trigger a new deployment
   - This will apply the new API client configuration

## Testing

After deployment, test the following:

1. **Authentication**: Log in with your wallet
2. **Document Viewing**: Try to view document details
3. **Organization List**: Check if the list of verified organizations loads

If you still encounter CORS issues, check the browser console for specific error messages and ensure that:
- The backend is properly configured to accept requests from your frontend domain
- The frontend is using the correct API URL
- The API endpoints are working correctly

## Troubleshooting

If issues persist:

1. **Check Network Requests**: Use browser developer tools to inspect network requests
2. **Verify Environment Variables**: Ensure all environment variables are correctly set
3. **Check Server Logs**: Look at the backend logs in Render.com for any errors
4. **Test API Directly**: Use tools like Postman to test the API endpoints directly
