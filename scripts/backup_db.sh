#!/usr/bin/env bash
# Daily PostgreSQL backup for tjayjeweler.
# Intended path on production: /var/backups/tjayjeweler/backup_db.sh
set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/tjayjeweler}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
STAMP="$(date +%F)"
DEST="${BACKUP_ROOT}/backup_${STAMP}.sql.gz"
LOG="${BACKUP_ROOT}/backup.log"

mkdir -p "$BACKUP_ROOT"
chmod 750 "$BACKUP_ROOT"

if [[ -f /var/www/tjayjeweler/.env ]]; then
  set -a
  # shellcheck disable=SC1091
  . /var/www/tjayjeweler/.env
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[$(date -Is)] DATABASE_URL missing" | tee -a "$LOG" >&2
  exit 1
fi

# Strip Prisma-only query params (e.g. schema=public) for pg_dump/libpq.
DUMP_URL="${DATABASE_URL%%\?*}"

umask 027
pg_dump --dbname="$DUMP_URL" --no-owner --no-acl | gzip -c > "${DEST}.tmp"
mv "${DEST}.tmp" "$DEST"
chmod 640 "$DEST"

find "$BACKUP_ROOT" -type f -name 'backup_*.sql.gz' -mtime +"${RETENTION_DAYS}" -delete

# Lightweight restore verification: list archive contents / gunzip test.
if ! gzip -t "$DEST"; then
  echo "[$(date -Is)] backup integrity failed: $DEST" | tee -a "$LOG" >&2
  exit 1
fi

SIZE="$(wc -c < "$DEST" | tr -d ' ')"
echo "[$(date -Is)] ok file=$DEST bytes=$SIZE retention_days=${RETENTION_DAYS}" | tee -a "$LOG"
