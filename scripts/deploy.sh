#!/bin/bash

# Authentico Deployment Script
# This script helps with deploying the Authentico application to production environments

# Exit on error
set -e

# Display help message
function show_help {
  echo "Authentico Deployment Script"
  echo "Usage: ./deploy.sh [options]"
  echo ""
  echo "Options:"
  echo "  -h, --help                 Show this help message"
  echo "  -e, --env [environment]    Set deployment environment (dev, prod)"
  echo "  -t, --target [target]      Deployment target (vercel, render, docker)"
  echo "  -b, --build                Build the application"
  echo "  -d, --deploy               Deploy the application"
  echo ""
  echo "Examples:"
  echo "  ./deploy.sh --env prod --target vercel --build --deploy"
  echo "  ./deploy.sh --env prod --target docker --build"
  echo ""
}

# Default values
ENVIRONMENT="dev"
TARGET="docker"
BUILD=false
DEPLOY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -h|--help)
      show_help
      exit 0
      ;;
    -e|--env)
      ENVIRONMENT="$2"
      shift
      shift
      ;;
    -t|--target)
      TARGET="$2"
      shift
      shift
      ;;
    -b|--build)
      BUILD=true
      shift
      ;;
    -d|--deploy)
      DEPLOY=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
  echo "Error: Invalid environment. Use 'dev' or 'prod'."
  exit 1
fi

# Validate target
if [[ "$TARGET" != "vercel" && "$TARGET" != "render" && "$TARGET" != "docker" ]]; then
  echo "Error: Invalid target. Use 'vercel', 'render', or 'docker'."
  exit 1
fi

# Display configuration
echo "Deployment Configuration:"
echo "  Environment: $ENVIRONMENT"
echo "  Target: $TARGET"
echo "  Build: $BUILD"
echo "  Deploy: $DEPLOY"
echo ""

# Setup environment files
function setup_env {
  echo "Setting up $ENVIRONMENT environment..."
  
  if [[ "$ENVIRONMENT" == "prod" ]]; then
    cp frontend/.env.production frontend/.env
    cp backend/.env.production backend/.env
  else
    cp frontend/.env.example frontend/.env
    cp backend/.env.example backend/.env
  fi
  
  echo "Environment files set up."
  echo ""
}

# Build the application
function build_app {
  echo "Building the application..."
  
  if [[ "$TARGET" == "docker" ]]; then
    echo "Building Docker images..."
    docker-compose build
  else
    echo "Running npm build..."
    npm run build
  fi
  
  echo "Build completed."
  echo ""
}

# Deploy the application
function deploy_app {
  echo "Deploying the application..."
  
  if [[ "$TARGET" == "vercel" ]]; then
    echo "Deploying to Vercel..."
    cd frontend
    npx vercel --prod
    cd ..
  elif [[ "$TARGET" == "render" ]]; then
    echo "Deploying to Render..."
    echo "Please use the Render Dashboard to deploy the application."
    echo "Render Blueprint URL: https://dashboard.render.com/select-repo?type=blueprint"
  elif [[ "$TARGET" == "docker" ]]; then
    echo "Starting Docker containers..."
    docker-compose up -d
  fi
  
  echo "Deployment completed."
  echo ""
}

# Main execution
setup_env

if [[ "$BUILD" == true ]]; then
  build_app
fi

if [[ "$DEPLOY" == true ]]; then
  deploy_app
fi

echo "Deployment script completed."
