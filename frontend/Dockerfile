# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Set Node.js memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy the rest of the application code
COPY . .

# Copy the .env file
COPY .env .env

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]