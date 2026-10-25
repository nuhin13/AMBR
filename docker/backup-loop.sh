#!/bin/sh
# Nightly pg_dump inside the "backup" service (docker-compose.prod.yml).
# Dumps at BACKUP_HOUR (UTC, default 21 = 03:00 Asia/Dhaka) and keeps RETENTION_DAYS of files.
set -eu
BACKUP_HOUR="${BACKUP_HOUR:-21}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
mkdir -p /backups
echo "Backup service started — daily at ${BACKUP_HOUR}:00 UTC, keeping ${RETENTION_DAYS} days."
while true; do
  if [ "$(date -u +%H)" = "$(printf '%02d' "$BACKUP_HOUR")" ]; then
    FILE="/backups/ambr-$(date -u +%Y%m%dT%H%M%SZ).dump"
    pg_dump --format=custom --no-owner --no-privileges --file="$FILE" && echo "✓ $FILE"
    find /backups -name 'ambr-*.dump' -mtime +"$RETENTION_DAYS" -delete
    sleep 3700
  else
    sleep 600
  fi
done
