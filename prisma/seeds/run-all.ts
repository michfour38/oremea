import { PrismaClient } from "@prisma/client";

import { seedWorks } from "./works/seed-works";
import { seedAllWorks } from "./works/seed-all";
import { seedAllResonance } from "./resonance-seed-lib";
import { verifyResonanceSeed } from "../scripts/resonance-verify-lib";

const prisma = new PrismaClient();

async function main() {
  await seedWorks();
  await seedAllWorks();
  await seedAllResonance(prisma);
  await verifyResonanceSeed(prisma);

  console.log("WORKS and verified Resonance content seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
