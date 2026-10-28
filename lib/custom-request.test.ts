import "dotenv/config";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";
import {
  customRequestFieldsSchema,
  customRequestHash,
  duplicateDecision,
  staffRequestAccess,
} from "./custom-request";
import { encodeProductImage, ImageRejected } from "./media";

const valid = {
  kind: "ORIGINAL_DESIGN" as const,
  description: "A heavy sterling cuff with a plain outer face.",
  contact_phone: "09120000000",
  idempotency_key: "6f1b9c0e-6a1d-4a1e-9c1a-0b9d8e7f6a5b",
};

describe("custom request validation", () => {
  it("accepts a new design without a catalog piece", () => {
    const parsed = customRequestFieldsSchema.parse(valid);
    assert.equal(parsed.kind, "ORIGINAL_DESIGN");
  });

  it("rejects a short description, a bad phone, and a new design that names a piece", () => {
    assert.equal(
      customRequestFieldsSchema.safeParse({ ...valid, description: "too short" }).success,
      false,
    );
    assert.equal(
      customRequestFieldsSchema.safeParse({ ...valid, contact_phone: "12345" }).success,
      false,
    );
    assert.equal(
      customRequestFieldsSchema.safeParse({
        ...valid,
        product_id: "cm1234567890123456789012",
      }).success,
      false,
    );
  });

  it("requires a catalog piece when modifying one", () => {
    assert.equal(
      customRequestFieldsSchema.safeParse({ ...valid, kind: "EXISTING_MODEL" }).success,
      false,
    );
  });
});

describe("staff-only access", () => {
  it("refuses anonymous visitors and customers", () => {
    assert.equal(staffRequestAccess(null), 401);
    assert.equal(staffRequestAccess("CUSTOMER"), 403);
    assert.equal(staffRequestAccess("ADMIN"), null);
  });
});

describe("duplicate submissions", () => {
  it("replays a matching hash and conflicts on a different one", () => {
    const hash = customRequestHash({
      kind: "ORIGINAL_DESIGN",
      productId: null,
      description: valid.description,
      contactName: null,
      contactPhone: valid.contact_phone,
      hasImage: false,
    });
    assert.equal(duplicateDecision(null, hash), "create");
    assert.equal(duplicateDecision(hash, hash), "replay");
    assert.equal(duplicateDecision("a".repeat(64), hash), "conflict");
  });
});

describe("reference image validation", () => {
  it("re-encodes a png and rejects a non-image", async () => {
    const png = await sharp({
      create: { width: 12, height: 12, channels: 3, background: "#111111" },
    })
      .png()
      .toBuffer();
    const encoded = await encodeProductImage(png);
    assert.ok(encoded.data.length > 0);

    await assert.rejects(
      encodeProductImage(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>")),
      ImageRejected,
    );
  });
});
