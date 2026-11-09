import test from "node:test"
import assert from "node:assert/strict"
import {
  createArgusRecoveryDispatcher,
  isAnthropicModelNotFound,
} from "../src/lib/ai/argus-runtime-recovery.ts"

const missing = model => ({
  error: { type: "not_found_error", message: `model: ${model} not found` },
})

test("only an explicit 404 for the exact configured model triggers recovery", () => {
  assert.equal(isAnthropicModelNotFound(404, missing("claude-sonnet-5"), "claude-sonnet-5"), true)
  for (const status of [200, 400, 401, 403, 429, 500, 503]) {
    assert.equal(isAnthropicModelNotFound(status, missing("claude-sonnet-5"), "claude-sonnet-5"), false)
  }
  assert.equal(isAnthropicModelNotFound(404, missing("claude-sonnet-5-5"), "claude-sonnet-5"), false)
  assert.equal(isAnthropicModelNotFound(404, {error:{type:"not_found_error",message:"route not found"}}, "claude-sonnet-5"), false)
  assert.equal(isAnthropicModelNotFound(404, {error:{type:"authentication_error",message:"model: claude-sonnet-5"}}, "claude-sonnet-5"), false)
  assert.equal(isAnthropicModelNotFound(404, null, "claude-sonnet-5"), false)
})

test("no token means zero outbound requests", async () => {
  let sends = 0
  const dispatch = createArgusRecoveryDispatcher({send:async () => { sends++; throw Error("unexpected") }})
  assert.equal(await dispatch({}), false)
  assert.equal(sends, 0)
})

test("one event only per cooldown, even during concurrent requests; no participant content", async () => {
  let clock = 1000
  const requests = []
  const dispatch = createArgusRecoveryDispatcher({
    now: () => clock,
    send: async (url, options) => {
      requests.push({url, options})
      return new Response(null,{status:204})
    },
  })
  const env = {ARGUS_GITHUB_DISPATCH_TOKEN: "test-fixture-token"}
  assert.deepEqual(await Promise.all([dispatch(env),dispatch(env),dispatch(env)]),[true,false,false])
  assert.equal(requests.length,1)
  assert.equal(requests[0].url, "https://api.github.com/repos/michfour38/oremea/actions/workflows/anthropic-model-watch.yml/dispatches")
  assert.deepEqual(JSON.parse(requests[0].options.body),{ref:"main"})
  assert.equal(requests[0].options.headers.Authorization,"Bearer test-fixture-token")
  assert.equal(requests[0].options.redirect,"error")
  clock += 5*60*60*1000
  assert.equal(await dispatch(env), false)
  clock += 60*60*1000 + 1
  assert.equal(await dispatch(env), true)
  assert.equal(requests.length, 2)
})

test("failed GitHub dispatch is throttled rather than hammering the API", async () => {
  let clock = 100
  let sends = 0
  const dispatch = createArgusRecoveryDispatcher({
    now: () => clock,
    send: async () => { sends++; return new Response(null,{status:403}) },
  })
  const env = {ARGUS_GITHUB_DISPATCH_TOKEN:"fixture"}
  assert.equal(await dispatch(env),false)
  assert.equal(await dispatch(env),false)
  assert.equal(sends,1)
  clock += 10*60*1000+1
  assert.equal(await dispatch(env),false)
  assert.equal(sends,2)
})
