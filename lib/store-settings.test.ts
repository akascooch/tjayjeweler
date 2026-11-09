import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bankSettingsSchema, formatCardNumber } from "./store-settings-schema";

describe("bank settings schema", () => {
  it("accepts a complete card profile", () => {
    const parsed = bankSettingsSchema.safeParse({
      bank_card_number: "6037991012345678",
      bank_card_holder: "TJAY JEWELER",
      bank_name: "Melli",
    });
    assert.equal(parsed.success, true);
  });

  it("rejects short or spaced card numbers", () => {
    assert.equal(
      bankSettingsSchema.safeParse({
        bank_card_number: "6037 9910 1234 5678",
        bank_card_holder: "TJAY",
        bank_name: "Melli",
      }).success,
      false,
    );
    assert.equal(
      bankSettingsSchema.safeParse({
        bank_card_number: "1234",
        bank_card_holder: "TJAY",
        bank_name: "Melli",
      }).success,
      false,
    );
  });
});

describe("card formatting", () => {
  it("groups digits in fours", () => {
    assert.equal(formatCardNumber("6037991012345678"), "6037 9910 1234 5678");
  });
});
