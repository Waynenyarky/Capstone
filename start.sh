#!/bin/bash
#
# One-Command Start Script
# 
# This script starts Docker services, web frontend, and automatically opens browser tabs
# when everything is ready. No need to remember commands!
#
# Usage:
#   ./start.sh          # Production mode (no auto-reload)
#   ./start.sh --dev    # Development mode (auto-reload enabled)

# Don't exit on error - we want to continue even if web server fails
set +e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if dev mode is requested
DEV_MODE=false
if [ "$1" = "--dev" ] || [ "$1" = "-d" ]; then
  DEV_MODE=true
  echo -e "${CYAN}🚀 Starting in DEVELOPMENT mode (auto-reload enabled)...${NC}"
  docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
else
  echo -e "${CYAN}🚀 Starting Docker services...${NC}"
  docker-compose up -d
fi

echo ""
echo -e "${CYAN}⏳ Waiting for services to initialize...${NC}"
sleep 5

echo ""
echo -e "${CYAN}🌐 Starting web frontend...${NC}"

# Check if web directory exists and has node_modules
if [ -d "web" ]; then
  cd web
  
  # Check if node_modules exists, if not, install dependencies
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}   Installing web dependencies (first time only)...${NC}"
    npm install
  fi
  
  # Start web dev server in background
  if ! pgrep -f "vite.*5173" > /dev/null; then
    echo -e "${GREEN}   Starting web dev server on port 5173...${NC}"
    # Start in background and capture PID
    (npm run dev > /tmp/web-dev-server.log 2>&1) &
    WEB_PID=$!
    echo $WEB_PID > /tmp/web-dev-server.pid
    sleep 2  # Give it a moment to start
    if ps -p $WEB_PID > /dev/null 2>&1; then
      echo -e "${GREEN}   ✅ Web server started (PID: $WEB_PID)${NC}"
      echo -e "${CYAN}   Logs: tail -f /tmp/web-dev-server.log${NC}"
    else
      echo -e "${YELLOW}   ⚠️  Web server may have failed to start. Check logs: tail /tmp/web-dev-server.log${NC}"
    fi
  else
    echo -e "${YELLOW}   Web dev server already running${NC}"
  fi
  
  cd ..
else
  echo -e "${YELLOW}   ⚠️  Web directory not found, skipping web frontend${NC}"
fi

echo ""
echo -e "${CYAN}⏳ Waiting a bit more for everything to be ready...${NC}"
sleep 3

echo ""
echo -e "${CYAN}🌐 Opening browser tabs...${NC}"
./scripts/open-services.sh

echo ""
echo -e "${GREEN}✅ All done! Your services are running and browser tabs are open.${NC}"
echo ""
if [ "$DEV_MODE" = true ]; then
  echo -e "${CYAN}🔥 Development Mode: Auto-reload enabled!${NC}"
  echo -e "${CYAN}   • Backend services will restart automatically on file changes${NC}"
  echo -e "${CYAN}   • Frontend has hot module replacement (HMR) - changes appear instantly${NC}"
  echo ""
fi
echo -e "${CYAN}Running services:${NC}"
echo -e "   • Docker services (MongoDB, IPFS, APIs)"
if [ -f "/tmp/web-dev-server.pid" ]; then
  echo -e "   • Web frontend (http://localhost:5173) - HMR enabled"
fi
echo ""
echo -e "${CYAN}To stop:${NC}"
echo -e "   • Docker: ./stop.sh"
if [ -f "/tmp/web-dev-server.pid" ]; then
  echo -e "   • Web: kill \$(cat /tmp/web-dev-server.pid) or pkill -f vite"
fi
echo ""
echo -e "${CYAN}To view logs:${NC}"
if [ "$DEV_MODE" = true ]; then
  echo -e "   • Docker: docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f"
else
  echo -e "   • Docker: docker-compose logs -f"
fi
if [ -f "/tmp/web-dev-server.pid" ]; then
  echo -e "   • Web: tail -f /tmp/web-dev-server.log"
fi
echo ""
if [ "$DEV_MODE" = false ]; then
  echo -e "${YELLOW}💡 Tip: Use './start.sh --dev' for development mode with auto-reload!${NC}"
fi
