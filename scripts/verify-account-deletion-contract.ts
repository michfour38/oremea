import assert from "node:assert/strict";
import fs from "node:fs";

const service = fs.readFileSync("lib/auth/account-deletion.ts", "utf8");
const extraGuards = fs.readFileSync(
  "lib/auth/account-deletion-extra-guards.ts",
  "utf8",
);
const actions = fs.readFileSync("app/admin/account-access/actions.ts", "utf8");
const route = fs.readFileSync("app/api/admin/account-delete/route.ts", "utf8");
const form = fs.readFileSync("components/admin/delete-account-form.tsx", "utf8");
const adminPage = fs.readFileSync("app/admin/page.tsx", "utf8");

assert.match(
  service,
  /getAccountDeletionPreflight[\s\S]*paidVisitOrders[\s\S]*paidResonanceRuns[\s\S]*whopEntitlements/,
  "Account deletion must preflight paid/provider-backed history.",
);
assert.match(
  service,
  /sharedHarmonizeOwned[\s\S]*sharedHarmonizeParticipation/,
  "Core preflight must protect shared Harmonize records.",
);
assert.match(
  extraGuards,
  /harmonize_systems\.count[\s\S]*harmonize_participants\.count[\s\S]*harmonize_invites\.count[\s\S]*Harmonize history\/invitations/,
  "The first release must block deletion whenever Harmonize identity or email evidence exists.",
);
assert.match(
  extraGuards,
  /oremea_party_registrations\.count[\s\S]*event\/party history/,
  "Email-only Oremea event history must block a claim of complete account reset.",
);
assert.match(
  service,
  /circlePosts[\s\S]*circleMemberships[\s\S]*reports/,
  "Account deletion must protect shared community/cohort/reporting records.",
);
assert.match(
  service,
  /sharedPromptCompletions[\s\S]*externalPromptAnalyses[\s\S]*externalPromptReactions/,
  "Account deletion must protect Resonance material involving another participant.",
);
assert.match(
  service,
  /oremea_eternal_key_invites\.deleteMany[\s\S]*oremea_eternal_key_issuances\.deleteMany/,
  "A true fresh-start deletion must remove Golden Key invite and issuance identity anchors.",
);
assert.match(
  service,
  /oremea_entitlements\.deleteMany/,
  "A true fresh-start deletion must remove Oremea entitlements.",
);
assert.match(
  service,
  /account_security\.deleteMany[\s\S]*profiles\.deleteMany/,
  "Account security state and the Oremea profile must be removed during the Oremea purge.",
);
assert.doesNotMatch(
  service,
  /clerkClient|deleteUser/,
  "The Oremea purge service must not own Clerk deletion; Clerk is a final separate step.",
);

assert.match(
  actions,
  /reviewAccountDeletionAction[\s\S]*isOremeaAdmin[\s\S]*hasOremeaOwnerAccess/,
  "Deletion review must refuse owner/admin identities.",
);
assert.match(
  actions,
  /verifiedEmails\.length !== 1/,
  "Deletion review must refuse ambiguous multi-email identities in the first release.",
);
assert.match(
  actions,
  /getAccountDeletionPreflight[\s\S]*getAccountDeletionExtraBlockers\(\{ userId: user\.id, email \}\)/,
  "The admin review must include user-id and email-only preflight guards.",
);
assert.match(
  actions,
  /canDelete: preflight\.canDelete && extraBlockers\.length === 0/,
  "Any extra identity anchor must keep the review from becoming deletable.",
);

assert.match(
  route,
  /requestOrigin[\s\S]*expectedOrigin/,
  "The destructive endpoint must reject cross-origin requests.",
);
assert.match(
  route,
  /requireAdminAction/,
  "The destructive endpoint must require current Oremea admin authority.",
);
assert.match(
  route,
  /confirmation !== `DELETE \$\{email\}`/,
  "The destructive endpoint must require an exact typed email confirmation.",
);
assert.match(
  route,
  /data\.length !== 1 \|\| data\[0\]\.id !== reviewedUserId/,
  "The destructive endpoint must bind execution to the exact identity reviewed by the admin.",
);
assert.match(
  route,
  /isOremeaAdmin\(target\.id\)[\s\S]*hasOremeaOwnerAccess\(target\.id\)/,
  "Owner/admin protection must be rechecked at execution time.",
);
assert.match(
  route,
  /getAccountDeletionPreflight[\s\S]*getAccountDeletionExtraBlockers\(\{ userId: target\.id, email \}\)[\s\S]*extraBlockers\.length > 0/,
  "All paid/shared/Harmonize/email-only blockers must be rechecked immediately before deletion.",
);
assert.match(
  route,
  /deleteOremeaAccountState[\s\S]*client\.users\.deleteUser/,
  "Oremea participant state must be deleted before the Clerk identity.",
);
assert.match(
  route,
  /partial: true/,
  "Clerk-final failure must be reported as partial instead of false success.",
);

assert.match(
  form,
  /Review deletion[\s\S]*review\.confirmationText[\s\S]*Delete account completely/,
  "The admin UI must separate review from irreversible confirmation.",
);
assert.match(
  form,
  /router\.refresh\(\)/,
  "A successful deletion must refresh the admin state so removed identities do not remain visibly stale.",
);
assert.match(
  form,
  /Paid records and shared participant data block deletion/,
  "The destructive UI must communicate the retained/shared-data boundary.",
);
assert.match(
  adminPage,
  /Danger zone[\s\S]*<DeleteAccountForm \/>/,
  "Delete account must live in the canonical Oremea admin page danger zone.",
);

console.log("Guarded account deletion contract checks passed.");
