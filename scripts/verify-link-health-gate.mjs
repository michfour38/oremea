// Regression: PR report-only mode may ignore an old live deployment's 404s,
// but it must NOT allow new broken source links to pass CI.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const fixture = join("src", "__oremea_link_health_gate_probe__.tsx");
assert.equal(existsSync(fixture), false, "Link-health probe must not overwrite a source file.");

try {
  writeFileSync(
    fixture,
    'export const BrokenLinkProbe = () => <a href="/__oremea_definitely_missing_route_8927">Probe</a>;\n',
  );

  const result = spawnSync(
    process.execPath,
    ["scripts/audit-link-health.mjs", "--report-only"],
    { encoding: "utf8", timeout: 30_000 },
  );

  assert.equal(
    result.status,
    1,
    "Missing local links must fail, even in report-only mode.",
  );
  assert.match(
    result.stderr,
    /Broken source references \(always blocking\):[\s\S]*__oremea_definitely_missing_route_8927/,
    "The failure must name the actual missing route.",
  );
  console.log("PR link-health gate correctly blocks newly broken local links.");
} finally {
  if (existsSync(fixture)) unlinkSync(fixture);
}
