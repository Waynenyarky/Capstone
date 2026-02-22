# syntax=docker/dockerfile:1
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (cache mount speeds up rebuilds)
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Start service
CMD ["npm", "start"]
