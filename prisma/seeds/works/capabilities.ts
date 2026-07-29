import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const capabilities = [
  ["REFORMULATION", "reformulation", "Reformulation", "Adjusts an existing formula or recipe for performance, compliance, cost or production.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["SAMPLE_PRODUCTION", "sample-production", "Sample production", "Produces samples or small pilot quantities before a commercial run.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["BLENDING", "blending", "Blending", "Combines ingredients or materials into a consistent blend.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["MIXING", "mixing", "Mixing", "Mixes ingredients or components as part of production.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["COOKING", "cooking", "Cooking", "Uses controlled cooking or heat processing during manufacture.", ["FOOD", "BEVERAGE"]],
  ["BAKING", "baking", "Baking", "Produces baked products at pilot or commercial scale.", ["FOOD"]],
  ["EXTRACTION", "extraction", "Extraction", "Extracts active, flavour, botanical or functional components from raw materials.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["FILLING", "filling", "Filling", "Fills a finished or bulk product into its final container.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["BOTTLING", "bottling", "Bottling", "Fills and closes products in bottles.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["CANNING", "canning", "Canning", "Fills and seals products in cans.", ["FOOD", "BEVERAGE"]],
  ["SACHET_FILLING", "sachet-filling", "Sachet filling", "Fills products into single-use or portion sachets.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["POUCH_PACKING", "pouch-packing", "Pouch packing", "Packs products into flexible pouches.", ["FOOD", "BEVERAGE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["ENCAPSULATION", "encapsulation", "Encapsulation", "Produces capsule-format products.", ["SUPPLEMENTS"]],
  ["TABLETING", "tableting", "Tableting", "Compresses formulations into tablet-format products.", ["SUPPLEMENTS"]],
  ["POWDER_BLENDING", "powder-blending", "Powder blending", "Blends dry powders to a production-ready specification.", ["FOOD", "BEVERAGE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["LABELLING", "labelling", "Label application", "Applies labels to finished product packaging.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["BARCODING", "barcoding", "Barcoding", "Creates or applies retail or logistics barcode information.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["BATCH_CODING", "batch-coding", "Batch coding", "Applies batch, lot, manufacture or expiry coding to products.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["STABILITY_TESTING", "stability-testing", "Stability testing", "Evaluates how a product changes over time under defined storage conditions.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["MICROBIOLOGICAL_TESTING", "microbiological-testing", "Microbiological testing", "Tests for relevant microorganisms and microbiological quality.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["SHELF_LIFE_TESTING", "shelf-life-testing", "Shelf-life testing", "Supports determination or validation of product shelf life.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["NUTRITIONAL_ANALYSIS", "nutritional-analysis", "Nutritional analysis", "Analyses nutritional composition for product development or labelling.", ["FOOD", "BEVERAGE", "SUPPLEMENTS"]],
  ["LABEL_COMPLIANCE", "label-compliance", "Label compliance", "Reviews label content against applicable product requirements.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["PACKAGING_DESIGN", "packaging-design", "Packaging design", "Designs packaging structures or production-ready packaging artwork.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["BRANDING", "branding", "Branding", "Develops visual brand assets used on the finished product.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["BARCODE_ASSISTANCE", "barcode-assistance", "Barcode assistance", "Helps obtain, structure or prepare barcode information for products.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["EXPORT_DOCUMENTATION", "export-documentation", "Export documentation", "Prepares or supports documentation needed for cross-border supply.", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
] as const;

export async function seedWorksCapabilities() {
  const locale = await prisma.works_locales.findFirstOrThrow({
    where: {
      code: "en-ZA",
      market: { code: "ZA" },
    },
    select: { id: true },
  });

  const categories = await prisma.works_categories.findMany({
    select: { id: true, key: true },
  });
  const categoryIds = new Map(categories.map((category) => [category.key, category.id]));

  for (const [index, definition] of capabilities.entries()) {
    const [key, slug, name, description, categoryKeys] = definition;

    const capability = await prisma.works_capabilities.upsert({
      where: { key },
      update: {
        slug,
        sort_order: index + 1,
        active: true,
      },
      create: {
        key,
        slug,
        sort_order: index + 1,
        active: true,
      },
      select: { id: true },
    });

    await prisma.works_capability_translations.upsert({
      where: {
        capability_id_locale_id: {
          capability_id: capability.id,
          locale_id: locale.id,
        },
      },
      update: { name, description },
      create: {
        capability_id: capability.id,
        locale_id: locale.id,
        name,
        description,
      },
    });

    for (const categoryKey of categoryKeys) {
      const categoryId = categoryIds.get(categoryKey);
      if (!categoryId) {
        throw new Error(`Missing WORKS category ${categoryKey} while seeding capabilities.`);
      }

      await prisma.works_capability_categories.upsert({
        where: {
          capability_id_category_id: {
            capability_id: capability.id,
            category_id: categoryId,
          },
        },
        update: {},
        create: {
          capability_id: capability.id,
          category_id: categoryId,
        },
      });
    }
  }
}
