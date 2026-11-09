import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { publicPageMetadata } from "@/lib/seo";
import { getPublicBankSettings } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = publicPageMetadata({
  title: "Checkout",
  description: "Complete your TJAY JEWELER order by card transfer and receipt upload.",
  path: "/checkout",
  index: false,
});

export default async function CheckoutPage() {
  const bank = await getPublicBankSettings();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8">
      <p className="font-ui text-xs tracking-[0.28em] text-[var(--muted)] uppercase">Checkout</p>
      <h1 className="editorial-heading mt-3 text-3xl font-bold tracking-[0.14em] uppercase md:text-4xl">
        Card Transfer
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-white/80">
        Transfer the order total to the studio card, then upload your payment receipt for verification.
      </p>
      <CheckoutForm bank={bank} />
    </main>
  );
}
