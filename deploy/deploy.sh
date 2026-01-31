#!/bin/bash
# ==========================================
# Capstone Deployment Script
# ==========================================
# Run this script on your EC2 instance to pull the latest code and restart services.
#
# Usage:
#   ./deploy/deploy.sh              # Pull and restart all services
#   ./deploy/deploy.sh --rebuild    # Rebuild images before starting
#   ./deploy/deploy.sh --logs       # Show logs after deployment
#
# ==========================================

set -e

# Configuration
PROJECT_DIR="${PROJECT_DIR:-$HOME/capstone}"
COMPOSE_FILE="docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Parse arguments
REBUILD=false
SHOW_LOGS=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --rebuild|-r)
            REBUILD=true
            shift
            ;;
        --logs|-l)
            SHOW_LOGS=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --rebuild, -r    Rebuild Docker images before starting"
            echo "  --logs, -l       Show logs after deployment"
            echo "  --help, -h       Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    echo "Please clone the repository first:"
    echo "  git clone <your-repo-url> $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found!"
    if [ -f ".env.production.example" ]; then
        echo "Creating .env from .env.production.example..."
        cp .env.production.example .env
        print_warning "Please edit .env with your production values!"
        echo "  nano .env"
        exit 1
    elif [ -f ".env.example" ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        print_warning "Please edit .env with your production values!"
        echo "  nano .env"
        exit 1
    else
        print_error "No .env template found!"
        exit 1
    fi
fi

print_header "Starting Deployment"
echo "Project directory: $PROJECT_DIR"
echo "Timestamp: $(date)"

# Pull latest changes
print_header "Pulling Latest Code"
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

# Check for local changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have local changes. Stashing them..."
    git stash
fi

git pull origin "$CURRENT_BRANCH"
print_success "Code updated"

# Stop running containers
print_header "Stopping Services"
docker-compose -f "$COMPOSE_FILE" down
print_success "Services stopped"

# Rebuild if requested
if [ "$REBUILD" = true ]; then
    print_header "Rebuilding Docker Images"
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    print_success "Images rebuilt"
fi

# Start services
print_header "Starting Services"
docker-compose -f "$COMPOSE_FILE" up -d
print_success "Services started"

# Wait for services to be healthy
print_header "Waiting for Services"
echo "Waiting for services to become healthy..."
sleep 10

# Check service status
print_header "Service Status"
docker-compose -f "$COMPOSE_FILE" ps

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "unknown")

print_header "Deployment Complete!"
echo ""
echo "Services are available at:"
echo -e "  Frontend:         ${GREEN}http://${PUBLIC_IP}:5173${NC}"
echo -e "  Auth Service:     ${GREEN}http://${PUBLIC_IP}:3001${NC}"
echo -e "  Business Service: ${GREEN}http://${PUBLIC_IP}:3002${NC}"
echo -e "  Admin Service:    ${GREEN}http://${PUBLIC_IP}:3003${NC}"
echo -e "  Audit Service:    ${GREEN}http://${PUBLIC_IP}:3004${NC}"
echo -e "  AI Service:       ${GREEN}http://${PUBLIC_IP}:3005${NC}"
echo -e "  IPFS Gateway:     ${GREEN}http://${PUBLIC_IP}:8080${NC}"
echo ""

# Show logs if requested
if [ "$SHOW_LOGS" = true ]; then
    print_header "Service Logs (Ctrl+C to exit)"
    docker-compose -f "$COMPOSE_FILE" logs -f
fi
