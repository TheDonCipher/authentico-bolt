# Authentico Frontend

This directory contains the Next.js 14 application for the Authentico platform, using the App Router.

## Overview

The frontend provides the user interface for interacting with the Authentico platform, including user authentication, document upload, and viewing document status. It communicates with the Node.js backend service for data and operations.

## Environment Variables

This application requires certain environment variables to function correctly, especially for connecting to the backend API.

1.  Copy the `sample.env` file (if one exists in this directory, otherwise create a new file) to `.env` in this `frontend/` directory.
    ```bash
    cp sample.env .env
    ```
2.  Fill in the required values in the `.env` file. Key variables typically include:
    *   `NEXT_PUBLIC_API_BASE_URL`: The base URL for the backend API (e.g., `http://localhost:8080/api`).
    *   *(Add any other frontend-specific variables here, like Firebase config if handled client-side)*

## Development

To run the frontend application in development mode:

1.  Ensure all dependencies are installed by running `npm install` from the **root** directory of the monorepo.
2.  Start the development server by running the following command **from the root directory**:
    ```bash
    npm run dev:frontend
    # Or, if you run `npm run dev` from the root, it will start this automatically.
    ```
3.  The application will typically be available at `http://localhost:3000`.

## Building for Production

To build the frontend application for production:

1.  Ensure all dependencies are installed (`npm install` from root).
2.  Run the build command **from the root directory**:
    ```bash
    npm run build --workspace=frontend
    ```
3.  The production-ready build will be located in the `.next` directory within `frontend/`.

## Key Directories

-   `app/`: Contains the core application code, including pages, layouts, and components, following the Next.js App Router structure.
-   `public/`: Static assets that are served directly.
-   `components/`: Reusable UI components (if structured this way).
-   `lib/`: Utility functions, hooks, etc.