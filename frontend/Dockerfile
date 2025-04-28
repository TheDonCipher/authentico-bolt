# Use the official Node.js image as the base image
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production=false --legacy-peer-deps

# Explicitly install TypeScript and required types
RUN npm install --save-dev typescript@5.0.4 @types/react@18.2.0 @types/react-dom@18.2.0 @types/node

# Copy the optimized next.config.js
COPY docker-next-config.js /app/next.config.js

# Copy the rest of the application code
COPY . .

# Set production environment
ENV NODE_ENV=production
ENV SKIP_TYPE_CHECK=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_SKIP_PREFLIGHT_CHECK=true

# Build the application with actual environment variables from Render
# ARG statements allow environment variables to be passed to the build stage
ARG FIREBASE_TYPE
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_PRIVATE_KEY
ARG FIREBASE_CLIENT_EMAIL
ARG FIREBASE_PRIVATE_KEY_ID
ARG FIREBASE_CLIENT_ID
ARG FIREBASE_AUTH_URI
ARG FIREBASE_TOKEN_URI
ARG FIREBASE_AUTH_PROVIDER_X509_CERT_URL
ARG FIREBASE_CLIENT_X509_CERT_URL
ARG FIREBASE_UNIVERSE_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_THIRDWEB_CLIENT_ID
ARG NEXT_PUBLIC_API_URL

# Set environment variables for the build
ENV FIREBASE_TYPE=${FIREBASE_TYPE}
ENV FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
ENV FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
ENV FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
ENV FIREBASE_PRIVATE_KEY_ID=${FIREBASE_PRIVATE_KEY_ID}
ENV FIREBASE_CLIENT_ID=${FIREBASE_CLIENT_ID}
ENV FIREBASE_AUTH_URI=${FIREBASE_AUTH_URI}
ENV FIREBASE_TOKEN_URI=${FIREBASE_TOKEN_URI}
ENV FIREBASE_AUTH_PROVIDER_X509_CERT_URL=${FIREBASE_AUTH_PROVIDER_X509_CERT_URL}
ENV FIREBASE_CLIENT_X509_CERT_URL=${FIREBASE_CLIENT_X509_CERT_URL}
ENV FIREBASE_UNIVERSE_DOMAIN=${FIREBASE_UNIVERSE_DOMAIN}
ENV NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
ENV NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}
ENV NEXT_PUBLIC_THIRDWEB_CLIENT_ID=${NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://authentico-backend.onrender.com/api}

# Run the build with environment variables directly
RUN echo "Building with environment variables from Render..." && \
    # Create a temporary next.config.js that optimizes for production
    cp /app/next.config.js /app/next.config.js.bak && \
    sed -i "s/module.exports = nextConfig;/nextConfig.output = \"standalone\";\nmodule.exports = nextConfig;/" /app/next.config.js && \
    # Create .env file from environment variables
    echo "Creating .env file from environment variables..." && \
    touch /app/.env && \
    # Add Firebase Admin variables if they exist
    if [ -n "$FIREBASE_TYPE" ]; then echo "FIREBASE_TYPE=$FIREBASE_TYPE" >> /app/.env; fi && \
    if [ -n "$FIREBASE_PROJECT_ID" ]; then echo "FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID" >> /app/.env; fi && \
    if [ -n "$FIREBASE_PRIVATE_KEY" ]; then echo "FIREBASE_PRIVATE_KEY=\"$FIREBASE_PRIVATE_KEY\"" >> /app/.env; fi && \
    if [ -n "$FIREBASE_CLIENT_EMAIL" ]; then echo "FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL" >> /app/.env; fi && \
    if [ -n "$FIREBASE_PRIVATE_KEY_ID" ]; then echo "FIREBASE_PRIVATE_KEY_ID=$FIREBASE_PRIVATE_KEY_ID" >> /app/.env; fi && \
    if [ -n "$FIREBASE_CLIENT_ID" ]; then echo "FIREBASE_CLIENT_ID=$FIREBASE_CLIENT_ID" >> /app/.env; fi && \
    if [ -n "$FIREBASE_AUTH_URI" ]; then echo "FIREBASE_AUTH_URI=$FIREBASE_AUTH_URI" >> /app/.env; fi && \
    if [ -n "$FIREBASE_TOKEN_URI" ]; then echo "FIREBASE_TOKEN_URI=$FIREBASE_TOKEN_URI" >> /app/.env; fi && \
    if [ -n "$FIREBASE_AUTH_PROVIDER_X509_CERT_URL" ]; then echo "FIREBASE_AUTH_PROVIDER_X509_CERT_URL=$FIREBASE_AUTH_PROVIDER_X509_CERT_URL" >> /app/.env; fi && \
    if [ -n "$FIREBASE_CLIENT_X509_CERT_URL" ]; then echo "FIREBASE_CLIENT_X509_CERT_URL=$FIREBASE_CLIENT_X509_CERT_URL" >> /app/.env; fi && \
    if [ -n "$FIREBASE_UNIVERSE_DOMAIN" ]; then echo "FIREBASE_UNIVERSE_DOMAIN=$FIREBASE_UNIVERSE_DOMAIN" >> /app/.env; fi && \
    # Add Firebase Client variables if they exist
    if [ -n "$NEXT_PUBLIC_FIREBASE_API_KEY" ]; then echo "NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY" >> /app/.env; fi && \
    if [ -n "$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" ]; then echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" >> /app/.env; fi && \
    if [ -n "$NEXT_PUBLIC_FIREBASE_PROJECT_ID" ]; then echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID" >> /app/.env; fi && \
    if [ -n "$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" ]; then echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" >> /app/.env; fi && \
    if [ -n "$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" ]; then echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" >> /app/.env; fi && \
    if [ -n "$NEXT_PUBLIC_FIREBASE_APP_ID" ]; then echo "NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID" >> /app/.env; fi && \
    # Add ThirdWeb variables if they exist
    if [ -n "$NEXT_PUBLIC_THIRDWEB_CLIENT_ID" ]; then echo "NEXT_PUBLIC_THIRDWEB_CLIENT_ID=$NEXT_PUBLIC_THIRDWEB_CLIENT_ID" >> /app/.env; fi && \
    # Add API URL
    echo "NEXT_PUBLIC_API_URL=https://authentico-backend.onrender.com/api" >> /app/.env && \
    # Log environment status (without exposing sensitive values)
    echo "Environment variables set. Configuration status:" && \
    if [ -n "$FIREBASE_PROJECT_ID" ] && [ -n "$FIREBASE_PRIVATE_KEY" ] && [ -n "$FIREBASE_CLIENT_EMAIL" ]; then \
      echo "Firebase Admin environment variables are configured."; \
    else \
      echo "WARNING: Missing required Firebase Admin environment variables."; \
    fi && \
    if [ -n "$NEXT_PUBLIC_FIREBASE_API_KEY" ] && [ -n "$NEXT_PUBLIC_FIREBASE_PROJECT_ID" ]; then \
      echo "Firebase Client environment variables are configured."; \
    else \
      echo "WARNING: Missing required Firebase Client environment variables."; \
    fi && \
    # Run the build with actual environment variables
    echo "Starting build with actual environment variables..." && \
    npm run build && \
    # Restore the original next.config.js
    mv /app/next.config.js.bak /app/next.config.js

# Production image, copy all the files and run next
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create a writable directory for environment variables
RUN mkdir -p /app/config && chown -R nextjs:nodejs /app/config

# Create entrypoint.sh file
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'echo "Creating runtime .env file..."' >> /app/entrypoint.sh && \
    echo 'touch /app/config/.env' >> /app/entrypoint.sh && \
    echo 'if [ -n "$FIREBASE_TYPE" ]; then echo "FIREBASE_TYPE=$FIREBASE_TYPE" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$FIREBASE_PROJECT_ID" ]; then echo "FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$FIREBASE_PRIVATE_KEY" ]; then' >> /app/entrypoint.sh && \
    echo '  # Handle the private key properly, removing any surrounding quotes' >> /app/entrypoint.sh && \
    echo '  PRIVATE_KEY="$FIREBASE_PRIVATE_KEY"' >> /app/entrypoint.sh && \
    echo '  # Remove surrounding quotes if present' >> /app/entrypoint.sh && \
    echo '  case "$PRIVATE_KEY" in' >> /app/entrypoint.sh && \
    echo '    \"*\")' >> /app/entrypoint.sh && \
    echo '      # Remove first and last character if they are quotes' >> /app/entrypoint.sh && \
    echo '      PRIVATE_KEY=$(echo "$PRIVATE_KEY" | sed "s/^\\\"//" | sed "s/\\\"$//")'  >> /app/entrypoint.sh && \
    echo '      ;;' >> /app/entrypoint.sh && \
    echo '  esac' >> /app/entrypoint.sh && \
    echo '  echo "FIREBASE_PRIVATE_KEY=\"$PRIVATE_KEY\"" >> /app/config/.env' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$FIREBASE_CLIENT_EMAIL" ]; then echo "FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$FIREBASE_PRIVATE_KEY_ID" ]; then echo "FIREBASE_PRIVATE_KEY_ID=$FIREBASE_PRIVATE_KEY_ID" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$FIREBASE_CLIENT_ID" ]; then echo "FIREBASE_CLIENT_ID=$FIREBASE_CLIENT_ID" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$FIREBASE_AUTH_URI" ]; then echo "FIREBASE_AUTH_URI=$FIREBASE_AUTH_URI" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$FIREBASE_TOKEN_URI" ]; then echo "FIREBASE_TOKEN_URI=$FIREBASE_TOKEN_URI" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$FIREBASE_AUTH_PROVIDER_X509_CERT_URL" ]; then echo "FIREBASE_AUTH_PROVIDER_X509_CERT_URL=$FIREBASE_AUTH_PROVIDER_X509_CERT_URL" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$FIREBASE_CLIENT_X509_CERT_URL" ]; then echo "FIREBASE_CLIENT_X509_CERT_URL=$FIREBASE_CLIENT_X509_CERT_URL" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$FIREBASE_UNIVERSE_DOMAIN" ]; then echo "FIREBASE_UNIVERSE_DOMAIN=$FIREBASE_UNIVERSE_DOMAIN" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$NEXT_PUBLIC_FIREBASE_API_KEY" ]; then echo "NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" ]; then echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$NEXT_PUBLIC_FIREBASE_PROJECT_ID" ]; then echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" ]; then echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" ]; then echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$NEXT_PUBLIC_FIREBASE_APP_ID" ]; then echo "NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$NEXT_PUBLIC_THIRDWEB_CLIENT_ID" ]; then echo "NEXT_PUBLIC_THIRDWEB_CLIENT_ID=$NEXT_PUBLIC_THIRDWEB_CLIENT_ID" >> /app/config/.env; fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$NEXT_PUBLIC_API_URL" ]; then' >> /app/entrypoint.sh && \
    echo '  echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" >> /app/config/.env' >> /app/entrypoint.sh && \
    echo 'else' >> /app/entrypoint.sh && \
    echo '  echo "NEXT_PUBLIC_API_URL=https://authentico-backend.onrender.com/api" >> /app/config/.env' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo 'echo "Runtime environment variables set. Configuration status:"' >> /app/entrypoint.sh && \
    echo 'if [ -n "$FIREBASE_PROJECT_ID" ] && [ -n "$FIREBASE_PRIVATE_KEY" ] && [ -n "$FIREBASE_CLIENT_EMAIL" ]; then' >> /app/entrypoint.sh && \
    echo '  echo "Firebase Admin environment variables are configured."' >> /app/entrypoint.sh && \
    echo 'else' >> /app/entrypoint.sh && \
    echo '  echo "WARNING: Missing required Firebase Admin environment variables."' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo 'if [ -n "$NEXT_PUBLIC_FIREBASE_API_KEY" ] && [ -n "$NEXT_PUBLIC_FIREBASE_PROJECT_ID" ]; then' >> /app/entrypoint.sh && \
    echo '  echo "Firebase Client environment variables are configured."' >> /app/entrypoint.sh && \
    echo 'else' >> /app/entrypoint.sh && \
    echo '  echo "WARNING: Missing required Firebase Client environment variables."' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo '# Create a symlink so Next.js can find the environment variables' >> /app/entrypoint.sh && \
    echo 'ln -sf /app/config/.env /app/.env' >> /app/entrypoint.sh && \
    echo 'echo "Created symlink from /app/.env to /app/config/.env"' >> /app/entrypoint.sh && \
    echo 'echo "Starting Next.js application..."' >> /app/entrypoint.sh && \
    echo 'exec npm start' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Make sure the entrypoint script is owned by the nextjs user
RUN chown nextjs:nodejs /app/entrypoint.sh

# Pass environment variables to the runtime stage
ARG FIREBASE_TYPE
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_PRIVATE_KEY
ARG FIREBASE_CLIENT_EMAIL
ARG FIREBASE_PRIVATE_KEY_ID
ARG FIREBASE_CLIENT_ID
ARG FIREBASE_AUTH_URI
ARG FIREBASE_TOKEN_URI
ARG FIREBASE_AUTH_PROVIDER_X509_CERT_URL
ARG FIREBASE_CLIENT_X509_CERT_URL
ARG FIREBASE_UNIVERSE_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_THIRDWEB_CLIENT_ID
ARG NEXT_PUBLIC_API_URL

# Set environment variables for runtime
ENV FIREBASE_TYPE=${FIREBASE_TYPE}
ENV FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
ENV FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
ENV FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
ENV FIREBASE_PRIVATE_KEY_ID=${FIREBASE_PRIVATE_KEY_ID}
ENV FIREBASE_CLIENT_ID=${FIREBASE_CLIENT_ID}
ENV FIREBASE_AUTH_URI=${FIREBASE_AUTH_URI}
ENV FIREBASE_TOKEN_URI=${FIREBASE_TOKEN_URI}
ENV FIREBASE_AUTH_PROVIDER_X509_CERT_URL=${FIREBASE_AUTH_PROVIDER_X509_CERT_URL}
ENV FIREBASE_CLIENT_X509_CERT_URL=${FIREBASE_CLIENT_X509_CERT_URL}
ENV FIREBASE_UNIVERSE_DOMAIN=${FIREBASE_UNIVERSE_DOMAIN}
ENV NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
ENV NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}
ENV NEXT_PUBLIC_THIRDWEB_CLIENT_ID=${NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://authentico-backend.onrender.com/api}

# Switch to non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Start the application using our entrypoint script
CMD ["/app/entrypoint.sh"]