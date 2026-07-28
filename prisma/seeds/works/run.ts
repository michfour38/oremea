import { seedWorksMarkets } from "./markets";

export async function seedWorks() {
  console.log("Running WORKS seeds...");
  await seedWorksMarkets();
  console.log("Done: WORKS seeds");
}
