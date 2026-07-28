import { PrismaClient, WorksMarketLaunchStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedWorksMarkets() {
  await prisma.works_markets.upsert({
    where: { code: "ZA" },
    update: {
      slug: "za",
      name: "South Africa",
      local_name: "South Africa",
      default_locale: "en-ZA",
      currency_code: "ZAR",
      currency_symbol: "R",
      calling_code: "+27",
      active: true,
      launch_status: WorksMarketLaunchStatus.SEEDING,
    },
    create: {
      code: "ZA",
      slug: "za",
      name: "South Africa",
      local_name: "South Africa",
      default_locale: "en-ZA",
      currency_code: "ZAR",
      currency_symbol: "R",
      calling_code: "+27",
      active: true,
      launch_status: WorksMarketLaunchStatus.SEEDING,
    },
  });
}
