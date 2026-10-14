#!/usr/bin/env bash
# ==============================================================================
# VARTA Database Backup Script
# Creates a compressed PostgreSQL dump and manages a 14-day rotation policy.
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/www/varta/backups}"
CONTAINER_NAME="${CONTAINER_NAME:-varta-prod-postgres}"
DB_USER="${POSTGRES_USER:-varta_user}"
DB_NAME="${POSTGRES_DB:-varta_db}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/varta_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting VARTA database backup..."
docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"

echo "[$(date)] Backup completed successfully: ${BACKUP_FILE} ($(du -sh "${BACKUP_FILE}" | cut -f1))"

# Retention policy: remove backups older than 14 days
find "${BACKUP_DIR}" -type f -name "varta_backup_*.sql.gz" -mtime +14 -exec rm -f {} \;
echo "[$(date)] Cleaned backups older than 14 days."
