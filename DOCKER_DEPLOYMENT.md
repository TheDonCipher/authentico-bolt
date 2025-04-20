# Docker Deployment Guide for Authentico

This guide provides detailed instructions for deploying the Authentico application using Docker and Docker Compose.

## Prerequisites

Before proceeding, ensure you have:

1. Docker installed on your deployment machine
2. Docker Compose installed on your deployment machine
3. All required environment variables prepared

## Environment Setup

1. Set up the production environment variables:

   ```bash
   # Copy the production environment files
   cp frontend/.env.production frontend/.env
   cp backend/.env.production backend/.env
   ```

2. Edit the `.env` files in the frontend and backend directories to include your actual production values.

## Docker Deployment

### Building the Docker Images

1. Build the Docker images using Docker Compose:

   ```bash
   docker-compose build
   ```

   This will build both the frontend and backend services as defined in the `docker-compose.yml` file.

### Starting the Services

1. Start the services in detached mode:

   ```bash
   docker-compose up -d
   ```

2. Verify that the services are running:

   ```bash
   docker-compose ps
   ```

   You should see both the frontend and backend services running.

### Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api

### Viewing Logs

To view the logs for the services:

```bash
# View logs for all services
docker-compose logs

# View logs for a specific service
docker-compose logs frontend
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f
```

### Stopping the Services

To stop the services:

```bash
docker-compose down
```

## Production Deployment Considerations

### Using a Reverse Proxy

For production deployments, it's recommended to use a reverse proxy like Nginx to handle SSL termination and routing:

1. Create an Nginx configuration file:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://frontend:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /api {
           proxy_pass http://backend:8080/api;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

2. Add the Nginx service to your `docker-compose.yml`:

   ```yaml
   nginx:
     image: nginx:alpine
     ports:
       - "80:80"
       - "443:443"
     volumes:
       - ./nginx.conf:/etc/nginx/conf.d/default.conf
       - ./certbot/conf:/etc/letsencrypt
       - ./certbot/www:/var/www/certbot
     depends_on:
       - frontend
       - backend
     networks:
       - authentico-net
   ```

### SSL Configuration

For SSL, you can use Certbot with Nginx:

1. Add a Certbot service to your `docker-compose.yml`:

   ```yaml
   certbot:
     image: certbot/certbot
     volumes:
       - ./certbot/conf:/etc/letsencrypt
       - ./certbot/www:/var/www/certbot
     entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
   ```

2. Set up SSL in your Nginx configuration.

## Scaling the Application

To scale the backend service:

```bash
docker-compose up -d --scale backend=3
```

This will start 3 instances of the backend service.

## Monitoring and Health Checks

Add health check endpoints to your services and configure Docker health checks in your `docker-compose.yml`:

```yaml
backend:
  build:
    context: .
    dockerfile: Dockerfile
    target: backend-prod
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8080/api/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

## Backup and Restore

Regularly backup your Firebase data and any other persistent data.

## Troubleshooting

### Container Issues

If containers are not starting properly:

```bash
# Check container logs
docker-compose logs [service_name]

# Check container status
docker-compose ps

# Restart a specific service
docker-compose restart [service_name]
```

### Network Issues

If services cannot communicate:

```bash
# Check the network
docker network inspect authentico-net

# Recreate the network
docker-compose down
docker network prune
docker-compose up -d
```

### Resource Issues

If containers are running out of resources:

```bash
# Check resource usage
docker stats

# Increase resource limits in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```
