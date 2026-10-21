import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import {
  readRecognitionComposer, writeRecognitionComposer, clearRecognitionDrafts, COMPOSER_TTL_MS,
} from "../src/lib/recognition/composer-storage";
import { privateErrorMetadata } from "../src/lib/security/private-errors";

// Evaluate the actual route/module with synthetic storage and authentication.
function load(file: string, dependencies: Record<string, unknown>) {
  const exports: Record<string, any> = {};
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, URL, Date, console, Request,
    require: (id: string) => {
      assert.ok(id in dependencies, `Unexpected dependency: ${id}`);
      return dependencies[id];
    },
  }, { filename: file });
  return exports;
}
const response = { json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }) };
let userId: string | null = null;
const active = (id: string) => id === "member-A" || id === "member-B";
const common = {
  "@clerk/nextjs/server": { auth: async () => ({ userId }) },
  "next/server": { NextResponse: response },
  "@/src/lib/security/private-errors": { logPrivateError: () => {} },
};
let archiveReads = 0;
const archive = load("app/api/harmonize/archive/summary/route.ts", {
  ...common,
  "@/lib/prisma": { prisma: { harmonize_systems: {
    findFirst: async ({ where, select }: any) => {
      archiveReads++;
      const membership = where.participants?.some;
      if (where.id !== "space-A" || (membership && (!membership.active || !active(membership.profile_id)))) return null;
      assert.equal(membership?.profile_id, userId);
      assert.equal(select.cycles.where.status, "archived");
      assert.equal(select.cycles.select.participant_labels.where.participants.profile_id, userId);
      return { cycles: [{ id: "cycle-A", status: "archived", started_at: "2026-01-01",
        participant_labels: [{ label: "My chosen label" }], signal_snapshot: { private: "invented" },
        pattern_snapshot: { private: "invented" }, system_snapshot: { private: "invented" } }] };
    },
  } } },
});
const archiveRequest = (id = "space-A") => new Request(`https://example.test/api?systemId=${id}`);
async function main() {
  assert.equal((await archive.GET(archiveRequest())).status, 401);
  assert.equal(archiveReads, 0);
  for (const identity of ["outsider", "inactive-member", "owner-without-active-membership"]) {
    userId = identity;
    assert.equal((await archive.GET(archiveRequest())).status, 404);
  }
  userId = "member-A";
  assert.equal((await archive.GET(archiveRequest("missing-space"))).status, 404);
  const allowed = await archive.GET(archiveRequest());
  assert.equal(allowed.status, 200);
  assert.equal(allowed.body.archive.conversations[0].displayTitle, "My chosen label");
  assert.deepEqual(Object.keys(allowed.body.archive.conversations[0]).sort(), ["displayTitle", "id", "started_at", "status"]);

  let updates = 0;
  const review = { entries: { participant_id: "participant-B", cycles: { systems: { participants: [
    { id: "participant-A", profile_id: "member-A", active: true },
    { id: "participant-B", profile_id: "member-B", active: true },
  ] } } } };
  const approve = load("app/api/harmonize/share-review/approve/route.ts", {
    ...common,
    "@/lib/prisma": { prisma: { harmonize_share_reviews: {
      findFirst: async ({ where }: any) => {
        const owner = where.entries?.participants;
        return where.id === "review-B" && (!owner || (owner.profile_id === "member-B" && owner.active)) ? review : null;
      },
      updateMany: async ({ where }: any) => {
        assert.equal(where.entries.participants.profile_id, "member-B");
        assert.equal(where.entries.participants.active, true);
        updates++; return { count: 1 };
      },
    } } },
  });
  const approvalRequest = () => new Request("https://example.test", { method: "POST", body: JSON.stringify({ reviewId: "review-B" }) });
  userId = "member-A";
  assert.equal((await approve.POST(approvalRequest())).status, 404);
  assert.equal(updates, 0);
  userId = "member-B";
  assert.equal((await approve.POST(approvalRequest())).status, 200);
  assert.equal(updates, 1);
  userId = null;
  assert.equal((await approve.POST(approvalRequest())).status, 401);

  const latest = load("app/api/harmonize/share-review/latest/route.ts", {
    ...common,
    "@/lib/prisma": { prisma: {
      harmonize_cycles: { findUnique: async () => ({ systems: { participants: review.entries.cycles.systems.participants } }) },
      harmonize_share_reviews: { findFirst: async ({ where }: any) => {
        assert.equal(where.entries.participant_id, "participant-A");
        assert.equal(where.entries.participants.profile_id, "member-A");
        return null;
      } },
    } },
  });
  userId = "member-A";
  assert.equal((await latest.GET(new Request("https://example.test?cycleId=cycle-A"))).body.review, null);
  userId = "outsider";
  assert.equal((await latest.GET(new Request("https://example.test?cycleId=cycle-A"))).status, 403);

  const storage = () => {
    const map = new Map<string, string>();
    return { get length() { return map.size; }, key: (i: number) => [...map.keys()][i] ?? null,
      getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { map.set(k, v); },
      removeItem: (k: string) => { map.delete(k); }, clear: () => map.clear() };
  };
  const stores = { sessionStorage: storage(), localStorage: storage() };
  stores.localStorage.setItem("oremea:recognition:composer:v1", JSON.stringify({ draft: "Unowned synthetic draft" }));
  assert.equal(readRecognitionComposer("A", "thread-A", stores, 1000), null);
  assert.equal(stores.localStorage.length, 0);
  writeRecognitionComposer("A", "thread-A", "Invented draft", "send-123", stores, 1000);
  assert.equal(readRecognitionComposer("A", "thread-A", stores, 1001)?.clientMessageId, "send-123");
  assert.equal(stores.localStorage.length, 0);
  assert.equal(readRecognitionComposer("A", "thread-B", stores, 1001), null);
  assert.equal(readRecognitionComposer("B", "thread-B", stores, 1001), null);
  assert.equal(readRecognitionComposer("A", "thread-A", stores, 1001), null);
  writeRecognitionComposer("A", "thread-A", "Expiring draft", null, stores, 1000);
  assert.equal(readRecognitionComposer("A", "thread-A", stores, 1000 + COMPOSER_TTL_MS), null);
  writeRecognitionComposer("A", "thread-A", "Clear me", null, stores, 1000);
  clearRecognitionDrafts(stores);
  assert.equal(stores.sessionStorage.length, 0);
  const blocked = { get sessionStorage(): Storage { throw new Error("blocked"); }, get localStorage(): Storage { throw new Error("blocked"); } };
  assert.equal(readRecognitionComposer("A", "thread-A", blocked), null);
  assert.doesNotThrow(() => writeRecognitionComposer("A", "thread-A", "x", null, blocked));
  assert.doesNotThrow(() => clearRecognitionDrafts(blocked));

  assert.deepEqual(privateErrorMetadata({ message: "private fixture", stack: "secret", cause: { token: "secret" }, body: "private", code: "P2002", status: 503 }), { code: "P2002", status: 503 });
  assert.deepEqual(privateErrorMetadata({ code: "private text", status: "secret" }), {});
  assert.deepEqual(privateErrorMetadata({ get code() { throw Error("private"); } }), {});

  // Derived memory deletion must cover copies belonging to A, never B's records.
  const memoryRows = ["active", "archived"].map((status, i) => ({ id: `A-${i}`, status,
    memory_snapshot: { version: 1, anchors: [{ quote: "Synthetic retained excerpt", turnIndex: i + 1 }] } }));
  let writes = 0;
  const memory = load("src/lib/recognition/recognition-memory-mutation.ts", {
    "node:crypto": { randomUUID: () => "synthetic-revision" },
    "@/lib/prisma": { prisma: { $transaction: async (fn: any) => fn({
      $executeRaw: async () => {},
      recognition_threads: {
        findMany: async ({ where }: any) => { assert.equal(where.user_id, "A"); return memoryRows; },
        updateMany: async ({ where, data }: any) => {
          assert.equal(where.user_id, "A"); assert.ok(where.id.startsWith("A-"));
          assert.equal(data.memory_snapshot.anchors.length, 0); writes++; return { count: 1 };
        },
      },
    }) } },
    "./recognition-conversation": { EMPTY_RECOGNITION_MEMORY: { version: 1, anchors: [] }, readRecognitionMemory: (v: any) => v },
  });
  await memory.mutateRecognitionMemoryCopies({ userId: "A", clear: true, turnIndex: null, quote: null });
  assert.equal(writes, 2);

  // Actual conversation route: a clear during generation must beat a stale
  // result even when the previously stored memory was already empty.
  let storedMemory: any = { version: 1, anchors: [] };
  let messageCount = 0;
  const transaction: any = {
    $executeRaw: async () => {},
    recognition_threads: {
      findUnique: async () => ({ status: "active", message_count: messageCount, memory_snapshot: storedMemory }),
      update: async ({ data }: any) => { messageCount = data.message_count; if (data.memory_snapshot) storedMemory = data.memory_snapshot; },
    },
    recognition_messages: {
      findUnique: async () => null,
      create: async ({ data }: any) => ({ ...data, created_at: new Date() }),
      findMany: async () => [],
    },
  };
  const converse = load("app/api/recognition/conversation/route.ts", {
    ...common,
    "@clerk/nextjs/server": { currentUser: async () => ({ id: "A", firstName: "Synthetic", emailAddresses: [] }) },
    "@/lib/prisma": { prisma: { ...transaction, $transaction: async (fn: any) => fn(transaction) } },
    "@/src/lib/recognition/recognition-thread": { getOrCreateActiveRecognitionThread: async () => ({ id: "thread-A" }) },
    "@/src/lib/recognition/recognition-conversation-access": { getRecognitionConversationAccess: async () => ({ active: true }) },
    "@/src/lib/recognition/recognition-context": { trimRecognitionRecentContext: (v: any) => v },
    "@/src/lib/recognition/recognition-conversation": {
      readRecognitionMemory: (v: any) => v,
      generateRecognitionConversationReply: async () => {
        storedMemory = { version: 1, anchors: [], _privacyRevision: "cleared-during-generation" };
        return { reply: "Invented response", memory: { version: 1, anchors: [{ quote: "Do not restore this" }] },
          model: "synthetic", responseMode: "structured", usage: { inputTokens: 0, outputTokens: 0 } };
      },
    },
  });
  const send = (threadId: string) => new Request("https://example.test", {
    method: "POST", body: JSON.stringify({ content: "Invented message", clientMessageId: "synthetic-send-123", threadId }),
  });
  assert.equal((await converse.POST(send("thread-B"))).status, 409);
  assert.equal(messageCount, 0);
  assert.equal((await converse.POST(send("thread-A"))).status, 200);
  assert.equal(messageCount, 2);
  assert.equal(storedMemory.anchors.length, 0);
  assert.equal(storedMemory._privacyRevision, "cleared-during-generation");

  const require = createRequire(`${process.cwd()}/package.json`);
  const config = require("./next.config.js");
  const environment = process.env as Record<string, string | undefined>;
  const previousEnv = environment.NODE_ENV;
  environment.NODE_ENV = "production";
  const headerRules = await config.headers();
  for (const name of ["Content-Security-Policy", "Strict-Transport-Security", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy"]) {
    assert.ok(headerRules[0].headers.some((h: any) => h.key === name));
  }
  assert.equal(headerRules[1].headers[0].value, "private, no-store, max-age=0");
  if (previousEnv === undefined) delete environment.NODE_ENV; else environment.NODE_ENV = previousEnv;
  writes = 0;
  await memory.mutateRecognitionMemoryCopies({ userId: "A", clear: false, turnIndex: 1, quote: "Synthetic retained excerpt" });
  assert.equal(writes, 2);

  // Integration guards for state that can arrive after an account switch.
  const chat = readFileSync("app/recognition/recognition-chat.tsx", "utf8");
  assert.match(chat, /if \(!identityMatches\) return null/);
  assert.match(chat, /if \(!identityRef.current\) return/);
  assert.match(chat, /JSON.stringify\(\{ content, clientMessageId, threadId \}\)/);
  assert.doesNotMatch(chat, /localStorage\.setItem/);
  const conversation = readFileSync("app/api/recognition/conversation/route.ts", "utf8");
  assert.match(conversation, /body.threadId !== thread.id/);
  assert.match(conversation, /JSON.stringify\(currentThread.memory_snapshot\) === JSON.stringify\(prepared.memorySnapshot\)/);
  console.log("Participant security regression checks passed (synthetic data only).");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
