import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const gatewaySource = readFileSync("src/lib/ai/ai-gateway.ts", "utf8");
const engineSource = readFileSync(
  "src/lib/recognition/recognition-conversation.ts",
  "utf8",
);
const schemaSource = readFileSync(
  "src/lib/recognition/recognition-output-schema.ts",
  "utf8",
);

assert.match(
  gatewaySource,
  /output_config/,
  "The AI gateway must send Anthropic's structured-output configuration when a schema is supplied.",
);
assert.match(
  gatewaySource,
  /type: "json_schema"/,
  "Structured Recognition output must use a JSON schema envelope.",
);
assert.match(
  gatewaySource,
  /outputSchema/,
  "Structured output must remain opt-in so existing AI callers keep their current behavior.",
);

assert.match(
  engineSource,
  /outputSchema: RECOGNITION_OUTPUT_SCHEMA/,
  "Recognition must request its structured reply/memory envelope.",
);
assert.match(
  engineSource,
  /maxTokens: 550/,
  "Recognition output must stay cost-bounded after the reply-length limit.",
);
assert.match(
  engineSource,
  /cacheSystem: true/,
  "Recognition's stable policy prefix must remain prompt-cacheable.",
);

assert.match(
  schemaSource,
  /required: \["reply", "remember"\]/,
  "Recognition's response schema must always contain a reply and explicit memory array.",
);
assert.match(
  schemaSource,
  /additionalProperties: false/,
  "Recognition's structured response must not acquire undeclared fields.",
);
assert.match(
  schemaSource,
  /"correction"/,
  "Recognition memory schema must preserve the correction evidence kind.",
);

console.log("Recognition AI envelope contract checks passed.");

async function verifyBoundedSonnetRequests() {
  const originalFetch = globalThis.fetch;
  const originalModel = process.env.AI_PRIMARY_MODEL;
  const originalFallback = process.env.AI_FALLBACK_MODEL;
  process.env.AI_PRIMARY_MODEL = "claude-sonnet-5";
  delete process.env.AI_FALLBACK_MODEL;

  try {
    const { generateRecognitionConversationReply, EMPTY_RECOGNITION_MEMORY } =
      await import("../src/lib/recognition/recognition-conversation");
    const requests: Record<string, any>[] = [];
    let mode: "structured" | "retry" | "fallback" = "structured";
    const reply = "What distinguishes choosing the smaller project from giving it up?";
    const quote = "I chose a smaller project; I did not give it up.";
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), "https://api.anthropic.com/v1/messages");
      const body = JSON.parse(String(init?.body));
      requests.push(body);
      assert.equal(body.model, "claude-sonnet-5");
      assert.deepEqual(body.thinking, { type: "disabled" },
        "Sonnet 5's default thinking must not consume Recognition's bounded reply budget.");
      assert.equal(body.system[0].cache_control.type, "ephemeral");
      assert.ok(body.messages[0].content.includes(quote));
      assert.equal(body.temperature, undefined);

      if (mode === "retry" && requests.length === 1) {
        return Response.json({ stop_reason: "max_tokens", content: [] });
      }
      const text = mode === "fallback" && body.output_config
        ? "unreadable structured reply"
        : body.output_config
          ? JSON.stringify({ reply, remember: [{ kind: "correction", quote, turnIndex: 1 }] })
          : reply;
      return Response.json({
        stop_reason: "end_turn",
        content: [{ type: "text", text }],
        usage: { input_tokens: 100, output_tokens: 60, cache_read_input_tokens: 50 },
      });
    };

    const input = {
      recentMessages: [{ role: "user" as const, content: quote, turnIndex: 1 }],
      memory: EMPTY_RECOGNITION_MEMORY,
    };
    const structured = await generateRecognitionConversationReply(input);
    assert.equal(structured.reply, reply);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].max_tokens, 550);
    assert.deepEqual(requests[0].output_config.format.schema,
      (await import("../src/lib/recognition/recognition-output-schema")).RECOGNITION_OUTPUT_SCHEMA);
    assert.ok(structured.memory.anchors.some(anchor => anchor.kind === "correction" && anchor.quote === quote));
    assert.equal(structured.usage.cacheReadInputTokens, 50);

    mode = "retry";
    requests.length = 0;
    const retried = await generateRecognitionConversationReply(input);
    assert.equal(retried.reply, reply);
    assert.equal(requests.length, 2);
    assert.equal(requests[1].max_tokens, 1100);
    assert.deepEqual(requests[1].messages, requests[0].messages);
    assert.deepEqual(requests[1].output_config, requests[0].output_config);

    mode = "fallback";
    requests.length = 0;
    const fallback = await generateRecognitionConversationReply({ ...input, memory: structured.memory });
    assert.equal(fallback.reply, reply);
    assert.deepEqual(fallback.memory, structured.memory);
    assert.equal(requests.length, 2);
    assert.equal(requests[1].max_tokens, 420);
    assert.equal(requests[1].output_config, undefined);
    console.log("Recognition bounded Sonnet requests, schema, memory, retry and fallback checks passed.");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalModel === undefined) delete process.env.AI_PRIMARY_MODEL;
    else process.env.AI_PRIMARY_MODEL = originalModel;
    if (originalFallback === undefined) delete process.env.AI_FALLBACK_MODEL;
    else process.env.AI_FALLBACK_MODEL = originalFallback;
  }
}

verifyBoundedSonnetRequests().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
