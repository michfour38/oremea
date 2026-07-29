import { seedWorksProvider } from "../seed-provider";
import { zaLiquidFoodProviders } from "./liquid-food";
import { zaManufacturingProviders } from "./manufacturing";
import { applyWorksZaResearchCorrections } from "./research-corrections";
import { zaServiceProviders } from "./services";

export async function seedWorksZaProviders() {
  const providers = [
    ...zaManufacturingProviders,
    ...zaLiquidFoodProviders,
    ...zaServiceProviders,
  ];

  console.log(`Seeding ${providers.length} researched WORKS ZA providers...`);

  for (const provider of providers) {
    await seedWorksProvider(provider);
    console.log(`  ✓ ${provider.name}`);
  }

  await applyWorksZaResearchCorrections();
}
