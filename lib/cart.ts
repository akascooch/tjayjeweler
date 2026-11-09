export type CartLine = {
  variantId: string;
  quantity: number;
  unitPriceIrt: number;
};

export type CartTotals = {
  itemCount: number;
  subtotalIrt: number;
  subtotalRial: number;
};

/** Zarinpal amounts are submitted in Rials. Store prices are IRT (Toman). */
export function irtToRial(amountIrt: number) {
  if (!Number.isFinite(amountIrt) || amountIrt < 0) return 0;
  return Math.round(amountIrt * 10);
}

export function rialToIrt(amountRial: number) {
  if (!Number.isFinite(amountRial) || amountRial < 0) return 0;
  return amountRial / 10;
}

export function cartTotals(lines: CartLine[]): CartTotals {
  let itemCount = 0;
  let subtotalIrt = 0;

  for (const line of lines) {
    const quantity = Number.isInteger(line.quantity) && line.quantity > 0 ? line.quantity : 0;
    const unit = Number.isFinite(line.unitPriceIrt) && line.unitPriceIrt > 0 ? line.unitPriceIrt : 0;
    if (quantity === 0 || unit === 0) continue;
    itemCount += quantity;
    subtotalIrt += unit * quantity;
  }

  const roundedIrt = Math.round(subtotalIrt * 100) / 100;
  return {
    itemCount,
    subtotalIrt: roundedIrt,
    subtotalRial: irtToRial(roundedIrt),
  };
}

export function formatIrt(amount: number) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${safe.toLocaleString("en-US", { maximumFractionDigits: 2 })} IRT`;
}

export function formatRial(amount: number) {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `${safe.toLocaleString("en-US")} Rial`;
}
