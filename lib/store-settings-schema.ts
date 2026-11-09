import { z } from "zod";

export const bankSettingsSchema = z.object({
  bank_card_number: z
    .string()
    .trim()
    .regex(/^\d{16}$/, "Enter a 16-digit card number with digits only."),
  bank_card_holder: z.string().trim().min(2, "Enter the account holder name.").max(120),
  bank_name: z.string().trim().min(2, "Enter the bank name.").max(120),
});

export type BankSettings = z.infer<typeof bankSettingsSchema>;

export function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}
