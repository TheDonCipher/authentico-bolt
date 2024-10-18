#!/bin/sh
set -e

echo "Running entrypoint.sh script..."

# Wait for the database to be ready
wait-for-it.sh db:5432 -- echo "Postgres is up - executing command"

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Seed the database
echo "Seeding the database..."
npx prisma db seed

# List current directory contents
echo "Current directory contents:"
ls -la

# List dist directory contents
echo "Dist directory contents:"
ls -la dist

# Display Node.js and npm versions
echo "Node.js version:"
node --version
echo "NPM version:"
npm --version

# Start the application
echo "Starting the application..."
node --trace-warnings dist/main.js