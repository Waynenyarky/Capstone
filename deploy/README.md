b# AWS Deployment Guide

This guide helps you deploy the Capstone project to AWS EC2.

## Overview

The deployment uses a single EC2 instance running Docker Compose with all services:
- MongoDB (database)
- Ganache (blockchain)
- IPFS (decentralized storage)
- Auth, Business, Admin, Audit services (Node.js)
- AI Service (Python/FastAPI with OCR)

## Quick Start

### 1. Prerequisites

On your local machine:
```bash
# Install AWS CLI
brew install awscli

# Configure with your credentials
aws configure
```

### 2. Launch EC2 Instance

```bash
# From project root
chmod +x deploy/aws-setup.sh
./deploy/aws-setup.sh
```

This will:
- Create a security group with required ports
- Create an SSH key pair (saved as `capstone-key.pem`)
- Launch an EC2 instance (t3.large by default)

### 3. Setup EC2 Server

```bash
# Copy install script to EC2
scp -i capstone-key.pem deploy/ec2-install.sh ec2-user@YOUR_IP:~/

# SSH into EC2
ssh -i capstone-key.pem ec2-user@YOUR_IP

# Run install script (on EC2)
chmod +x ec2-install.sh
./ec2-install.sh

# Log out and back in for Docker group changes
exit
ssh -i capstone-key.pem ec2-user@YOUR_IP
```

### 4. Deploy Application

```bash
# Clone repository (on EC2)
git clone YOUR_REPO_URL ~/capstone
cd ~/capstone

# Setup environment
cp .env.production.example .env
nano .env  # Edit with your settings (see Configuration below)

# Also setup frontend environment
cp web/.env.production.example web/.env
nano web/.env  # Set YOUR_EC2_PUBLIC_IP

# Start services
./start.sh
```

### 5. Access Your App

- Frontend: `http://YOUR_IP:5173`
- Auth API: `http://YOUR_IP:3001`
- AI Service: `http://YOUR_IP:3005`

## Configuration

### Required .env Changes

```bash
# Generate a strong JWT secret
openssl rand -base64 64

# Then edit .env:
JWT_SECRET=<paste generated secret>
CORS_ORIGIN=http://YOUR_EC2_PUBLIC_IP:5173
SEED_DEV=false
```

### Frontend .env (web/.env)

```bash
VITE_BACKEND_ORIGIN=http://YOUR_EC2_PUBLIC_IP:3001
VITE_AI_SERVICE_URL=http://YOUR_EC2_PUBLIC_IP:3005
```

## Helper Scripts

### Deploy Updates
```bash
./deploy/deploy.sh              # Pull and restart
./deploy/deploy.sh --rebuild    # Rebuild images
./deploy/deploy.sh --logs       # Show logs after
```

### View Logs
```bash
./deploy/logs.sh                    # All services
./deploy/logs.sh auth-service       # Specific service
./deploy/logs.sh -n 100             # Last 100 lines
```

### Backup Database
```bash
./deploy/backup.sh                      # Local backup
./deploy/backup.sh --s3 your-bucket     # Backup to S3
```

## Instance Types & Costs

| Type | vCPU | RAM | Monthly Cost | Notes |
|------|------|-----|--------------|-------|
| t3.medium | 2 | 4GB | ~$30 | Minimum (may be slow) |
| t3.large | 2 | 8GB | ~$60 | Recommended |
| t3.xlarge | 4 | 16GB | ~$120 | Best for AI service |

Add ~$5-10 for EBS storage (50GB).

## Auto-Shutdown (Save Money!)

Enable automatic shutdown when there's no traffic for 30 minutes:

```bash
# On EC2, after deploying:
~/capstone/deploy/auto-shutdown.sh --install

# Check status
~/capstone/deploy/auto-shutdown.sh --status

# Change timeout to 1 hour
INACTIVITY_MINUTES=60 ~/capstone/deploy/auto-shutdown.sh --install

# Disable auto-shutdown
~/capstone/deploy/auto-shutdown.sh --uninstall
```

**How it works**: Monitors connections to your services (ports 3001-3005, 5173, 8080). If no traffic for 30 minutes, the instance shuts down automatically.

**To restart**: Go to AWS Console → EC2 → Select instance → Instance state → Start

## Troubleshooting

### Services not starting
```bash
# Check service status
docker-compose ps

# Check logs for specific service
docker-compose logs auth-service
```

### AI Service slow/OOM
- Upgrade to t3.xlarge (16GB RAM)
- Or add swap: `sudo fallocate -l 4G /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`

### Can't connect from browser
- Check security group allows ports 3001-3005, 5173
- Check CORS_ORIGIN in .env matches your access URL
- Try with IP:PORT not localhost

### SSH connection refused
- Wait 1-2 minutes after launch
- Check security group allows port 22 from your IP
- Verify key file permissions: `chmod 400 capstone-key.pem`

## Security Notes

1. **Never commit secrets** - Keep `.env` out of git
2. **Restrict SSH** - The setup script limits SSH to your current IP
3. **Use HTTPS in production** - Consider adding Nginx + Let's Encrypt
4. **Enable AWS backups** - Configure EBS snapshots or use backup script
5. **Monitor costs** - Set up AWS billing alerts

## Cleanup

To avoid charges when not using the instance:

```bash
# Stop instance (keeps data, minimal charge)
aws ec2 stop-instances --instance-ids YOUR_INSTANCE_ID

# Terminate instance (deletes everything)
aws ec2 terminate-instances --instance-ids YOUR_INSTANCE_ID
```
