import { spawnSync } from "node:child_process";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const RECOGNITION_MIGRATION = "20260810132000_add_recognition_conversation";
// Prisma generate uses the multi-file schema directory, but migrate resolve/deploy
// must be anchored to the main schema file so Prisma locates prisma/migrations.
const MIGRATION_SCHEMA_PATH = "prisma/schema.prisma";

function fail(message) {
  console.error(`[migration-deploy] ${message}`);
  process.exitCode = 1;
}

function runPrisma(args) {
  const result = spawnSync("prisma", args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`prisma ${args.join(" ")} exited with status ${result.status}`);
  }
}

async function recognitionSchemaComplete() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      to_regclass('public.recognition_threads')::text AS "threads",
      to_regclass('public.recognition_messages')::text AS "messages",
      to_regclass('public.recognition_threads_user_id_key')::text AS "user_index",
      to_regclass('public.recognition_messages_thread_id_turn_index_key')::text AS "turn_index",
      to_regclass('public.recognition_messages_thread_id_client_message_id_key')::text AS "client_message_index",
      (
        SELECT conname
        FROM pg_constraint
        WHERE conname = 'recognition_messages_thread_id_fkey'
        LIMIT 1
      )::text AS "foreign_key"
  `);

  const row = rows[0];
  return Boolean(
    row?.threads &&
      row?.messages &&
      row?.user_index &&
      row?.turn_index &&
      row?.client_message_index &&
      row?.foreign_key,
  );
}

async function reconcileKnownRecognitionMigration() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      "finished_at",
      "rolled_back_at",
      "logs"
    FROM "_prisma_migrations"
    WHERE "migration_name" = '${RECOGNITION_MIGRATION}'
    ORDER BY "started_at" DESC
  `);

  const applied = rows.filter((row) => Boolean(row.finished_at));
  const unresolved = rows.filter(
    (row) => !row.finished_at && !row.rolled_back_at,
  );

  if (unresolved.length === 0) {
    return;
  }

  const schemaComplete = await recognitionSchemaComplete();
  const exactlyKnownFailure =
    applied.length === 0 &&
    unresolved.length === 1 &&
    /already exists|42P07/i.test(unresolved[0]?.logs ?? "") &&
    schemaComplete;

  if (!exactlyKnownFailure) {
    throw new Error(
      `Refusing automatic migration repair: ${RECOGNITION_MIGRATION} is unresolved but does not match the verified already-applied schema state.`,
    );
  }

  console.log(
    `[migration-deploy] Verified ${RECOGNITION_MIGRATION} already exists in the database; reconciling Prisma migration history.`,
  );

  runPrisma([
    "migrate",
    "resolve",
    "--applied",
    RECOGNITION_MIGRATION,
    `--schema=${MIGRATION_SCHEMA_PATH}`,
  ]);

  const after = await prisma.$queryRawUnsafe(`
    SELECT
      "finished_at",
      "rolled_back_at"
    FROM "_prisma_migrations"
    WHERE "migration_name" = '${RECOGNITION_MIGRATION}'
    ORDER BY "started_at" DESC
  `);

  const unresolvedAfter = after.filter(
    (row) => !row.finished_at && !row.rolled_back_at,
  );
  const appliedAfter = after.some((row) => Boolean(row.finished_at));

  if (!appliedAfter || unresolvedAfter.length > 0) {
    throw new Error(
      `Prisma did not leave ${RECOGNITION_MIGRATION} in a resolved applied state.`,
    );
  }
}

async function main() {
  try {
    await reconcileKnownRecognitionMigration();
    await prisma.$disconnect();

    console.log("[migration-deploy] Running normal Prisma production migrations.");
    runPrisma(["migrate", "deploy", `--schema=${MIGRATION_SCHEMA_PATH}`]);
  } catch (error) {
    await prisma.$disconnect().catch(() => undefined);
    fail(error instanceof Error ? error.message : "Migration deployment failed.");
  }
}

await main();
