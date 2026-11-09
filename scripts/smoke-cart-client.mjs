/**
 * Headless cart/checkout smoke against production.
 * Captures pageerror / console.error and fails on uncaught exceptions.
 *
 * Usage: node scripts/smoke-cart-client.mjs [baseUrl]
 */
import { chromium } from "playwright";

const baseUrl = (process.argv[2] || "https://tjayjeweler.com").replace(/\/$/, "");
const errors = [];

function track(page) {
  page.on("pageerror", (err) => {
    errors.push(`pageerror: ${err.message}`);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore benign third-party / extension noise if any appears.
      if (/favicon|Download the React DevTools/i.test(text)) return;
      errors.push(`console.error: ${text}`);
    }
  });
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    // Prefer system Chrome when Playwright's bundled Chromium is unavailable.
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
  });
  const page = await browser.newPage();
  track(page);

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(1500);

  // Dedicated in-stock smoke SKU from Phase 11 ops (falls back to first product link).
  await page.goto(`${baseUrl}/products/phase11-smoke-piece`, { waitUntil: "networkidle", timeout: 60_000 });
  if (page.url().includes("404") || (await page.getByText(/not found/i).count()) > 0) {
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 60_000 });
    const productLink = page.locator('a[href^="/products/"]').first();
    await productLink.waitFor({ state: "visible", timeout: 30_000 });
    await productLink.click();
    await page.waitForURL(/\/products\//, { timeout: 30_000 });
  }
  await page.waitForTimeout(1000);

  const addBtn = page.getByRole("button", { name: /add to bag|in bag/i }).first();
  await addBtn.waitFor({ state: "visible", timeout: 30_000 });
  const unavailable = await page.getByText(/out of stock|price on request/i).count();
  if (unavailable > 0 && ((await addBtn.textContent()) ?? "").toLowerCase().includes("add to bag")) {
    // Still try add; product-detail blocks zero-price / OOS with a note instead of looping.
  }
  const label = (await addBtn.textContent())?.toLowerCase() ?? "";
  if (!label.includes("in bag")) {
    await addBtn.click();
    await page.waitForTimeout(800);
  }

  const bagDialog = page.getByRole("dialog", { name: /bag/i });
  // addItem opens the drawer automatically; only click the header bag if it is closed.
  if ((await bagDialog.count()) === 0 || !(await bagDialog.isVisible())) {
    await page.getByRole("button", { name: /open bag/i }).click({ force: true });
  }
  await bagDialog.waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForTimeout(1000);

  await page.getByRole("link", { name: /proceed to checkout/i }).click();
  await page.waitForURL(/\/checkout/, { timeout: 30_000 });
  await page.waitForTimeout(1500);

  await browser.close();

  const critical = errors.filter((entry) => /185|Maximum update depth|Minified React error/i.test(entry));
  const payload = {
    ok: critical.length === 0 && errors.length === 0,
    baseUrl,
    errors,
    critical,
  };
  console.log(JSON.stringify(payload, null, 2));
  if (!payload.ok) process.exit(1);
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, fatal: String(error) }, null, 2));
  process.exit(1);
});
