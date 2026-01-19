#!/bin/bash

# Script to start all microservices
# Checks prerequisites and starts services

set -e

echo "🚀 Starting all microservices..."

# Check MongoDB
if ! command -v mongod &> /dev/null && [ -z "$MONGO_URI" ]; then
    echo "⚠️  MongoDB not found locally and MONGO_URI not set"
    echo "   Please start MongoDB or set MONGO_URI in .env files"
fi

# Check IPFS (optional)
if ! lsof -ti:5001 > /dev/null 2>&1; then
    echo "⚠️  IPFS not running on port 5001"
    echo "   Start IPFS: ipfs daemon"
    echo "   Or configure Pinata/Infura in .env files"
fi

# Check Ganache (optional - only needed for audit service)
if ! lsof -ti:7545 > /dev/null 2>&1; then
    echo "⚠️  Ganache not running on port 7545"
    echo "   Start Ganache: ganache-cli"
    echo "   Or configure testnet in audit-service/.env"
fi

# Check if .env files exist
if [ ! -f "auth-service/.env" ]; then
    echo "⚠️  auth-service/.env not found"
    echo "   Create it from .env.example"
fi

if [ ! -f "audit-service/.env" ]; then
    echo "⚠️  audit-service/.env not found"
    echo "   Create it from .env.example"
    echo "   IMPORTANT: Set contract addresses after deploying contracts!"
fi

echo ""
echo "📦 Installing dependencies..."
npm run install:all

echo ""
echo "🎯 Starting services..."
echo "   Auth Service: http://localhost:3001"
echo "   Business Service: http://localhost:3002"
echo "   Admin Service: http://localhost:3003"
echo "   Audit Service: http://localhost:3004"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

npm start
