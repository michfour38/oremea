import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const formats = [
  ["BOTTLE", "bottle", "Bottle", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["JAR", "jar", "Jar", ["FOOD", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["TUBE", "tube", "Tube", ["SKINCARE", "PERSONAL_CARE"]],
  ["SACHET", "sachet", "Sachet", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["POUCH", "pouch", "Pouch", ["FOOD", "BEVERAGE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["CAN", "can", "Can", ["FOOD", "BEVERAGE"]],
  ["TIN", "tin", "Tin", ["FOOD", "SKINCARE", "PERSONAL_CARE"]],
  ["BOX", "box", "Box", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["TUB", "tub", "Tub", ["FOOD", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["CAPSULE", "capsule", "Capsule", ["SUPPLEMENTS"]],
  ["BLISTER_PACK", "blister-pack", "Blister pack", ["SUPPLEMENTS"]],
  ["DROPPER", "dropper", "Dropper", ["SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
  ["PUMP", "pump", "Pump", ["SKINCARE", "PERSONAL_CARE"]],
  ["SPRAY", "spray", "Spray", ["SKINCARE", "PERSONAL_CARE"]],
  ["OTHER", "other", "Other packaging format", ["FOOD", "BEVERAGE", "SKINCARE", "PERSONAL_CARE", "SUPPLEMENTS"]],
] as const;

export async function seedWorksPackagingFormats() {
  const locale = await prisma.works_locales.findFirstOrThrow({
    where: { code: "en-ZA", market: { code: "ZA" } },
    select: { id: true },
  });

  const categories = await prisma.works_categories.findMany({
    select: { id: true, key: true },
  });
  const categoryByKey = new Map(categories.map((row) => [row.key, row.id]));

  for (const [index, [key, slug, name, categoryKeys]] of formats.entries()) {
    const format = await prisma.works_packaging_formats.upsert({
      where: { key },
      update: { slug, sort_order: index + 1, active: true },
      create: { key, slug, sort_order: index + 1, active: true },
      select: { id: true },
    });

    await prisma.works_packaging_format_translations.upsert({
      where: {
        packaging_format_id_locale_id: {
          packaging_format_id: format.id,
          locale_id: locale.id,
        },
      },
      update: { name },
      create: { packaging_format_id: format.id, locale_id: locale.id, name },
    });

    for (const categoryKey of categoryKeys) {
      const categoryId = categoryByKey.get(categoryKey);
      if (!categoryId) continue;

      await prisma.works_packaging_format_categories.upsert({
        where: {
          packaging_format_id_category_id: {
            packaging_format_id: format.id,
            category_id: categoryId,
          },
        },
        update: {},
        create: { packaging_format_id: format.id, category_id: categoryId },
      });
    }
  }
}
