import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedWorksMarkets() {
  await prisma.$executeRawUnsafe(`
    INSERT INTO "works_markets" (
      "code",
      "slug",
      "name",
      "local_name",
      "default_locale",
      "currency_code",
      "currency_symbol",
      "calling_code",
      "active",
      "launch_status",
      "updated_at"
    )
    VALUES (
      'ZA',
      'za',
      'South Africa',
      'South Africa',
      'en-ZA',
      'ZAR',
      'R',
      '+27',
      true,
      'SEEDING'::"WorksMarketLaunchStatus",
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("code") DO UPDATE SET
      "slug" = EXCLUDED."slug",
      "name" = EXCLUDED."name",
      "local_name" = EXCLUDED."local_name",
      "default_locale" = EXCLUDED."default_locale",
      "currency_code" = EXCLUDED."currency_code",
      "currency_symbol" = EXCLUDED."currency_symbol",
      "calling_code" = EXCLUDED."calling_code",
      "active" = EXCLUDED."active",
      "launch_status" = EXCLUDED."launch_status",
      "updated_at" = CURRENT_TIMESTAMP;
  `);
}
