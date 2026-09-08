import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const helperPath = path.join(root, "src/lib/testing/product-test-reset.ts");
const pagePath = path.join(root, "app/internal/product-test/page.tsx");
const recoveryPath = path.join(root, "src/lib/oremea/owner-recovery.ts");
const recognitionAccessPath = path.join(
  root,
  "src/lib/recognition/recognition-conversation-access.ts",
);
const compassAccessPath = path.join(root, "src/lib/compass/compass-access.ts");

const helper = fs.readFileSync(helperPath, "utf8");
const page = fs.readFileSync(pagePath, "utf8");
const recovery = fs.readFileSync(recoveryPath, "utf8");
const recognitionAccess = fs.readFileSync(recognitionAccessPath, "utf8");
const compassAccess = fs.readFileSync(compassAccessPath, "utf8");

assert.match(helper, /isRecognitionOwner\(userId\) \|\| isCompassOwner\(userId\)/);
assert.match(helper, /hasProductTestOwnerAccess/);
assert.match(helper, /getOremeaOwnerResetUserIds/);
assert.match(helper, /recognition_threads\.deleteMany/);
assert.match(helper, /compass_daily_goals\.deleteMany/);
assert.match(helper, /compass_sessions\.deleteMany/);
assert.match(helper, /current_invitations\.deleteMany/);
assert.match(helper, /current_qualifications\.deleteMany/);
assert.match(helper, /status: \"preserved\"/);
assert.match(helper, /purchase_source/);
assert.match(helper, /owner_test_reset/);
assert.match(helper, /DELETE FROM \"prompt_completions\"/);
assert.match(helper, /DELETE FROM \"resonance_day_guidance\"/);
assert.match(helper, /DELETE FROM \"journey_day_continues\"/);
assert.match(helper, /DELETE FROM \"mirror_responses\"/);

assert.doesNotMatch(helper, /oremea_entitlements\.(?:delete|deleteMany)/);
assert.doesNotMatch(helper, /profiles\.(?:delete|deleteMany)/);
assert.doesNotMatch(helper, /clerkClient|deleteUser|users\.delete/i);

const targetKeys = Array.from(
  helper.matchAll(/key: \"([^\"]+)\"/g),
  (match) => match[1],
);
assert.equal(targetKeys.length, 13, "The owner audit hub must expose exactly 13 product targets.");
assert.equal(
  targetKeys.filter((key) => key.startsWith("resonance-")).length,
  10,
  "The owner audit hub must include all ten Resonance rooms.",
);

assert.match(page, /index: false/);
assert.match(page, /follow: false/);
assert.match(page, /Your Clerk identity/);
assert.match(page, /Whop records, entitlements, purchase references/);
assert.match(page, /Transparency · Contrast · Curiosity/);
assert.match(page, /Reset & open/);
assert.match(page, /currentUser/);
assert.match(page, /verification\?\.status === \"verified\"/);
assert.match(page, /recoverOremeaOwnerAccess/);

assert.match(recovery, /OREMEA_OWNER_RECOVERY_PRODUCT_KEY/);
assert.match(recovery, /verifiedEmails/);
assert.match(recovery, /primary_email/);
assert.match(recovery, /isConfiguredOremeaOwnerUserId/);
assert.match(recovery, /verified_legacy_owner_email/);
assert.doesNotMatch(recovery, /michellefourie38@/i);
assert.doesNotMatch(recovery, /clerkClient|deleteUser|users\.delete/i);

assert.match(recognitionAccess, /hasOremeaOwnerAccess/);
assert.match(compassAccess, /hasOremeaOwnerAccess/);

console.log("Product test reset and owner recovery contracts verified.");
