#!/bin/bash

# Deployment script for smart contracts
# This script compiles and deploys all contracts to Ganache

set -e

echo "🚀 Starting contract deployment..."

# Check if Ganache is running
if ! lsof -ti:7545 > /dev/null 2>&1; then
    echo "⚠️  Ganache is not running on port 7545"
    echo "   Please start Ganache first:"
    echo "   ganache-cli"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to cancel..."
fi

# Compile contracts
echo ""
echo "📦 Compiling contracts..."
npm run compile

# Deploy contracts
echo ""
echo "🚀 Deploying contracts to Ganache..."
npm run migrate --network ganache

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Contract addresses (copy these to audit-service/.env):"
echo ""

# Extract contract addresses from migration output
# Note: This is a simple extraction - you may need to check the actual output
echo "Please check the migration output above for contract addresses:"
echo "  - ACCESS_CONTROL_CONTRACT_ADDRESS"
echo "  - USER_REGISTRY_CONTRACT_ADDRESS"
echo "  - DOCUMENT_STORAGE_CONTRACT_ADDRESS"
echo "  - AUDIT_LOG_CONTRACT_ADDRESS"
echo ""
echo "Next steps:"
echo "  1. Copy contract addresses to backend/services/audit-service/.env"
echo "  2. Set DEPLOYER_PRIVATE_KEY in audit-service/.env (first Ganache account)"
echo "  3. Grant roles in AccessControl contract (see DEPLOYMENT_STEPS.md)"
