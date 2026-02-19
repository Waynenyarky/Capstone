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

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="${PROJECT_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
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

# Load env for MONGO_APP_USER / MONGO_APP_PASSWORD (IAS-3.7 authenticated dump)
if [ -f "$PROJECT_DIR/.env" ]; then set -a; . "$PROJECT_DIR/.env"; set +a; fi
MONGO_APP_USER="${MONGO_APP_USER:-capstone_app}"
MONGO_APP_PASSWORD="${MONGO_APP_PASSWORD:-devapppass}"

echo -e "${BLUE}=== MongoDB Backup ===${NC}"
echo "Timestamp: $TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create MongoDB dump (with auth: least-privilege app user)
echo "Creating MongoDB dump..."
docker-compose exec -T -e MONGO_APP_USER -e MONGO_APP_PASSWORD mongodb mongodump \
    --db=capstone_project \
    --username="$MONGO_APP_USER" --password="$MONGO_APP_PASSWORD" --authenticationDatabase=admin \
    --archive="/tmp/${BACKUP_NAME}.archive" \
    --gzip

# Copy from container
docker cp capstone-mongodb:/tmp/${BACKUP_NAME}.archive "${BACKUP_DIR}/${BACKUP_NAME}.archive"

# Cleanup container temp file
docker-compose exec -T mongodb rm -f "/tmp/${BACKUP_NAME}.archive"

# IAS-3.4: Encrypt backup when BACKUP_ENCRYPTION_PASSWORD is set (production should set this)
BACKUP_ENCRYPTION_PASSWORD="${BACKUP_ENCRYPTION_PASSWORD:-}"
if [ -n "$BACKUP_ENCRYPTION_PASSWORD" ]; then
    echo "Encrypting backup (AES-256-CBC)..."
    openssl enc -aes-256-cbc -salt -pbkdf2 -in "${BACKUP_DIR}/${BACKUP_NAME}.archive" -out "${BACKUP_DIR}/${BACKUP_NAME}.archive.enc" -k "$BACKUP_ENCRYPTION_PASSWORD"
    rm -f "${BACKUP_DIR}/${BACKUP_NAME}.archive"
    BACKUP_FINAL="${BACKUP_DIR}/${BACKUP_NAME}.archive.enc"
else
    echo -e "${YELLOW}! BACKUP_ENCRYPTION_PASSWORD not set; backup is not encrypted (set in production).${NC}"
    BACKUP_FINAL="${BACKUP_DIR}/${BACKUP_NAME}.archive"
fi

echo -e "${GREEN}✓ Backup created: ${BACKUP_FINAL}${NC}"

# Upload to S3 if specified (upload the final file: .enc if encrypted, else .archive)
if [ -n "$S3_BUCKET" ]; then
    echo "Uploading to S3..."
    if command -v aws &> /dev/null; then
        aws s3 cp "$BACKUP_FINAL" "s3://${S3_BUCKET}/backups/$(basename "$BACKUP_FINAL")"
        echo -e "${GREEN}✓ Uploaded to s3://${S3_BUCKET}/backups/$(basename "$BACKUP_FINAL")${NC}"
    else
        echo -e "${YELLOW}! AWS CLI not installed. Skipping S3 upload.${NC}"
    fi
fi

# Show backup size
SIZE=$(du -h "$BACKUP_FINAL" | cut -f1)
echo ""
echo "Backup details:"
echo "  File: $BACKUP_FINAL"
echo "  Size: $SIZE"

# List recent backups
echo ""
echo "Recent backups:"
ls -lh "$BACKUP_DIR" | tail -5
