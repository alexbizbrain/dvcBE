# Docker Configuration

This folder contains all Docker-related configuration files for the DVCC Backend application.

## Structure

```
Docker/
├── README.md                           # This file
├── Dockerfile                          # Main Docker image definition
├── .dockerignore                       # Docker ignore patterns
├── docker-compose.development.yml      # Development environment
├── docker-compose.staging.yml          # Staging environment
└── docker-compose.production.yml       # Production environment
```

## Usage

### Development

```bash
# Run development environment
docker-compose -f Docker/docker-compose.development.yml up --build

# Run in background
docker-compose -f Docker/docker-compose.development.yml up -d --build
```

### Staging

```bash
# Run staging environment
docker-compose -f Docker/docker-compose.staging.yml up --build

# Run in background
docker-compose -f Docker/docker-compose.staging.yml up -d --build
```

### Production

```bash
# Run production environment
docker-compose -f Docker/docker-compose.production.yml up --build

# Run in background
docker-compose -f Docker/docker-compose.production.yml up -d --build
```

## Environment Variables

Make sure to set the following environment variables before running:

### Required

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret

### Optional (with defaults)

- `JWT_ISS` - JWT issuer (default: dvcc-app)
- `JWT_AUD` - JWT audience (default: dvcc-users)
- `APP_NAME` - Application name (default: DVCC)
- `FRONTEND_URL` - Frontend URL (default: http://localhost:3000)
- `AWS_REGION` - AWS region (default: us-east-1)
- `FROM_EMAIL` - Default from email address

### AWS (if using S3)

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET_NAME`

### Twilio (if using SMS)

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_MESSAGING_SERVICE_SID`

## Environment Differences

### Development

- Hot reload enabled with volume mounts
- Source code mounted for live updates
- Uses `yarn start:dev` command
- More verbose logging

### Staging

- Production build
- Uses `yarn start:prod` command
- Health checks enabled
- Optimized for testing

### Production

- Production build
- Uses `yarn start:prod` command
- Health checks enabled
- Optimized for performance
- No default values for critical environment variables

## Health Checks

All environments include health checks that:

- Check every 30 seconds
- Timeout after 10 seconds
- Retry up to 3 times
- Wait 40 seconds before starting checks

The health check endpoint is available at: `http://localhost:4000/health`
