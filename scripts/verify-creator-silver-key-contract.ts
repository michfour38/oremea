import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema = readFileSync("prisma/schema/creator-silver-key.prisma", "utf8");
const migration = readFileSync(
  "prisma/migrations/20261005153000_creator_silver_key/migration.sql",
  "utf8",
);
const service = readFileSync("lib/auth/creator-silver-key.ts", "utf8");
const invites = readFileSync("lib/auth/creator-silver-key-invites.ts", "utf8");
const recognitionAccess = readFileSync(
  "src/lib/recognition/recognition-conversation-access.ts",
  "utf8",
);
const recognitionPage = readFileSync("app/recognition/page.tsx", "utf8");
const compassAccess = readFileSync("src/lib/compass/compass-access.ts", "utf8");
const compassRoute = readFileSync("app/api/compass/access/route.ts", "utf8");
const memberNav = readFileSync("app/(member)/member-nav.tsx", "utf8");
const visitAccess = readFileSync("src/lib/resonance/visit-access.ts", "utf8");
const infoPack = readFileSync("app/key/silver/page.tsx", "utf8");
const claimPage = readFileSync("app/key/silver/claim/[token]/page.tsx", "utf8");
const claimAction = readFileSync("app/key/silver/claim/[token]/actions.ts", "utf8");
const adminAction = readFileSync("app/admin/account-access/actions.ts", "utf8");
const adminPage = readFileSync("app/admin/page.tsx", "utf8");
const adminForm = readFileSync(
  "components/admin/creator-silver-key-invite-form.tsx",
  "utf8",
);
const deletionGuard = readFileSync(
  "lib/auth/account-deletion-extra-guards.ts",
  "utf8",
);

assert.match(
  schema,
  /model oremea_creator_silver_key_issuances[\s\S]*recognition_activated_at[\s\S]*recognition_expires_at[\s\S]*compass_activated_at[\s\S]*compass_expires_at[\s\S]*resonance_order_id/,
  "Silver Key issuance must persist independent Recognition and Compass windows plus the Resonance grant reference.",
);
assert.match(
  schema,
  /model oremea_creator_silver_key_events[\s\S]*event_type[\s\S]*metadata/,
  "Silver Key must keep an append-only audit event model.",
);
assert.match(
  migration,
  /CREATE TABLE "oremea_creator_silver_key_issuances"[\s\S]*CREATE TABLE "oremea_creator_silver_key_invites"[\s\S]*CREATE TABLE "oremea_creator_silver_key_events"/,
  "Production migration must create issuance, invitation and audit tables.",
);
assert.match(
  migration,
  /ON DELETE RESTRICT/,
  "Invitation and audit history must not cascade away with the issuance.",
);

assert.match(
  service,
  /CREATOR_SILVER_KEY = "oremea:creator-silver-key"/,
  "Silver Key must use one canonical entitlement marker.",
);
assert.match(
  service,
  /CREATOR_SILVER_PRODUCT_DAYS = 30/,
  "Recognition and Compass Silver windows must remain 30 days.",
);
assert.match(
  service,
  /CREATOR_SILVER_RESONANCE_CREDITS = 3/,
  "Silver Key must remain a three-room Resonance grant.",
);
assert.match(
  service,
  /activateCreatorSilverProduct[\s\S]*hasCreatorSilverKey\(userId\)[\s\S]*eligible: false[\s\S]*hasEternalOremeaKey\(userId\)[\s\S]*getCreatorSilverProductAccess\(userId, product, now\)[\s\S]*return prisma\.\$transaction/,
  "Only a Silver holder without stronger Golden access may enter the timed Silver activation transaction.",
);
assert.match(
  service,
  /pg_advisory_xact_lock\(hashtext\(\$\{lockKey\}\)\)::text/,
  "Silver activation locks must cast PostgreSQL void results before Prisma deserializes them.",
);
assert.match(
  service,
  /product === "recognition"[\s\S]*recognition_activated_at[\s\S]*recognition_expires_at[\s\S]*compass_activated_at[\s\S]*compass_expires_at/,
  "Recognition and Compass must use separate activation fields.",
);
assert.match(
  service,
  /if \(existingActivatedAt && existingExpiresAt\)[\s\S]*return/,
  "Re-entry must never restart a Silver product clock.",
);
assert.match(
  service,
  /oremea_creator_silver_key_events\.create/,
  "Product activation must create a persistent audit event.",
);

assert.match(
  invites,
  /randomBytes\(32\)\.toString\("base64url"\)/,
  "Silver claim links must use cryptographically random bearer material.",
);
assert.match(
  invites,
  /createHash\("sha256"\)[\s\S]*token_hash: tokenHash/,
  "Only the Silver token hash may be persisted.",
);
assert.match(
  invites,
  /CREATOR_SILVER_INVITE_TTL_MS = 7 \* 24 \* 60 \* 60 \* 1000/,
  "Silver invitation links must expire after seven days.",
);
assert.match(
  invites,
  /verified\.has\(invite\.email_normalized\)/,
  "A forwarded Silver link must not be claimable by another verified email.",
);
assert.match(
  invites,
  /updateMany\([\s\S]*claimed_at: null[\s\S]*revoked_at: null[\s\S]*expires_at: \{ gt: now \}[\s\S]*consumed\.count !== 1/,
  "Silver claim must atomically consume exactly one live invitation.",
);
assert.match(
  invites,
  /kind: "creator_silver_key"[\s\S]*quantity: CREATOR_SILVER_RESONANCE_CREDITS[\s\S]*amount_cents: 0[\s\S]*remaining_quantity: CREATOR_SILVER_RESONANCE_CREDITS[\s\S]*status: "paid"/,
  "Silver claim must mint exactly three internal Resonance credits without a customer charge.",
);
assert.match(
  invites,
  /paid_at: null/,
  "The Resonance grant must not masquerade as a paid purchase.",
);
assert.doesNotMatch(
  invites,
  /whopApiRequest|createVisitCheckout|chargeVisitOrder|checkout|payment\.succeeded/,
  "Silver grant logic must remain outside provider checkout and payment machinery.",
);
assert.match(
  invites,
  /oremea_creator_silver_key_events\.createMany/,
  "Claim and Resonance grant must be audit recorded in the same transaction.",
);
assert.doesNotMatch(
  invites,
  /affiliate.*create|creator_partner|commission/i,
  "Claiming a Silver Key must never auto-enrol the creator in the partner programme.",
);

assert.match(
  recognitionPage,
  /activateCreatorSilverProduct\(user\.id, "recognition"\)[\s\S]*getRecognitionConversationAccess/,
  "Recognition must start its Silver window only on actual product entry.",
);
assert.match(
  recognitionAccess,
  /source: "creator_silver_key"/,
  "Recognition must preserve Silver Key access provenance.",
);
assert.match(
  compassRoute,
  /peekOnly[\s\S]*if \(!peekOnly\)[\s\S]*activateCreatorSilverProduct\(userId, "compass"\)[\s\S]*getCompassAccessState/,
  "Compass must activate Silver access only for a real product entry, not a read-only access peek.",
);
assert.match(
  memberNav,
  /fetch\("\/api\/compass\/access\?peek=1"/,
  "Shared member navigation must never burn a Creator Silver Compass day merely by rendering.",
);
assert.match(
  compassAccess,
  /source: "creator_silver_key"/,
  "Compass must preserve Silver Key access provenance.",
);

assert.match(
  visitAccess,
  /visitCreditsAvailableFor[\s\S]*hasCreatorSilverKey/,
  "Silver holders must be able to use their Resonance credits even when public checkout is off.",
);
const checkoutBody =
  visitAccess.match(/export async function visitCheckoutAvailableFor[\s\S]*$/)?.[0] ?? "";
assert.doesNotMatch(
  checkoutBody,
  /hasCreatorSilverKey/,
  "Silver Key must not silently enable public Resonance checkout.",
);

const activationCopy =
  "Your Recognition and Compass access do not start when your Silver Key is issued. Each 30-day access period begins only when you first enter that product, so exploring Recognition today will not reduce your Compass time. Your three Resonance room credits remain available until you use them.";
assert.ok(
  infoPack.includes(activationCopy),
  "Creator info pack must explain the independent product clocks and persistent Resonance credits exactly.",
);
assert.match(
  infoPack,
  /There is no requirement to post, review or promote Oremea/,
  "Silver creators must be told there is no posting obligation.",
);
assert.match(
  infoPack,
  /not Lifetime All Access[\s\S]*not automatically included/,
  "Silver must remain distinct from Golden lifetime access and future products.",
);
assert.doesNotMatch(
  infoPack,
  /Harmonize|Continuum/,
  "Unincluded products must not appear in the Silver info pack.",
);
assert.match(
  infoPack,
  /https:\/\/recognition\.oremea\.com\/begin/,
  "Silver Recognition must link directly to the canonical live product entry.",
);
assert.match(
  infoPack,
  /https:\/\/resonance\.oremea\.com\//,
  "Silver Resonance must link directly to the canonical room chooser.",
);
assert.match(
  infoPack,
  /https:\/\/compass\.oremea\.com\/begin/,
  "Silver Compass must link directly to the canonical live product entry.",
);

assert.match(
  claimPage,
  /robots: \{ index: false, follow: false \}[\s\S]*referrer: "no-referrer"/,
  "Silver claim links must remain private and non-indexable.",
);
assert.match(
  claimAction,
  /verification\?\.status === "verified"[\s\S]*claimCreatorSilverKeyInvite/,
  "Silver claim action must pass only verified Clerk emails.",
);
assert.match(
  adminAction,
  /createCreatorSilverKeyInviteAction[\s\S]*createCreatorSilverKeyInvite/,
  "Admin must be able to create Silver invitations before the recipient account exists.",
);
assert.match(
  adminPage,
  /<CreatorSilverKeyInviteForm \/>[\s\S]*Creator Silver Keys/,
  "Canonical admin must expose Silver issuance and recent state.",
);
assert.match(
  adminForm,
  /Create Silver Key link[\s\S]*token hash[\s\S]*Copy link/,
  "Admin must surface the one-use Silver link once while storing only its hash.",
);
assert.match(
  deletionGuard,
  /oremea_creator_silver_key_issuances[\s\S]*Creator Silver Key issuance and audit history/,
  "Destructive account deletion must not silently erase or orphan Silver Key history.",
);

console.log("Creator Silver Key contract verified.");
