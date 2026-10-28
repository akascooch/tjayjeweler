import { createHash } from "node:crypto";
import { z } from "zod";
import { phoneSchema } from "@/lib/validators";

export const customRequestKindSchema = z.enum(["EXISTING_MODEL", "ORIGINAL_DESIGN"]);
export const customRequestStatusSchema = z.enum(["NEW", "REVIEWED", "CLOSED"]);

const idempotencyKeySchema = z.string().uuid();

export const customRequestFieldsSchema = z
  .object({
    kind: customRequestKindSchema,
    product_id: z.string().trim().min(20).max(32).optional(),
    description: z.string().trim().min(20).max(2000),
    contact_name: z.string().trim().max(80).optional(),
    contact_phone: phoneSchema,
    idempotency_key: idempotencyKeySchema,
  })
  .superRefine((value, context) => {
    if (value.kind === "EXISTING_MODEL" && !value.product_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["product_id"],
        message: "Choose a catalog piece to modify.",
      });
    }
    if (value.kind === "ORIGINAL_DESIGN" && value.product_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["product_id"],
        message: "A new design does not use a catalog piece.",
      });
    }
  });

export const customRequestReviewSchema = z.object({
  status: customRequestStatusSchema,
  staff_note: z.string().trim().max(2000).nullable().optional(),
});

export type CustomRequestFields = z.infer<typeof customRequestFieldsSchema>;

export function customRequestHash(input: {
  kind: CustomRequestFields["kind"];
  productId: string | null;
  description: string;
  contactName: string | null;
  contactPhone: string;
  hasImage: boolean;
}) {
  return createHash("sha256")
    .update(
      [
        input.kind,
        input.productId ?? "",
        input.contactPhone,
        input.contactName ?? "",
        input.description,
        input.hasImage ? "image" : "no-image",
      ].join("\n"),
    )
    .digest("hex");
}

export function staffRequestAccess(role: string | null | undefined) {
  if (role === "ADMIN") return null;
  return role ? 403 : 401;
}

export function duplicateDecision(existingHash: string | null, nextHash: string) {
  if (!existingHash) return "create" as const;
  return existingHash === nextHash ? ("replay" as const) : ("conflict" as const);
}
