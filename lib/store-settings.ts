import { prisma } from "@/lib/db";
import { type BankSettings, bankSettingsSchema } from "@/lib/store-settings-schema";

export type { BankSettings } from "@/lib/store-settings-schema";
export { bankSettingsSchema, formatCardNumber } from "@/lib/store-settings-schema";

export async function ensureStoreSettings() {
  return prisma.storeSetting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      bank_card_number: "",
      bank_card_holder: "",
      bank_name: "",
    },
    update: {},
  });
}

export async function getBankSettings() {
  const row = await ensureStoreSettings();
  return {
    bank_card_number: row.bank_card_number,
    bank_card_holder: row.bank_card_holder,
    bank_name: row.bank_name,
    updated_at: row.updated_at,
  };
}

export async function getPublicBankSettings() {
  const settings = await getBankSettings();
  const configured =
    /^\d{16}$/.test(settings.bank_card_number) &&
    settings.bank_card_holder.trim().length >= 2 &&
    settings.bank_name.trim().length >= 2;
  return {
    configured,
    bank_card_number: configured ? settings.bank_card_number : "",
    bank_card_holder: configured ? settings.bank_card_holder : "",
    bank_name: configured ? settings.bank_name : "",
  };
}

export async function updateBankSettings(input: BankSettings) {
  const parsed = bankSettingsSchema.parse(input);
  return prisma.storeSetting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      bank_card_number: parsed.bank_card_number,
      bank_card_holder: parsed.bank_card_holder,
      bank_name: parsed.bank_name,
    },
    update: {
      bank_card_number: parsed.bank_card_number,
      bank_card_holder: parsed.bank_card_holder,
      bank_name: parsed.bank_name,
    },
  });
}
