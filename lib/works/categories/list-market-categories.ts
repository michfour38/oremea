import { prisma } from "@/lib/prisma";

export type WorksMarketCategory = {
  key: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

export async function listMarketCategories(
  marketSlug: string,
  localeCode?: string
): Promise<WorksMarketCategory[]> {
  const market = await prisma.works_markets.findUnique({
    where: { slug: marketSlug.toLowerCase() },
    select: {
      id: true,
      active: true,
      default_locale: true,
    },
  });

  if (!market?.active) return [];

  const requestedLocale = localeCode ?? market.default_locale;
  const localeCodes = Array.from(
    new Set([requestedLocale, market.default_locale])
  );

  const records = await prisma.works_market_categories.findMany({
    where: {
      market_id: market.id,
      enabled: true,
      category: { active: true },
    },
    orderBy: { sort_order: "asc" },
    select: {
      sort_order: true,
      category: {
        select: {
          key: true,
          slug: true,
          translations: {
            where: {
              locale: {
                market_id: market.id,
                code: { in: localeCodes },
                active: true,
              },
            },
            select: {
              name: true,
              description: true,
              locale: { select: { code: true } },
            },
          },
        },
      },
    },
  });

  return records.flatMap((record) => {
    const requested = record.category.translations.find(
      (translation) => translation.locale.code === requestedLocale
    );
    const fallback = record.category.translations.find(
      (translation) => translation.locale.code === market.default_locale
    );
    const translation = requested ?? fallback;

    if (!translation) return [];

    return [
      {
        key: record.category.key,
        slug: record.category.slug,
        name: translation.name,
        description: translation.description,
        sortOrder: record.sort_order,
      },
    ];
  });
}
