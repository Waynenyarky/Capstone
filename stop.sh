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
  # More aggressive cleanup - kill all npm run dev processes too
  pkill -f "npm run dev" 2>/dev/null || true
  pkill -f "node.*vite" 2>/dev/null || true
  echo -e "${GREEN}✅ All web servers stopped${NC}\n"
fi

# Detect if using MongoDB Atlas
USING_ATLAS=false
if [ -f ".env" ]; then
    if grep -q "^MONGO_URI=mongodb+srv://" .env 2>/dev/null || grep -q "^MONGO_URI=mongodb://.*mongodb.net" .env 2>/dev/null; then
        USING_ATLAS=true
    fi
fi

# Ask user if they want to preserve data before removing volumes
if [ "$USING_ATLAS" = true ]; then
    echo -e "${CYAN}ℹ️  Using MongoDB Atlas (cloud database)${NC}"
    
    # Ask about database clearing
    echo -e "${YELLOW}⚠️  WARNING: This will permanently delete ALL data in your Atlas database!${NC}"
    echo -ne "${RED}Clear Atlas database? [y/N]: ${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}🗑️  Clearing Atlas database...${NC}"
        if [ -f ".env" ]; then
            # Load .env and run clear script
            export $(grep -v '^#' .env | xargs)
            if command -v node &> /dev/null; then
                node backend/scripts/clear-database.js
                if [ $? -eq 0 ]; then
                    echo -e "${GREEN}✅ Atlas database cleared!${NC}\n"
                else
                    echo -e "${RED}❌ Failed to clear Atlas database${NC}\n"
                fi
            else
                echo -e "${RED}❌ Node.js not found - cannot clear database${NC}\n"
            fi
        else
            echo -e "${RED}❌ .env file not found - cannot clear database${NC}\n"
        fi
    else
        echo -e "${CYAN}💡 Atlas database data preserved${NC}\n"
    fi
    
    # Ask about local volumes
    echo -ne "${YELLOW}Remove local Docker volumes (IPFS, contracts)? [y/N]: ${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}�️  Removing local volumes...${NC}"
        docker-compose down -v 2>/dev/null || docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v 2>/dev/null || true
        echo -e "${GREEN}✅ Local volumes removed!${NC}\n"
    else
        echo -e "${CYAN}💡 Local volumes kept${NC}\n"
    fi
else
    echo -e "${CYAN}ℹ️  Using local MongoDB${NC}"
    echo -ne "${YELLOW}Keep data for next start? [y/N]: ${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${CYAN}💡 Data preservation requested. Volumes will be kept.${NC}\n"
        echo -e "${GREEN}✅ Data preserved!${NC}\n"
    else
        echo -e "${YELLOW}🗑️  Removing volumes (clean slate)...${NC}"
        docker-compose down -v 2>/dev/null || docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v 2>/dev/null || true
        echo -e "${GREEN}✅ All volumes removed!${NC}\n"
        echo -e "${CYAN}🧹 Complete clean - fresh start next time!${NC}\n"
    fi
fi

echo -e "${GREEN}Done!${NC}"
echo -e "${CYAN}To start again: ./start.sh${NC}\n"
