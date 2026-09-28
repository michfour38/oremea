import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

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
  assert.equal(product.commerce.affiliateStatus, product.id === "the-current" ? "off" : "whop_managed");
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
assert.doesNotMatch(
  [
    compass.category,
    compass.headline,
    compass.buyerDecision,
    compass.description,
    compass.chooseWhen,
    ...compass.limits,
  ].join(" "),
  /seven Why layers|seven layers|7 layers|the Descent/i,
);
assert.match(compass.limits.join(" "), /Archive, Map, access, commerce and completion/i);
assert.match(OREMEA_PRODUCT_TRUTH.compass.description, /next movement/i);

const roomById = Object.fromEntries(
  RESONANCE_ROOM_MARKETING.map((room) => [room.id, room]),
);
assert.match(roomById["resonance-hearth"].headline, /belonging/i);
assert.match(roomById["resonance-hearth"].buyerDecision, /remain yourself/i);
assert.match(roomById["resonance-hearth"].description, /welcome, attention, space, boundaries and mutual effort/i);
assert.doesNotMatch(roomById["resonance-hearth"].description, /diagnos|verdict|hidden motive/i);
assert.match(roomById["resonance-mirror"].headline, /familiar pattern/i);
assert.match(roomById["resonance-mirror"].description, /pattern can become visible without becoming an identity/i);
assert.match(roomById["resonance-mirror"].chooseWhen, /belongs to your participation/i);
assert.match(roomById["resonance-mirror"].limits.join(" "), /No invented motive/i);
assert.doesNotMatch(roomById["resonance-mirror"].description, /attachment style|trauma response|diagnos/i);
assert.match(roomById["resonance-garden"].headline, /care that can keep working/i);
assert.match(roomById["resonance-garden"].description, /time, attention, labour, energy, resources and rest/i);
assert.match(roomById["resonance-garden"].chooseWhen, /capacity and limits/i);
assert.match(roomById["resonance-garden"].limits.join(" "), /No compatibility scoring/i);
assert.doesNotMatch(roomById["resonance-garden"].description, /compatibility|selfish|martyr|trauma|attachment/i);
assert.match(roomById["resonance-bearing"].headline, /everything cannot come first/i);
assert.match(roomById["resonance-bearing"].description, /stated priorities beside lived decisions/i);
assert.match(roomById["resonance-bearing"].chooseWhen, /decision ownership/i);
assert.doesNotMatch(roomById["resonance-bearing"].description, /execution plan|moral ranking|should win/i);
assert.match(roomById["resonance-pulse"].headline, /desire meet reality/i);
assert.match(roomById["resonance-pulse"].buyerDecision, /wanting something does not tell you what to do with it/i);
assert.match(roomById["resonance-pulse"].description, /time, information and real contact/i);
assert.match(roomById["resonance-pulse"].chooseWhen, /without rushing its meaning/i);
assert.doesNotMatch(roomById["resonance-pulse"].description, /values|alignment|destiny|compatibility/i);
assert.match(roomById["resonance-shadow"].headline, /reaction arrives before choice/i);
assert.match(roomById["resonance-shadow"].description, /usefulness|helped with/i);
assert.match(roomById["resonance-shadow"].description, /where another choice may be available/i);
assert.doesNotMatch(roomById["resonance-shadow"].description, /projection|disowned|trauma|defence mechanism/i);
assert.match(roomById["resonance-forge"].headline, /repair has to become visible/i);
assert.match(roomById["resonance-forge"].buyerDecision, /what changes afterward/i);
assert.match(roomById["resonance-forge"].description, /what belongs to each person/i);
assert.match(roomById["resonance-forge"].chooseWhen, /if repair is not available/i);
assert.doesNotMatch(roomById["resonance-forge"].description, /forgive|reconcile|their motive|their intention/i);
assert.match(roomById["resonance-vision"].headline, /ordinary Tuesday/i);
assert.match(roomById["resonance-vision"].buyerDecision, /what that future would actually ask/i);
assert.match(roomById["resonance-vision"].description, /ordinary days, rhythms, responsibilities, decisions, resources/i);
assert.match(roomById["resonance-vision"].chooseWhen, /same life in practice/i);
assert.doesNotMatch(roomById["resonance-vision"].description, /manifest|destiny|guarantee|predict/i);
assert.match(roomById["resonance-gathering"].headline, /without forcing one story/i);
assert.match(roomById["resonance-gathering"].buyerDecision, /which deserve to stay separate/i);
assert.match(roomById["resonance-gathering"].description, /tests connection without manufacturing it/i);
assert.match(roomById["resonance-gathering"].chooseWhen, /fuller picture/i);
assert.doesNotMatch(roomById["resonance-gathering"].description, /everything happens for a reason|grand meaning|one true story/i);
assert.match(roomById["resonance-becoming"].headline, /survive a bad day/i);
assert.match(roomById["resonance-becoming"].buyerDecision, /still return to/i);
assert.match(roomById["resonance-becoming"].description, /lower-capacity version/i);
assert.match(roomById["resonance-becoming"].description, /return after a lapse/i);
assert.match(roomById["resonance-becoming"].chooseWhen, /missed day into a moral verdict/i);
assert.doesNotMatch(roomById["resonance-becoming"].description, /discipline|willpower|lazy|failure|streak/i);

const productTruthDescriptions = Object.fromEntries(
  Object.entries(OREMEA_PRODUCT_TRUTH).map(([id, product]) => [
    id,
    product.description,
  ]),
);
assert.match(productTruthDescriptions["resonance-hearth"], /concrete cues and participation/i);
assert.match(productTruthDescriptions["resonance-mirror"], /recurring roles, responses and participation/i);
assert.match(productTruthDescriptions["resonance-garden"], /care, capacity, labour, resources/i);
assert.match(productTruthDescriptions["resonance-bearing"], /choices, allocations and trade-offs/i);
assert.doesNotMatch(productTruthDescriptions["resonance-bearing"], /deeper alignment/i);
assert.match(productTruthDescriptions["resonance-pulse"], /desire, attraction, interest/i);
assert.match(productTruthDescriptions["resonance-shadow"], /strong reactions and familiar moves/i);
assert.doesNotMatch(productTruthDescriptions["resonance-shadow"], /fear|trigger|beneath/i);
assert.match(productTruthDescriptions["resonance-forge"], /conflict, rupture, responsibility, repair/i);
assert.match(productTruthDescriptions["resonance-vision"], /rhythms, responsibilities, decisions, resources/i);
assert.match(productTruthDescriptions["resonance-gathering"], /unresolved or separate material/i);
assert.doesNotMatch(productTruthDescriptions["resonance-gathering"], /make meaning|emerged/i);
assert.match(productTruthDescriptions["resonance-becoming"], /repeatable lived practice/i);

assert.equal(
  existsSync("components/site/sections/compare-current.tsx"),
  false,
  "The hidden Current must not regain the retired public dating/matching comparison surface.",
);

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
  const source = readFileSync(path, "utf8");
  assert.match(
    source,
    /\/resonance\/enter/,
    `${path} must send prospects directly to the Resonance funnel entry.`,
  );
  assert.doesNotMatch(
    source,
    /\/resonance-rooms/,
    `${path} must not route prospects through the retired room catalogue.`,
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
assert.doesNotMatch(recognitionPurchase, /What it will not become/);

const resonanceEnterPage = readFileSync(
  "app/(marketing)/resonance/enter/page.tsx",
  "utf8",
);
assert.doesNotMatch(resonanceEnterPage, /next\/font\/google|Playfair_Display/);
assert.doesNotMatch(resonanceEnterPage, /seven-day|seven days|Days 1–6|Day 7|each day&apos;s/i);
assert.match(resonanceEnterPage, /seven-stage reflection experience/i);
assert.match(resonanceEnterPage, /move through at your own pace/i);

const resonanceRoomsPage = readFileSync("app/resonance-rooms/page.tsx", "utf8");
assert.match(resonanceRoomsPage, /permanentRedirect\("\/resonance\/enter"\)/);
assert.doesNotMatch(resonanceRoomsPage, /RESONANCE_ROOM_MARKETING|Open this room|Get Resonance visits/);

const compareResonance = readFileSync(
  "components/site/sections/compare-resonance.tsx",
  "utf8",
);
assert.doesNotMatch(compareResonance, /seven-day|seven days/i);

const explorePage = readFileSync("app/explore/page.tsx", "utf8");
assert.doesNotMatch(explorePage, /ExploreWhatNot/);
assert.equal(
  existsSync("components/site/sections/explore-what-not.tsx"),
  false,
  "The retired negative Explore section must not return.",
);

const disclaimer = readFileSync("app/(legal)/disclaimer/page.tsx", "utf8");
assert.match(disclaimer, /do not diagnose personality, trauma, motives or hidden intent/i);
assert.match(disclaimer, /do not promise compatibility, reconciliation, emotional safety/i);

assert.match(readFileSync("middleware.ts", "utf8"), /"\/resonance-rooms\(\.\*\)"/);
const sitemap = readFileSync("app/sitemap.xml/route.ts", "utf8");
assert.match(sitemap, /"\/resonance\/enter"/);
assert.doesNotMatch(sitemap, /"\/resonance-rooms"/);
assert.match(
  readFileSync("components/site/sections/current-panel.tsx", "utf8"),
  /Private self-witnessing while a new one-to-one relationship is forming/,
);

const siteFooter = readFileSync("components/site/site-footer.tsx", "utf8");
assert.match(siteFooter, /href="\/resonance\/enter"/);
assert.doesNotMatch(siteFooter, /href="\/resonance-rooms"/);
assert.doesNotMatch(siteFooter, /href="\/resonance"/);
assert.doesNotMatch(siteFooter, /tel:/i);
assert.doesNotMatch(siteFooter, /OREMEA_OPERATOR\.telephone/);

const legalLinks = readFileSync("src/lib/legal/legal-links.ts", "utf8");
assert.doesNotMatch(
  legalLinks,
  /telephone\s*:/i,
  "The public Oremea operator record must not expose a personal phone number.",
);

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
