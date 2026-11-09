import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cartTotals, formatIrt, formatRial, irtToRial, rialToIrt } from "./cart";
import { isSuccessfulVerifyCode } from "./zarinpal";

describe("cart totals", () => {
  it("sums quantities and converts IRT to Rial", () => {
    const totals = cartTotals([
      { variantId: "a", quantity: 2, unitPriceIrt: 150_000 },
      { variantId: "b", quantity: 1, unitPriceIrt: 49_500.5 },
    ]);
    assert.equal(totals.itemCount, 3);
    assert.equal(totals.subtotalIrt, 349_500.5);
    assert.equal(totals.subtotalRial, 3_495_005);
  });

  it("ignores invalid quantities and negative prices", () => {
    const totals = cartTotals([
      { variantId: "a", quantity: 0, unitPriceIrt: 10 },
      { variantId: "b", quantity: 1.5, unitPriceIrt: 10 },
      { variantId: "c", quantity: 2, unitPriceIrt: -5 },
    ]);
    assert.equal(totals.itemCount, 0);
    assert.equal(totals.subtotalIrt, 0);
    assert.equal(totals.subtotalRial, 0);
  });
});

describe("currency helpers", () => {
  it("converts between IRT and Rial", () => {
    assert.equal(irtToRial(12_345.67), 123_457);
    assert.equal(rialToIrt(123_450), 12_345);
  });

  it("formats display amounts", () => {
    assert.equal(formatIrt(12000), "12,000 IRT");
    assert.equal(formatRial(120000), "120,000 Rial");
  });
});

describe("zarinpal verify codes", () => {
  it("treats 100 and 101 as successful verification", () => {
    assert.equal(isSuccessfulVerifyCode(100), true);
    assert.equal(isSuccessfulVerifyCode(101), true);
    assert.equal(isSuccessfulVerifyCode(-9), false);
  });
});
