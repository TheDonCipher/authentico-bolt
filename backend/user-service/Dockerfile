# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Copy wait-for-it.sh script
COPY wait-for-it.sh /usr/local/bin/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh

# Build the application
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Expose the port the app runs on
EXPOSE 3003

# Start the application with wait-for-it.sh
CMD ["sh", "-c", "wait-for-it.sh db:5432 -- sh -c 'npx prisma migrate deploy && npx ts-node prisma/seed.ts && node dist/main'"]