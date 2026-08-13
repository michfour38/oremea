import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const SUPERSEDED_ROOT = "superseded";
const ACTIVE_SCAN_ROOTS = ["app", "components", "config", "lib", "src"];
const ACTIVE_ROOT_FILES = ["middleware.ts", "next.config.js"];
const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
]);

function collectSourceFiles(path: string): string[] {
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) {
    return SOURCE_EXTENSIONS.has(extname(path)) ? [path] : [];
  }

  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory()
      ? collectSourceFiles(child)
      : SOURCE_EXTENSIONS.has(extname(entry.name))
        ? [child]
        : [];
  });
}

assert.ok(
  existsSync(`${SUPERSEDED_ROOT}/README.md`) &&
    existsSync(`${SUPERSEDED_ROOT}/recognition/README.md`),
  "Superseded work must have an explicit non-runtime boundary and product note.",
);

const executableSupersededFiles = collectSourceFiles(SUPERSEDED_ROOT);
assert.deepEqual(
  executableSupersededFiles,
  [],
  "Superseded snapshots must be documentation/text only, never executable source.",
);

const activeFiles = [
  ...ACTIVE_SCAN_ROOTS.flatMap(collectSourceFiles),
  ...ACTIVE_ROOT_FILES.filter((path) => existsSync(path)),
];

for (const path of activeFiles) {
  const source = readFileSync(path, "utf8");
  assert.doesNotMatch(
    source,
    /(?:from\s+["'][^"']*superseded(?:\/|["'])|import\s*\([^)]*superseded)/i,
    `${path} must not import implementation code from superseded work.`,
  );
}

const middlewareSource = readFileSync("middleware.ts", "utf8");
assert.match(
  middlewareSource,
  /pathname === "\/begin"[\s\S]*rewriteRecognitionPath\(req, "\/recognition"\)/,
  "Recognition checks must trace the current /begin host route to /recognition before editing UI code.",
);

const pageSource = readFileSync("app/recognition/page.tsx", "utf8");
assert.match(
  pageSource,
  /from "\.\/recognition-chat"/,
  "The current Recognition page must explicitly render the active Recognition chat component.",
);

const chatSource = readFileSync("app/recognition/recognition-chat.tsx", "utf8");
assert.doesNotMatch(
  chatSource,
  /Enter to send|Shift\s*\+\s*Enter\s+for\s+a\s+new\s+line/i,
  "Superseded Enter-to-send helper copy must never return to the active Recognition composer.",
);
assert.match(
  chatSource,
  />\s*Reflect\s*</,
  "The active Recognition composer must use Reflect as its primary action.",
);
assert.equal(
  (chatSource.match(/<RecognitionDots\s*\/>/g) ?? []).length,
  1,
  "Recognition must show the animated response indicator in one human-facing location only.",
);

console.log("Superseded source boundary checks passed.");
