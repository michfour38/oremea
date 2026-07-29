import { seedWorksCapabilities } from "./capabilities";
import { seedWorksCategories } from "./categories";
import { seedWorksCredentialAuthorities } from "./credential-authorities";
import { seedWorksLocales } from "./locales";
import { seedWorksMarkets } from "./markets";
import { seedWorksPackagingFormats } from "./packaging-formats";
import { seedWorksProviderTypes } from "./provider-types";
import { seedWorksServices } from "./services";

export async function seedWorks() {
  console.log("Running WORKS seeds...");
  await seedWorksMarkets();
  await seedWorksLocales();
  await seedWorksCategories();
  await seedWorksProviderTypes();
  await seedWorksCredentialAuthorities();
  await seedWorksServices();
  await seedWorksCapabilities();
  await seedWorksPackagingFormats();
  console.log("Done: WORKS seeds");
}
