#!/bin/bash
# ==========================================
# EC2 Docker Installation Script
# ==========================================
# Run this script on your EC2 instance to install Docker and dependencies.
#
# Usage (on EC2):
#   chmod +x ec2-install.sh
#   ./ec2-install.sh
#
# ==========================================

set -e

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

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    else
        print_error "Cannot detect OS"
        exit 1
    fi
    print_success "Detected OS: $OS"
}

# Update system packages
update_system() {
    print_header "Updating System Packages"
    
    case $OS in
        amzn|amazon)
            sudo yum update -y
            ;;
        ubuntu|debian)
            sudo apt-get update -y
            sudo apt-get upgrade -y
            ;;
        *)
            print_warning "Unknown OS: $OS. Attempting yum..."
            sudo yum update -y
            ;;
    esac
    print_success "System updated"
}

# Install Docker
install_docker() {
    print_header "Installing Docker"
    
    if command -v docker &> /dev/null; then
        print_success "Docker is already installed"
        docker --version
    else
        case $OS in
            amzn|amazon)
                sudo yum install -y docker
                ;;
            ubuntu|debian)
                # Install Docker using official method
                sudo apt-get install -y ca-certificates curl gnupg
                sudo install -m 0755 -d /etc/apt/keyrings
                curl -fsSL https://download.docker.com/linux/$OS/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
                sudo chmod a+r /etc/apt/keyrings/docker.gpg
                echo \
                    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS \
                    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
                    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
                sudo apt-get update
                sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
                ;;
            *)
                sudo yum install -y docker
                ;;
        esac
        print_success "Docker installed"
    fi
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    print_success "Docker service started and enabled"
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    print_success "Added $USER to docker group"
}

# Install Docker Compose
install_docker_compose() {
    print_header "Installing Docker Compose"
    
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose is already installed"
        docker-compose --version
    else
        # Download latest Docker Compose
        COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
        if [ -z "$COMPOSE_VERSION" ]; then
            COMPOSE_VERSION="v2.24.0"  # Fallback version
        fi
        
        echo "Installing Docker Compose $COMPOSE_VERSION..."
        sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
        # Create symlink if needed
        if [ ! -f /usr/bin/docker-compose ]; then
            sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
        fi
        
        print_success "Docker Compose installed"
    fi
    docker-compose --version
}

# Install Git
install_git() {
    print_header "Installing Git"
    
    if command -v git &> /dev/null; then
        print_success "Git is already installed"
    else
        case $OS in
            amzn|amazon)
                sudo yum install -y git
                ;;
            ubuntu|debian)
                sudo apt-get install -y git
                ;;
            *)
                sudo yum install -y git
                ;;
        esac
        print_success "Git installed"
    fi
    git --version
}

# Install useful utilities
install_utilities() {
    print_header "Installing Useful Utilities"
    
    # Note: Amazon Linux uses curl-minimal - don't install full curl (conflicts)
    case $OS in
        amzn|amazon)
            sudo yum install -y htop vim nano wget jq
            ;;
        ubuntu|debian)
            sudo apt-get install -y htop vim nano curl wget jq
            ;;
        *)
            sudo yum install -y htop vim nano wget jq
            ;;
    esac
    print_success "Utilities installed (htop, vim, nano, wget, jq)"
}

# Configure swap (helpful for memory-intensive AI service)
configure_swap() {
    print_header "Configuring Swap Space"
    
    # Check if swap already exists
    if [ $(swapon --show | wc -l) -gt 0 ]; then
        print_success "Swap is already configured"
        free -h | grep -i swap
    else
        # Create 4GB swap file
        SWAP_SIZE="4G"
        echo "Creating ${SWAP_SIZE} swap file..."
        
        sudo fallocate -l $SWAP_SIZE /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        
        # Make swap permanent
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        
        # Adjust swappiness
        sudo sysctl vm.swappiness=10
        echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
        
        print_success "Swap configured (${SWAP_SIZE})"
        free -h | grep -i swap
    fi
}

# Configure firewall (if applicable)
configure_firewall() {
    print_header "Checking Firewall"
    
    # Most AWS instances use security groups instead of local firewall
    # But check if firewalld is running
    if systemctl is-active --quiet firewalld 2>/dev/null; then
        print_warning "firewalld is running. Adding Docker ports..."
        sudo firewall-cmd --permanent --add-port=3001-3005/tcp
        sudo firewall-cmd --permanent --add-port=5173/tcp
        sudo firewall-cmd --permanent --add-port=8080/tcp
        sudo firewall-cmd --permanent --add-port=80/tcp
        sudo firewall-cmd --permanent --add-port=443/tcp
        sudo firewall-cmd --reload
        print_success "Firewall rules added"
    else
        print_success "No local firewall active (using AWS Security Groups)"
    fi
}

# Print summary
print_summary() {
    print_header "Installation Complete!"
    
    echo "Installed components:"
    echo "  - Docker: $(docker --version 2>/dev/null || echo 'Not available until re-login')"
    echo "  - Docker Compose: $(docker-compose --version 2>/dev/null || echo 'Not available')"
    echo "  - Git: $(git --version)"
    echo ""
    echo -e "${YELLOW}IMPORTANT:${NC} Log out and back in for Docker group changes to take effect:"
    echo -e "  ${BLUE}exit${NC}"
    echo -e "  ${BLUE}ssh -i your-key.pem ec2-user@your-ip${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo ""
    echo "1. Clone your repository:"
    echo "   git clone <your-repo-url> ~/capstone"
    echo ""
    echo "2. Configure environment:"
    echo "   cd ~/capstone"
    echo "   cp .env.production.example .env"
    echo "   nano .env  # Edit with your settings"
    echo ""
    echo "3. Start services:"
    echo "   ./start.sh"
    echo ""
    echo "4. View logs:"
    echo "   docker-compose logs -f"
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════╗"
    echo "║  Capstone EC2 Docker Setup                 ║"
    echo "╚════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    detect_os
    update_system
    install_docker
    install_docker_compose
    install_git
    install_utilities
    configure_swap
    configure_firewall
    print_summary
}

main "$@"
