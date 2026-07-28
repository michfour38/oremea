import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedWorksLocales() {
  const southAfrica = await prisma.works_markets.findUniqueOrThrow({
    where: { code: "ZA" },
    select: { id: true },
  });

  await prisma.works_locales.upsert({
    where: {
      market_id_code: {
        market_id: southAfrica.id,
        code: "en-ZA",
      },
    },
    update: {
      language_code: "en",
      region_code: "ZA",
      name: "English (South Africa)",
      local_name: "English (South Africa)",
      is_default: true,
      active: true,
    },
    create: {
      market_id: southAfrica.id,
      code: "en-ZA",
      language_code: "en",
      region_code: "ZA",
      name: "English (South Africa)",
      local_name: "English (South Africa)",
      is_default: true,
      active: true,
    },
  });
}
