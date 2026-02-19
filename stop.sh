#!/bin/bash
#
# Stop Services Script
# 
# This script stops all Docker services gracefully.
#
# Usage:
#   ./stop.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}🛑 Stopping Docker services...${NC}\n"

# Stop all services (try both regular and dev mode)
docker-compose down 2>/dev/null || docker-compose -f docker-compose.yml -f docker-compose.dev.yml down 2>/dev/null || true

echo -e "\n${GREEN}✅ All Docker services stopped!${NC}\n"

# Stop web preview server (demo/production build on 4173) if running
if [ -f "/tmp/web-preview-server.pid" ]; then
  WEB_PID=$(cat /tmp/web-preview-server.pid)
  if ps -p $WEB_PID > /dev/null 2>&1; then
    echo -e "${CYAN}🛑 Stopping web preview server (4173)...${NC}"
    kill $WEB_PID 2>/dev/null || true
    rm -f /tmp/web-preview-server.pid
    echo -e "${GREEN}✅ Web preview server stopped${NC}\n"
  else
    rm -f /tmp/web-preview-server.pid
  fi
fi

# Stop web dev server (Vite HMR on 5173) if running
if [ -f "/tmp/web-dev-server.pid" ]; then
  WEB_PID=$(cat /tmp/web-dev-server.pid)
  if ps -p $WEB_PID > /dev/null 2>&1; then
    echo -e "${CYAN}🛑 Stopping web dev server (5173)...${NC}"
    kill $WEB_PID 2>/dev/null || true
    rm -f /tmp/web-dev-server.pid
    echo -e "${GREEN}✅ Web dev server stopped${NC}\n"
  else
    rm -f /tmp/web-dev-server.pid
  fi
fi

# Also kill any remaining vite processes (dev or preview)
if pgrep -f "vite.*5173" > /dev/null || pgrep -f "vite preview" > /dev/null || pgrep -f "vite.*4173" > /dev/null; then
  echo -e "${CYAN}🛑 Stopping any remaining web servers...${NC}"
  pkill -f "vite.*5173" 2>/dev/null || true
  pkill -f "vite preview" 2>/dev/null || true
  pkill -f "vite.*4173" 2>/dev/null || true
  echo -e "${GREEN}✅ All web servers stopped${NC}\n"
fi

# Optional: Ask if user wants to remove volumes (clean slate)
read -p "$(echo -e ${YELLOW}Do you want to remove volumes? This will delete all data. [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️  Removing volumes...${NC}"
    docker-compose down -v 2>/dev/null || docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v 2>/dev/null || true
    echo -e "${GREEN}✅ Volumes removed!${NC}\n"
else
    echo -e "${CYAN}💡 Data preserved. Volumes not removed.${NC}\n"
fi

echo -e "${GREEN}Done!${NC}"
echo -e "${CYAN}To start again: ./start.sh${NC}\n"
