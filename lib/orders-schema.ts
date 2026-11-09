import { z } from "zod";
import { checkoutItemSchema } from "@/lib/checkout-schema";
import { phoneSchema } from "@/lib/validators";

export const orderContactSchema = z.object({
  email: z.union([z.string().trim().email("Enter a valid email.").max(160), z.literal("")]).optional(),
  phone: phoneSchema,
  items: z.array(checkoutItemSchema).min(1, "Your bag is empty.").max(30),
});

export type OrderContactInput = z.infer<typeof orderContactSchema>;

export const orderReviewSchema = z
  .object({
    status: z.enum(["PAYMENT_APPROVED", "PAYMENT_REJECTED", "PROCESSING", "COMPLETED"]),
    staff_note: z.string().trim().max(2000).optional(),
  })
  .refine((value) => value.status !== "PAYMENT_REJECTED" || (value.staff_note?.trim().length ?? 0) > 0, {
    message: "Add a note when rejecting a payment.",
    path: ["staff_note"],
  });
