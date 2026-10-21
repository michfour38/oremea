import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Offline SQL renderer only. It never opens a database or reads connection secrets.
export function renderRuntimeGrants({ role, schema = "public", tables, sequences = [] }) {
  const identifier = (value) => {
    if (typeof value !== "string" || !/^[a-z_][a-z0-9_]{0,62}$/.test(value)) throw Error("Invalid SQL identifier");
    return `"${value}"`;
  };
  if (!/^oremea_[a-z0-9_]+_runtime_v\d+$/.test(role)) throw Error("Use a new versioned OREMEA runtime role");
  if (!Array.isArray(tables) || !tables.length || tables.length > 250) throw Error("Explicit table allowlist required");
  if (!Array.isArray(sequences)) throw Error("Invalid sequence allowlist");
  const roleName = identifier(role), schemaName = identifier(schema);
  const qualified = (name) => `${schemaName}.${identifier(name)}`;
  return [
    "-- REVIEW BEFORE APPLYING. New group role only; no password or connection changes.",
    "-- Existing PUBLIC/inherited grants and SECURITY DEFINER functions require separate review.",
    "-- CREATE ROLE deliberately fails if this role already exists. Never demote the source owner.",
    "BEGIN;",
    `CREATE ROLE ${roleName} NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;`,
    `GRANT USAGE ON SCHEMA ${schemaName} TO ${roleName};`,
    ...[...new Set(tables)].map((name) => `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ${qualified(name)} TO ${roleName};`),
    ...[...new Set(sequences)].map((name) => `GRANT USAGE, SELECT ON SEQUENCE ${qualified(name)} TO ${roleName};`),
    "COMMIT;",
    "-- Provision a separate LOGIN securely, grant membership, and verify effective privileges",
    "-- before switching one service. Keep migration/owner credentials separate.",
    "",
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 3 || process.argv[2] === "--help") {
    console.log("Offline renderer: node scripts/security/render-runtime-grants.mjs APPROVED-MANIFEST.json");
    console.log('Manifest: {"role":"oremea_recognition_runtime_v1","schema":"public","tables":["recognition_threads","recognition_messages"],"sequences":[]}');
  } else {
    try { process.stdout.write(renderRuntimeGrants(JSON.parse(readFileSync(process.argv[2], "utf8")))); }
    catch { console.error("Cannot render grants: check the explicit manifest and safe identifiers."); process.exitCode = 1; }
  }
}
