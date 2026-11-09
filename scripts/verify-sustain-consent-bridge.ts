import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const bridge = read("src/lib/integrations/sustain-bridge.ts");
const confirm = read("app/api/integrations/sustain/connect/route.ts");
const linkPage = read("app/integrations/sustain/connect/page.tsx");
const recognitionRoute = read("app/api/recognition/conversation/route.ts");
const recognitionPrompt = read("src/lib/recognition/recognition-conversation.ts");
const compassRoute = read("app/api/compass/mirror/route.ts");
const compassService = read("src/lib/compass/session/compass-mirror.service.ts");
const resonance = read("app/(member)/resonance/page.tsx");

assert.match(bridge, /getRecognitionConversationAccess/);
assert.match(bridge, /getCompassAccessState/);
assert.match(bridge, /getActiveResonanceRun/);
assert.match(bridge, /return access\.active/);
assert.match(bridge, /return Boolean\(await getActiveResonanceRun\(userId\)\)/);
assert.doesNotMatch(bridge, /grantCompassAccess|setCompassMembershipAccess|createPurchasedResonanceRun|activateCreatorSilverProduct/);
assert.match(bridge, /SUSTAIN_OREMEA_BRIDGE_SECRET/);
assert.match(bridge, /SUSTAIN_BRIDGE_URL/);
assert.match(bridge, /parsed\.protocol !== "https:"/);
assert.match(bridge, /AbortSignal\.timeout/);
assert.match(bridge, /cache: "no-store"/);
assert.match(bridge, /slice\(0, 6\)/);

assert.match(confirm, /await auth\(\)/);
assert.match(confirm, /validOrigin/);
assert.match(confirm, /hasSustainProductAccess\(userId, body\.product, emails\)/);
assert.match(confirm, /redeemSustainPairing\(userId, body\.product, body\.code\)/);
assert.ok(confirm.indexOf("hasSustainProductAccess") < confirm.lastIndexOf("redeemSustainPairing"));
assert.match(linkPage, /Sign in|sign-in/);
assert.match(linkPage, /Product access required/);
assert.match(linkPage, /SustainLinkConfirmation/);

assert.match(recognitionRoute, /getRecognitionConversationAccess/);
assert.match(recognitionRoute, /getSharedSustainReferences\(user\.id, "recognition"\)/);
assert.ok(recognitionRoute.indexOf("if (!access.active)") < recognitionRoute.indexOf("getSharedSustainReferences(user.id"));
assert.match(recognitionPrompt, /EXTERNAL CONTEXT BOUNDARY/);
assert.match(recognitionPrompt, /sustainReferences = \[\]/);
assert.match(recognitionPrompt, /SELECTED LONG-TERM PARTICIPANT EVIDENCE/);
assert.match(recognitionPrompt, /const optionalReferences/);
assert.match(recognitionPrompt, /only when the newest participant message contains exact wording/);

assert.match(compassRoute, /if \(!\(await getCompassAccessState\(userId\)\)\.active\)/);
assert.match(compassRoute, /getSharedSustainReferences\(userId, "compass"\)/);
assert.match(compassService, /const approvedPrompt = prompt \+ consentedContext/);
assert.match(compassService, /\? approvedPrompt\s*: \`\$\{approvedPrompt\}/);
assert.match(compassService, /seven Why layers/);
assert.match(resonance, /getActiveResonanceRun\(userId\)/);
assert.match(resonance, /getSharedSustainReferences\(userId, "resonance"\)/);
assert.match(resonance, /These stay private/);
console.log("SUSTAIN ↔ Oremea consent, eligibility and private-reference boundaries passed");
