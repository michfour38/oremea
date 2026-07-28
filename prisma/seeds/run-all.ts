import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

type SeedModule = Record<string, unknown>;

function getWeekNumber(fileName: string): number | null {
  const match = fileName.match(/^seed-week(\d+)\.ts$/);
  if (!match) return null;
  return Number(match[1]);
}

async function run() {
  const seedsDir = path.resolve(process.cwd(), "prisma", "seeds");

  // 1. Seed isolated WORKS foundation data first.
  const worksSeedPath = path.join(seedsDir, "works", "run.ts");
  const worksSeedUrl = pathToFileURL(worksSeedPath).href;
  const worksSeedMod = (await import(worksSeedUrl)) as SeedModule;

  const worksSeedEntries = Object.entries(worksSeedMod).filter(
    ([key, value]) => key.startsWith("seed") && typeof value === "function"
  ) as Array<[string, () => Promise<unknown>]>;

  for (const [exportName, seedFn] of worksSeedEntries) {
    console.log(`Running works/run.ts → ${exportName}...`);
    await seedFn();
    console.log(`Done: works/run.ts → ${exportName}`);
  }

  // 2. Run seed-rooms.ts.
  const seedRoomsPath = path.join(seedsDir, "seed-rooms.ts");
  const seedRoomsUrl = pathToFileURL(seedRoomsPath).href;
  const seedRoomsMod = (await import(seedRoomsUrl)) as SeedModule;

  const seedRoomsEntries = Object.entries(seedRoomsMod).filter(
    ([key, value]) => key.startsWith("seed") && typeof value === "function"
  ) as Array<[string, () => Promise<unknown>]>;

  for (const [exportName, seedFn] of seedRoomsEntries) {
    console.log(`Running seed-rooms.ts → ${exportName}...`);
    await seedFn();
    console.log(`Done: seed-rooms.ts → ${exportName}`);
  }

  // 3. Then run all week seed files in order.
  const entries = await fs.readdir(seedsDir, { withFileTypes: true });

  const seedFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => entry.name)
    .filter((fileName) => getWeekNumber(fileName) !== null)
    .sort((a, b) => {
      const weekA = getWeekNumber(a) ?? 0;
      const weekB = getWeekNumber(b) ?? 0;
      return weekA - weekB;
    });

  if (seedFiles.length === 0) {
    console.log("No matching seed files found in prisma/seeds");
    process.exit(0);
  }

  for (const fileName of seedFiles) {
    const fullPath = path.join(seedsDir, fileName);
    const moduleUrl = pathToFileURL(fullPath).href;
    const mod = (await import(moduleUrl)) as SeedModule;

    const seedEntries = Object.entries(mod).filter(
      ([key, value]) => key.startsWith("seed") && typeof value === "function"
    ) as Array<[string, () => Promise<unknown>]>;

    if (seedEntries.length === 0) {
      console.log(`Skipping ${fileName} (no exported seed function found)`);
      continue;
    }

    for (const [exportName, seedFn] of seedEntries) {
      console.log(`Running ${fileName} → ${exportName}...`);
      await seedFn();
      console.log(`Done: ${fileName} → ${exportName}`);
    }
  }

  console.log("All seeds completed.");
  process.exit(0);
}

run().catch((error) => {
  console.error("Seed runner failed:");
  console.error(error);
  process.exit(1);
});
