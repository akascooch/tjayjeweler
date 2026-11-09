import type { Metadata } from "next";
import { CategoryCatalog } from "@/components/category-catalog";
import { publicPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = publicPageMetadata({
  title: "Sterling Silver Chains",
  description: "Heavy sterling silver chains and pendants from TJAY JEWELER.",
  path: "/pendants-chains",
});

export default function ChainsPage() {
  return (
    <CategoryCatalog
      slug="pendants-chains"
      title="Chains"
      intro="Heavy silver chains and pendants."
    />
  );
}
