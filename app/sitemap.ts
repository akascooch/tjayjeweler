import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

const staticRoutes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/rings", changeFrequency: "weekly", priority: 0.9 },
  { path: "/pendants-chains", changeFrequency: "weekly", priority: 0.9 },
  { path: "/cuffs-bracelets", changeFrequency: "weekly", priority: 0.9 },
  { path: "/custom", changeFrequency: "monthly", priority: 0.7 },
  { path: "/search", changeFrequency: "weekly", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const products = await prisma.product.findMany({
    where: { is_visible: true, status: "ACTIVE" },
    select: { slug: true, updated_at: true },
    orderBy: { updated_at: "desc" },
  });

  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE_URL}${route.path === "/" ? "" : route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...products.map((product) => ({
      url: `${SITE_URL}/products/${product.slug}`,
      lastModified: product.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
