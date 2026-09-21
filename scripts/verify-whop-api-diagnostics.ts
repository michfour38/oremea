import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WhopApiError, whopApiRequest, WHOP_VISIT_API_VERSION } from "../src/lib/whop/whop-api";

async function main() {
  const originalFetch = globalThis.fetch;
  const apiKey = "test-secret-with+/characters";
  let attempts = 0;
  async function failure(response: Response, status = 403) {
    attempts = 0;
    globalThis.fetch = async (_url, init) => {
      attempts++;
      assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer " + apiKey);
      assert.equal((init?.headers as Record<string, string>)["Api-Version-Date"], WHOP_VISIT_API_VERSION);
      return response;
    };
    try {
      await whopApiRequest("accounts/me", { apiKey });
      assert.fail("Expected a provider error");
    } catch (error) {
      assert.ok(error instanceof WhopApiError);
      assert.equal(error.status, status);
      assert.equal(error.path, "accounts/me");
      assert.equal(error.message, "Whop request returned " + status + ".",
        "Shared callers must not receive provider details through Error.message.");
      assert.equal(attempts, 1, "An authorization failure must not trigger retries.");
      return error.details;
    }
  }

  try {
    assert.deepEqual(await failure(Response.json({
      error: { code: "forbidden", message: "Missing permission company:read for this account." },
      secret: "DO-NOT-COPY-THE-RESPONSE-BODY",
    }, { status: 403, headers: { "x-request-id": "req_diagnostic_123" } })), {
      code: "forbidden",
      message: "Missing permission company:read for this account.",
      requestId: "req_diagnostic_123",
    });

    const secrets = [apiKey, encodeURIComponent(apiKey), "apik_test_secret123", "whsec_test_secret123",
      "eyJhbGciOi.test.signature", "bearer-secret", "credential123", "person@example.test",
      "https://example.test/?token=private", "x".repeat(60)];
    const message = secrets.slice(0, 5).join(" ") + " Bearer " + secrets[5] +
      " api_key=" + secrets[6] + " " + secrets.slice(7).join(" ");
    const redacted = await failure(Response.json({
      error: { code: apiKey, message },
    }, { status: 403, headers: { "x-request-id": apiKey } }));
    for (const secret of secrets) assert.ok(!JSON.stringify(redacted).includes(secret), "Credential/PII must be removed.");
    assert.match(redacted.message!, /\[redacted\]/);

    assert.equal((await failure(Response.json({ type: "authentication_error", message: "Key rejected" },
      { status: 401 }), 401)).code, "authentication_error");
    assert.equal((await failure(Response.json({ error: "Access denied" }, { status: 403 }))).message, "Access denied");
    for (const body of [null, [], { error: { code: {}, message: ["secret"] } }, { data: { secret: apiKey } }]) {
      const details = await failure(Response.json(body, { status: 403 }));
      assert.equal(details.message, undefined);
      assert.equal(details.code, undefined);
    }
    for (const response of [
      new Response("<html>private proxy body</html>", { status: 403, headers: { "content-type": "text/html" } }),
      new Response("{invalid", { status: 403, headers: { "content-type": "application/json" } }),
      Response.json({ error: { message: "large ".repeat(5000) } }, { status: 403 }),
    ]) {
      assert.equal((await failure(response)).message, undefined);
    }
    const bounded = await failure(Response.json({
      error: { code: "bad ".repeat(100), message: "denied ".repeat(500) },
    }, { status: 403 }));
    assert.equal(bounded.code?.length, 128);
    assert.equal(bounded.message?.length, 800);

    let cancelled = false;
    const oversizedStream = new ReadableStream<Uint8Array>({
      pull(controller) { controller.enqueue(new Uint8Array(8192)); },
      cancel() { cancelled = true; },
    });
    await failure(new Response(oversizedStream, { status: 403, headers: { "content-type": "application/json" } }));
    assert.equal(cancelled, true, "Stop reading an oversized error body.");
    const brokenStream = new ReadableStream({ start(controller) { controller.error(new Error("broken")); } });
    await failure(new Response(brokenStream, { status: 403, headers: { "content-type": "application/json" } }));

    globalThis.fetch = async () => Response.json({ id: "biz_test" });
    assert.deepEqual(await whopApiRequest("accounts/me", { apiKey }), { id: "biz_test" });

    const action = readFileSync("app/admin/resonance-commerce/actions.ts", "utf8");
    assert.ok(action.indexOf("await requireAdminAction()") < action.indexOf("await provisionResonanceWhopCatalog()"));
    assert.match(action, /providerDetails: error.providerDetails/);
    assert.doesNotMatch(action, /URLSearchParams|console\./,
      "Provider diagnostics must stay out of redirect URLs and logs.");
    const page = readFileSync("app/admin/resonance-commerce/page.tsx", "utf8");
    assert.match(page, /await requireAdminPage\(\)/);
    assert.doesNotMatch(page, /it is missing a permission required/);
    const form = readFileSync("app/admin/resonance-commerce/provision-form.tsx", "utf8");
    assert.match(form, /disabled=\{!enabled \|\| pending\}/);
    assert.doesNotMatch(form, /dangerouslySetInnerHTML/);
    console.log("Whop diagnostic checks passed (mocked HTTP errors, redaction, bounds, no retry, private admin transport).");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
