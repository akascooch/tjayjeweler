export function effectiveShowPrice(productShowPrice: boolean, override: boolean | null) {
  return override === null ? productShowPrice : override;
}

export function isZeroPrice(price: string) {
  return Number(price) === 0;
}

export function variantPriceCopy(
  productShowPrice: boolean,
  override: boolean | null,
  price: string,
) {
  if (!effectiveShowPrice(productShowPrice, override)) {
    return "برای قیمت پیام بده / تماس بگیرید";
  }
  if (isZeroPrice(price)) return "تماس برای قیمت";
  return `${price} IRT`;
}

export function productPriceCopy(
  productShowPrice: boolean,
  variants: { show_price_override: boolean | null; price: string }[],
) {
  const visiblePrices = variants
    .filter((variant) => effectiveShowPrice(productShowPrice, variant.show_price_override))
    .map((variant) => variant.price);

  if (visiblePrices.length === 0) return "برای قیمت پیام بده / تماس بگیرید";
  const priced = visiblePrices.filter((price) => !isZeroPrice(price));
  if (priced.length === 0) return "تماس برای قیمت";
  const lowest = priced.reduce((left, right) => (Number(left) <= Number(right) ? left : right));
  return priced.length > 1 ? `از ${lowest} IRT` : `${lowest} IRT`;
}
