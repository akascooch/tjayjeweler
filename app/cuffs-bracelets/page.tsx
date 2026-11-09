import type { Metadata } from "next";
import { CategoryCatalog } from "@/components/category-catalog";
import { publicPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = publicPageMetadata({
  title: "Sterling Silver Cuffs",
  description: "Engraved sterling silver cuffs and bracelets from TJAY JEWELER.",
  path: "/cuffs-bracelets",
});

export default function CuffsPage() {
  return (
    <CategoryCatalog
      slug="cuffs-bracelets"
      title="Cuffs"
      intro="Engraved silver cuffs and bracelets."
    />
  );
}
