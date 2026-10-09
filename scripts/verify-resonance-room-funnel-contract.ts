import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path: string) => readFileSync(path, "utf8");
const publicPage = read("app/(marketing)/resonance/enter/page.tsx");
const entryPage = read("app/(member)/entry/page.tsx");
const roomTarget = read("app/(member)/entry/room-target.tsx");
const resonancePage = read("app/(member)/resonance/page.tsx");
const archivePage = read("app/(member)/resonance/archive/page.tsx");
const visitsPage = read("app/(member)/resonance/visits/page.tsx");
const checkoutEmbed = read("app/(member)/resonance/visits/whop-checkout.tsx");
const purchasePage = read("app/(member)/resonance/purchase/page.tsx");
const actions = read("app/(member)/resonance/visits/actions.ts");
const completePage = read("app/(member)/resonance/complete/page.tsx");
const offerPicker = read("app/(member)/resonance/complete/additional-offer-picker.tsx");
const roomEntry = read("src/lib/resonance/room-entry.ts");
const middleware = read("middleware.ts");

assert.match(middleware, /pathname === "\/"[\s\S]{0,180}rewriteResonancePath\(req, "\/resonance\/enter"\)/);
assert.doesNotMatch(middleware, /host === RESONANCE_HOST && pathname === "\/"[\s\S]{0,120}auth\.protect/);
assert.match(middleware, /"\/resonance\/enter\(\.\*\)"/);
assert.doesNotMatch(middleware, /"\/resonance\/visits\(\.\*\)"/);

assert.match(publicPage, /<details/);
assert.match(publicPage, /Choose \{roomName\}/);
assert.match(publicPage, /room\.chooseWhen/);
assert.match(publicPage, /const roomInterestHref = \(weekNumber: number\)/);
assert.match(publicPage, /`\/resonance\/visits\?room=\$\{weekNumber\}`/);
assert.match(publicPage, /href=\{roomInterestHref\(room\.weekNumber\)\}/);
assert.doesNotMatch(publicPage, /href=\{`\/entry\?room=\$\{room\.weekNumber\}`\}/);
assert.doesNotMatch(publicPage, /line-clamp-2/);
assert.match(roomEntry, /The Hearth/);
assert.match(roomEntry, /The Becoming/);
assert.match(entryPage, /resonance\/visits\?room=/);
assert.match(roomTarget, /You showed interest in \{roomName\}/);
assert.match(roomTarget, /Begin with \{roomName\}/);
assert.match(roomTarget, /Compare the rooms/);
assert.match(visitsPage, /getResonanceRoomTarget/);
assert.match(visitsPage, /name="room"/);
assert.match(
  visitsPage,
  /returnUrl=\{\`\$\{checkoutOrigin\}\/resonance\/complete\?order=\$\{order\.id\}\$\{roomSuffix\}\`\}/,
);
assert.match(checkoutEmbed, /returnUrl=\{returnUrl\}/);
assert.doesNotMatch(visitsPage, /js\.whop\.com\/static\/checkout\/loader\.js|data-whop-checkout-/);
assert.match(actions, /formRoomTarget/);
assert.match(actions, /roomTarget\?\.entryPath/);
assert.match(completePage, /roomWeekNumber=\{roomTarget\?\.weekNumber\}/);
assert.match(completePage, /Continue to \$\{roomTarget\.name\}/);
assert.match(offerPicker, /name="room"/);

// Resonance hero/sub copy uses punctuation as part of meaning, not decoration.
// Keep real question marks and internal sentence stops, but no terminal full stop
// on display headlines/subheads.
assert.match(publicPage, /Stay with what becomes visible/);
assert.match(entryPage, /Enter where you are/);
assert.match(entryPage, /Which one do you choose\?/);
assert.match(visitsPage, /Choose the visits · choose the room next/);
assert.doesNotMatch(visitsPage, /Choose the visits\. Choose the room next\./);
assert.match(resonancePage, /weekTheme\.replace\(\/\\\.\\s\*\$\/, ""\)/);
assert.doesNotMatch(
  resonancePage,
  /This day's reflections (?:could not be loaded|are not available) yet\./,
);
assert.match(archivePage, /a new visit while the earlier visit stays intact\n/);
assert.doesNotMatch(archivePage, /a new visit while the earlier visit stays intact\./);
assert.match(purchasePage, /detail\.description\.replace\(\/\\\.\\s\*\$\/, ""\)/);
assert.match(completePage, /"Your visits are ready"/);
assert.match(completePage, /"The payment did not complete"/);
assert.match(completePage, /"This payment is under review"/);
assert.match(completePage, /"The payment is not confirmed yet"/);
assert.doesNotMatch(
  completePage,
  /"(?:Your visits are ready|The payment did not complete|This payment is under review|The payment is not confirmed yet)\."/,
);
console.log("Resonance public sales root, remembered room interest, account-first checkout funnel, and hero copy checks passed.");
