#!/bin/bash
#
# One-Command Start Script
# 
# This script starts Docker services, web frontend, and automatically opens browser tabs
# when everything is ready. No need to remember commands!
#
# Usage:
#   ./start.sh              # Production mode (no auto-reload)
#   ./start.sh --dev        # Development mode (auto-reload enabled)
#   ./start.sh --skip-ai    # Skip AI model check
#   ./start.sh --retrain    # Force retrain AI model
#   ./start.sh --clean      # Clean up unused Docker resources before starting
#   ./start.sh --status     # Just show status, don't start anything

# Don't exit on error - we want to continue even if web server fails
set +e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
DEV_MODE=false
SKIP_AI=false
RETRAIN_AI=false
FULL_TRAIN=false
CLEAN_DOCKER=false
STATUS_ONLY=false

for arg in "$@"; do
  case $arg in
    --dev|-d)
      DEV_MODE=true
      ;;
    --skip-ai)
      SKIP_AI=true
      ;;
    --retrain)
      RETRAIN_AI=true
      ;;
    --full-train)
      RETRAIN_AI=true
      FULL_TRAIN=true
      ;;
    --clean)
      CLEAN_DOCKER=true
      ;;
    --status)
      STATUS_ONLY=true
      ;;
  esac
done

# ================================
# Check for Already Running Services
# ================================
check_running_services() {
  local running_containers=$(docker ps --filter "name=capstone-" --format "{{.Names}}" 2>/dev/null | wc -l | tr -d ' ')
  echo "$running_containers"
}

show_status() {
  echo ""
  echo -e "${CYAN}📊 Docker Status:${NC}"
  
  # Check running containers
  local running=$(check_running_services)
  if [ "$running" -gt 0 ]; then
    echo -e "${GREEN}   ✅ $running Capstone containers running:${NC}"
    docker ps --filter "name=capstone-" --format "      • {{.Names}} ({{.Status}})" 2>/dev/null
  else
    echo -e "${YELLOW}   ⚠️  No Capstone containers running${NC}"
  fi
  
  # Check web server
  if pgrep -f "vite.*5173" > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Web dev server running on port 5173${NC}"
  else
    echo -e "${YELLOW}   ⚠️  Web dev server not running${NC}"
  fi
  
  # Show Docker disk usage
  echo ""
  echo -e "${CYAN}💾 Docker Disk Usage:${NC}"
  docker system df --format "   {{.Type}}: {{.Size}} ({{.Reclaimable}} reclaimable)" 2>/dev/null
  
  # Calculate total
  local total_size=$(docker system df --format "{{.Size}}" 2>/dev/null | awk '{
    gsub(/GB/, "*1024"); gsub(/MB/, "*1"); gsub(/kB/, "/1024"); 
    sum += $1
  } END { printf "%.1f", sum/1024 }')
  echo ""
  echo -e "${CYAN}   Total Docker usage: ~${total_size}GB${NC}"
}

# If --status flag, just show status and exit
if [ "$STATUS_ONLY" = true ]; then
  show_status
  echo ""
  echo -e "${CYAN}💡 Commands:${NC}"
  echo -e "   • Start services: ./start.sh --dev"
  echo -e "   • Stop services:  ./stop.sh"
  echo -e "   • Clean Docker:   ./start.sh --clean --dev"
  exit 0
fi

# Check if services are already running
RUNNING_COUNT=$(check_running_services)
if [ "$RUNNING_COUNT" -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}⚠️  Capstone services are already running!${NC}"
  echo -e "${CYAN}   Found $RUNNING_COUNT container(s):${NC}"
  docker ps --filter "name=capstone-" --format "      • {{.Names}}" 2>/dev/null
  echo ""
  read -p "Do you want to restart them? [y/N]: " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}   Keeping existing services. Use ./stop.sh to stop them.${NC}"
    exit 0
  fi
  echo -e "${CYAN}   Stopping existing services first...${NC}"
  docker-compose down 2>/dev/null
  sleep 2
fi

# Clean Docker resources if requested
if [ "$CLEAN_DOCKER" = true ]; then
  echo ""
  echo -e "${CYAN}🧹 Cleaning up Docker resources...${NC}"
  
  # Show current usage
  echo -e "${CYAN}   Current Docker disk usage:${NC}"
  docker system df 2>/dev/null | head -5 | tail -4 | sed 's/^/      /'
  
  # Remove unused images, containers, and build cache
  echo ""
  echo -e "${YELLOW}   Removing unused Docker resources (keeping active ones)...${NC}"
  docker system prune -f 2>/dev/null
  
  echo ""
  echo -e "${GREEN}   ✅ Cleanup complete!${NC}"
  echo -e "${CYAN}   New Docker disk usage:${NC}"
  docker system df 2>/dev/null | head -5 | tail -4 | sed 's/^/      /'
  echo ""
fi

# ================================
# Step 1: Check AI Model
# ================================
MODEL_PATH="ai/models/id_verification/model_v1.h5"
AUTO_TRAIN_SCRIPT="ai/id-verification/scripts/auto_train.sh"

if [ "$SKIP_AI" = false ]; then
  echo ""
  echo -e "${CYAN}🤖 Checking AI model...${NC}"
  
  if [ "$RETRAIN_AI" = true ]; then
    if [ "$FULL_TRAIN" = true ]; then
      echo -e "${YELLOW}   Forcing FULL model retraining (1000 images, 30 epochs)...${NC}"
      echo -e "${YELLOW}   This will take 10-15 minutes...${NC}"
    else
      echo -e "${YELLOW}   Forcing model retraining (quick mode)...${NC}"
    fi
    if [ -f "$AUTO_TRAIN_SCRIPT" ]; then
      chmod +x "$AUTO_TRAIN_SCRIPT"
      if [ "$FULL_TRAIN" = true ]; then
        bash "$AUTO_TRAIN_SCRIPT" --force
      else
        bash "$AUTO_TRAIN_SCRIPT" --force --quick
      fi
    else
      echo -e "${RED}   ❌ Auto-train script not found at $AUTO_TRAIN_SCRIPT${NC}"
    fi
  elif [ ! -f "$MODEL_PATH" ]; then
    echo -e "${YELLOW}   ⚠️  AI model not found at $MODEL_PATH${NC}"
    echo -e "${CYAN}   Starting auto-training in QUICK mode (~200 images, 5 epochs)...${NC}"
    echo -e "${CYAN}   For better accuracy, run: ./start.sh --full-train${NC}"
    echo ""
    
    if [ -f "$AUTO_TRAIN_SCRIPT" ]; then
      chmod +x "$AUTO_TRAIN_SCRIPT"
      # Use quick mode for faster startup
      bash "$AUTO_TRAIN_SCRIPT" --quick
    else
      echo -e "${RED}   ❌ Auto-train script not found${NC}"
      echo -e "${YELLOW}   You can manually train the model later with:${NC}"
      echo -e "${YELLOW}   cd ai/id-verification && ./scripts/auto_train.sh${NC}"
    fi
  else
    echo -e "${GREEN}   ✅ AI model found${NC}"
    
    # Show model info if metadata exists
    METADATA_PATH="${MODEL_PATH%.h5}_metadata.json"
    if [ -f "$METADATA_PATH" ] && command -v python3 &> /dev/null; then
      python3 -c "
import json
try:
    with open('$METADATA_PATH') as f:
        m = json.load(f)
        acc = m.get('metrics', {}).get('accuracy')
        ver = m.get('model_version', 'unknown')
        mode = m.get('training_mode', m.get('training_config', {}).get('training_mode', 'unknown'))
        total = m.get('data_counts', {}).get('total', 0)
        if acc:
            print(f'      Version: {ver}, Accuracy: {acc:.2%}')
            print(f'      Training: {mode} mode ({total} images)')
except:
    pass
" 2>/dev/null
    fi
  fi
fi

# ================================
# Step 2: Start Docker Services
# ================================
echo ""
if [ "$DEV_MODE" = true ]; then
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
echo -e "${CYAN}💡 Other options:${NC}"
echo -e "   • ./start.sh --status    # Check what's running and disk usage"
echo -e "   • ./start.sh --clean     # Clean unused Docker resources before starting"
