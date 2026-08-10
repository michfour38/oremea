import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schemaSource = readFileSync(
  "prisma/schema/recognition-conversation.prisma",
  "utf8",
);
const memoryRouteSource = readFileSync(
  "app/api/recognition/memory/route.ts",
  "utf8",
);
const threadRouteSource = readFileSync(
  "app/api/recognition/thread/route.ts",
  "utf8",
);
const archiveSource = readFileSync("app/recognition/archive/page.tsx", "utf8");
const threadControlsSource = readFileSync(
  "app/recognition/archive/recognition-thread-controls.tsx",
  "utf8",
);

assert.match(
  schemaSource,
  /onDelete: Cascade/,
  "Deleting a Recognition thread must delete its ongoing conversation messages.",
);
assert.match(
  memoryRouteSource,
  /EMPTY_RECOGNITION_MEMORY/,
  "Participants must be able to clear carried-forward Recognition memory without deleting transcript history.",
);
assert.match(
  threadRouteSource,
  /currentUser/,
  "Ongoing Recognition conversation deletion must remain account-bound.",
);
assert.match(
  threadRouteSource,
  /delete-recognition-conversation/,
  "Recognition conversation deletion must require an explicit confirmation token.",
);
assert.match(
  threadRouteSource,
  /recognition_threads\.deleteMany/,
  "Starting fresh must delete the participant's current ongoing thread rather than merely hiding it.",
);
assert.doesNotMatch(
  threadRouteSource,
  /oremea_entitlements/,
  "Deleting the ongoing conversation must not revoke Recognition purchase or membership access.",
);
assert.match(
  archiveSource,
  /RecognitionThreadControls/,
  "Recognition Archive must expose a participant-controlled start-fresh path.",
);
assert.match(
  threadControlsSource,
  /This cannot be undone/,
  "The destructive conversation deletion action must warn the participant before it runs.",
);
assert.match(
  threadControlsSource,
  /Earlier completed Recognition processes remain/,
  "Deleting the ongoing thread must clearly distinguish it from preserved legacy Recognition history.",
);

console.log("Recognition privacy contract checks passed.");
