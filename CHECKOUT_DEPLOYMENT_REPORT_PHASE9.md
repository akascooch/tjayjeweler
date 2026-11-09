# Phase 9 — Shopping Cart, Orders & Zarinpal Checkout

Date: 2026-11-09  
Production host: `62.3.42.179:3031`  
App path: `/var/www/tjayjeweler`  
Process: PM2 `tjay-web` → `127.0.0.1:3000` behind Nginx + Let’s Encrypt  
Release: `e6afafb6e62c32c0a38da5302d04e11eb82f4bb6`

## Final status

**PASS — cart state, order/payment schema, Zarinpal REST v4 checkout/verify, and production deploy completed**

Live merchant credentials remain sandbox placeholders until a real `ZARINPAL_MERCHANT_ID` is installed. Checkout routes and DB schema are live.

## Gate summary

| Gate | Result |
| --- | --- |
| Prisma Order / PaymentTransaction migration | PASS |
| Zustand cart + drawer + product wiring | PASS |
| `POST /api/checkout` + `GET /api/checkout/verify` | PASS |
| Local lint / test / build | PASS (23/23 tests, build OK) |
| Commit + push `origin/main` | PASS — `e6afafb` |
| Production deploy via `/var/www/tjayjeweler/deploy.sh` | PASS (`HTTP_HOME=200`, `CHECKOUT=200`) |
| Postgres bind remains localhost | PASS (`127.0.0.1:5432`) |

## 1. Database

Migration `20261109160000_add_orders_payment_fields`:

- `OrderStatus.FAILED`
- Order fields: `email`, `total_amount`, `authority_code`, `ref_id`
- Model `PaymentTransaction` linked to `Order`
- Existing variant-based `OrderItem` retained (no parallel product-only schema)

Applied locally and on production (`tjayjeweler_prod`). `prisma migrate status`: schema up to date (5 migrations).

## 2. Cart & storefront UI

- `lib/store/cart-store.ts` — Zustand + LocalStorage (`tjay-cart`), clears legacy `tjay-bag`
- `components/cart-drawer.tsx` — slide-over bag with qty controls, IRT/Rial subtotal, checkout CTA
- Header bag icon + product detail “Add to bag” wired to the store

## 3. Checkout & Zarinpal

- `POST /api/checkout` — same-origin CSRF check, Zod validation, atomic stock hold, pending order + transaction, Zarinpal `/pg/v4/payment/request.json`
- `GET /api/checkout/verify` — gateway callback, `/pg/v4/payment/verify.json`, marks `PAID` / restores stock on cancel-fail, redirects to `/checkout/result`
- Amounts: store IRT (Toman) → gateway Rials (`×10`)
- Sandbox switch: `ZARINPAL_SANDBOX=true|false`

`.env.example` placeholders:

- `APP_BASE_URL`
- `ZARINPAL_MERCHANT_ID`
- `ZARINPAL_SANDBOX`

Production `.env` keys present (`SET`); merchant ID still placeholder / sandbox mode.

## 4. Local QA

| Command | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm test` | PASS — 23 tests |
| `npm run build` | PASS — Next `15.5.29` |

## 5. Production deploy

`deploy.sh` updated to run `npx prisma migrate deploy` after `npm ci` and before build.

| Step | Result |
| --- | --- |
| Pull | `d482eb0` → `e6afafb` |
| Migrate | `add_orders_payment_fields` applied |
| Build | success |
| PM2 reload `tjay-web` | online |
| Health | `HTTP_HOME=200`, `CHECKOUT=200`, verify callback `307` (redirect) |
| Postgres | listening on `127.0.0.1:5432` only |

## Next phase trigger

Install the real Zarinpal merchant ID, set `ZARINPAL_SANDBOX=false` for production traffic, run an end-to-end sandbox payment against a catalog variant, then proceed to order admin / fulfillment UX.
