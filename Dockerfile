# Use Node.js official image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json yarn.lock ./
COPY prisma ./prisma/

# Install dependencies (production only)
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Copy source code
COPY . .

# Generate Prisma Client and build the application
RUN yarn prisma generate && yarn build

# Remove dev dependencies to reduce image size
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

# Expose the port your app runs on
EXPOSE 4000

# Start the application
CMD ["yarn", "start:prod"]