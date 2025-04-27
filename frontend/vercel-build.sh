#!/bin/bash

# Direct build script for Vercel deployment
echo "Starting direct Vercel build process..."

# Install TypeScript dependencies
echo "Installing TypeScript dependencies..."
npm install --save-dev typescript@5.8.3 @types/react@18.2.0 @types/react-dom@18.2.0

# Verify installation
echo "Verifying TypeScript dependencies..."
npm list typescript @types/react @types/react-dom

# Build the Next.js application
echo "Building Next.js application..."
next build

echo "Build process completed!"
