import { prisma } from "@/lib/prisma";

type SupplyOption = {
  key: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

export type WorksSupplyOptions = {
  services: SupplyOption[];
  capabilities: SupplyOption[];
};

export async function listSupplyOptions(
  marketSlug: string,
  categoryKey: string,
  localeCode?: string
): Promise<WorksSupplyOptions> {
  const market = await prisma.works_markets.findUnique({
    where: { slug: marketSlug.toLowerCase() },
    select: {
      id: true,
      active: true,
      default_locale: true,
    },
  });

  if (!market?.active) {
    return { services: [], capabilities: [] };
  }

  const marketCategory = await prisma.works_market_categories.findFirst({
    where: {
      market_id: market.id,
      enabled: true,
      category: {
        key: categoryKey.toUpperCase(),
        active: true,
      },
    },
    select: { category_id: true },
  });

  if (!marketCategory) {
    return { services: [], capabilities: [] };
  }

  const requestedLocale = localeCode ?? market.default_locale;
  const localeCodes = Array.from(
    new Set([requestedLocale, market.default_locale])
  );

  const [serviceRecords, capabilityRecords] = await Promise.all([
    prisma.works_services.findMany({
      where: {
        active: true,
        categories: {
          some: { category_id: marketCategory.category_id },
        },
      },
      orderBy: { sort_order: "asc" },
      select: {
        key: true,
        slug: true,
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
    }),
    prisma.works_capabilities.findMany({
      where: {
        active: true,
        categories: {
          some: { category_id: marketCategory.category_id },
        },
      },
      orderBy: { sort_order: "asc" },
      select: {
        key: true,
        slug: true,
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
    }),
  ]);

  const localize = <T extends {
    key: string;
    slug: string;
    sort_order: number;
    translations: Array<{
      name: string;
      description: string | null;
      locale: { code: string };
    }>;
  }>(records: T[]): SupplyOption[] =>
    records.flatMap((record) => {
      const requested = record.translations.find(
        (translation) => translation.locale.code === requestedLocale
      );
      const fallback = record.translations.find(
        (translation) => translation.locale.code === market.default_locale
      );
      const translation = requested ?? fallback;

      if (!translation) return [];

      return [{
        key: record.key,
        slug: record.slug,
        name: translation.name,
        description: translation.description,
        sortOrder: record.sort_order,
      }];
    });

  return {
    services: localize(serviceRecords),
    capabilities: localize(capabilityRecords),
  };
}
