FROM node:18-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package*.json ./
RUN npm install

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
