import type { Metadata } from "next";
import { CategoryCatalog } from "@/components/category-catalog";
import { publicPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = publicPageMetadata({
  title: "Sterling Silver Rings",
  description: "Sterling silver signet and statement rings from TJAY JEWELER. Sizes and weights listed with each piece.",
  path: "/rings",
});

export default function RingsPage() {
  return (
    <CategoryCatalog
      slug="rings"
      title="Rings"
      intro="Sterling signet rings. Sizes and weights are listed with each piece."
    />
  );
}
