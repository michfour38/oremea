import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const action = readFileSync("app/(marketing)/party/actions.ts", "utf8");
const page = readFileSync("app/(marketing)/party/page.tsx", "utf8");
const sender = readFileSync("src/lib/email/send-party-welcome-email.ts", "utf8");

assert.match(
  action,
  /let welcomeEmailSent = false;[\s\S]*try \{[\s\S]*welcomeEmailSent = await sendPartyWelcomeEmail[\s\S]*catch \(error\)[\s\S]*deliveryStatus = welcomeEmailSent \? "" : "&delivery=unavailable"/,
  "Once registration is saved, email delivery failure must have a controlled recovery route.",
);
assert.match(
  page,
  /query\.delivery === "unavailable"[\s\S]*role="alert"[\s\S]*contact Oremea/,
  "The confirmation page must never silently imply a failed welcome message was delivered.",
);
assert.match(
  page,
  /private Questions Box link is not[\s\S]*displayed publicly/,
  "A missing welcome message must not leak a private Questions Box token into a shareable page.",
);
assert.match(
  sender,
  /if \(!apiKey\)[\s\S]*return false;[\s\S]*if \(error\)[\s\S]*return false;/,
  "The mail sender must report provider failure to its caller.",
);

console.log("Party welcome email delivery recovery contract verified.");
