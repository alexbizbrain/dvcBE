#!/bin/bash

# DVCC Backend Deployment Script
# Usage: ./deploy.sh [environment]
# Environment options: development, staging, production (default: production)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-production}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo -e "${RED}Invalid environment: $ENVIRONMENT${NC}"
    echo "Usage: $0 [development|staging|production]"
    exit 1
fi

# Set docker-compose file based on environment
COMPOSE_FILE="Docker/docker-compose.${ENVIRONMENT}.yml"

echo "Deploying DVCC Backend to $ENVIRONMENT environment..."
echo "Using compose file: $COMPOSE_FILE"

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}Docker compose file not found: $COMPOSE_FILE${NC}"
    exit 1
fi

# Pull latest code
echo "Pulling latest code from main branch..."
git pull origin main

# Stop existing containers
echo "Stopping existing containers..."
docker compose -f "$COMPOSE_FILE" down

# Optional: Clean up old images
if [ "$2" == "--clean" ]; then
    echo "Cleaning up old Docker images..."
    docker image prune -f
fi

# Build and start new containers
echo "Building and starting new containers..."
docker compose -f "$COMPOSE_FILE" up --build -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 15

# Health check with retry
echo "Running health checks..."
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -sf http://localhost/health > /dev/null 2>&1; then
        echo -e "${GREEN}Health check passed!${NC}"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
            echo -e "${RED}Health check failed after $MAX_RETRIES attempts${NC}"
            echo "Check logs with: docker compose -f $COMPOSE_FILE logs"
            exit 1
        fi
        echo "Health check attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying..."
        sleep 5
    fi
done

# Check container status
echo "Container status:"
docker compose -f "$COMPOSE_FILE" ps

# Show recent logs
echo "Recent logs (nginx):"
docker compose -f "$COMPOSE_FILE" logs --tail=10 nginx

echo "Recent logs (nestjs-app):"
docker compose -f "$COMPOSE_FILE" logs --tail=10 nestjs-app

# Test nginx config
echo "Testing nginx configuration..."
docker exec nginx-${ENVIRONMENT} nginx -t

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "Application URL: http://52.52.133.33"
echo "Health check: http://52.52.133.33/health"
echo ""
echo "Useful commands:"
echo "  View logs: docker compose -f $COMPOSE_FILE logs -f"
echo "  Stop: docker compose -f $COMPOSE_FILE down"
echo "  Restart: docker compose -f $COMPOSE_FILE restart"