# Authentico Demo Prototype Checklist

This checklist outlines the remaining work needed to reach a functional demo prototype that can authenticate users and upload documents.

## Core Features

### User Authentication (Firebase)
- [ ] Setup Firebase project & configure SDKs
  - [ ] Frontend: Initialize Firebase client SDK
  - [ ] Backend: Initialize Firebase admin SDK
- [ ] Implement Frontend UI
  - [ ] Login/Signup forms
  - [ ] Auth state management
- [ ] Implement Backend API endpoints
  - [ ] `/api/auth/register` - User registration
  - [ ] `/api/auth/login` - User login
  - [ ] `/api/auth/me` - Get current user info
- [ ] Secure API endpoints
  - [ ] Verify Firebase tokens on protected routes

### Document Upload (Pinata)
- [ ] Configure Pinata SDK/API keys
  - [ ] Store keys in backend environment variables
- [ ] Implement Frontend UI
  - [ ] File selection/upload component
  - [ ] Upload progress/status indicators
- [ ] Implement Backend API endpoint
  - [ ] `/api/documents/upload` - Handle file upload to Pinata
  - [ ] Store document metadata in Firebase (hash, owner, timestamp, etc.)

### Document Status Viewing
- [ ] Implement Backend API endpoint
  - [ ] `/api/documents` - List user's documents with status
- [ ] Implement Frontend UI
  - [ ] Document list component
  - [ ] Status indicators (Uploaded, Processing, Verified)

## Deployment & Testing
- [ ] Verify Docker setup
  - [ ] Test `docker-compose up --build` works
  - [ ] Confirm services can communicate
- [ ] Create demo script
  - [ ] Outline steps to demonstrate functionality
  - [ ] Prepare test documents

## Nice-to-Have (If Time Permits)
- [ ] Basic document verification flow
- [ ] User profile page
- [ ] Document preview functionality