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
