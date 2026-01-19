#!/bin/bash

# Helper script to create .env files for all services
# Run this after deploying contracts to set up environment variables

set -e

echo "📝 Creating .env files for all services..."
echo ""

# Get contract addresses (if provided as arguments)
ACCESS_CONTROL_ADDR=${1:-"0x..."}
USER_REGISTRY_ADDR=${2:-"0x..."}
DOCUMENT_STORAGE_ADDR=${3:-"0x..."}
AUDIT_LOG_ADDR=${4:-"0x..."}
DEPLOYER_KEY=${5:-"0x..."}

echo "⚠️  You'll need to manually edit these files to add:"
echo "   - Contract addresses (from deployment output)"
echo "   - DEPLOYER_PRIVATE_KEY (from Ganache)"
echo "   - MONGO_URI (your MongoDB connection string)"
echo "   - EMAIL_API_KEY (if using SendGrid)"
echo "   - JWT_SECRET (strong random string)"
echo ""

# Auth Service
cat > auth-service/.env << EOF
AUTH_SERVICE_PORT=3001
MONGO_URI=mongodb://localhost:27017/capstone_project
EMAIL_API_PROVIDER=sendgrid
EMAIL_API_KEY=your_sendgrid_api_key_here
EMAIL_API_URL=https://api.sendgrid.com/v3
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
IPFS_PROVIDER=local
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=http://127.0.0.1:8080/ipfs/
AUDIT_SERVICE_URL=http://localhost:3004
JWT_SECRET=change_this_to_a_strong_random_secret_key
CORS_ORIGIN=http://localhost:5173
EOF
echo "✅ Created auth-service/.env"

# Business Service
cat > business-service/.env << EOF
BUSINESS_SERVICE_PORT=3002
MONGO_URI=mongodb://localhost:27017/capstone_project
IPFS_PROVIDER=local
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=http://127.0.0.1:8080/ipfs/
AUDIT_SERVICE_URL=http://localhost:3004
AUTH_SERVICE_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:5173
EOF
echo "✅ Created business-service/.env"

# Admin Service
cat > admin-service/.env << EOF
ADMIN_SERVICE_PORT=3003
MONGO_URI=mongodb://localhost:27017/capstone_project
AUTH_SERVICE_URL=http://localhost:3001
AUDIT_SERVICE_URL=http://localhost:3004
BUSINESS_SERVICE_URL=http://localhost:3002
CORS_ORIGIN=http://localhost:5173
EOF
echo "✅ Created admin-service/.env"

# Audit Service
cat > audit-service/.env << EOF
AUDIT_SERVICE_PORT=3004
MONGO_URI=mongodb://localhost:27017/capstone_project
GANACHE_RPC_URL=http://127.0.0.1:7545
DEPLOYER_PRIVATE_KEY=${DEPLOYER_KEY}
ACCESS_CONTROL_CONTRACT_ADDRESS=${ACCESS_CONTROL_ADDR}
USER_REGISTRY_CONTRACT_ADDRESS=${USER_REGISTRY_ADDR}
DOCUMENT_STORAGE_CONTRACT_ADDRESS=${DOCUMENT_STORAGE_ADDR}
AUDIT_LOG_CONTRACT_ADDRESS=${AUDIT_LOG_ADDR}
AUDIT_CONTRACT_ADDRESS=${AUDIT_LOG_ADDR}
CORS_ORIGIN=http://localhost:5173
EOF
echo "✅ Created audit-service/.env"

echo ""
echo "📋 Next steps:"
echo "   1. Edit audit-service/.env and add:"
echo "      - DEPLOYER_PRIVATE_KEY (from Ganache)"
echo "      - Contract addresses (from deployment output)"
echo "   2. Edit auth-service/.env and add:"
echo "      - EMAIL_API_KEY (if using SendGrid)"
echo "      - JWT_SECRET (strong random string)"
echo "   3. Update MONGO_URI in all files if using MongoDB Atlas"
echo ""
