# syntax=docker/dockerfile:1
FROM node:18-alpine

# Build from backend root so we can include shared/
WORKDIR /backend/services/audit-service

# Copy package files
COPY services/audit-service/package*.json ./

# Install dependencies (cache mount speeds up rebuilds)
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Copy service code
COPY services/audit-service/ ./

# Copy shared directory (required by models for encryptionPlugin, etc.)
COPY shared/ /backend/shared/

# Expose port
EXPOSE 3004

# Start service
CMD ["npm", "start"]
