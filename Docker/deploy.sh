#!/bin/bash

# DVCC Backend Deployment Script
# Usage: ./deploy.sh [environment]
# Environment options: development, staging, production (default: production)

set -e  # Exit on any error

# Default environment
ENVIRONMENT=${1:-production}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [development|staging|production]"
    exit 1
fi

# Set docker-compose file based on environment
COMPOSE_FILE="Docker/docker-compose.${ENVIRONMENT}.yml"

echo "🚀 Deploying DVCC Backend to $ENVIRONMENT environment..."
echo "📁 Using compose file: $COMPOSE_FILE"

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Docker compose file not found: $COMPOSE_FILE"
    exit 1
fi

# Pull latest code
echo "📥 Pulling latest code from main branch..."
git pull origin main

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down

# Remove old images (optional - uncomment if you want to clean up)
# echo "🧹 Cleaning up old images..."
# docker image prune -f

# Build and start new containers
echo "🔨 Building and starting new containers..."
docker-compose -f "$COMPOSE_FILE" up --build -d

# Wait for health check
echo "⏳ Waiting for application to be healthy..."
sleep 10

# Check container status
echo "📊 Container status:"
docker-compose -f "$COMPOSE_FILE" ps

# Check logs for any errors
echo "📋 Recent logs:"
docker-compose -f "$COMPOSE_FILE" logs --tail=20

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be available at: http://localhost:4000"
echo "🏥 Health check: http://localhost:4000/health"
