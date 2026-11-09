import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkoutBodySchema } from "./checkout-schema";

describe("checkout body schema", () => {
  it("accepts a valid bag payload", () => {
    const parsed = checkoutBodySchema.safeParse({
      email: "buyer@example.com",
      phone: "09121234567",
      items: [{ variantId: "cabcdefghijklmnopqrstuv", quantity: 1 }],
    });
    assert.equal(parsed.success, true);
  });

  it("rejects an empty bag", () => {
    const parsed = checkoutBodySchema.safeParse({
      email: "",
      items: [],
    });
    assert.equal(parsed.success, false);
  });

  it("rejects invalid mobile numbers when provided", () => {
    const parsed = checkoutBodySchema.safeParse({
      phone: "123",
      items: [{ variantId: "cabcdefghijklmnopqrstuv", quantity: 1 }],
    });
    assert.equal(parsed.success, false);
  });
});
