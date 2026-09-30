import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path: string) => readFileSync(path, "utf8");
const publicPage = read("app/(marketing)/resonance/enter/page.tsx");
const entryPage = read("app/(member)/entry/page.tsx");
const visitsPage = read("app/(member)/resonance/visits/page.tsx");
const actions = read("app/(member)/resonance/visits/actions.ts");
const completePage = read("app/(member)/resonance/complete/page.tsx");
const offerPicker = read("app/(member)/resonance/complete/additional-offer-picker.tsx");
const claimPage = read("app/(marketing)/resonance/claim/page.tsx");
const roomEntry = read("src/lib/resonance/room-entry.ts");
const paymentContract = read("src/lib/resonance/visit-payment-contract.ts");
const visitOrders = read("src/lib/resonance/visit-orders.ts");
const middleware = read("middleware.ts");

assert.match(middleware, /"\/resonance\/enter\(\.\*\)"/);
assert.match(middleware, /"\/resonance\/visits\(\.\*\)"/);
assert.match(middleware, /"\/resonance\/complete\(\.\*\)"/);
assert.match(middleware, /"\/resonance\/claim\(\.\*\)"/);
assert.doesNotMatch(middleware, /host === RESONANCE_HOST && pathname === "\/"[\s\S]{0,120}auth\.protect/);
assert.match(middleware, /pathname === "\/"[\s\S]{0,120}rewriteResonancePath\(req, "\/resonance\/enter"\)/);

assert.match(publicPage, /<details/);
assert.match(publicPage, /Choose \{roomName\}/);
assert.match(publicPage, /room\.chooseWhen/);
assert.match(publicPage, /`\/resonance\/visits\?room=\$\{room\.weekNumber\}`/);
assert.match(publicPage, /remember the interest through checkout/i);
assert.doesNotMatch(publicPage, /Create account to see visit options/);
assert.doesNotMatch(publicPage, /line-clamp-2/);

assert.match(roomEntry, /The Hearth/);
assert.match(roomEntry, /The Becoming/);
assert.match(entryPage, /resonance\/visits\?room=/);

assert.match(visitsPage, /guestOwnerFromClaim/);
assert.match(visitsPage, /Complete payment first\. Your account is created only after the purchase is confirmed/);
assert.match(visitsPage, /data-whop-checkout-return-url=\{checkoutReturnUrl\}/);
assert.match(visitsPage, /name="room"/);
assert.doesNotMatch(visitsPage, /if \(!userId\) redirect\(`\/sign-in/);

assert.match(actions, /createGuestVisitClaim/);
assert.match(actions, /pendingGuestEmail/);
assert.match(actions, /guestClaimPath/);
assert.match(actions, /startVisitPurchase\([\s\S]*guestOwner/);
assert.match(actions, /declineVisitAddition\(guestOwner/);

assert.match(paymentContract, /isGuestVisitOwner\(order\.user_id\)/);
assert.match(paymentContract, /buyer_email: payment\.user\.email\.toLowerCase\(\)/);
assert.match(visitOrders, /claimGuestVisitPurchase/);
assert.match(visitOrders, /account email does not match the purchase email/i);

assert.match(completePage, /claim=\{claim\}/);
assert.match(completePage, /guestClaimPath/);
assert.match(completePage, /Your Oremea account comes next/);
assert.match(offerPicker, /name="claim"/);
assert.match(offerPicker, /No thanks · Continue/);

assert.match(claimPage, /Purchase confirmed/);
assert.match(claimPage, /same email address you used at checkout/i);
assert.match(claimPage, /claimGuestVisitPurchase/);
assert.match(claimPage, /roomTarget\?\.entryPath/);

console.log("Resonance guest checkout, room-interest recall, and post-payment account claim checks passed.");
