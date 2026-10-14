#!/usr/bin/env bash
# ==============================================================================
# VARTA Database Restore Script
# Restores a compressed PostgreSQL dump into the target container.
# CAUTION: This will overwrite data in the target database!
# ==============================================================================

set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path-to-backup-file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="${CONTAINER_NAME:-varta-prod-postgres}"
DB_USER="${POSTGRES_USER:-varta_user}"
DB_NAME="${POSTGRES_DB:-varta_db}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "WARNING: Restoring will overwrite existing data in '${DB_NAME}'."
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo "[$(date)] Restoring database from ${BACKUP_FILE}..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"
echo "[$(date)] Database restoration finished successfully."
