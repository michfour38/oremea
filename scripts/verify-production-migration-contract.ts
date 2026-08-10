import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const deploy = readFileSync("scripts/deploy-migrations.mjs", "utf8");
const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts?: Record<string, string>;
};

assert.equal(
  packageJson.scripts?.["db:migrate:deploy"],
  "node scripts/deploy-migrations.mjs",
  "Production migrations must run through the guarded deployment wrapper.",
);

assert.match(
  deploy,
  /20260810132000_add_recognition_conversation/,
  "The wrapper must name the one verified failed Recognition migration explicitly.",
);
assert.match(
  deploy,
  /recognition_threads/,
  "The wrapper must verify the Recognition thread table before reconciling history.",
);
assert.match(
  deploy,
  /recognition_messages_thread_id_client_message_id_key/,
  "The wrapper must verify the Recognition idempotency index before reconciling history.",
);
assert.match(
  deploy,
  /recognition_messages_thread_id_fkey/,
  "The wrapper must verify the Recognition foreign key before reconciling history.",
);
assert.match(
  deploy,
  /already exists\|42P07/,
  "The wrapper must only recognize the diagnosed already-exists failure class.",
);
assert.match(
  deploy,
  /"resolve"[\s\S]*"--applied"/,
  "The wrapper must use Prisma migrate resolve --applied rather than direct migration-history SQL.",
);
assert.match(
  deploy,
  /"deploy"[\s\S]*`--schema=\$\{SCHEMA_PATH\}`/,
  "The wrapper must continue with normal Prisma migrate deploy after reconciliation.",
);
assert.match(
  deploy,
  /const SCHEMA_PATH = "prisma"/,
  "Production migrations must point at the complete multi-file Prisma schema directory.",
);
assert.doesNotMatch(
  deploy,
  /UPDATE\s+"?_prisma_migrations|DELETE\s+FROM\s+"?_prisma_migrations/i,
  "The wrapper must not mutate Prisma migration history with direct SQL.",
);

console.log("Production migration repair contract checks passed.");
