import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, it } from "node:test";
import { customRequestHash } from "./custom-request";
import { CustomRequestConflict, saveCustomRequest } from "./custom-request-store";
import { prisma } from "./db";

const created: string[] = [];

function fields(key: string, description: string) {
  return {
    kind: "ORIGINAL_DESIGN" as const,
    description,
    contact_phone: "09120000000",
    idempotency_key: key,
  };
}

describe("custom request persistence", () => {
  after(async () => {
    if (created.length > 0) {
      await prisma.customRequest.deleteMany({ where: { id: { in: created } } });
    }
    await prisma.$disconnect();
  });

  it("stores one row and replays the same key", async () => {
    const key = randomUUID();
    const description = "A plain sterling band for a custom request test.";
    const hash = customRequestHash({
      kind: "ORIGINAL_DESIGN",
      productId: null,
      description,
      contactName: null,
      contactPhone: "09120000000",
      hasImage: false,
    });
    const first = await saveCustomRequest({
      fields: fields(key, description),
      contactName: null,
      productId: null,
      payloadHash: hash,
      referenceFile: null,
    });
    created.push(first.id);
    const second = await saveCustomRequest({
      fields: fields(key, description),
      contactName: null,
      productId: null,
      payloadHash: hash,
      referenceFile: null,
    });
    assert.equal(second.id, first.id);
    assert.equal(second.replay, true);
    const count = await prisma.customRequest.count({ where: { idempotency_key: key } });
    assert.equal(count, 1);
  });

  it("rejects a reused key that carries different details", async () => {
    const key = randomUUID();
    const description = "A second custom request persistence case.";
    const hash = customRequestHash({
      kind: "ORIGINAL_DESIGN",
      productId: null,
      description,
      contactName: null,
      contactPhone: "09120000000",
      hasImage: false,
    });
    const saved = await saveCustomRequest({
      fields: fields(key, description),
      contactName: null,
      productId: null,
      payloadHash: hash,
      referenceFile: null,
    });
    created.push(saved.id);
    await assert.rejects(
      saveCustomRequest({
        fields: fields(key, `${description} changed`),
        contactName: null,
        productId: null,
        payloadHash: "b".repeat(64),
        referenceFile: null,
      }),
      CustomRequestConflict,
    );
  });
});
