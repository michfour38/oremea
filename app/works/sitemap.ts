import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { worksUrl } from "@/lib/works/seo";

export const dynamic = "force-dynamic";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: worksUrl("/"), changeFrequency: "weekly", priority: 1 },
  { url: worksUrl("/providers/plans"), changeFrequency: "monthly", priority: 0.8 },
  { url: worksUrl("/providers/join"), changeFrequency: "monthly", priority: 0.8 },
  { url: worksUrl("/verification"), changeFrequency: "yearly", priority: 0.4 },
  { url: worksUrl("/reviews-policy"), changeFrequency: "yearly", priority: 0.3 },
  { url: worksUrl("/partner-disclosure"), changeFrequency: "yearly", priority: 0.2 },
  { url: worksUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const categories = await prisma.works_market_categories.findMany({
      where: {
        enabled: true,
        market: { slug: "za", active: true },
        category: { active: true },
      },
      select: {
        category: { select: { slug: true, updated_at: true } },
      },
      orderBy: { sort_order: "asc" },
    });

    const providers = await prisma.works_providers.findMany({
      where: {
        profile_status: { not: "ARCHIVED" },
        slug: { not: "works-qa-supplier" },
        markets: {
          some: {
            active: true,
            offerings: { some: { active: true } },
          },
        },
      },
      select: { slug: true, updated_at: true },
      orderBy: { updated_at: "desc" },
    });

    return [
      ...STATIC_ROUTES,
      ...categories.map((category) => ({
        url: worksUrl(`/manufacturers/${category.category.slug}`),
        lastModified: category.category.updated_at,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      })),
      ...providers.map((provider) => ({
        url: worksUrl(`/providers/${provider.slug}`),
        lastModified: provider.updated_at,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch (error) {
    console.error("WORKS sitemap could not load public provider profiles.", error);
    return STATIC_ROUTES;
  }
}
