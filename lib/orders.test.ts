import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { orderContactSchema, orderReviewSchema } from "./orders-schema";

describe("order contact schema", () => {
  it("requires a mobile number and at least one item", () => {
    const parsed = orderContactSchema.safeParse({
      email: "buyer@example.com",
      phone: "09121234567",
      items: [{ variantId: "cabcdefghijklmnopqrstuv", quantity: 1 }],
    });
    assert.equal(parsed.success, true);
  });

  it("rejects missing phone", () => {
    const parsed = orderContactSchema.safeParse({
      items: [{ variantId: "cabcdefghijklmnopqrstuv", quantity: 1 }],
    });
    assert.equal(parsed.success, false);
  });
});

describe("order review schema", () => {
  it("requires a note when rejecting payment", () => {
    assert.equal(orderReviewSchema.safeParse({ status: "PAYMENT_REJECTED" }).success, false);
    assert.equal(
      orderReviewSchema.safeParse({ status: "PAYMENT_REJECTED", staff_note: "Blurry receipt" }).success,
      true,
    );
  });

  it("allows approval without a note", () => {
    assert.equal(orderReviewSchema.safeParse({ status: "PAYMENT_APPROVED" }).success, true);
  });
});
