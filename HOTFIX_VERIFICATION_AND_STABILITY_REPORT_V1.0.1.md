# Hotfix Verification & Stability Report — v1.0.1

Date: 2026-11-09  
Domain: `https://tjayjeweler.com`  
Hotfix base: `4eca4b27baa030028c7a110d477cdbb4b60e41cf`  
Release tag: `v1.0.1-stable`

## Final status

**PASS — React #185 fixed, selectors audited, interactive cart/checkout smoke clean, tag published**

## Gate summary

| Gate | Result |
| --- | --- |
| Zustand selector audit | PASS |
| Latent selector hardening (`product-detail`) | PASS |
| Headless cart → checkout smoke (0 console exceptions) | PASS |
| Annotated tag `v1.0.1-stable` | PASS |

## 1. Root cause (already fixed in `4eca4b2`)

`components/cart-drawer.tsx` subscribed with:

```ts
useCartStore((state) => state.totals())
```

`totals()` returns a **new object every call**. Zustand/`useSyncExternalStore` treated every snapshot as changed → infinite re-render → React minified error **#185**.

Fix: select stable `items` / primitive `itemCount`, compute totals via `useMemo`.

## 2. Store selector audit

Only Zustand store in the app: `lib/store/cart-store.ts` (`useCartStore`).

| Consumer | Selector pattern | Verdict |
| --- | --- | --- |
| `cart-drawer.tsx` | primitives + `items` ref + `useMemo` totals | PASS (post-hotfix) |
| `CartHeaderButton` | primitive `itemCount` reduce | PASS |
| `checkout-form.tsx` | `items` + stable `clear` action | PASS |
| `checkout-result-effects.tsx` | stable `clear` action | PASS |
| `product-detail.tsx` | `items` + primitive `cartSkus` via `useMemo` | PASS (hardened) |

No other auth/UI Zustand stores exist. No remaining `state.totals()` selector usage.

## 3. Interactive smoke (production)

Command: `node scripts/smoke-cart-client.mjs https://tjayjeweler.com`  
(`npm run smoke:cart`)

Flow verified:

1. Load `/`
2. Open `/products/phase11-smoke-piece`
3. Add to bag (drawer auto-opens)
4. Confirm bag dialog visible
5. Navigate to `/checkout`

Result:

```json
{ "ok": true, "baseUrl": "https://tjayjeweler.com", "errors": [], "critical": [] }
```

Zero `pageerror` / `console.error` events, including no React #185 / maximum update depth.

## 4. Tag

```text
v1.0.1-stable
Message: Release v1.0.1: Hotfix React #185 infinite re-render loop in Zustand cart selector; verified stable
```

## Sign-off

**Client runtime stability: APPROVED for continued commercial traffic.**
