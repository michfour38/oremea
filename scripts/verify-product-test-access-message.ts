import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/internal/product-test/page.tsx", "utf8");

assert.match(page, /The page is working\. Access is not attached to this Clerk session yet\./);
assert.match(page, /email_not_verified/);
assert.match(page, /email_not_approved/);
assert.match(page, /recovery_failed/);
assert.match(page, /Signed-in email:/);
assert.match(page, /Retry access/);
assert.doesNotMatch(page, /notFound\(/);
assert.doesNotMatch(page, /michellefourie(?:38)?@gmail\.com/i);

console.log("Product test access diagnostics contract verified.");
