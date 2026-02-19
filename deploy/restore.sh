#!/bin/bash
# ==========================================
# MongoDB Restore Script (IAS-3.4)
# ==========================================
# Restores the capstone_project database from a backup created by deploy/backup.sh.
# Supports plain .archive and encrypted .archive.enc (when BACKUP_ENCRYPTION_PASSWORD is set).
#
# Usage:
#   ./deploy/restore.sh <path-to-backup>
#   ./deploy/restore.sh /path/to/capstone_backup_20250101_120000.archive
#   ./deploy/restore.sh /path/to/capstone_backup_20250101_120000.archive.enc
#
# For .enc files, set BACKUP_ENCRYPTION_PASSWORD in .env or environment.
# ==========================================

set -e

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ $# -lt 1 ]; then
    echo "Usage: $0 <path-to-backup>"
    echo ""
    echo "  Backup can be:"
    echo "    - .archive   (plain gzipped archive from mongodump)"
    echo "    - .archive.enc (encrypted with BACKUP_ENCRYPTION_PASSWORD)"
    echo ""
    echo "  Load .env from PROJECT_DIR for MONGO_APP_USER, MONGO_APP_PASSWORD, BACKUP_ENCRYPTION_PASSWORD."
    exit 1
fi

BACKUP_PATH="$1"
if [ ! -f "$BACKUP_PATH" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_PATH${NC}"
    exit 1
fi

cd "$PROJECT_DIR"
if [ -f "$PROJECT_DIR/.env" ]; then set -a; . "$PROJECT_DIR/.env"; set +a; fi
MONGO_APP_USER="${MONGO_APP_USER:-capstone_app}"
MONGO_APP_PASSWORD="${MONGO_APP_PASSWORD:-devapppass}"

echo "Restoring from: $BACKUP_PATH"

if [ "${BACKUP_PATH%.enc}" != "$BACKUP_PATH" ]; then
    # Encrypted backup: decrypt to a temp file, then restore
    if [ -z "${BACKUP_ENCRYPTION_PASSWORD:-}" ]; then
        echo -e "${RED}Error: BACKUP_ENCRYPTION_PASSWORD is required for encrypted backups. Set in .env or environment.${NC}"
        exit 1
    fi
    TMP_ARCHIVE=$(mktemp)
    trap "rm -f '$TMP_ARCHIVE'" EXIT
    echo "Decrypting backup..."
    openssl enc -aes-256-cbc -d -pbkdf2 -in "$BACKUP_PATH" -out "$TMP_ARCHIVE" -k "$BACKUP_ENCRYPTION_PASSWORD"
    RESTORE_INPUT="$TMP_ARCHIVE"
else
    RESTORE_INPUT="$BACKUP_PATH"
fi

# Copy into container and run mongorestore (with auth)
ARCHIVE_NAME=$(basename "$RESTORE_INPUT")
docker cp "$RESTORE_INPUT" capstone-mongodb:/tmp/restore.archive
docker-compose exec -T -e MONGO_APP_USER -e MONGO_APP_PASSWORD mongodb mongorestore \
    --username="$MONGO_APP_USER" --password="$MONGO_APP_PASSWORD" --authenticationDatabase=admin \
    --db=capstone_project --archive=/tmp/restore.archive --gzip --drop
docker-compose exec -T mongodb rm -f /tmp/restore.archive

echo -e "${GREEN}✓ Restore completed.${NC}"
