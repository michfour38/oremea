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
  /const MIGRATION_SCHEMA_PATH = "prisma\/schema\.prisma"/,
  "Production migrate deploy must use prisma/schema.prisma so Prisma can locate prisma/migrations.",
);
assert.match(
  deploy,
  /"migrate", "deploy"/,
  "The production wrapper must use Prisma migrate deploy.",
);
assert.match(
  deploy,
  /P1002/,
  "The wrapper must recognize Prisma's transient advisory-lock timeout class.",
);
assert.match(
  deploy,
  /advisory lock/i,
  "The wrapper must restrict retry handling to advisory-lock contention.",
);
assert.match(
  deploy,
  /MAX_ATTEMPTS = 4/,
  "Advisory-lock retries must be bounded.",
);
assert.match(
  deploy,
  /LOCK_RETRY_DELAY_MS = 3_000/,
  "Advisory-lock retries must wait before retrying.",
);
assert.doesNotMatch(
  deploy,
  /migrate[\s\S]*resolve|--applied|20260810132000_add_recognition_conversation/,
  "The completed one-off Recognition migration repair must not remain in permanent deployment infrastructure.",
);
assert.doesNotMatch(
  deploy,
  /\$queryRawUnsafe|_prisma_migrations/,
  "The permanent migration runner must not inspect or mutate Prisma migration history directly.",
);
assert.doesNotMatch(
  deploy,
  /PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK/,
  "Production must keep Prisma advisory locking enabled.",
);

console.log("Production migration deployment contract checks passed.");
