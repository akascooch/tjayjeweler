import { CategoryCatalog } from "@/components/category-catalog";

export const dynamic = "force-dynamic";

export default function RingsPage() {
  return (
    <CategoryCatalog
      slug="rings"
      title="Rings"
      intro="Sterling signet rings. Sizes and weights are listed with each piece."
    />
  );
}
