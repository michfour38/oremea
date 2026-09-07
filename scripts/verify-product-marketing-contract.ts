import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  OREMEA_PUBLIC_PRODUCT_MARKETING,
  RESONANCE_ROOM_MARKETING,
} from "@/src/lib/oremea/public-product-marketing";
import { OREMEA_PRODUCT_TRUTH } from "@/src/lib/oremea/product-truth";

const expectedIds = [
  "compass",
  "recognition",
  "resonance-bearing",
  "resonance-becoming",
  "resonance-forge",
  "resonance-garden",
  "resonance-gathering",
  "resonance-hearth",
  "resonance-mirror",
  "resonance-pulse",
  "resonance-shadow",
  "resonance-vision",
  "the-current",
];

assert.deepEqual(
  Object.keys(OREMEA_PUBLIC_PRODUCT_MARKETING).sort(),
  expectedIds,
  "Public marketing must cover the exact 13-product catalogue.",
);
assert.deepEqual(
  Object.keys(OREMEA_PRODUCT_TRUTH).sort(),
  expectedIds,
  "Marketing and canonical product truth must cover the same products.",
);
assert.equal(RESONANCE_ROOM_MARKETING.length, 10);
assert.deepEqual(
  RESONANCE_ROOM_MARKETING.map((room) => room.weekNumber),
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
);

for (const [id, marketing] of Object.entries(
  OREMEA_PUBLIC_PRODUCT_MARKETING,
)) {
  const product = OREMEA_PRODUCT_TRUTH[id as keyof typeof OREMEA_PRODUCT_TRUTH];
  assert.equal(marketing.id, id);
  assert.ok(marketing.buyerDecision.length > 30, `${id} needs a buyer decision`);
  assert.ok(marketing.description.length > 70, `${id} needs specific copy`);
  assert.ok(marketing.chooseWhen.length > 50, `${id} needs selection guidance`);
  assert.equal(marketing.limits.length, 3, `${id} needs three explicit limits`);
  assert.equal(product.commerce.affiliateStatus, "off");
}

const resonanceCommerceUrls = RESONANCE_ROOM_MARKETING.map(
  (room) => OREMEA_PRODUCT_TRUTH[room.id].commerce.url,
);
assert.equal(new Set(resonanceCommerceUrls).size, 10);
assert.ok(resonanceCommerceUrls.every((url) => url?.startsWith("https://whop.com/oremea/")));

const current = OREMEA_PUBLIC_PRODUCT_MARKETING["the-current"];
assert.equal(current.public, false);
assert.equal(OREMEA_PRODUCT_TRUTH["the-current"].commerce.url, null);
assert.equal(OREMEA_PRODUCT_TRUTH["the-current"].commercial.invitationOnly, true);
assert.match(current.description, /private self-witnessing/i);
assert.doesNotMatch(current.description, /matchmaking|compatibility score|relationship authority/i);

const recognition = OREMEA_PUBLIC_PRODUCT_MARKETING.recognition;
assert.match(recognition.category, /Help me see myself/);
assert.match(recognition.headline, /private AI discussion journal/i);
assert.match(recognition.limits.join(" "), /No fixed prompt sequence, action plan or accountability loop/i);

const compass = OREMEA_PUBLIC_PRODUCT_MARKETING.compass;
assert.match(compass.category, /Help me move/);
assert.match(compass.description, /seven Why layers stay intact/i);
assert.match(compass.limits.join(" "), /Archive, Map, access, commerce and completion/i);
assert.match(OREMEA_PRODUCT_TRUTH.compass.description, /next movement/i);

const roomById = Object.fromEntries(
  RESONANCE_ROOM_MARKETING.map((room) => [room.id, room]),
);
assert.match(roomById["resonance-hearth"].description, /concrete cues and participation/i);
assert.match(roomById["resonance-mirror"].limits.join(" "), /No invented motive/i);
assert.doesNotMatch(roomById["resonance-garden"].description, /compatibility/i);
assert.match(roomById["resonance-bearing"].description, /choices, allocations and trade-offs/i);
assert.match(roomById["resonance-pulse"].description, /desire, attraction, aliveness/i);
assert.doesNotMatch(roomById["resonance-pulse"].description, /values|alignment/i);
assert.match(roomById["resonance-shadow"].description, /strong reactions and familiar moves/i);
assert.doesNotMatch(roomById["resonance-shadow"].description, /projection|disowned|trauma/i);
assert.match(roomById["resonance-forge"].description, /conflict, rupture, honesty and repair/i);
assert.match(roomById["resonance-vision"].description, /rhythms, responsibilities, decisions, resources and tests/i);
assert.match(roomById["resonance-gathering"].description, /allowing unresolved or separate material/i);
assert.match(roomById["resonance-becoming"].description, /low-capacity versions and return after a lapse/i);

const publicFiles = [
  "app/page.tsx",
  "app/resonance-rooms/page.tsx",
  "app/recognition/layout.tsx",
  "app/recognition/purchase/page.tsx",
  "components/site/sections/explore-ecosystem.tsx",
  "components/site/sections/compare-resonance.tsx",
  "components/site/sections/current-panel.tsx",
  "components/site/site-footer.tsx",
  "middleware.ts",
  "app/sitemap.xml/route.ts",
];
const publicSource = publicFiles
  .map((path) => `/* ${path} */\n${readFileSync(path, "utf8")}`)
  .join("\n");

for (const stalePattern of [
  /\$24\.99/,
  /Save 20%/i,
  /\+1 option/i,
  /does not renew automatically[\s\S]{0,100}Compass/i,
]) {
  assert.doesNotMatch(
    publicSource,
    stalePattern,
    `Public Oremea source must not carry stale commerce: ${stalePattern}`,
  );
}

for (const path of [
  "app/page.tsx",
  "components/site/sections/explore-ecosystem.tsx",
  "components/site/sections/compare-resonance.tsx",
]) {
  assert.match(
    readFileSync(path, "utf8"),
    /\/resonance-rooms/,
    `${path} must send prospects to the public room chooser.`,
  );
}

const recognitionLayout = readFileSync("app/recognition/layout.tsx", "utf8");
assert.match(recognitionLayout, /alternates: \{ canonical: "\/" \}/);
assert.match(recognitionLayout, /openGraph:/);
assert.match(recognitionLayout, /twitter:/);

const recognitionPurchase = readFileSync(
  "app/recognition/purchase/page.tsx",
  "utf8",
);
assert.match(recognitionPurchase, /FAQPage/);
assert.match(recognitionPurchase, /How Recognition works/);
assert.match(recognitionPurchase, /What it will not become/);

assert.match(readFileSync("middleware.ts", "utf8"), /"\/resonance-rooms\(\.\*\)"/);
assert.match(
  readFileSync("app/sitemap.xml/route.ts", "utf8"),
  /"\/resonance-rooms"/,
);
assert.match(
  readFileSync("components/site/sections/current-panel.tsx", "utf8"),
  /Private self-witnessing while a new one-to-one relationship is forming/,
);

const siteFooter = readFileSync("components/site/site-footer.tsx", "utf8");
assert.match(siteFooter, /href="\/resonance-rooms"/);
assert.doesNotMatch(siteFooter, /href="\/resonance"/);

const recognitionEmail = readFileSync(
  "src/lib/email/send-recognition-email.ts",
  "utf8",
);
assert.doesNotMatch(
  recognitionEmail,
  /Continue to Resonance|stay with it long enough to change|resonance\.oremea\.com/i,
);
assert.match(recognitionEmail, /Meaning and choices remain yours/i);

console.log("Product marketing authority contract checks passed.");
