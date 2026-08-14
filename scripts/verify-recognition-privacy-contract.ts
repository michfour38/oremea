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
const threadLifecycleSource = readFileSync(
  "src/lib/recognition/recognition-thread.ts",
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
  "Deleting a Recognition thread must delete only the messages belonging to that selected thread.",
);
assert.match(
  schemaSource,
  /archived_at/,
  "Recognition must preserve a durable archived state for closed chats.",
);
assert.doesNotMatch(
  schemaSource,
  /user_id\s+String\s+@unique/,
  "Recognition must allow more than one preserved conversation per participant.",
);
assert.match(
  memoryRouteSource,
  /EMPTY_RECOGNITION_MEMORY/,
  "Participants must be able to clear carried-forward Recognition memory without deleting transcript history.",
);
assert.match(
  threadRouteSource,
  /currentUser/,
  "Recognition thread changes must remain account-bound.",
);
assert.match(
  threadRouteSource,
  /startNewRecognitionThread/,
  "New chat must use the preserved thread lifecycle rather than deleting history.",
);
assert.match(
  threadLifecycleSource,
  /status:\s*"archived"/,
  "Beginning a new Recognition chat must archive the current chat.",
);
assert.match(
  threadLifecycleSource,
  /recognition_threads\.create/,
  "Beginning a new Recognition chat must create a separate active thread.",
);
assert.match(
  threadRouteSource,
  /delete-recognition-conversation/,
  "Recognition conversation deletion must require an explicit confirmation token.",
);
assert.match(
  threadRouteSource,
  /id:\s*threadId[\s\S]*user_id:\s*user\.id/,
  "Deleting a Recognition chat must verify that the selected thread belongs to the signed-in participant.",
);
assert.doesNotMatch(
  threadRouteSource,
  /recognition_threads\.deleteMany/,
  "Deleting one Recognition chat must never wipe every thread for the participant.",
);
assert.doesNotMatch(
  threadRouteSource,
  /oremea_entitlements/,
  "Deleting a conversation must not revoke Recognition purchase or membership access.",
);
assert.match(
  archiveSource,
  /threads\.map/,
  "Recognition Archive must expose separate preserved chats rather than one overwritten transcript.",
);
assert.match(
  archiveSource,
  /Starting a new chat does not overwrite the old one/,
  "Recognition Archive must explain that old chats remain intact.",
);
assert.match(
  archiveSource,
  /RecognitionThreadControls/,
  "Recognition Archive must expose participant-controlled deletion for the selected chat.",
);
assert.match(
  threadControlsSource,
  /This cannot be undone/,
  "The destructive conversation deletion action must warn the participant before it runs.",
);
assert.match(
  threadControlsSource,
  /Other chats in[\s\S]*Archive stay exactly where they are/,
  "Deleting one chat must clearly distinguish it from the participant's other preserved conversations.",
);

console.log("Recognition privacy contract checks passed.");
