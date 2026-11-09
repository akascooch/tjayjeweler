import "dotenv/config";
import { updateBankSettings, getBankSettings, getPublicBankSettings } from "../lib/store-settings";
import { prisma } from "../lib/db";

function usage() {
  console.error(
    [
      "Usage:",
      "  npx tsx scripts/seed-bank-settings.ts",
      "",
      "Required env (or args):",
      "  BANK_CARD_NUMBER=16 digits",
      "  BANK_CARD_HOLDER=name",
      "  BANK_NAME=bank",
      "",
      "Optional:",
      "  --force   overwrite even when already configured",
    ].join("\n"),
  );
}

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const force = process.argv.includes("--force");
  const card =
    (argValue("--card") ?? process.env.BANK_CARD_NUMBER ?? "").replace(/\D/g, "");
  const holder = (argValue("--holder") ?? process.env.BANK_CARD_HOLDER ?? "").trim();
  const bank = (argValue("--bank") ?? process.env.BANK_NAME ?? "").trim();

  const current = await getPublicBankSettings();
  if (current.configured && !force) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          action: "unchanged",
          configured: true,
          bank_name: current.bank_name,
          bank_card_holder: current.bank_card_holder,
          card_last4: current.bank_card_number.slice(-4),
        },
        null,
        2,
      ),
    );
    return;
  }

  if (!card || !holder || !bank) {
    usage();
    process.exit(1);
  }

  await updateBankSettings({
    bank_card_number: card,
    bank_card_holder: holder,
    bank_name: bank,
  });

  const saved = await getBankSettings();
  console.log(
    JSON.stringify(
      {
        ok: true,
        action: force ? "overwritten" : "seeded",
        configured: true,
        bank_name: saved.bank_name,
        bank_card_holder: saved.bank_card_holder,
        card_last4: saved.bank_card_number.slice(-4),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "seed failed");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
