# syntax=docker/dockerfile:1
FROM node:18-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Install dependencies (cache mount speeds up rebuilds)
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Copy contract files
COPY contracts/ ./contracts/
COPY migrations/ ./migrations/
COPY scripts/ ./scripts/
COPY truffle-config.js ./
COPY extract-addresses.js write-env.js ./

# Compile contracts
RUN npm run compile

# Default command (will be overridden by docker-compose)
CMD ["npm", "run", "migrate:ganache"]
