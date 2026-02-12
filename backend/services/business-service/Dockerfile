FROM node:18-alpine

# Build from backend root so we can include shared/
WORKDIR /backend/services/business-service

# Copy package files
COPY services/business-service/package*.json ./

# Install dependencies
RUN npm install

# Copy service code
COPY services/business-service/ ./

# Copy shared constants (required by BusinessProfile.js: ../../../../shared/constants)
COPY shared/ /backend/shared/

# Expose port
EXPOSE 3002

# Start service
CMD ["npm", "start"]
