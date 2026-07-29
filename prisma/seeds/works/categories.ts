import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const launchCategories = [
  {
    key: "FOOD",
    slug: "food",
    name: "Food",
    description:
      "Food products including sauces, condiments, snacks, baked goods, dry mixes and prepared foods.",
  },
  {
    key: "BEVERAGE",
    slug: "beverage",
    name: "Beverage",
    description:
      "Drinks and drink products including juices, soft drinks, functional beverages, water, tea, coffee and powdered drinks.",
  },
  {
    key: "SKINCARE",
    slug: "skincare",
    name: "Skincare",
    description:
      "Skin-focused products including creams, serums, oils, cleansers, masks, sunscreen and baby skincare.",
  },
  {
    key: "PERSONAL_CARE",
    slug: "personal-care",
    name: "Personal Care",
    description:
      "Personal care products including haircare, soap, body wash, deodorant, oral care, fragrance and grooming products.",
  },
  {
    key: "SUPPLEMENTS",
    slug: "supplements",
    name: "Supplements",
    description:
      "Supplement products including capsules, tablets, powders, protein, liquids, herbal products and sports nutrition.",
  },
] as const;

export async function seedWorksCategories() {
  const southAfrica = await prisma.works_markets.findUniqueOrThrow({
    where: { code: "ZA" },
    select: { id: true },
  });

  const englishSouthAfrica = await prisma.works_locales.findUniqueOrThrow({
    where: {
      market_id_code: {
        market_id: southAfrica.id,
        code: "en-ZA",
      },
    },
    select: { id: true },
  });

  for (const [index, definition] of launchCategories.entries()) {
    const category = await prisma.works_categories.upsert({
      where: { key: definition.key },
      update: {
        slug: definition.slug,
        active: true,
      },
      create: {
        key: definition.key,
        slug: definition.slug,
        active: true,
      },
      select: { id: true },
    });

    await prisma.works_category_translations.upsert({
      where: {
        category_id_locale_id: {
          category_id: category.id,
          locale_id: englishSouthAfrica.id,
        },
      },
      update: {
        name: definition.name,
        description: definition.description,
      },
      create: {
        category_id: category.id,
        locale_id: englishSouthAfrica.id,
        name: definition.name,
        description: definition.description,
      },
    });

    await prisma.works_market_categories.upsert({
      where: {
        market_id_category_id: {
          market_id: southAfrica.id,
          category_id: category.id,
        },
      },
      update: {
        enabled: true,
        sort_order: index + 1,
      },
      create: {
        market_id: southAfrica.id,
        category_id: category.id,
        enabled: true,
        sort_order: index + 1,
      },
    });
  }
}
