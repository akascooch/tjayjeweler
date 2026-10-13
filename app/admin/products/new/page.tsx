import { NewProductForm } from "./new-product-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <section>
      <h2 className="text-2xl font-black tracking-[0.12em] uppercase">New product</h2>
      <NewProductForm categories={categories} />
    </section>
  );
}
