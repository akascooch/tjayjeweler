import { prisma } from "@/lib/db";
import { duplicateDecision, type CustomRequestFields } from "@/lib/custom-request";

export class CustomRequestConflict extends Error {}

type SaveInput = {
  fields: CustomRequestFields;
  contactName: string | null;
  productId: string | null;
  payloadHash: string;
  referenceFile: string | null;
};

export async function findCustomRequestByKey(idempotencyKey: string) {
  return prisma.customRequest.findUnique({
    where: { idempotency_key: idempotencyKey },
    select: { id: true, payload_hash: true },
  });
}

export async function saveCustomRequest(input: SaveInput) {
  const existing = await findCustomRequestByKey(input.fields.idempotency_key);
  const decision = duplicateDecision(existing?.payload_hash ?? null, input.payloadHash);
  if (decision === "replay" && existing) return { id: existing.id, replay: true };
  if (decision === "conflict") throw new CustomRequestConflict();

  try {
    const created = await prisma.customRequest.create({
      data: {
        kind: input.fields.kind,
        product_id: input.productId,
        description: input.fields.description,
        contact_name: input.contactName,
        contact_phone: input.fields.contact_phone,
        reference_file: input.referenceFile,
        payload_hash: input.payloadHash,
        idempotency_key: input.fields.idempotency_key,
      },
      select: { id: true },
    });
    return { id: created.id, replay: false };
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      const raced = await findCustomRequestByKey(input.fields.idempotency_key);
      const racedDecision = duplicateDecision(raced?.payload_hash ?? null, input.payloadHash);
      if (racedDecision === "replay" && raced) return { id: raced.id, replay: true };
      throw new CustomRequestConflict();
    }
    throw error;
  }
}
