#!/bin/bash
# ==========================================
# AWS EC2 Setup Script for Capstone Project
# ==========================================
# This script automates the creation of AWS resources for deploying the Capstone project.
#
# Prerequisites:
#   1. AWS CLI installed: brew install awscli
#   2. AWS CLI configured: aws configure
#   3. Your AWS credentials with EC2 permissions
#
# Usage:
#   chmod +x deploy/aws-setup.sh
#   ./deploy/aws-setup.sh
#
# ==========================================

set -e

# Configuration - Modify these as needed
REGION="${AWS_REGION:-ap-southeast-1}"  # Default: Singapore
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.large}"  # 2 vCPU, 8GB RAM (~$60/month)
# Use t3.xlarge for 4 vCPU, 16GB RAM if AI service needs more resources (~$120/month)
VOLUME_SIZE=50  # GB
KEY_NAME="${KEY_NAME:-capstone-key}"
SECURITY_GROUP_NAME="capstone-sg"
INSTANCE_NAME="capstone-server"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if AWS CLI is installed
check_aws_cli() {
    print_header "Checking AWS CLI"
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed."
        echo "Install it with: brew install awscli"
        echo "Then configure it with: aws configure"
        exit 1
    fi
    print_success "AWS CLI is installed"
    
    # Check if configured
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured or credentials are invalid."
        echo "Run: aws configure"
        exit 1
    fi
    print_success "AWS CLI is configured"
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo "  Account ID: $ACCOUNT_ID"
    echo "  Region: $REGION"
}

# Get the user's public IP for SSH access
get_my_ip() {
    print_header "Getting Your Public IP"
    MY_IP=$(curl -s https://checkip.amazonaws.com)
    if [ -z "$MY_IP" ]; then
        print_warning "Could not determine your IP. SSH will be open to 0.0.0.0/0"
        MY_IP="0.0.0.0"
        SSH_CIDR="0.0.0.0/0"
    else
        SSH_CIDR="${MY_IP}/32"
        print_success "Your IP: $MY_IP"
    fi
}

# Create or get existing key pair
setup_key_pair() {
    print_header "Setting Up SSH Key Pair"
    
    if aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region "$REGION" &> /dev/null; then
        print_success "Key pair '$KEY_NAME' already exists"
    else
        echo "Creating new key pair: $KEY_NAME"
        aws ec2 create-key-pair \
            --key-name "$KEY_NAME" \
            --query 'KeyMaterial' \
            --output text \
            --region "$REGION" > "${KEY_NAME}.pem"
        chmod 400 "${KEY_NAME}.pem"
        print_success "Key pair created and saved to ${KEY_NAME}.pem"
        print_warning "IMPORTANT: Keep ${KEY_NAME}.pem safe! You need it to SSH into your instance."
    fi
}

# Create security group
setup_security_group() {
    print_header "Setting Up Security Group"
    
    # Get default VPC
    VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region "$REGION")
    
    if [ "$VPC_ID" == "None" ] || [ -z "$VPC_ID" ]; then
        print_error "No default VPC found. Please create one or specify a VPC ID."
        exit 1
    fi
    echo "Using VPC: $VPC_ID"
    
    # Check if security group exists
    SG_ID=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" "Name=vpc-id,Values=$VPC_ID" \
        --query "SecurityGroups[0].GroupId" \
        --output text \
        --region "$REGION" 2>/dev/null || echo "None")
    
    if [ "$SG_ID" != "None" ] && [ -n "$SG_ID" ]; then
        print_success "Security group '$SECURITY_GROUP_NAME' already exists: $SG_ID"
    else
        echo "Creating security group: $SECURITY_GROUP_NAME"
        SG_ID=$(aws ec2 create-security-group \
            --group-name "$SECURITY_GROUP_NAME" \
            --description "Security group for Capstone project" \
            --vpc-id "$VPC_ID" \
            --query 'GroupId' \
            --output text \
            --region "$REGION")
        print_success "Security group created: $SG_ID"
        
        # Add inbound rules
        echo "Adding inbound rules..."
        
        # SSH (port 22) - restricted to your IP
        aws ec2 authorize-security-group-ingress \
            --group-id "$SG_ID" \
            --protocol tcp \
            --port 22 \
            --cidr "$SSH_CIDR" \
            --region "$REGION" 2>/dev/null || true
        print_success "SSH (22) - from $SSH_CIDR"
        
        # HTTP (port 80)
        aws ec2 authorize-security-group-ingress \
            --group-id "$SG_ID" \
            --protocol tcp \
            --port 80 \
            --cidr "0.0.0.0/0" \
            --region "$REGION" 2>/dev/null || true
        print_success "HTTP (80) - from anywhere"
        
        # HTTPS (port 443)
        aws ec2 authorize-security-group-ingress \
            --group-id "$SG_ID" \
            --protocol tcp \
            --port 443 \
            --cidr "0.0.0.0/0" \
            --region "$REGION" 2>/dev/null || true
        print_success "HTTPS (443) - from anywhere"
        
        # Backend services (ports 3001-3005)
        aws ec2 authorize-security-group-ingress \
            --group-id "$SG_ID" \
            --protocol tcp \
            --port 3001-3005 \
            --cidr "0.0.0.0/0" \
            --region "$REGION" 2>/dev/null || true
        print_success "Backend services (3001-3005) - from anywhere"
        
        # Frontend dev server (port 5173)
        aws ec2 authorize-security-group-ingress \
            --group-id "$SG_ID" \
            --protocol tcp \
            --port 5173 \
            --cidr "0.0.0.0/0" \
            --region "$REGION" 2>/dev/null || true
        print_success "Frontend dev (5173) - from anywhere"
        
        # IPFS Gateway (port 8080)
        aws ec2 authorize-security-group-ingress \
            --group-id "$SG_ID" \
            --protocol tcp \
            --port 8080 \
            --cidr "0.0.0.0/0" \
            --region "$REGION" 2>/dev/null || true
        print_success "IPFS Gateway (8080) - from anywhere"
    fi
}

# Get the latest Amazon Linux 2023 AMI
get_ami_id() {
    print_header "Finding Latest Amazon Linux 2023 AMI"
    AMI_ID=$(aws ec2 describe-images \
        --owners amazon \
        --filters "Name=name,Values=al2023-ami-2023*-x86_64" "Name=state,Values=available" \
        --query "sort_by(Images, &CreationDate)[-1].ImageId" \
        --output text \
        --region "$REGION")
    
    if [ -z "$AMI_ID" ] || [ "$AMI_ID" == "None" ]; then
        print_error "Could not find Amazon Linux 2023 AMI"
        exit 1
    fi
    print_success "AMI ID: $AMI_ID"
}

# Launch EC2 instance
launch_instance() {
    print_header "Launching EC2 Instance"
    
    # Check if instance already exists
    EXISTING_INSTANCE=$(aws ec2 describe-instances \
        --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running,stopped" \
        --query "Reservations[0].Instances[0].InstanceId" \
        --output text \
        --region "$REGION" 2>/dev/null || echo "None")
    
    if [ "$EXISTING_INSTANCE" != "None" ] && [ -n "$EXISTING_INSTANCE" ]; then
        print_warning "Instance '$INSTANCE_NAME' already exists: $EXISTING_INSTANCE"
        INSTANCE_ID="$EXISTING_INSTANCE"
    else
        echo "Launching new instance..."
        echo "  Instance type: $INSTANCE_TYPE"
        echo "  Volume size: ${VOLUME_SIZE}GB"
        
        INSTANCE_ID=$(aws ec2 run-instances \
            --image-id "$AMI_ID" \
            --instance-type "$INSTANCE_TYPE" \
            --key-name "$KEY_NAME" \
            --security-group-ids "$SG_ID" \
            --block-device-mappings "[{\"DeviceName\":\"/dev/xvda\",\"Ebs\":{\"VolumeSize\":$VOLUME_SIZE,\"VolumeType\":\"gp3\",\"DeleteOnTermination\":true}}]" \
            --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
            --query 'Instances[0].InstanceId' \
            --output text \
            --region "$REGION")
        
        print_success "Instance launched: $INSTANCE_ID"
    fi
    
    # Wait for instance to be running
    echo "Waiting for instance to be running..."
    aws ec2 wait instance-running --instance-ids "$INSTANCE_ID" --region "$REGION"
    print_success "Instance is running"
    
    # Get public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids "$INSTANCE_ID" \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text \
        --region "$REGION")
    
    print_success "Public IP: $PUBLIC_IP"
}

# Print summary and next steps
print_summary() {
    print_header "Setup Complete!"
    
    echo -e "Instance Details:"
    echo -e "  Instance ID: ${GREEN}$INSTANCE_ID${NC}"
    echo -e "  Public IP:   ${GREEN}$PUBLIC_IP${NC}"
    echo -e "  Region:      $REGION"
    echo -e "  Type:        $INSTANCE_TYPE"
    
    echo -e "\n${BLUE}Next Steps:${NC}"
    echo ""
    echo "1. SSH into your instance:"
    echo -e "   ${YELLOW}ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}${NC}"
    echo ""
    echo "2. Run the EC2 install script on the server:"
    echo "   Copy deploy/ec2-install.sh to the server and run it"
    echo -e "   ${YELLOW}scp -i ${KEY_NAME}.pem deploy/ec2-install.sh ec2-user@${PUBLIC_IP}:~/${NC}"
    echo -e "   ${YELLOW}ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP} 'chmod +x ec2-install.sh && ./ec2-install.sh'${NC}"
    echo ""
    echo "3. Clone your project and start services:"
    echo -e "   ${YELLOW}ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}${NC}"
    echo "   git clone <your-repo-url> ~/capstone"
    echo "   cd ~/capstone"
    echo "   cp .env.production.example .env"
    echo "   # Edit .env with your settings"
    echo "   ./start.sh"
    echo ""
    echo "4. Access your services at:"
    echo -e "   Frontend:  ${GREEN}http://${PUBLIC_IP}:5173${NC}"
    echo -e "   Auth API:  ${GREEN}http://${PUBLIC_IP}:3001${NC}"
    echo -e "   AI API:    ${GREEN}http://${PUBLIC_IP}:3005${NC}"
    echo ""
    
    # Save instance info
    cat > deploy/instance-info.txt << EOF
# Capstone EC2 Instance Info
# Generated: $(date)

INSTANCE_ID=$INSTANCE_ID
PUBLIC_IP=$PUBLIC_IP
REGION=$REGION
KEY_NAME=$KEY_NAME

# SSH Command:
ssh -i ${KEY_NAME}.pem ec2-user@${PUBLIC_IP}
EOF
    print_success "Instance info saved to deploy/instance-info.txt"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════╗"
    echo "║  Capstone AWS EC2 Setup                    ║"
    echo "╚════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_aws_cli
    get_my_ip
    setup_key_pair
    setup_security_group
    get_ami_id
    launch_instance
    print_summary
}

main "$@"
