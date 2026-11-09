# Phase 9.1 — Card-to-Card Transfer, Receipt Upload & Admin Verification

Date: 2026-11-09  
Production host: `62.3.42.179:3031`  
App path: `/var/www/tjayjeweler`  
Process: PM2 `tjay-web`

## Final status

**PASS — checkout pivoted from Zarinpal redirect to card transfer + receipt verification**

Customers now see live bank card settings, upload a receipt, and land in `PENDING_VERIFICATION`. Admins manage card details and approve/reject receipts from the admin panel.

## Gate summary

| Gate | Result |
| --- | --- |
| Prisma `StoreSetting` + order status/receipt migration | PASS |
| Admin bank settings API + UI | PASS |
| Checkout receipt upload (`POST /api/orders`) | PASS |
| Admin orders verification dashboard | PASS |
| Local lint / test / build | PASS (30/30 tests) |
| Commit + push + production deploy | PASS |

## Schema

Migration `20261109180000_pivot_card_transfer_and_receipt`:

- `StoreSetting` singleton (`bank_card_number`, `bank_card_holder`, `bank_name`)
- Order status additions: `PENDING_VERIFICATION`, `PAYMENT_APPROVED`, `PAYMENT_REJECTED`, `PROCESSING`, `COMPLETED`
- Order fields: `phone`, `receipt_image` (private file), `staff_note`

Receipts are re-encoded to WebP and stored under the private media root (`…/receipts`), served only via admin auth.

## Storefront checkout

- `/checkout` shows configured card details (copyable) and requires mobile + receipt image
- `POST /api/orders` creates an atomic stock hold and order at `PENDING_VERIFICATION`
- Success page: `/checkout/result?status=pending_verification`

## Admin

- Settings: bank card form on `/admin/settings` via `GET/PUT /api/admin/settings`
- Orders queue: `/admin/orders` + detail review with receipt image
- Approve / reject / processing / completed via `PATCH /api/admin/orders/[id]`
- Reject restores reserved stock; approval keeps the hold and sets `paid_at`

## Production follow-up

1. Sign in to `/admin/settings` and enter the live card number, holder, and bank name.
2. Place a test order with a receipt image and verify it under `/admin/orders`.
3. Legacy Zarinpal routes remain in the tree but are unused by the new checkout UI.
