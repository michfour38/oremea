import { PrismaClient } from "@prisma/client";

import { seedAllResonance } from "./resonance-seed-lib";
import { verifyResonanceSeed } from "../scripts/resonance-verify-lib";

const prisma = new PrismaClient();

async function main() {
  await seedAllResonance(prisma);
  const result = await verifyResonanceSeed(prisma);

  console.log("");
  for (const summary of result.roomSummaries) console.log(summary);
  console.log("");
  console.log("RESONANCE SEED VERIFIED");
  console.log(`Expected prompts: ${result.expectedPromptCount}`);
  console.log(`Active prompts: ${result.activePromptCount}`);
  console.log("Missing: 0");
  console.log("Unexpected: 0");
  console.log("Mismatched: 0");
  console.log("Duplicate active orders: 0");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
