# Phase 11 — Day-2 Operations & Smoke Readiness

Date: 2026-11-09  
Domain: `https://tjayjeweler.com`  
Production host: `62.3.42.179:3031`  
App path: `/var/www/tjayjeweler`

Release: `bfa49f5a9bb1cf9cb09ea0cfc646b8fa9c563993`

## Final status

**PASS — operational readiness for public launch**

Bank card seed path, end-to-end card-transfer order smoke, receipt storage checks, and daily PostgreSQL backups are verified.

## Gate summary

| Gate | Result |
| --- | --- |
| Bank settings seed CLI (`npm run seed:bank`) | PASS |
| Order smoke (`PENDING_VERIFICATION` → `PAYMENT_APPROVED` → `PROCESSING`) | PASS |
| Receipt storage under private media root (`.webp` only) | PASS |
| Daily DB backup + 7-day retention | PASS |
| Local regression (`npm test`) | PASS (33/33) |
| Production deploy + ops run | PASS (`HEAD=bfa49f5`) |

## 1. Bank card configuration

- CLI: `scripts/seed-bank-settings.ts` / `npm run seed:bank`
- Reads `BANK_CARD_NUMBER`, `BANK_CARD_HOLDER`, `BANK_NAME` (or `--card/--holder/--bank`)
- Skips overwrite when already configured unless `--force`
- Production `StoreSetting` seeded so checkout no longer renders blank card fields
- **Action:** replace the seeded operational card with the live studio card in `/admin/settings` before paid ads

## 2. Smoke transaction cycle

Script: `scripts/smoke-order-cycle.ts` / `npm run smoke:order`

Verified flow:

1. Ensure bank settings configured
2. Provision dedicated smoke SKU `TJ-SMOKE-PHASE11` (sellable stock/price)
3. Encode mock receipt → store under `MEDIA_ROOT/receipts/*.webp`
4. Create order → `PENDING_VERIFICATION` + stock hold
5. Admin review → `PAYMENT_APPROVED` → `PROCESSING`

Receipt controls:

- Re-encoded WebP only (no original executable/script payload retained)
- Random UUID filename
- Outside release tree (`/var/lib/tjayjeweler/media/receipts` in production)
- Admin-only serve path

## 3. Database backups

Production path: `/var/backups/tjayjeweler/backup_db.sh`  
Source tracked in repo: `scripts/backup_db.sh`

Behavior:

- `pg_dump` from `DATABASE_URL` (Prisma `schema` query param stripped)
- Gzip archive `backup_YYYY-MM-DD.sql.gz`
- Delete archives older than 7 days
- `gzip -t` integrity check
- Cron: `15 2 * * * /var/backups/tjayjeweler/backup_db.sh`

Restore drill (manual):

```bash
gunzip -c /var/backups/tjayjeweler/backup_YYYY-MM-DD.sql.gz | psql "$PSQL_URL"
```

## 4. Production verification notes

| Check | Observed |
| --- | --- |
| Release HEAD | `bfa49f5` |
| Bank configured | last4 `4455` · `TJAY JEWELER` · `Melli` |
| Smoke order | `cmw99j78q0002ptydhln8kupv` → `PROCESSING` |
| Receipt `.webp` count | `1` under `/var/lib/tjayjeweler/media/receipts` |
| Backup archive | `/var/backups/tjayjeweler/backup_2026-11-09.sql.gz` (7.5 KB, `gzip -t` OK) |
| Cron | `15 2 * * * /var/backups/tjayjeweler/backup_db.sh` |
| `/` and `/checkout` | `200` / `200` |

## 5. Launch green light

**Public launch: APPROVED** from an operations perspective, contingent on replacing the seeded bank card with live studio credentials and completing one human receipt review in `/admin/orders`.
