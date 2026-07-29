import { seedWorksCategories } from "./categories";
import { seedWorksCredentialAuthorities } from "./credential-authorities";
import { seedWorksLocales } from "./locales";
import { seedWorksMarkets } from "./markets";
import { seedWorksProviderTypes } from "./provider-types";

export async function seedWorks() {
  console.log("Running WORKS seeds...");
  await seedWorksMarkets();
  await seedWorksLocales();
  await seedWorksCategories();
  await seedWorksProviderTypes();
  await seedWorksCredentialAuthorities();
  console.log("Done: WORKS seeds");
}
