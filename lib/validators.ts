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

export const variantUpdateSchema = z.object({
  price: z
    .string()
    .trim()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, "Enter a price in IRT with up to two decimal places."),
  stock_quantity: z.number().int().min(0).max(1_000_000),
});

export function normalizePrice(price: string) {
  const [whole, fraction = ""] = price.split(".");
  return `${whole}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

export function firstZodMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the submitted values.";
}
