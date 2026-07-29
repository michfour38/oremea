import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALL_LAUNCH_CATEGORIES = [
  "FOOD",
  "BEVERAGE",
  "SKINCARE",
  "PERSONAL_CARE",
  "SUPPLEMENTS",
] as const;

const services = [
  {
    key: "PRODUCT_DEVELOPMENT",
    slug: "product-development",
    name: "Product development",
    description: "Moves a product from concept toward a production-ready specification.",
    categories: ALL_LAUNCH_CATEGORIES,
  },
  {
    key: "FORMULATION",
    slug: "formulation",
    name: "Formulation",
    description: "Develops or refines a recipe, formula or product composition.",
    categories: ALL_LAUNCH_CATEGORIES,
  },
  {
    key: "PROTOTYPING",
    slug: "prototyping",
    name: "Prototyping and samples",
    description: "Creates samples, prototypes or pilot versions before commercial production.",
    categories: ALL_LAUNCH_CATEGORIES,
  },
  {
    key: "TESTING",
    slug: "testing",
    name: "Testing and analysis",
    description: "Tests product quality, safety, stability, composition or shelf life.",
    categories: ALL_LAUNCH_CATEGORIES,
  },
  {
    key: "REGULATORY_SUPPORT",
    slug: "regulatory-support",
    name: "Regulatory support",
    description: "Helps identify and satisfy product, label and market compliance requirements.",
    categories: ALL_LAUNCH_CATEGORIES,
  },
  {
    key: "RAW_MATERIAL_SOURCING",
    slug: "raw-material-sourcing",
    name: "Raw-material sourcing",
    description: "Sources ingredients, components or production inputs needed to make the product.",
    categories: ALL_LAUNCH_CATEGORIES,
  },
  {
    key: "PACKAGING_SUPPLY",
    slug: "packaging-supply",
    name: "Packaging supply",
    description: "Supplies bottles, jars, pouches, cartons and other empty packaging components needed before filling or packing.",
    categories: ALL_LAUNCH_CATEGORIES,
  },
  {
    key: "MANUFACTURING",
    slug: "manufacturing",
    name: "Manufacturing",
    description: "Produces the product at commercial or pilot production scale.",
    categories: ALL_LAUNCH_CATEGORIES,
  },
  {
    key: "PACKAGING",
    slug: "packaging",
    name: "Packaging and filling",
    description: "Fills or packs the finished product into its production-ready container or format.",
    categories: ALL_LAUNCH_CATEGORIES,
  },
  {
    key: "LABELLING",
    slug: "labelling",
    name: "Labelling",
    description: "Applies or prepares product labels and production identification.",
    categories: ALL_LAUNCH_CATEGORIES,
  },
  {
    key: "PRINTING",
    slug: "printing",
    name: "Printing",
    description: "Produces labels, cartons, sleeves and other printed production materials.",
    categories: ALL_LAUNCH_CATEGORIES,
  },
  {
    key: "WAREHOUSING",
    slug: "warehousing",
    name: "Warehousing",
    description: "Stores finished products, packaging or production inputs.",
    categories: ALL_LAUNCH_CATEGORIES,
  },
  {
    key: "FULFILMENT",
    slug: "fulfilment",
    name: "Fulfilment",
    description: "Picks, packs and dispatches finished customer orders.",
    categories: ALL_LAUNCH_CATEGORIES,
  },
  {
    key: "LOGISTICS",
    slug: "logistics",
    name: "Logistics",
    description: "Moves materials, packaging or finished products between production locations.",
    categories: ALL_LAUNCH_CATEGORIES,
  },
  {
    key: "EXPORT_PREPARATION",
    slug: "export-preparation",
    name: "Export preparation",
    description: "Prepares products and documentation for cross-border supply.",
    categories: ALL_LAUNCH_CATEGORIES,
  },
] as const;

export async function seedWorksServices() {
  const locale = await prisma.works_locales.findFirstOrThrow({
    where: {
      code: "en-ZA",
      market: { code: "ZA" },
    },
    select: { id: true },
  });

  const categories = await prisma.works_categories.findMany({
    where: { key: { in: [...ALL_LAUNCH_CATEGORIES] } },
    select: { id: true, key: true },
  });

  const categoryIds = new Map(categories.map((category) => [category.key, category.id]));

  for (const [index, definition] of services.entries()) {
    const service = await prisma.works_services.upsert({
      where: { key: definition.key },
      update: {
        slug: definition.slug,
        sort_order: index + 1,
        active: true,
      },
      create: {
        key: definition.key,
        slug: definition.slug,
        sort_order: index + 1,
        active: true,
      },
      select: { id: true },
    });

    await prisma.works_service_translations.upsert({
      where: {
        service_id_locale_id: {
          service_id: service.id,
          locale_id: locale.id,
        },
      },
      update: {
        name: definition.name,
        description: definition.description,
      },
      create: {
        service_id: service.id,
        locale_id: locale.id,
        name: definition.name,
        description: definition.description,
      },
    });

    for (const categoryKey of definition.categories) {
      const categoryId = categoryIds.get(categoryKey);
      if (!categoryId) {
        throw new Error(`Missing WORKS category ${categoryKey} while seeding services.`);
      }

      await prisma.works_service_categories.upsert({
        where: {
          service_id_category_id: {
            service_id: service.id,
            category_id: categoryId,
          },
        },
        update: {},
        create: {
          service_id: service.id,
          category_id: categoryId,
        },
      });
    }
  }
}
