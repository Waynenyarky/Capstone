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
#   ./start.sh --test       # Run all tests (backend, web, blockchain)

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
TEST_MODE=false

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
    --test|-t)
      TEST_MODE=true
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
  echo -e "   • Run all tests:  ./start.sh --test"
  exit 0
fi

# ================================
# Run All Tests (--test flag)
# ================================
run_all_tests() {
  echo ""
  echo -e "${CYAN}🧪 Running All Tests${NC}"
  echo -e "${CYAN}===================${NC}"
  
  local TOTAL_PASSED=0
  local TOTAL_FAILED=0
  local FAILED_SUITES=""
  
  # Single persistent error log (overwritten each run)
  local PROJECT_ROOT
  PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || pwd)
  local TEST_LOG_FILE="${PROJECT_ROOT}/test-results.log"
  : > "$TEST_LOG_FILE"  # Truncate at start of each run
  echo "Test run started at $(date)" >> "$TEST_LOG_FILE"
  echo "========================================" >> "$TEST_LOG_FILE"
  
  # Create temp directory for per-suite output (used during run)
  local ERROR_LOG_DIR=$(mktemp -d)
  trap "rm -rf $ERROR_LOG_DIR" EXIT
  
  # Backend Tests (Jest)
  echo ""
  echo -e "${BLUE}📦 Backend Tests (Jest)${NC}"
  echo -e "${BLUE}------------------------${NC}"
  if [ -d "backend" ] && [ -f "backend/package.json" ]; then
    cd backend
    if [ ! -d "node_modules" ]; then
      echo -e "${YELLOW}   Installing backend dependencies...${NC}"
      npm install --silent
    fi
    echo -e "${CYAN}   Running backend tests...${NC}"
    local BACKEND_OUTPUT="$ERROR_LOG_DIR/backend.log"
    # Use script to allocate a pseudo-TTY so Jest shows output in real-time
    script -q "$BACKEND_OUTPUT" bash -c 'npm test 2>&1'
    local BACKEND_EXIT=$?
    local BACKEND_SUMMARY
    BACKEND_SUMMARY=$(sed 's/\x1b\[[0-9;]*[a-zA-Z]//g; s/\x1b\[[?][0-9]*[a-zA-Z]//g' "$BACKEND_OUTPUT" 2>/dev/null | tr -d '\r' | grep -E "(Test Suites:|Tests:|Snapshots:|Time:)" || true)
    if [ $BACKEND_EXIT -eq 0 ]; then
      echo -e "${GREEN}   ✅ Backend tests passed${NC}"
      ((TOTAL_PASSED++))
      echo "[PASS] Backend (Jest)" >> "$TEST_LOG_FILE"
    else
      echo -e "${RED}   ❌ Backend tests failed (errors captured for summary)${NC}"
      ((TOTAL_FAILED++))
      FAILED_SUITES="${FAILED_SUITES}backend "
      echo "[FAIL] Backend (Jest)" >> "$TEST_LOG_FILE"
    fi
    if [ -n "$BACKEND_SUMMARY" ]; then
      echo "$BACKEND_SUMMARY" >> "$TEST_LOG_FILE"
    fi
    echo "" >> "$TEST_LOG_FILE"
    cd ..
  else
    echo -e "${YELLOW}   ⚠️  Backend directory not found, skipping${NC}"
  fi
  
  # Web Unit Tests (Vitest)
  echo ""
  echo -e "${BLUE}🌐 Web Unit Tests (Vitest)${NC}"
  echo -e "${BLUE}---------------------------${NC}"
  if [ -d "web" ] && [ -f "web/package.json" ]; then
    cd web
    if [ ! -d "node_modules" ]; then
      echo -e "${YELLOW}   Installing web dependencies...${NC}"
      npm install --silent
    fi
    echo -e "${CYAN}   Running web unit tests...${NC}"
    local WEB_UNIT_OUTPUT="$ERROR_LOG_DIR/web-unit.log"
    script -q "$WEB_UNIT_OUTPUT" bash -c 'npm run test -- --run 2>&1'
    local WEB_UNIT_EXIT=$?
    local WEB_UNIT_SUMMARY
    WEB_UNIT_SUMMARY=$(sed 's/\x1b\[[0-9;]*[a-zA-Z]//g; s/\x1b\[[?][0-9]*[a-zA-Z]//g' "$WEB_UNIT_OUTPUT" 2>/dev/null | tr -d '\r' | grep -E "(Test Files|Tests |Start at|Duration)" | tail -4 || true)
    if [ $WEB_UNIT_EXIT -eq 0 ]; then
      echo -e "${GREEN}   ✅ Web unit tests passed${NC}"
      ((TOTAL_PASSED++))
      echo "[PASS] Web Unit (Vitest)" >> "$TEST_LOG_FILE"
    else
      echo -e "${RED}   ❌ Web unit tests failed (errors captured for summary)${NC}"
      ((TOTAL_FAILED++))
      FAILED_SUITES="${FAILED_SUITES}web-unit "
      echo "[FAIL] Web Unit (Vitest)" >> "$TEST_LOG_FILE"
    fi
    if [ -n "$WEB_UNIT_SUMMARY" ]; then
      echo "$WEB_UNIT_SUMMARY" >> "$TEST_LOG_FILE"
    fi
    echo "" >> "$TEST_LOG_FILE"
    cd ..
  else
    echo -e "${YELLOW}   ⚠️  Web directory not found, skipping${NC}"
  fi
  
  # Web E2E Tests (Playwright)
  echo ""
  echo -e "${BLUE}🎭 Web E2E Tests (Playwright)${NC}"
  echo -e "${BLUE}------------------------------${NC}"
  if [ -d "web" ] && [ -f "web/package.json" ]; then
    cd web
    # Install Playwright browsers if not already installed
    # Check by counting browser directories in the cache
    PW_CACHE="$HOME/.cache/ms-playwright"
    BROWSER_COUNT=$(find "$PW_CACHE" -maxdepth 1 -type d 2>/dev/null | wc -l)
    if [ "$BROWSER_COUNT" -lt 2 ]; then
      echo -e "${YELLOW}   Installing Playwright browsers (this may take a few minutes)...${NC}"
      npx playwright install --with-deps chromium webkit 2>&1
      echo -e "${GREEN}   Playwright browsers installed${NC}"
    fi
    echo -e "${CYAN}   Running web e2e tests...${NC}"
    local WEB_E2E_OUTPUT="$ERROR_LOG_DIR/web-e2e.log"
    script -q "$WEB_E2E_OUTPUT" bash -c 'npm run test:e2e 2>&1'
    local WEB_E2E_EXIT=$?
    local WEB_E2E_SUMMARY
    WEB_E2E_SUMMARY=$(sed 's/\x1b\[[0-9;]*[a-zA-Z]//g; s/\x1b\[[?][0-9]*[a-zA-Z]//g' "$WEB_E2E_OUTPUT" 2>/dev/null | tr -d '\r' | grep -E "([0-9]+ (passed|failed)|slow test)" | tail -4 || true)
    if [ $WEB_E2E_EXIT -eq 0 ]; then
      echo -e "${GREEN}   ✅ Web e2e tests passed${NC}"
      ((TOTAL_PASSED++))
      echo "[PASS] Web E2E (Playwright)" >> "$TEST_LOG_FILE"
    else
      echo -e "${RED}   ❌ Web e2e tests failed (errors captured for summary)${NC}"
      ((TOTAL_FAILED++))
      FAILED_SUITES="${FAILED_SUITES}web-e2e "
      echo "[FAIL] Web E2E (Playwright)" >> "$TEST_LOG_FILE"
    fi
    if [ -n "$WEB_E2E_SUMMARY" ]; then
      echo "$WEB_E2E_SUMMARY" >> "$TEST_LOG_FILE"
    fi
    echo "" >> "$TEST_LOG_FILE"
    cd ..
  else
    echo -e "${YELLOW}   ⚠️  Web directory not found, skipping${NC}"
  fi
  
  # Blockchain Tests (Truffle)
  echo ""
  echo -e "${BLUE}⛓️  Blockchain Tests (Truffle)${NC}"
  echo -e "${BLUE}-------------------------------${NC}"
  if [ -d "blockchain" ] && [ -f "blockchain/package.json" ]; then
    cd blockchain
    if [ ! -d "node_modules" ]; then
      echo -e "${YELLOW}   Installing blockchain dependencies...${NC}"
      npm install --silent
    fi
    # Check if Ganache is running (required for Truffle tests)
    if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "ganache"; then
      echo -e "${CYAN}   Running blockchain tests...${NC}"
      local BLOCKCHAIN_OUTPUT="$ERROR_LOG_DIR/blockchain.log"
      script -q "$BLOCKCHAIN_OUTPUT" bash -c 'npm test 2>&1'
      local BLOCKCHAIN_EXIT=$?
      local BLOCKCHAIN_SUMMARY
      BLOCKCHAIN_SUMMARY=$(sed 's/\x1b\[[0-9;]*[a-zA-Z]//g; s/\x1b\[[?][0-9]*[a-zA-Z]//g' "$BLOCKCHAIN_OUTPUT" 2>/dev/null | tr -d '\r' | grep -E "(passing|failing|pending)" || true)
      if [ $BLOCKCHAIN_EXIT -eq 0 ]; then
        echo -e "${GREEN}   ✅ Blockchain tests passed${NC}"
        ((TOTAL_PASSED++))
        echo "[PASS] Blockchain (Truffle)" >> "$TEST_LOG_FILE"
      else
        echo -e "${RED}   ❌ Blockchain tests failed (errors captured for summary)${NC}"
        ((TOTAL_FAILED++))
        FAILED_SUITES="${FAILED_SUITES}blockchain "
        echo "[FAIL] Blockchain (Truffle)" >> "$TEST_LOG_FILE"
      fi
      if [ -n "$BLOCKCHAIN_SUMMARY" ]; then
        echo "$BLOCKCHAIN_SUMMARY" >> "$TEST_LOG_FILE"
      fi
      echo "" >> "$TEST_LOG_FILE"
    else
      echo -e "${YELLOW}   ⚠️  Ganache not running - skipping blockchain tests${NC}"
      echo -e "${YELLOW}   💡 Start services first: ./start.sh --dev${NC}"
    fi
    cd ..
  else
    echo -e "${YELLOW}   ⚠️  Blockchain directory not found, skipping${NC}"
  fi
  
  # Summary
  echo ""
  echo -e "${CYAN}======================================${NC}"
  echo -e "${CYAN}📊 Test Summary${NC}"
  echo -e "${CYAN}======================================${NC}"
  echo -e "   Passed: ${GREEN}$TOTAL_PASSED${NC}"
  echo -e "   Failed: ${RED}$TOTAL_FAILED${NC}"
  
  if [ $TOTAL_FAILED -gt 0 ]; then
    echo ""
    echo -e "${RED}Failed test suites: $FAILED_SUITES${NC}"
    
    # Display error details for each failed suite
    echo ""
    echo -e "${CYAN}======================================${NC}"
    echo -e "${RED}📋 Error Details${NC}"
    echo -e "${CYAN}======================================${NC}"
    
    # Function to extract and display errors from log (also appends to persistent log file)
    display_errors() {
      local suite_name=$1
      local log_file=$2
      local max_lines=${3:-100}  # Default to 100 lines max per suite
      local persist_log=${4:-}    # Optional: path to persistent error log
      
      if [ -f "$log_file" ] && [ -s "$log_file" ]; then
        echo ""
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}❌ $suite_name Errors:${NC}"
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        # Extract relevant error lines (filter out noise, keep failures/errors)
        # For Jest/Vitest: Look for FAIL, Error, expect, AssertionError
        # For Playwright: Look for Error, failed, expect
        # For Truffle: Look for Error, failing, AssertionError
        
        local error_output
        error_output=$(grep -E -i "(FAIL|Error:|error|expect\(|AssertionError|failing|failed|✗|✘|×|at Object\.|at Test\.|at Context\.|Received:|Expected:|Difference:|- Expected|+ Received)" "$log_file" 2>/dev/null | head -n "$max_lines")
        
        if [ -z "$error_output" ]; then
          error_output=$(tail -n 50 "$log_file")
          echo -e "${CYAN}(Showing last 50 lines of output)${NC}"
        fi
        echo "$error_output"
        
        # Append to persistent log file (strip ANSI codes for clean plain text)
        if [ -n "$persist_log" ]; then
          {
            echo ""
            echo "========================================"
            echo "❌ $suite_name Errors"
            echo "========================================"
            echo "$error_output" | sed 's/\x1b\[[0-9;]*[a-zA-Z]//g' | sed 's/\x1b\[[?][0-9]*[a-zA-Z]//g' | tr -d '\r'
          } >> "$persist_log"
        fi
        
        # Show full log path
        echo ""
        echo -e "${CYAN}   Full log: $log_file${NC}"
      fi
    }
    
    # Display errors for each failed suite (and append to persistent log)
    for suite in $FAILED_SUITES; do
      case $suite in
        backend)
          display_errors "Backend (Jest)" "$ERROR_LOG_DIR/backend.log" 100 "$TEST_LOG_FILE"
          ;;
        web-unit)
          display_errors "Web Unit (Vitest)" "$ERROR_LOG_DIR/web-unit.log" 100 "$TEST_LOG_FILE"
          ;;
        web-e2e)
          display_errors "Web E2E (Playwright)" "$ERROR_LOG_DIR/web-e2e.log" 100 "$TEST_LOG_FILE"
          ;;
        blockchain)
          display_errors "Blockchain (Truffle)" "$ERROR_LOG_DIR/blockchain.log" 100 "$TEST_LOG_FILE"
          ;;
      esac
    done
    
    echo ""
    echo -e "${CYAN}======================================${NC}"
    echo -e "${YELLOW}💡 Errors saved to: $TEST_LOG_FILE${NC}"
    echo -e "${YELLOW}   (Overwritten each run)${NC}"
    echo -e "${CYAN}======================================${NC}"
    
    # Add overall summary to persistent log
    {
      echo ""
      echo "========================================"
      echo "OVERALL SUMMARY"
      echo "========================================"
      echo "Suites passed: $TOTAL_PASSED"
      echo "Suites failed: $TOTAL_FAILED"
      echo "Failed: $FAILED_SUITES"
      echo "Run completed at $(date)"
    } >> "$TEST_LOG_FILE"
    exit 1
  else
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
    {
      echo ""
      echo "========================================"
      echo "OVERALL SUMMARY"
      echo "========================================"
      echo "All $TOTAL_PASSED suite(s) passed!"
      echo "Run completed at $(date)"
    } >> "$TEST_LOG_FILE"
    exit 0
  fi
}

# If --test flag, run all tests and exit
if [ "$TEST_MODE" = true ]; then
  run_all_tests
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
MODEL_VALIDATOR="ai/id-verification/scripts/validate_model.py"

if [ "$SKIP_AI" = false ]; then
  echo ""
  echo -e "${CYAN}🤖 Checking AI model...${NC}"
  
  # Force retrain if requested
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
  else
    # Validate existing model
    MODEL_VALID=false
    if [ -f "$MODEL_VALIDATOR" ]; then
      # Ensure validation dependencies (joblib, scikit-learn, numpy) are installed for python3
      pip3 install -q joblib scikit-learn numpy 2>/dev/null || true
      chmod +x "$MODEL_VALIDATOR"
      VALIDATION_OUTPUT=$(python3 "$MODEL_VALIDATOR" "$MODEL_PATH" 2>&1)
      VALIDATION_CODE=$?
      
      if [ $VALIDATION_CODE -eq 0 ]; then
        echo -e "${GREEN}   ✅ $VALIDATION_OUTPUT${NC}"
        MODEL_VALID=true
      elif [ $VALIDATION_CODE -eq 1 ]; then
        echo -e "${YELLOW}   ⚠️  $VALIDATION_OUTPUT${NC}"
        MODEL_VALID=false
      elif [ $VALIDATION_CODE -eq 2 ]; then
        echo -e "${YELLOW}   ⚠️  $VALIDATION_OUTPUT${NC}"
        echo -e "${YELLOW}   🔄 Model incompatible - will retrain automatically...${NC}"
        MODEL_VALID=false
      else
        echo -e "${RED}   ❌ $VALIDATION_OUTPUT${NC}"
        MODEL_VALID=false
      fi
    else
      # Fallback: just check if file exists
      if [ -f "$MODEL_PATH" ] || [ -f "${MODEL_PATH%.h5}.joblib" ]; then
        echo -e "${GREEN}   ✅ AI model found${NC}"
        MODEL_VALID=true
      else
        MODEL_VALID=false
      fi
    fi
    
    # Auto-train if model is invalid or missing
    if [ "$MODEL_VALID" = false ]; then
      echo -e "${CYAN}   Starting auto-training in QUICK mode (~200 images, 5 epochs)...${NC}"
      echo -e "${CYAN}   For better accuracy, run: ./start.sh --full-train${NC}"
      echo ""
      
      if [ -f "$AUTO_TRAIN_SCRIPT" ]; then
        chmod +x "$AUTO_TRAIN_SCRIPT"
        bash "$AUTO_TRAIN_SCRIPT" --quick
      else
        echo -e "${RED}   ❌ Auto-train script not found${NC}"
        echo -e "${YELLOW}   You can manually train the model later with:${NC}"
        echo -e "${YELLOW}   cd ai/id-verification && ./scripts/auto_train.sh${NC}"
      fi
    fi
    
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

# Check if web directory exists
if [ -d "web" ]; then
  cd web
  
  # Always run npm install to ensure package.json and node_modules stay in sync
  # (catches new deps from git pull, fresh clones, or corrupted node_modules)
  echo -e "${CYAN}   Ensuring web dependencies are installed...${NC}"
  npm install
  
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
echo -e "   • Dozzle (live in browser): http://localhost:9999"
if [ "$DEV_MODE" = true ]; then
  echo -e "   • Docker (terminal): docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f"
else
  echo -e "   • Docker (terminal): docker-compose logs -f"
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
echo -e "   • ./start.sh --test      # Run all tests (backend, web, blockchain)"