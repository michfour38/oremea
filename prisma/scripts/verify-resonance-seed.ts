import { PrismaClient } from "@prisma/client";

import { verifyResonanceSeed } from "./resonance-verify-lib";

const prisma = new PrismaClient();

async function main() {
  const result = await verifyResonanceSeed(prisma);

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
