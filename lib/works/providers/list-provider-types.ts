import { prisma } from "@/lib/prisma";

export type WorksProviderTypeOption = {
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

export async function listProviderTypes(
  marketSlug: string,
  localeCode?: string
): Promise<WorksProviderTypeOption[]> {
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

  const records = await prisma.works_provider_types.findMany({
    where: { active: true },
    orderBy: { sort_order: "asc" },
    select: {
      key: true,
      sort_order: true,
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
  });

  return records.flatMap((record) => {
    const requested = record.translations.find(
      (translation) => translation.locale.code === requestedLocale
    );
    const fallback = record.translations.find(
      (translation) => translation.locale.code === market.default_locale
    );
    const translation = requested ?? fallback;

    if (!translation) return [];

    return [
      {
        key: record.key,
        name: translation.name,
        description: translation.description,
        sortOrder: record.sort_order,
      },
    ];
  });
}
