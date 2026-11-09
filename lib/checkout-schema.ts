import { z } from "zod";
import { phoneSchema } from "@/lib/validators";

export const checkoutItemSchema = z.object({
  variantId: z.string().trim().min(20).max(40),
  quantity: z.number().int().min(1).max(20),
});

export const checkoutBodySchema = z.object({
  email: z.union([z.string().trim().email("Enter a valid email.").max(160), z.literal("")]).optional(),
  phone: z.union([phoneSchema, z.literal("")]).optional(),
  items: z.array(checkoutItemSchema).min(1, "Your bag is empty.").max(30),
});

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;
