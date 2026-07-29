import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const providerTypes = [
  {
    key: "MANUFACTURER",
    name: "Manufacturer",
    description: "Produces products commercially at an agreed production scale.",
  },
  {
    key: "CO_PACKER",
    name: "Co-packer",
    description: "Fills, packs, labels or finishes products for another business.",
  },
  {
    key: "FORMULATOR",
    name: "Formulator",
    description: "Develops or refines a product formula, recipe or composition.",
  },
  {
    key: "PRODUCT_DEVELOPER",
    name: "Product developer",
    description: "Helps move a product from concept through development toward commercial production.",
  },
  {
    key: "LABORATORY",
    name: "Laboratory",
    description: "Performs testing, analysis or other laboratory services relevant to a product.",
  },
  {
    key: "PACKAGING_SUPPLIER",
    name: "Packaging supplier",
    description: "Supplies packaging materials, components or production-ready packaging formats.",
  },
  {
    key: "RAW_MATERIAL_SUPPLIER",
    name: "Raw-material supplier",
    description: "Supplies ingredients, materials or components used to make a product.",
  },
  {
    key: "REGULATORY_CONSULTANT",
    name: "Regulatory consultant",
    description: "Helps determine and meet the regulatory requirements that apply to a product.",
  },
  {
    key: "FOOD_TECHNOLOGIST",
    name: "Food technologist",
    description: "Applies food science to product development, processing, safety and commercialisation.",
  },
  {
    key: "COSMETIC_CHEMIST",
    name: "Cosmetic chemist",
    description: "Develops and evaluates cosmetic or personal-care formulations.",
  },
  {
    key: "PRINTER",
    name: "Printer",
    description: "Produces labels, cartons, sleeves or other printed production materials.",
  },
  {
    key: "LOGISTICS_PROVIDER",
    name: "Logistics provider",
    description: "Moves products, materials or production inputs between locations.",
  },
  {
    key: "FULFILMENT_PROVIDER",
    name: "Fulfilment provider",
    description: "Stores, picks, packs and dispatches finished customer orders.",
  },
  {
    key: "DESIGNER",
    name: "Designer",
    description: "Creates production-ready brand, label, packaging or product design work.",
  },
  {
    key: "SOURCING_CONSULTANT",
    name: "Sourcing consultant",
    description: "Finds and evaluates suitable suppliers, manufacturers or production inputs.",
  },
  {
    key: "OTHER",
    name: "Other production specialist",
    description: "Provides a production-related service that does not yet fit a standard WORKS type.",
  },
] as const;

export async function seedWorksProviderTypes() {
  const locale = await prisma.works_locales.findFirstOrThrow({
    where: {
      code: "en-ZA",
      market: { code: "ZA" },
    },
    select: { id: true },
  });

  for (const [index, definition] of providerTypes.entries()) {
    const providerType = await prisma.works_provider_types.upsert({
      where: { key: definition.key },
      update: {
        sort_order: index + 1,
        active: true,
      },
      create: {
        key: definition.key,
        sort_order: index + 1,
        active: true,
      },
      select: { id: true },
    });

    await prisma.works_provider_type_translations.upsert({
      where: {
        provider_type_id_locale_id: {
          provider_type_id: providerType.id,
          locale_id: locale.id,
        },
      },
      update: {
        name: definition.name,
        description: definition.description,
      },
      create: {
        provider_type_id: providerType.id,
        locale_id: locale.id,
        name: definition.name,
        description: definition.description,
      },
    });
  }
}
