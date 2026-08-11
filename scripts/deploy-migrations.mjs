import { spawnSync } from "node:child_process";

const MIGRATION_SCHEMA_PATH = "prisma/schema.prisma";
const MAX_ATTEMPTS = 4;
const LOCK_RETRY_DELAY_MS = 3_000;

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function runDeployAttempt() {
  const result = spawnSync(
    "prisma",
    ["migrate", "deploy", `--schema=${MIGRATION_SCHEMA_PATH}`],
    {
      encoding: "utf8",
      env: process.env,
      shell: process.platform === "win32",
    },
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;

  return {
    status: result.status,
    output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
  };
}

function isAdvisoryLockTimeout(output) {
  return /P1002/i.test(output) && /advisory lock/i.test(output);
}

function main() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    console.log(
      `[migration-deploy] Running Prisma production migrations (attempt ${attempt}/${MAX_ATTEMPTS}).`,
    );

    const result = runDeployAttempt();
    if (result.status === 0) {
      console.log("[migration-deploy] Production migrations complete.");
      return;
    }

    const canRetry =
      attempt < MAX_ATTEMPTS && isAdvisoryLockTimeout(result.output);

    if (!canRetry) {
      throw new Error(
        `prisma migrate deploy exited with status ${result.status ?? "unknown"}`,
      );
    }

    console.warn(
      `[migration-deploy] Prisma advisory lock is busy; retrying in ${LOCK_RETRY_DELAY_MS / 1000}s.`,
    );
    sleep(LOCK_RETRY_DELAY_MS);
  }
}

try {
  main();
} catch (error) {
  console.error(
    `[migration-deploy] ${error instanceof Error ? error.message : "Migration deployment failed."}`,
  );
  process.exitCode = 1;
}
