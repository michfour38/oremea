import { seedWorksLocales } from "./locales";
import { seedWorksMarkets } from "./markets";

export async function seedWorks() {
  console.log("Running WORKS seeds...");
  await seedWorksMarkets();
  await seedWorksLocales();
  console.log("Done: WORKS seeds");
}
