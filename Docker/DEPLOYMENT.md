# EC2 Deployment Guide

This guide covers deploying the DVCC Backend application to AWS EC2 with the new organized Docker structure.

## Quick Start

### Option 1: Using the Deployment Script (Recommended)

```bash
# Deploy to production
./Docker/deploy.sh production

# Deploy to staging
./Docker/deploy.sh staging

# Deploy to development
./Docker/deploy.sh development
```

### Option 2: Manual Deployment

```bash
# Pull latest code
git pull origin main

# Stop existing containers
docker-compose -f Docker/docker-compose.production.yml down

# Build and start new containers
docker-compose -f Docker/docker-compose.production.yml up --build -d
```

## Migration from Old Structure

If you're migrating from the old unstructured Docker files, follow these steps:

### 1. Update Your EC2 Deployment Process

**Before (old structure):**

```bash
docker-compose up --build
```

**After (new structure):**

```bash
docker-compose -f Docker/docker-compose.production.yml up --build
```

### 2. Update Any Existing Scripts

If you have any deployment scripts on EC2, update them to use the new file paths:

```bash
# Old
docker-compose -f docker-compose.yml down
docker-compose -f docker-compose.yml up --build -d

# New
docker-compose -f Docker/docker-compose.production.yml down
docker-compose -f Docker/docker-compose.production.yml up --build -d
```

### 3. Environment Variables

Make sure your EC2 instance has the required environment variables set:

```bash
# Required
export DATABASE_URL="your_database_url"
export JWT_SECRET="your_jwt_secret"
export JWT_REFRESH_SECRET="your_jwt_refresh_secret"

# Optional (with defaults)
export JWT_ISS="dvcc-app"
export JWT_AUD="dvcc-users"
export APP_NAME="DVCC"
export FRONTEND_URL="your_frontend_url"
export AWS_REGION="us-east-1"

# AWS (if using S3)
export AWS_ACCESS_KEY_ID="your_aws_key"
export AWS_SECRET_ACCESS_KEY="your_aws_secret"
export AWS_S3_BUCKET_NAME="your_bucket"

# Twilio (if using SMS)
export TWILIO_ACCOUNT_SID="your_twilio_sid"
export TWILIO_AUTH_TOKEN="your_twilio_token"
export TWILIO_MESSAGING_SERVICE_SID="your_twilio_service_sid"
```

## Environment-Specific Deployment

### Production Deployment

```bash
# Using script
./Docker/deploy.sh production

# Manual
docker-compose -f Docker/docker-compose.production.yml up --build -d
```

**Production Features:**

- Optimized for performance
- Health checks enabled
- No default environment variables (all must be set)
- Uses `yarn start:prod`

### Staging Deployment

```bash
# Using script
./Docker/deploy.sh staging

# Manual
docker-compose -f Docker/docker-compose.staging.yml up --build -d
```

**Staging Features:**

- Production build
- Health checks enabled
- Some default environment variables
- Uses `yarn start:prod`

### Development Deployment

```bash
# Using script
./Docker/deploy.sh development

# Manual
docker-compose -f Docker/docker-compose.development.yml up --build -d
```

**Development Features:**

- Hot reload enabled
- Volume mounts for live code updates
- Uses `yarn start:dev`
- More verbose logging

## Troubleshooting

### Common Issues

1. **"docker-compose.yml not found"**
   - Solution: Use the full path `Docker/docker-compose.production.yml`

2. **"Dockerfile not found"**
   - Solution: The Dockerfile is now in the `Docker/` folder, and the compose files reference it correctly

3. **Environment variables not working**
   - Solution: Make sure all required environment variables are set on your EC2 instance

### Health Checks

Monitor your deployment:

```bash
# Check container status
docker-compose -f Docker/docker-compose.production.yml ps

# Check logs
docker-compose -f Docker/docker-compose.production.yml logs -f

# Check health endpoint
curl http://localhost:4000/health
```

### Rollback Process

If you need to rollback:

```bash
# Stop current containers
docker-compose -f Docker/docker-compose.production.yml down

# Checkout previous commit
git checkout HEAD~1

# Deploy previous version
docker-compose -f Docker/docker-compose.production.yml up --build -d
```

## Automation Recommendations

### 1. GitHub Actions (CI/CD)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USERNAME }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /path/to/your/app
            ./Docker/deploy.sh production
```

### 2. Cron Job for Automatic Updates

```bash
# Add to crontab (crontab -e)
# Check for updates every hour
0 * * * * cd /path/to/your/app && git pull origin main && ./Docker/deploy.sh production
```

### 3. Systemd Service

Create `/etc/systemd/system/dvcc-backend.service`:

```ini
[Unit]
Description=DVCC Backend Service
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/your/app
ExecStart=/path/to/your/app/Docker/deploy.sh production
ExecStop=/usr/bin/docker-compose -f /path/to/your/app/Docker/docker-compose.production.yml down

[Install]
WantedBy=multi-user.target
```

## Security Considerations

1. **Environment Variables**: Store sensitive data in AWS Systems Manager Parameter Store or AWS Secrets Manager
2. **Firewall**: Ensure only necessary ports are open (4000 for the app)
3. **SSL/TLS**: Use a reverse proxy (nginx) with SSL certificates
4. **Updates**: Keep Docker and the base image updated

## Monitoring

Set up monitoring for:

- Container health
- Application logs
- Resource usage (CPU, memory)
- Database connections
- API response times
