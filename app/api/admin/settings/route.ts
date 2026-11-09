import { jsonData, requireAdmin } from "@/lib/admin";
import { jsonError, readJson } from "@/lib/http";
import { bankSettingsSchema, getBankSettings, updateBankSettings } from "@/lib/store-settings";
import { firstZodMessage } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const settings = await getBankSettings();
    return jsonData(settings);
  } catch (error) {
    console.error(error instanceof Error ? error.name : "settings read failed");
    return jsonError("Settings could not be loaded.", 500);
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = bankSettingsSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(firstZodMessage(parsed.error), 400);

  try {
    const settings = await updateBankSettings(parsed.data);
    return jsonData({
      bank_card_number: settings.bank_card_number,
      bank_card_holder: settings.bank_card_holder,
      bank_name: settings.bank_name,
      updated_at: settings.updated_at,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.name : "settings update failed");
    return jsonError("Settings could not be saved.", 500);
  }
}
