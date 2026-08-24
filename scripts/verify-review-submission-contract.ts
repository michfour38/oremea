import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

const reviewsPage = read("app/reviews/page.tsx");
const sharePage = read("app/reviews/share/page.tsx");
const submitRoute = read("app/api/reviews/submit/route.ts");
const middleware = read("middleware.ts");
const memberNav = read("app/(member)/member-nav.tsx");

assert.match(
  reviewsPage,
  /href="\/reviews\/share"/,
  "The public Reviews page must offer a clear route for participants to submit their own reflection.",
);

assert.match(
  sharePage,
  /Nothing from a private Oremea conversation, reflection, Map or Archive is[\s\S]*pulled into this form automatically/i,
  "Review submission must explicitly protect private product material from automatic extraction.",
);
assert.match(
  sharePage,
  /never published automatically/i,
  "Review submission must disclose human moderation before publication.",
);
assert.match(
  sharePage,
  /publicationConsent/,
  "Review submission must collect explicit publication permission.",
);
assert.match(
  sharePage,
  /Anonymous[\s\S]*First name[\s\S]*Initial/,
  "Participants must control public attribution.",
);

assert.match(
  submitRoute,
  /publicationConsent === true/,
  "The review API must fail closed unless publication permission is explicit.",
);
assert.match(
  submitRoute,
  /PENDING HUMAN REVIEW/,
  "Submitted reviews must enter a human moderation queue rather than publishing automatically.",
);
assert.match(
  submitRoute,
  /support@oremea\.com/,
  "Review submissions must reach the Oremea support inbox for moderation.",
);
assert.doesNotMatch(
  submitRoute,
  /prisma\.|create\([^)]*review|insert[^\n]*review/i,
  "The launch review flow must not silently auto-publish or create a public review record.",
);

assert.match(
  middleware,
  /"\/reviews\(\.\*\)"/,
  "Reviews and the share page must be available to signed-out visitors.",
);
assert.match(
  middleware,
  /"\/api\/reviews\/submit"/,
  "The public review submission endpoint must remain reachable without a Clerk sign-in gate.",
);
assert.match(
  memberNav,
  /www\.oremea\.com\/reviews\/share[\s\S]*Share Your Experience/,
  "Signed-in participants must have a quiet permanent route to share an experience.",
);

console.log("Review submission contract checks passed.");
