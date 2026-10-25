#!/usr/bin/env bash
# AMBR database backup — compressed pg_dump with timestamp, optional upload to S3/R2.
#   DATABASE_URL=... BACKUP_DIR=./backups [S3_BUCKET=s3://bucket/path] [S3_ENDPOINT=https://<id>.r2.cloudflarestorage.com] ./scripts/backup.sh
# Keeps the last $RETENTION_DAYS (default 30) local backups.
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$BACKUP_DIR/ambr-$STAMP.dump"

mkdir -p "$BACKUP_DIR"
# Strip Prisma's ?schema=… query parameter, which pg_dump doesn't understand.
PG_URL="${DATABASE_URL%%\?*}"
pg_dump --format=custom --no-owner --no-privileges --dbname="$PG_URL" --file="$FILE"
echo "✓ Backup written: $FILE ($(du -h "$FILE" | cut -f1))"

if [[ -n "${S3_BUCKET:-}" ]]; then
  aws s3 cp "$FILE" "$S3_BUCKET/" ${S3_ENDPOINT:+--endpoint-url "$S3_ENDPOINT"}
  echo "✓ Uploaded to $S3_BUCKET"
fi

find "$BACKUP_DIR" -name 'ambr-*.dump' -mtime +"$RETENTION_DAYS" -delete
