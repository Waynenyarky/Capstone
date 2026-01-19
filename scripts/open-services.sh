#!/bin/bash
#
# Auto-Open Services Script
# 
# This script waits for Docker services to be ready, then automatically
# opens browser tabs for easy access - no need to remember URLs!
#
# Usage:
#   ./scripts/open-services.sh
#   # Or after docker-compose up:
#   docker-compose up -d && ./scripts/open-services.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Waiting for services to be ready...${NC}"

# Function to check if a service is ready
check_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        # Check if container is running and healthy
        if docker ps --filter "name=$service" --filter "status=running" --format "{{.Names}}" | grep -q "^${service}$"; then
            # Check if container is healthy (if healthcheck exists)
            local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$service" 2>/dev/null || echo "none")
            if [ "$health_status" = "healthy" ] || [ "$health_status" = "none" ]; then
                # Try to check port connectivity
                if command -v nc >/dev/null 2>&1 && nc -z localhost "$port" 2>/dev/null; then
                    return 0
                elif command -v curl >/dev/null 2>&1 && curl -s --max-time 1 "http://localhost:$port" >/dev/null 2>&1; then
                    return 0
                elif docker exec "$service" echo "test" >/dev/null 2>&1; then
                    # Container is running and exec works, assume it's ready
                    return 0
                fi
            fi
        fi
        echo -e "${YELLOW}   Waiting for $service... (attempt $attempt/$max_attempts)${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    return 1
}

# Function to open URL in browser (cross-platform)
open_browser() {
    local url=$1
    local name=$2
    
    echo -e "${GREEN}   ✅ Opening $name...${NC}"
    echo -e "${CYAN}      URL: $url${NC}"
    
    # Detect OS and use appropriate command
    local result=0
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if ! open "$url" 2>&1; then
            result=$?
            echo -e "${RED}   ❌ Failed to open $url (exit code: $result)${NC}"
            echo -e "${YELLOW}   Try manually: open \"$url\"${NC}"
            return 1
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ -n "$WINDIR" ]]; then
        # Windows (Git Bash, Cygwin, or Windows)
        if command -v cmd.exe >/dev/null 2>&1; then
            cmd.exe //c start "" "$url" 2>&1
        elif command -v start >/dev/null 2>&1; then
            start "$url" 2>&1
        else
            echo -e "${YELLOW}   ⚠️  Could not find command to open browser on Windows${NC}"
            echo -e "${CYAN}      Please open manually: $url${NC}"
            return 1
        fi
    else
        # Linux and other Unix-like systems
        if command -v xdg-open >/dev/null 2>&1; then
            xdg-open "$url" 2>&1
        elif command -v gnome-open >/dev/null 2>&1; then
            gnome-open "$url" 2>&1
        else
            echo -e "${YELLOW}   ⚠️  Could not find command to open browser${NC}"
            echo -e "${CYAN}      Please open manually: $url${NC}"
            return 1
        fi
    fi
    
    # Small delay between opens to avoid overwhelming the browser
    sleep 0.5
    return 0
}

# Wait for services
echo -e "${BLUE}📦 Checking Docker services...${NC}"

# Check MongoDB
if check_service "capstone-mongodb" 27017; then
    echo -e "${GREEN}✅ MongoDB is ready${NC}"
else
    echo -e "${RED}❌ MongoDB not ready${NC}"
fi

# Check IPFS
if check_service "capstone-ipfs" 5001; then
    echo -e "${GREEN}✅ IPFS is ready${NC}"
else
    echo -e "${RED}❌ IPFS not ready${NC}"
fi

# Check Ganache
if check_service "capstone-ganache" 7545; then
    echo -e "${GREEN}✅ Ganache is ready${NC}"
else
    echo -e "${YELLOW}⚠️  Ganache not ready (may still be starting)${NC}"
fi

# Wait a bit more for services to fully initialize
echo -e "${CYAN}⏳ Giving services a moment to fully initialize...${NC}"
sleep 5

# Wait for API services to actually be responding
echo -e "${CYAN}⏳ Waiting for API services to be ready...${NC}"
for port in 3001 3002 3003 3004; do
    service_name=""
    case $port in
        3001) service_name="Auth" ;;
        3002) service_name="Business" ;;
        3003) service_name="Admin" ;;
        3004) service_name="Audit" ;;
    esac
    
    max_wait=30
    waited=0
    while [ $waited -lt $max_wait ]; do
        http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "http://localhost:$port/api/health" 2>/dev/null || echo "000")
        if [ "$http_code" = "200" ]; then
            echo -e "${GREEN}   ✅ $service_name Service ($port) is ready${NC}"
            break
        fi
        sleep 1
        waited=$((waited + 1))
    done
    if [ $waited -ge $max_wait ]; then
        echo -e "${YELLOW}   ⚠️  $service_name Service ($port) not responding after ${max_wait}s${NC}"
    fi
done
sleep 2

echo -e "\n${GREEN}🌐 Opening browser tabs...${NC}\n"
echo -e "${CYAN}💡 Note: Browser tabs may open in the background. Check your browser!${NC}\n"

# Open IPFS Gateway with a test file (IPFS logo) to verify it works
# The root URL doesn't work, so we use a known test CID
open_browser "http://localhost:8080/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG" "IPFS Gateway (Test)"

# Small delay before next
sleep 1

# Open IPFS Web UI (if available)
open_browser "http://localhost:5001/webui" "IPFS Web UI"
sleep 1

# Print MongoDB connection info instead of trying to open HTML file
echo -e "\n${BLUE}🔌 MongoDB Connection Info:${NC}"
echo -e "${CYAN}   Connection String:${NC} mongodb://localhost:27017"
echo -e "${CYAN}   Database:${NC} capstone_project"
echo -e "${CYAN}   Quick Access:${NC} docker exec -it capstone-mongodb mongosh capstone_project"
echo -e "${CYAN}   MongoDB Compass:${NC} https://www.mongodb.com/try/download/compass"
echo ""

# Check and open API services (using health endpoints which actually exist)
echo -e "\n${BLUE}🔌 Checking API services...${NC}"

# Function to check if service is actually responding (already checked above, just verify)
check_service_ready() {
    local port=$1
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "http://localhost:$port/api/health" 2>/dev/null || echo "000")
    if [ "$http_code" = "200" ]; then
        return 0
    fi
    return 1
}

# Open only services that are confirmed ready (we already waited above)
echo -e "\n${BLUE}🔌 Opening API service tabs...${NC}"

# Auth Service
if check_service_ready 3001; then
    open_browser "http://localhost:3001/api/health" "Auth Service (Health Check)"
    sleep 0.5
else
    echo -e "${YELLOW}   ⚠️  Skipping Auth Service (3001) - not ready${NC}"
    echo -e "${CYAN}      Check logs: docker-compose logs auth-service${NC}"
fi

# Business Service
if check_service_ready 3002; then
    open_browser "http://localhost:3002/api/health" "Business Service (Health Check)"
    sleep 0.5
else
    echo -e "${YELLOW}   ⚠️  Skipping Business Service (3002) - not ready${NC}"
    echo -e "${CYAN}      Check logs: docker-compose logs business-service${NC}"
fi

# Admin Service
if check_service_ready 3003; then
    open_browser "http://localhost:3003/api/health" "Admin Service (Health Check)"
    sleep 0.5
else
    echo -e "${YELLOW}   ⚠️  Skipping Admin Service (3003) - not ready${NC}"
    echo -e "${CYAN}      Check logs: docker-compose logs admin-service${NC}"
fi

# Audit Service
if check_service_ready 3004; then
    open_browser "http://localhost:3004/api/health" "Audit Service (Health Check)"
    sleep 0.5
else
    echo -e "${YELLOW}   ⚠️  Skipping Audit Service (3004) - not ready${NC}"
    echo -e "${CYAN}      Check logs: docker-compose logs audit-service${NC}"
fi

# Web frontend - always try to open (will show error if not running)
# Check if web server is running using multiple methods for cross-platform compatibility
WEB_RUNNING=false
if command -v nc >/dev/null 2>&1 && nc -z localhost 5173 2>/dev/null; then
    WEB_RUNNING=true
elif command -v curl >/dev/null 2>&1 && curl -s --max-time 1 "http://localhost:5173" >/dev/null 2>&1; then
    WEB_RUNNING=true
elif command -v timeout >/dev/null 2>&1 && timeout 1 bash -c "echo > /dev/tcp/localhost/5173" 2>/dev/null; then
    WEB_RUNNING=true
fi

if [ "$WEB_RUNNING" = true ]; then
    open_browser "http://localhost:5173" "Web App"
    sleep 0.5
else
    echo -e "${YELLOW}   ℹ️  Web frontend not running, but opening anyway...${NC}"
    echo -e "${YELLOW}   (Start it with: cd web && npm run dev)${NC}"
    open_browser "http://localhost:5173" "Web App (Not Running)"
fi

echo -e "\n${GREEN}✅ Done! Browser tabs should be open.${NC}\n"
echo -e "${CYAN}💡 Tip: If tabs didn't open, check your browser - they might be in the background.${NC}"
echo -e "${CYAN}💡 Tip: Bookmark these pages for quick access!${NC}\n"
echo -e "${YELLOW}📋 Quick URLs (copy/paste these if needed):${NC}"
echo -e "   Web App: http://localhost:5173"
echo -e "   IPFS Gateway: http://localhost:8080/ipfs/{CID}"
echo -e "   IPFS Web UI: http://localhost:5001/webui"
echo -e "   Auth API: http://localhost:3001/api/health"
echo -e "   Business API: http://localhost:3002/api/health"
echo -e "   Admin API: http://localhost:3003/api/health"
echo -e "   Audit API: http://localhost:3004/api/health"
echo -e "   MongoDB: mongodb://localhost:27017/capstone_project"
echo ""
echo -e "${CYAN}💡 To start the web frontend: cd web && npm run dev${NC}"
echo ""

# No temp file to clean up anymore
