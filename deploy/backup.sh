#!/bin/bash
# ==========================================
# MongoDB Backup Script
# ==========================================
# Creates a backup of the MongoDB database.
#
# Usage:
#   ./deploy/backup.sh                    # Backup to local file
#   ./deploy/backup.sh --s3 bucket-name   # Backup to S3
#
# ==========================================

set -e

PROJECT_DIR="${PROJECT_DIR:-$HOME/capstone}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="capstone_backup_${TIMESTAMP}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
S3_BUCKET=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --s3|-s)
            S3_BUCKET="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --s3, -s BUCKET   Upload backup to S3 bucket"
            echo "  -h, --help        Show this help"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

cd "$PROJECT_DIR"

echo -e "${BLUE}=== MongoDB Backup ===${NC}"
echo "Timestamp: $TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create MongoDB dump
echo "Creating MongoDB dump..."
docker-compose exec -T mongodb mongodump \
    --db=capstone_project \
    --archive="/tmp/${BACKUP_NAME}.archive" \
    --gzip

# Copy from container
docker cp capstone-mongodb:/tmp/${BACKUP_NAME}.archive "${BACKUP_DIR}/${BACKUP_NAME}.archive"

# Cleanup container temp file
docker-compose exec -T mongodb rm -f "/tmp/${BACKUP_NAME}.archive"

echo -e "${GREEN}✓ Backup created: ${BACKUP_DIR}/${BACKUP_NAME}.archive${NC}"

# Upload to S3 if specified
if [ -n "$S3_BUCKET" ]; then
    echo "Uploading to S3..."
    if command -v aws &> /dev/null; then
        aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.archive" "s3://${S3_BUCKET}/backups/${BACKUP_NAME}.archive"
        echo -e "${GREEN}✓ Uploaded to s3://${S3_BUCKET}/backups/${BACKUP_NAME}.archive${NC}"
    else
        echo -e "${YELLOW}! AWS CLI not installed. Skipping S3 upload.${NC}"
    fi
fi

# Show backup size
SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.archive" | cut -f1)
echo ""
echo "Backup details:"
echo "  File: ${BACKUP_DIR}/${BACKUP_NAME}.archive"
echo "  Size: $SIZE"

# List recent backups
echo ""
echo "Recent backups:"
ls -lh "$BACKUP_DIR" | tail -5
