#!/usr/bin/env bash
# Restore an AMBR backup into the database at DATABASE_URL.
#   DATABASE_URL=... ./scripts/restore.sh backups/ambr-20261025T020000Z.dump
# DANGER: replaces existing objects in the target database. Restore into a NEW database first to verify.
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"
FILE="${1:?usage: restore.sh <backup.dump>}"
PG_URL="${DATABASE_URL%%\?*}"
read -r -p "Restore $FILE into $PG_URL? This overwrites data. Type 'restore' to continue: " ok
[[ "$ok" == "restore" ]] || { echo "Aborted."; exit 1; }
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$PG_URL" "$FILE"
echo "✓ Restore complete. Run: npx prisma migrate status"
