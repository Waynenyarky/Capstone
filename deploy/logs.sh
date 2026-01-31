#!/bin/bash
# ==========================================
# Service Logs Viewer
# ==========================================
# View logs for one or all services.
#
# Usage:
#   ./deploy/logs.sh                 # Follow all logs
#   ./deploy/logs.sh auth-service    # Follow specific service logs
#   ./deploy/logs.sh -n 100          # Show last 100 lines
#
# ==========================================

PROJECT_DIR="${PROJECT_DIR:-$HOME/capstone}"
cd "$PROJECT_DIR" 2>/dev/null || { echo "Project not found at $PROJECT_DIR"; exit 1; }

# Parse arguments
SERVICE=""
LINES=""
FOLLOW=true

while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--lines)
            LINES="--tail=$2"
            shift 2
            ;;
        --no-follow)
            FOLLOW=false
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [SERVICE] [OPTIONS]"
            echo ""
            echo "Services:"
            echo "  auth-service, business-service, admin-service"
            echo "  audit-service, ai-service, mongodb, ipfs, ganache"
            echo ""
            echo "Options:"
            echo "  -n, --lines N     Show last N lines"
            echo "  --no-follow       Don't follow logs (just show current)"
            echo "  -h, --help        Show this help"
            exit 0
            ;;
        *)
            SERVICE="$1"
            shift
            ;;
    esac
done

# Build command
CMD="docker-compose logs"
if [ -n "$LINES" ]; then
    CMD="$CMD $LINES"
fi
if [ "$FOLLOW" = true ]; then
    CMD="$CMD -f"
fi
if [ -n "$SERVICE" ]; then
    CMD="$CMD $SERVICE"
fi

echo "Running: $CMD"
echo "Press Ctrl+C to exit"
echo ""

eval $CMD
