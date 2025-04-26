# Authentico Frontend - Next.js 14 Application with App Router

## Overview

The Authentico Frontend is the user interface for the Authentico platform, built using Next.js 14, TypeScript, and the App Router. It provides a comprehensive suite of features for user and organization verification, secure document management, and administrative oversight. Designed to integrate seamlessly with the Authentico Backend, it delivers a responsive, accessible, and efficient user experience.

### Key Features

- **Secure Authentication and Authorization**: Leverages Firebase Authentication and Thirdweb for robust user registration, login, and session management. Implements role-based access control to effectively manage user permissions and ensure secure access to different platform features.
- **Organization Verification UI**: Offers an intuitive user interface for initiating, tracking, and comprehensively managing organization verification processes. Provides real-time status updates and facilitates seamless interaction throughout the verification lifecycle.
- **Document Verification UI**: Enables secure and efficient uploading, management, and monitoring of document verification statuses. Supports a wide range of document formats and ensures data integrity and security.
- **Admin Dashboard**: Features a powerful admin dashboard that provides tools for managing users, organizations, verifications, system configurations, and comprehensive platform monitoring. Enhances administrative efficiency and control.
- **Responsive and Accessible Design**: Engineered with a fully responsive design that adapts to various devices, ensuring optimal usability across desktops, tablets, and mobile devices. Adheres to accessibility guidelines to ensure accessibility for all users.
- **Backend API Integration**: Seamlessly integrates with the Authentico Backend API using RESTful services, ensuring real-time data synchronization and efficient communication between frontend and backend systems.
- **Next.js 14 App Router**: Built on the Next.js 14 App Router to leverage enhanced performance, streamlined routing, and improved maintainability, contributing to a robust and scalable frontend architecture.
- **Blockchain Integration**: Connects to the Ethereum blockchain (Sepolia testnet) via Thirdweb for document verification and anchoring.
- **Enhanced Security Measures**: Incorporates security best practices at every layer, including protection against common web vulnerabilities, secure data handling, and regular security audits to maintain a high security posture.
- **Real-time Updates and Notifications**: Implements WebSocket communication to provide real-time updates and notifications, enhancing user engagement and system responsiveness.
- **Advanced Form Handling**: Utilizes `react-hook-form` and `yup` for sophisticated form management and validation, ensuring data accuracy and improving user input processes.
- **Efficient Data Fetching**: Employs `swr` for optimized data fetching strategies, including caching and revalidation, to enhance application performance and reduce latency.
- **Rich UI Components**: Leverages `Radix UI` and `shadcn/ui` to deliver accessible, styled, and reusable UI components, ensuring a consistent and high-quality user interface.
- **Neubrutalism Design**: Features a modern neubrutalism design with a clean UI and nature-based color palette (Forest Green primary).

### Technology Stack

- **Next.js 14 (App Router)**: Core React framework for web applications.
- **TypeScript**: Static typing for enhanced code quality.
- **React**: UI library for building components.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Thirdweb**: Web3 infrastructure SDK for blockchain integration.
- **Firebase**: Authentication and client-side functionalities.
- **Zustand**: State management library.
- **axios**: HTTP client for API requests.
- **react-hook-form**: Form management library.
- **yup**: Schema validation library.
- **@hookform/resolvers**: Yup integration for react-hook-form.
- **swr**: Data fetching and caching library.
- **date-fns**: Date utility library.
- **WebSocket**: Real-time communication.
- **Radix UI**: Accessible UI primitives.
- **shadcn/ui**: Styled components based on Radix UI and Tailwind CSS.
- **ESLint**: JavaScript and TypeScript linter.
- **Prettier**: Code formatter.
- **framer-motion**: Animation library.
- **qrcode.react**: QR code generation library.
- **Jest**: Testing framework.
- **Cypress**: End-to-end testing framework.
- **Testing Library**: React testing utilities.

## Getting Started

### Prerequisites

- **Node.js (>=18.x) and npm (>=8.x)**: Ensure that Node.js version 18 or higher and npm version 8 or higher are installed on your development environment.
- **Firebase Project**: A Firebase project must be set up and configured for the frontend application to enable Firebase services.
- **Thirdweb Account**: A Thirdweb account is required for blockchain integration.

### Environment Setup

1. **Clone Repository**:

   ```bash
   git clone <repository-url>
   cd authentico
   ```

2. **Copy Configuration Template**:

   ```bash
   cp frontend/.env.example frontend/.env
   ```

3. **Configure `.env`**:
   Modify the `.env` file located in the `frontend/` directory to configure Firebase settings, Thirdweb, and API URLs.

   **Environment Variables**:

   - `NEXT_PUBLIC_API_URL`: Specifies the base URL for the Authentico Backend API (e.g., `http://localhost:8080/api`), directing frontend API requests.
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: API key for the Firebase client-side SDK, necessary for accessing Firebase services from the frontend.
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase Authentication domain, used for authenticating users with Firebase.
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase Project ID, identifying your Firebase project.
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase Storage bucket name, used for accessing Firebase Storage.
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase Cloud Messaging sender ID, used for push notifications.
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase App ID, uniquely identifying your Firebase application.
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: Firebase Measurement ID (optional), used for Firebase analytics.
   - `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`: Thirdweb Client ID for blockchain integration.
   - `NEXT_PUBLIC_GATEWAY_URL`: Pinata gateway URL for accessing IPFS content.
   - `NEXT_PUBLIC_WEBSOCKET_URL`: WebSocket URL (e.g., `ws://localhost:8080`), for real-time communication features.

   **Configuration Notes**:

   - Firebase configuration details can be found in your Firebase project settings under Project settings > General > Web apps.
   - Ensure `NEXT_PUBLIC_API_URL` is correctly set to point to your running backend service for seamless API communication.

### Installation

1. **Install Dependencies**:
   From the project root directory, run:

   ```bash
   npm install
   ```

   or from the frontend directory:

   ```bash
   cd frontend
   npm install
   ```

## Development and Usage

### Run in Development Mode

To start the frontend application in development mode, execute the following command from the project root directory:

```bash
npm run dev:frontend
```

or from the frontend directory:

```bash
cd frontend
npm run dev
```

This command launches the frontend app at `http://localhost:3000`. Development mode features hot-reloading, which automatically updates the application in the browser upon code changes, enhancing the development experience.

### Production Build

To create a production-ready build of the Authentico Frontend:

1. **Install Dependencies**: Ensure all project dependencies are installed by running `npm install`.
2. **Build Command**: From the project root directory, run:
   ```bash
   npm run build --workspace=frontend
   ```
   or from the frontend directory:
   ```bash
   cd frontend
   npm run build
   ```
   This command generates an optimized production build in the `frontend/.next` directory. The contents of this directory are ready to be deployed to your chosen hosting service.

### Project Structure

- `app/`: Contains the Next.js 14 App Router structure, organizing routes, layouts, pages, and server components to define the application's UI and routing logic.
  - `layout.tsx`: Defines the root layout of the application, providing a consistent UI structure across all pages.
  - `page.tsx`: Represents the home page of the application, serving as the entry point for users.
  - `[organization-verification-id]/`: Directory for pages related to organization verification processes, handling specific verification IDs.
  - `[document-verification-id]/`: Directory for pages managing document verification processes, organized by document verification IDs.
  - `admin/`: Contains pages for the admin dashboard, providing administrative functionalities and protected access.
  - `api/`: Includes API routes for frontend-specific serverless functions, enhancing frontend capabilities.
  - `auth/`: Directory for authentication-related pages, such as login, registration, and password management.
  - `dashboard/`: Contains pages for the user dashboard, offering users a personalized view and access to their activities.
  - `organization-dashboard/`: Contains pages for the organization dashboard, providing organization-specific functionalities.
  - `individual-dashboard/`: Contains pages for the individual user dashboard, providing user-specific functionalities.
- `public/`: Stores static assets such as images, fonts, and other public files that are directly served by Next.js.
- `components/`: Houses reusable React components, built using shadcn/ui, to maintain UI consistency and component reusability across the application.
  - `ui/`: Contains basic UI components like buttons, inputs, and cards.
  - `layout/`: Contains layout components like headers, footers, and sidebars.
  - `document/`: Contains document-related components like document cards and viewers.
  - `organization/`: Contains organization-related components like organization cards and forms.
  - `auth/`: Contains authentication-related components like login and registration forms.
  - `admin/`: Contains admin-specific components like admin panels and dashboards.
- `lib/`: Contains utility functions, custom hooks, and shared logic that are used throughout the frontend application, promoting code reuse and maintainability.
  - `api/`: Contains API client functions for communicating with the backend.
  - `utils/`: Contains utility functions for common tasks.
  - `hooks/`: Contains custom React hooks for shared functionality.
  - `context/`: Contains React context providers for state management.
  - `validation/`: Contains validation schemas and functions.
- `test/`: Includes unit, integration, and end-to-end tests for testing individual components, integration between them, and complete user flows, ensuring code reliability and security.
  - `unit/`: Contains unit tests for individual components and functions.
  - `integration/`: Contains integration tests for API clients and services.
  - `e2e/`: Contains end-to-end tests for complete user flows.
  - `security/`: Contains security-focused tests for potential vulnerabilities.
- `middleware.ts`: Configures Next.js middleware to handle request modifications, authentication checks, and routing adjustments.
- `next.config.js`: The main Next.js configuration file, used to customize Next.js behavior, including build settings and experimental features.
- `tailwind.config.ts`: Configuration file for Tailwind CSS, defining the project's styling, theme, and utility classes.
- `tsconfig.json`: TypeScript configuration file, specifying compiler options and project settings for TypeScript compilation.

## Testing

The Authentico Frontend includes a comprehensive test suite to ensure code reliability, functionality, and security. The tests are organized into several categories:

- **Unit Tests**: Test individual utility functions and components in isolation.
- **Integration Tests**: Test the interaction between different parts of the application, such as API clients and services.
- **End-to-End Tests**: Test complete user flows, such as document upload and verification, blockchain integration, and authentication.
- **Security Tests**: Test for potential security vulnerabilities, such as XSS, CSRF, and input validation.

To run the tests, use the following commands:

```bash
# Run all tests
npm run test:all

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run security tests
npm run test:security

# Run tests with coverage report
npm run test:coverage
```

## Deployment

The Authentico Frontend can be deployed to various hosting platforms, with Vercel being the recommended option for Next.js applications.

### Vercel Deployment

1. **Prepare for Deployment**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   npm run deploy:vercel
   ```

   Alternatively, you can deploy directly from the Vercel dashboard by connecting your GitHub repository.

3. **Environment Variables**:
   Make sure to set all the required environment variables in the Vercel dashboard.

### Docker Deployment

The Authentico Frontend can also be deployed using Docker:

```bash
# Build the Docker image
docker build -t authentico-frontend -f frontend/Dockerfile .

# Run the Docker container
docker run -p 3000:3000 authentico-frontend
```

For more detailed deployment instructions, refer to the [DEPLOYMENT_GUIDE.md](../docs/DEPLOYMENT_GUIDE.md) in the project documentation.

## Contribution

We welcome contributions to the Authentico Frontend project. Please adhere to the following guidelines when contributing:

- **Coding Standards**: Maintain code consistency by following ESLint and Prettier configurations. Ensure code is clean, readable, and adheres to project coding standards.
- **Commit Messages**: Write clear, concise, and descriptive commit messages using a conventional format to ensure a well-documented commit history.
- **Testing**: Develop comprehensive unit and integration tests for all new features and changes. Aim for high test coverage to ensure the reliability and stability of the codebase.
- **Pull Requests**: Submit well-structured pull requests with detailed descriptions of the changes. Ensure pull requests are focused and address specific issues or features. All pull requests will be reviewed by project maintainers before merging.
- **Documentation**: Update relevant documentation, including README files, component documentation, and guides, to reflect any changes in code or functionality.

For more detailed contribution guidelines, please refer to [CONTRIBUTING.md](../docs/CONTRIBUTING.md) in the project documentation.

## License

The Authentico Frontend is proprietary software. License details are available in the `LICENSE` file. All rights reserved under the Authentico license.
