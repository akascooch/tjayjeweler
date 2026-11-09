# Master Project Handover — tjayjeweler.com

Date sealed: 2026-11-09  
Working copy: `C:\scooch\tjayjeweler`  
Live domain: `https://tjayjeweler.com` / `https://www.tjayjeweler.com`  
Production host: `62.3.42.179` · SSH `root@62.3.42.179` port **3031**  
App root: `/var/www/tjayjeweler`  
Stable release tag: **`v1.0.1-stable`** (`ec7ef6672256c8fe23338956989c68cf474de96a`)  
Prior golden tag: `v1.0.0-commercial-ready` (`c06bda85e6975d2f1234af73942548523c9f83a0`)

## 1. Executive summary

tjayjeweler is a production silver-jewelry e-commerce platform: Next.js App Router storefront, Prisma-backed PostgreSQL catalog/orders, Zustand cart, card-to-card checkout with private WebP receipt upload, and an admin panel for bank settings, order verification, catalog, and custom requests.

All phased gates (discovery → host hardening → bootstrap → build/PM2 → Nginx/TLS → commerce → SEO → ops → golden seal → React #185 hotfix) are **PASS**. Production at seal time:

| Check | Observed |
| --- | --- |
| Remote HEAD | `ec7ef66` = `v1.0.1-stable` |
| PM2 `tjay-web` | `online` (Node 22.23.3, `npm start -- -H 127.0.0.1`) |
| Localhost `/` + `/checkout` | `200` / `200` |
| PostgreSQL | **18.6**, listen `127.0.0.1:5432` only |
| Next origin | `127.0.0.1:3000` only |
| UFW | `3031/tcp`, `80/tcp`, `443/tcp` |
| Fail2ban `sshd` | active |
| Daily DB backup cron | `15 2 * * * /var/backups/tjayjeweler/backup_db.sh` |

**Sign-off:** system is commercially live and stable under `v1.0.1-stable`. Non-blocking studio follow-ups: replace seeded bank credentials with live card details, keep catalog prices/stock current, complete human receipt reviews in `/admin/orders`.

---

## 2. Architectural blueprint

### 2.1 Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js **15.5.29** (App Router), React **19.1**, TypeScript |
| Styling / images | Tailwind CSS 4, `sharp` (WebP/AVIF pipeline) |
| Client state | Zustand 5 (`lib/store/cart-store.ts`) — selectors must stay primitive/stable (see §6) |
| ORM / DB | Prisma **7.10** + `@prisma/adapter-pg` → PostgreSQL **18** |
| Validation / auth | Zod; `bcryptjs` + `jose` session cookies; admin role gate |
| Process | PM2 app name `tjay-web`; systemd `pm2-root` enabled |
| Edge | Nginx reverse proxy → `127.0.0.1:3000`; Certbot TLS; Cloudflare DNS/proxy |
| Host hardening | SSH **3031**, UFW, Fail2ban `sshd`, Postgres localhost-only |

### 2.2 Runtime topology

```text
Internet → Cloudflare → Nginx :443/:80
                           └─ proxy_pass → 127.0.0.1:3000 (Next / PM2 tjay-web)
                           └─ Postgres 127.0.0.1:5432 (not public)
SSH management → :3031 only (UFW allow 3031/tcp)
Private media → /var/lib/tjayjeweler/media/receipts (admin-only serve)
DB backups → /var/backups/tjayjeweler/backup_YYYY-MM-DD.sql.gz
```

### 2.3 Data model (Prisma)

Core models: `User`, `Category`, `Product`, `ProductImage`, `ProductVariant`, `InventoryReservation`, `CustomRequest`, `StoreSetting` (singleton bank card), `Order`, `OrderItem`, `PaymentTransaction`.

Commerce statuses used by card-transfer flow: `PENDING_VERIFICATION` → `PAYMENT_APPROVED` / `PAYMENT_REJECTED` → `PROCESSING` → `COMPLETED` (plus legacy `PENDING` / `PAID` / `FAILED` / `CANCELLED`).

Receipts are re-encoded to WebP, stored outside the release tree, and served only through authenticated admin routes.

### 2.4 Security posture checklist

| Control | Status |
| --- | --- |
| SSH on port 3031 (UFW explicit allow) | Required / active |
| Password SSH retired; key-only BatchMode | Required |
| PostgreSQL `listen_addresses = 127.0.0.1` | Verified |
| App binds `127.0.0.1:3000` (not public Node) | Verified |
| Zod validation + parameterized Prisma queries | In app |
| Admin routes unauthenticated → `307` redirect | Verified |
| Receipt/custom images not public URLs | Verified |
| Nginx headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` | Present |
| Origin CSP / origin HSTS | Residual optional (Cloudflare may supply HSTS) |
| Atomic stock hold on order create; reject restores stock | Implemented |

---

## 3. Feature inventory

### 3.1 Storefront

| Feature | Location / notes |
| --- | --- |
| Homepage brand composition | `app/page.tsx` |
| Support / About home panels | `components/home-panels.tsx` |
| Product scroller | `components/product-scroller.tsx` |
| Header search | `/search` + header search UI |
| Category catalogs | `/rings`, `/pendants-chains`, `/cuffs-bracelets` |
| Product detail + add to bag | `/products/[slug]` |
| Cart drawer | `components/cart-drawer.tsx` (Zustand; hotfix-stable) |
| Custom design requests | `/custom` + `POST /api/custom-requests` |
| Account surface | `/account` |
| SEO | `sitemap.xml`, `robots.txt`, OG/metadata (Phase 10) |

### 3.2 Checkout (card-to-card)

| Feature | Notes |
| --- | --- |
| `/checkout` | Shows live bank card from `StoreSetting`; copyable number |
| Receipt upload | Required image → private WebP under media root |
| `POST /api/orders` | Creates order at `PENDING_VERIFICATION` with stock reservation |
| Result page | `/checkout/result?status=pending_verification` |
| Legacy Zarinpal routes | Remain in tree; unused by current checkout UI |

### 3.3 Admin

| Area | Path |
| --- | --- |
| Dashboard | `/admin` |
| Bank card + password | `/admin/settings` (`GET/PUT /api/admin/settings`) |
| Orders list / detail / receipt | `/admin/orders`, `/admin/orders/[id]`, receipt API |
| Approve / reject / processing | `PATCH /api/admin/orders/[id]` |
| Products / variants / images | `/admin/products…` |
| Categories | `/admin/categories` |
| Custom requests + private image | `/admin/custom-requests…` |

### 3.4 Ops tooling (repo scripts)

| Script | Command |
| --- | --- |
| Seed bank settings | `npm run seed:bank` → `scripts/seed-bank-settings.ts` |
| Order lifecycle smoke | `npm run smoke:order` → `scripts/smoke-order-cycle.ts` |
| Headless cart/checkout smoke | `npm run smoke:cart` → `scripts/smoke-cart-client.mjs` |
| Daily backup source | `scripts/backup_db.sh` (installed on server under `/var/backups/tjayjeweler/`) |
| Unit tests | `npm test` |

---

## 4. Admin operational guide

### 4.1 Update bank card (customer-facing checkout)

1. SSH is not required for this step.
2. Sign in as admin and open `https://tjayjeweler.com/admin/settings`.
3. Set **card number**, **card holder**, **bank name**; save.
4. Confirm `/checkout` shows the new details (seeded Phase 11 values must be replaced with live studio credentials before paid traffic).

CLI alternative (server, from app root with env loaded): `npm run seed:bank` with the script’s expected env/args.

### 4.2 Review payment receipts

1. Open `/admin/orders`.
2. Open an order in `PENDING_VERIFICATION`.
3. Inspect the private receipt image (admin-only route).
4. **Approve** → `PAYMENT_APPROVED` (sets `paid_at`, keeps inventory hold) then move to `PROCESSING` / `COMPLETED` as fulfillment progresses.
5. **Reject** → `PAYMENT_REJECTED` and stock restore.

### 4.3 Catalog & custom work

- Manage products/variants/images under `/admin/products`.
- Review custom requests under `/admin/custom-requests` (reference images are private).

---

## 5. Developer & DevOps runbook

### 5.1 SSH

```bash
ssh -i ~/.ssh/id_ed25519_tjay -p 3031 root@62.3.42.179
```

Never change UFW in a way that drops `3031/tcp`. Postgres must remain on localhost only.

### 5.2 Git tags (release baseline)

| Tag | Commit | Meaning |
| --- | --- | --- |
| `v1.0.0-commercial-ready` | `c06bda8` | Golden commercial seal (Phase 12) |
| `v1.0.1-stable` | `ec7ef66` | Hotfix: React #185 cart selector + smoke verification |

Checkout a known release:

```bash
git fetch --tags
git checkout v1.0.1-stable
```

### 5.3 Production deploy

On the server:

```bash
/var/www/tjayjeweler/deploy.sh
```

Documented flow (production `deploy.sh`):

1. `nvm` load → `cd /var/www/tjayjeweler`
2. `git fetch` / `checkout main` / `pull origin main`
3. `npm ci` (runs `prisma generate` via `postinstall`)
4. `npx prisma migrate deploy`
5. `npm run build`
6. `pm2 reload tjay-web --update-env` (or start if missing) → `pm2 save`
7. Health retry: localhost `http://127.0.0.1:3000/` must return `200` or script exits non-zero

Local → remote path:

```bash
git push origin main
ssh -p 3031 root@62.3.42.179 '/var/www/tjayjeweler/deploy.sh'
```

### 5.4 Monitoring

```bash
pm2 status
pm2 logs tjay-web --lines 100
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/checkout
ss -lntp | grep -E '5432|3000'
ufw status
fail2ban-client status sshd
tail -n 50 /var/backups/tjayjeweler/backup.log
```

Public probes: `/`, `/search`, `/checkout`, `/robots.txt`, `/sitemap.xml` → `200`; `/admin/*` unauthenticated → `307`.

Client smoke (from a workstation with Playwright + Chrome):

```bash
npm run smoke:cart -- https://tjayjeweler.com
```

Expect JSON `{ "ok": true, "errors": [], "critical": [] }`.

### 5.5 Database backups & restore

- Cron: `15 2 * * * /var/backups/tjayjeweler/backup_db.sh >/dev/null 2>&1`
- Archives: `/var/backups/tjayjeweler/backup_YYYY-MM-DD.sql.gz`
- Retention: 7 days; integrity via `gzip -t`
- Source of truth in git: `scripts/backup_db.sh`

Manual backup:

```bash
/var/backups/tjayjeweler/backup_db.sh
```

Restore drill (use a maintenance window; confirm `PSQL_URL` / `DATABASE_URL` target carefully):

```bash
gunzip -c /var/backups/tjayjeweler/backup_YYYY-MM-DD.sql.gz | psql "$PSQL_URL"
```

### 5.6 Rollback strategy

**App-only rollback** (preferred when DB schema did not change):

```bash
cd /var/www/tjayjeweler
git fetch origin
git checkout <known-good-sha-or-tag>   # e.g. v1.0.1-stable or prior commit
npm ci
npm run build
pm2 reload tjay-web --update-env
pm2 save
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
```

**Schema-aware rollback:** do not invent down-migrations. If a bad release included a forward migration, restore from the latest good `backup_*.sql.gz` only after confirming downtime acceptance, then redeploy the matching git tag. Prefer fixing forward with a new migration when safe.

**Process crash:** `pm2 restart tjay-web --update-env`; systemd `pm2-root` restores process list on reboot via saved dump.

---

## 6. Stability note (v1.0.1 hotfix)

Root cause: `useCartStore((s) => s.totals())` returned a **new object every snapshot** → infinite re-render (React #185).

Rule for future work:

- Select primitives or stable store references (`items`, `itemCount`, actions).
- Derive computed objects with `useMemo` (or `useShallow` if selecting object slices).
- Never call factory/computed object methods inside the Zustand selector.

Audit status: only cart store exists; `cart-drawer`, header button, checkout form, and product-detail consumers verified. Interactive production smoke recorded in `HOTFIX_VERIFICATION_AND_STABILITY_REPORT_V1.0.1.md`.

---

## 7. Phase gate ledger

| Phase | Gate | Result |
| --- | --- | --- |
| 1 | Read-only discovery & audit | PASS |
| 2 | Host hardening (SSH 3031, UFW, Fail2ban, Postgres 18, swap) | PASS |
| 3 | Project bootstrap (Next/Prisma schema) | PASS |
| 4 | Production build, migrations, PM2 | PASS |
| 5–8 | Nginx/TLS, security headers, deploy closeout | PASS |
| 9 / 9.1 | Checkout → card-transfer + receipt pivot | PASS |
| 10 | SEO + launch sign-off | PASS |
| 11 | Ops: bank seed, order smoke, daily backups | PASS |
| 12 | Golden tag `v1.0.0-commercial-ready` | PASS |
| Hotfix | `v1.0.1-stable` React #185 + selector audit + cart smoke | PASS |

Supporting reports in repo root: `AUDIT_REPORT_PHASE1.md`, Phase 3–12 / security / checkout / ops / hotfix reports.

---

## 8. Final project sign-off

**MASTER HANDOVER: APPROVED.**

tjayjeweler.com is delivered, hardened, commercially tagged, hotfix-stable, and operable under the runbooks above. Ownership for ongoing catalog content, live bank credentials, and human payment verification transfers to studio operators; engineering baseline remains `origin/main` at **`v1.0.1-stable`**.
