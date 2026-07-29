import { seedWorksProvider } from "../seed-provider";
import { zaManufacturingProviders } from "./manufacturing";
import { applyWorksZaResearchCorrections } from "./research-corrections";
import { zaServiceProviders } from "./services";

export async function seedWorksZaProviders() {
  const providers = [...zaManufacturingProviders, ...zaServiceProviders];

  console.log(`Seeding ${providers.length} researched WORKS ZA providers...`);

  for (const provider of providers) {
    await seedWorksProvider(provider);
    console.log(`  ✓ ${provider.name}`);
  }

  await applyWorksZaResearchCorrections();
}
