import { z } from "zod";

export const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^0\d{10}$/, "Enter a valid mobile number."),
  password: z.string().min(1).max(128),
});

export const newPasswordSchema = z
  .string()
  .min(10, "Use at least 10 characters with an uppercase letter, a lowercase letter, and a digit.")
  .max(128)
  .refine((value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value), {
    message: "Use at least 10 characters with an uppercase letter, a lowercase letter, and a digit.",
  });

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1).max(128),
    new_password: newPasswordSchema,
    confirm_password: z.string().min(1).max(128),
  })
  .refine((value) => value.new_password === value.confirm_password, {
    message: "New password and confirmation do not match.",
    path: ["confirm_password"],
  })
  .refine((value) => value.new_password !== value.current_password, {
    message: "Choose a password that is different from the current one.",
    path: ["new_password"],
  });

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase slug with letters, numbers, and hyphens.")
  .max(80);

export const priceSchema = z
  .string()
  .trim()
  .regex(/^\d{1,10}(\.\d{1,2})?$/, "Enter a price in IRT with up to two decimal places.");

export const weightSchema = z
  .string()
  .trim()
  .regex(/^\d{1,7}(\.\d{1,3})?$/, "Enter a weight in grams with up to three decimal places.");

export const sortOrderSchema = z.number().int().min(0).max(100_000);
export const stockSchema = z.number().int().min(0).max(1_000_000);
export const productStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);

export const categoryWriteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema,
  description: z.string().trim().max(2000).nullable().optional(),
  sort_order: sortOrderSchema.optional(),
});

export const productWriteSchema = z.object({
  category_id: z.string().trim().min(20).max(32),
  title: z.string().trim().min(1).max(160),
  slug: slugSchema,
  description: z.string().trim().max(8000).nullable().optional(),
  purity: z.string().trim().min(1).max(16).optional(),
  base_weight: weightSchema.optional(),
  is_visible: z.boolean().optional(),
  show_price: z.boolean().optional(),
  sort_order: sortOrderSchema.optional(),
  status: productStatusSchema.optional(),
});

export const productPatchSchema = productWriteSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Nothing to update." });

export const variantWriteSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9-]+$/, "SKU can use letters, numbers, and hyphens."),
  price: priceSchema,
  stock_quantity: stockSchema,
  weight_grams: weightSchema.optional(),
  ring_size: z.string().trim().max(16).nullable().optional(),
  chain_length: z.string().trim().max(16).nullable().optional(),
  show_price_override: z.boolean().nullable().optional(),
});

export const variantUpdateSchema = z
  .object({
    sku: variantWriteSchema.shape.sku.optional(),
    price: priceSchema.optional(),
    stock_quantity: stockSchema.optional(),
    weight_grams: weightSchema.optional(),
    ring_size: z.string().trim().max(16).nullable().optional(),
    chain_length: z.string().trim().max(16).nullable().optional(),
    show_price_override: z.boolean().nullable().optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Nothing to update.",
  });

const imageUrlSchema = z
  .string()
  .trim()
  .url("Enter a full image URL.")
  .max(2000)
  .refine((value) => value.startsWith("https://") || value.startsWith("http://"), {
    message: "Image URL must start with http:// or https://.",
  });

export const imageWriteSchema = z.object({
  url: imageUrlSchema,
  alt_text: z.string().trim().max(200).nullable().optional(),
  sort_order: sortOrderSchema.optional(),
  is_primary: z.boolean().optional(),
});

export const imagePatchSchema = z
  .object({
    url: imageUrlSchema.optional(),
    alt_text: z.string().trim().max(200).nullable().optional(),
    sort_order: sortOrderSchema.optional(),
    is_primary: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Nothing to update.",
  });

export function normalizePrice(price: string) {
  const [whole, fraction = ""] = price.split(".");
  return `${whole}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

export function normalizeWeight(weight: string) {
  const [whole, fraction = ""] = weight.split(".");
  return `${whole}.${fraction.padEnd(3, "0").slice(0, 3)}`;
}

export function blankToNull(value: string | null | undefined) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function firstZodMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the submitted values.";
}
