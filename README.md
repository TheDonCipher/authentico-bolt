# Authentico

Authentico is a comprehensive document authentication and verification platform built using a modern tech stack and following best practices for scalable, maintainable software development.

## Project Structure

The project is organized as a monorepo using Lerna, with the following main directories:

```
authentico/
├── frontend/
├── backend/
│   ├── document-service/
│   ├── verification-service/
│   ├── user-service/
├── smart-contracts/
├── .github/
│   └── workflows/
```

### Frontend

The frontend is built using Next.js 13 with TypeScript and Tailwind CSS. It utilizes the shadcn/ui component library for a consistent and modern UI.

### Backend

The backend is composed of three microservices, each built with NestJS:

1. Document Service: Handles document management and storage.
2. Verification Service: Manages the verification process for documents.
3. User Service: Handles user authentication and management.

### Smart Contracts

Smart contracts are written in Solidity and managed using Foundry for testing and deployment.

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/your-org/authentico.git
   cd authentico
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development environment:
   ```
   npm run dev
   ```

This command will start the frontend and all backend services concurrently.

## Development Workflow

- Use feature branches and pull requests for all changes.
- Ensure all tests pass before merging changes.
- Follow the established coding standards and best practices.

## CI/CD

GitHub Actions are set up for continuous integration:

- `frontend-ci.yml`: Runs tests and builds the frontend.
- `backend-ci.yml`: Runs tests and builds each backend service.
- `smart-contracts-ci.yml`: Runs tests for smart contracts.

## Deployment

The project is containerized using Docker, with configurations in `docker-compose.yml`. For production deployment, follow these steps:

1. Build the Docker images:
   ```
   docker-compose build
   ```

2. Deploy the stack:
   ```
   docker-compose up -d
   ```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the [MIT License](LICENSE).
