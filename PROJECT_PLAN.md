# Authentico Project Plan

This document outlines the plan for updating the Authentico project structure, documentation, deployment configuration, and defining the scope for a demo prototype.

## Phase 1: Project Setup & Documentation Cleanup

1.  **Update Root `package.json`:**
    *   Correct the `dev:backend` script to point to the single backend service workspace: `"dev:backend": "npm run start:dev --workspace=backend"`.
    *   *(Optional)* Add an `install:all` script for clarity: `"install:all": "npm install"`.
    *   Update the root `README.md` to accurately describe the monorepo structure (Frontend: Next.js, Backend: Node.js, Smart Contracts), explain the npm workspace setup, and detail core commands (`npm install`, `npm run dev`, `npm run build`, `npm run test`).

2.  **Create Package-Specific READMEs:**
    *   **`frontend/README.md`:**
        *   Overview of the Next.js application.
        *   Instructions for setting up required environment variables (`.env`).
        *   How to run in development mode: `npm run dev --workspace=frontend`.
        *   How to build for production: `npm run build --workspace=frontend`.
        *   Brief explanation of key directories/components.
    *   **`backend/README.md`:**
        *   Overview of the Node.js backend service (mentioning Firebase integration for user details and Pinata interaction).
        *   Instructions for setting up required environment variables (`.env`).
        *   How to run in development mode: `npm run start:dev --workspace=backend`.
        *   List of primary API endpoints and their purpose.
        *   Database/external service connections (Firebase, Pinata).

## Phase 2: Deployment Configuration

3.  **Update Docker Configuration:**
    *   **Root `Dockerfile`:** Refactor (or potentially split into `frontend.Dockerfile` and `backend.Dockerfile`) to build production-ready images for both the Next.js frontend and the Node.js backend using multi-stage builds.
    *   **`docker-compose.yml`:** Update to define services for `frontend` and `backend`, reference the correct Dockerfile(s) and build contexts, map ports, and manage environment variables.

## Phase 3: Demo Planning

4.  **Create Demo Checklist (`DEMO_CHECKLIST.md`):**
    *   Create a new markdown file in the root directory.
    *   Outline the required features and implementation steps as a checklist:
        *   **User Authentication (Firebase):**
            *   [ ] Setup Firebase project & configure SDKs (Frontend/Backend).
            *   [ ] Implement Frontend Login/Signup UI.
            *   [ ] Implement Backend API endpoints for user registration/login.
            *   [ ] Integrate Frontend UI with Backend Auth API.
            *   [ ] Secure relevant Backend API endpoints.
        *   **Document Upload (Pinata):**
            *   [ ] Configure Pinata SDK/API keys.
            *   [ ] Implement Frontend UI for file selection/upload.
            *   [ ] Implement Backend API endpoint to receive file and upload to Pinata.
            *   [ ] Store Pinata hash/metadata associated with the user (likely in Firebase Firestore).
        *   **View Document Status:**
            *   [ ] Implement Backend API endpoint to retrieve user's documents and their status (e.g., 'Uploaded', 'Pending Verification').
            *   [ ] Implement Frontend UI to display the list of uploaded documents and their status.
        *   **Deployment/Setup:**
            *   [ ] Ensure Docker configuration builds and runs successfully.
            *   [ ] Document steps to run the demo locally using Docker Compose.