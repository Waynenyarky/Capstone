#!/bin/bash

echo "🔧 Fixing auth-service dependencies..."

# Install speakeasy if missing
if ! npm list speakeasy &>/dev/null; then
    echo "📦 Installing missing speakeasy dependency..."
    npm install speakeasy
fi

# Verify installation
if node -e "try { require('speakeasy'); console.log('✅ speakeasy verified'); } catch(e) { process.exit(1); }"; then
    echo "🎉 Dependencies fixed successfully!"
else
    echo "❌ Failed to fix dependencies"
    exit 1
fi
