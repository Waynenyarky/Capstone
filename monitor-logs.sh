#!/bin/bash

echo "🔍 Monitoring Business Service Logs"
echo "===================================="
echo ""
echo "Waiting for payment creation attempts..."
echo "Press Ctrl+C to stop"
echo ""

docker logs capstone-business-service -f 2>&1 | grep --line-buffered -E "(POST.*payment|error|Error|failed|Failed|Business profile|businessId)"
