#!/usr/bin/env bash
# =========================================================================
# Vazir Student Portal - Production Scheduled Backup Script
# =========================================================================
# This script executes SQLite's online backup (preserving live WAL consistency)
# and synchronizes the snapshot off the host server.
#
# Cron entry example (runs daily at 03:00 AM server time):
# 0 3 * * * /opt/vazir-app/scripts/backup-cron.sh >> /var/log/vazir-backup.log 2>&1
# =========================================================================

set -euo pipefail

# Project root directory
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${APP_DIR}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${APP_DIR}/backups"
mkdir -p "${BACKUP_DIR}"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting scheduled database backup..."

# 1. Execute online SQLite backup and JSON export
# If running inside Docker: docker exec vazir-app npm run backup
# If running directly with Node on VPS:
npm run backup

# 2. Remote offsite synchronization examples (choose your provider):
# Option A: AWS S3 or compatible object storage (MinIO, ArvanCloud S3, Cloudflare R2)
# aws s3 sync "${BACKUP_DIR}/" "s3://your-secure-bucket/vazir-backups/" --exclude "*" --include "backup-*.db" --include "backup-*.json"

# Option B: Rclone to any remote cloud storage (Google Drive, Nextcloud, SFTP)
# rclone copy "${BACKUP_DIR}/" "remote:vazir-backups/" --include "backup-*.db" --include "backup-*.json"

# Option C: Rsync to a secondary remote backup server
# rsync -avz -e "ssh -i /root/.ssh/backup_key" "${BACKUP_DIR}/" backupuser@remote-storage.example.com:/backups/vazir/

# 3. Clean up local snapshots older than 14 days to preserve disk space
find "${BACKUP_DIR}" -type f \( -name "backup-*.db" -o -name "backup-*.json" \) -mtime +14 -exec rm -f {} +

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Scheduled backup completed successfully."
