# Authentico Deployment Script (PowerShell)
# This script helps with deploying the Authentico application to production environments

# Display help message
function Show-Help {
    Write-Host "Authentico Deployment Script"
    Write-Host "Usage: .\deploy.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Help                    Show this help message"
    Write-Host "  -Environment [env]       Set deployment environment (dev, prod)"
    Write-Host "  -Target [target]         Deployment target (vercel, render, docker)"
    Write-Host "  -Build                   Build the application"
    Write-Host "  -Deploy                  Deploy the application"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\deploy.ps1 -Environment prod -Target vercel -Build -Deploy"
    Write-Host "  .\deploy.ps1 -Environment prod -Target docker -Build"
    Write-Host ""
}

# Parameters
param (
    [switch]$Help,
    [ValidateSet("dev", "prod")]
    [string]$Environment = "dev",
    [ValidateSet("vercel", "render", "docker")]
    [string]$Target = "docker",
    [switch]$Build,
    [switch]$Deploy
)

# Show help if requested
if ($Help) {
    Show-Help
    exit 0
}

# Display configuration
Write-Host "Deployment Configuration:"
Write-Host "  Environment: $Environment"
Write-Host "  Target: $Target"
Write-Host "  Build: $Build"
Write-Host "  Deploy: $Deploy"
Write-Host ""

# Setup environment files
function Setup-Env {
    Write-Host "Setting up $Environment environment..."
    
    if ($Environment -eq "prod") {
        Copy-Item -Path "frontend/.env.production" -Destination "frontend/.env" -Force
        Copy-Item -Path "backend/.env.production" -Destination "backend/.env" -Force
    } else {
        Copy-Item -Path "frontend/.env.example" -Destination "frontend/.env" -Force
        Copy-Item -Path "backend/.env.example" -Destination "backend/.env" -Force
    }
    
    Write-Host "Environment files set up."
    Write-Host ""
}

# Build the application
function Build-App {
    Write-Host "Building the application..."
    
    if ($Target -eq "docker") {
        Write-Host "Building Docker images..."
        docker-compose build
    } else {
        Write-Host "Running npm build..."
        npm run build
    }
    
    Write-Host "Build completed."
    Write-Host ""
}

# Deploy the application
function Deploy-App {
    Write-Host "Deploying the application..."
    
    if ($Target -eq "vercel") {
        Write-Host "Deploying to Vercel..."
        Set-Location -Path "frontend"
        npx vercel --prod
        Set-Location -Path ".."
    } elseif ($Target -eq "render") {
        Write-Host "Deploying to Render..."
        Write-Host "Please use the Render Dashboard to deploy the application."
        Write-Host "Render Blueprint URL: https://dashboard.render.com/select-repo?type=blueprint"
    } elseif ($Target -eq "docker") {
        Write-Host "Starting Docker containers..."
        docker-compose up -d
    }
    
    Write-Host "Deployment completed."
    Write-Host ""
}

# Main execution
Setup-Env

if ($Build) {
    Build-App
}

if ($Deploy) {
    Deploy-App
}

Write-Host "Deployment script completed."
