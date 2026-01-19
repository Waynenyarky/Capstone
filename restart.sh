#!/bin/bash
#
# Restart Services Script
# 
# This script restarts all Docker services, web frontend, and opens browser tabs.
#
# Usage:
#   ./restart.sh          # Production mode
#   ./restart.sh --dev    # Development mode

set -e

# Colors for output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if dev mode is requested
DEV_MODE=false
if [ "$1" = "--dev" ] || [ "$1" = "-d" ]; then
  DEV_MODE=true
  echo -e "${CYAN}🔄 Restarting services in DEVELOPMENT mode...${NC}\n"
else
  echo -e "${CYAN}🔄 Restarting services...${NC}\n"
fi

# Restart Docker services
echo -e "${CYAN}Restarting Docker services...${NC}"
if [ "$DEV_MODE" = true ]; then
  docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart
else
  docker-compose restart
fi

# Restart web dev server if it was running
if [ -f "/tmp/web-dev-server.pid" ]; then
  WEB_PID=$(cat /tmp/web-dev-server.pid)
  if ps -p $WEB_PID > /dev/null 2>&1; then
    echo -e "${CYAN}Restarting web dev server...${NC}"
    kill $WEB_PID 2>/dev/null || true
    rm -f /tmp/web-dev-server.pid
  fi
fi

# Kill any existing vite processes
if pgrep -f "vite.*5173" > /dev/null; then
  echo -e "${CYAN}Stopping existing web dev servers...${NC}"
  pkill -f "vite.*5173" 2>/dev/null || true
  sleep 1
fi

# Start web dev server if web directory exists
if [ -d "web" ]; then
  cd web
  if [ -d "node_modules" ]; then
    echo -e "${GREEN}Starting web dev server...${NC}"
    npm run dev > /tmp/web-dev-server.log 2>&1 &
    WEB_PID=$!
    echo $WEB_PID > /tmp/web-dev-server.pid
    echo -e "${CYAN}Web server starting (PID: $WEB_PID)${NC}"
  else
    echo -e "${YELLOW}⚠️  Web dependencies not installed. Run: cd web && npm install${NC}"
  fi
  cd ..
fi

# Wait a moment
sleep 5

# Open browser tabs
echo -e "\n${GREEN}🌐 Opening browser tabs...${NC}\n"
./scripts/open-services.sh

echo -e "\n${GREEN}✅ Done! Services restarted and browser tabs opened.${NC}\n"
