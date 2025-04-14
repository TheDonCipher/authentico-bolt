# Authentico Backend

This directory contains the Node.js backend service for the Authentico platform. It handles business logic, user authentication (via Firebase), document interactions (via Pinata), and provides APIs for the frontend.

## Overview

This service is built using Node.js and likely Express (based on dependencies). It serves as the central API for the Authentico application.

Key responsibilities include:
- Managing user data and authentication (Firebase).
- Handling document uploads and metadata storage.
- Interacting with the Pinata service to store documents on IPFS.
- Providing endpoints for the frontend to fetch data and perform actions.

## Environment Variables

This service requires environment variables for configuration, especially for connecting to external services like Firebase and Pinata.

1.  Copy the `sample.env` file to `.env` in this `backend/` directory.
    ```bash
    cp sample.env .env
    ```
2.  Fill in the required values in the `.env` file. Essential variables include:
    *   `PORT`: The port the server will run on (e.g., `8080`).
    *   `FIREBASE_PROJECT_ID`: Your Firebase project ID.
    *   `FIREBASE_PRIVATE_KEY`: Your Firebase service account private key.
    *   `FIREBASE_CLIENT_EMAIL`: Your Firebase service account client email.
    *   `PINATA_API_KEY`: Your Pinata API Key.
    *   `PINATA_SECRET_API_KEY`: Your Pinata Secret API Key.
    *   *(Add any other backend-specific variables here, like database connection strings if applicable)*

## Development

To run the backend service in development mode:

1.  Ensure all dependencies are installed by running `npm install` from the **root** directory of the monorepo.
2.  Start the development server by running the following command **from the root directory**:
    ```bash
    npm run dev:backend
    # Or, if you run `npm run dev` from the root, it will start this automatically.
    ```
3.  This uses `nodemon` to watch for file changes and automatically restart the server. The server will typically run on the port specified in your `.env` file (e.g., `http://localhost:8080`).

## API Endpoints

The service provides the following primary API endpoints (details TBC):

-   `POST /api/auth/register`: User registration.
-   `POST /api/auth/login`: User login.
-   `POST /api/documents/upload`: Upload a new document.
-   `GET /api/documents`: Get a list of the user's documents and their status.
-   *(Add/modify endpoints based on actual implementation)*

## External Services

-   **Firebase:** Used for user authentication and potentially storing user-related metadata (like document references) in Firestore.
-   **Pinata:** Used to pin document files to IPFS, ensuring decentralized storage.