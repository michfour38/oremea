import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proposeRepair, probeStructuredCompatibility } from './argus-auto-repair.mjs';
const source = model => `export const AI_MODELS = {\n  primary:\n    process.env.AI_PRIMARY_MODEL ||\n    "${model}",\n\n  fallback:\n    process.env.AI_FALLBACK_MODEL || null,\n} as const\n`;
const catalog = [
 { id: 'claude-sonnet-5-5', lifecycle: 'active', line: 'sonnet', created_at: '2026-09-28T00:00:00Z' },
 { id: 'claude-opus-5-5', lifecycle: 'active', line: 'opus', created_at: '2026-09-29T00:00:00Z' },
 { id: 'claude-sonnet-4-6', lifecycle: 'active', line: 'sonnet', created_at: '2026-02-17T00:00:00Z' },
];
const report = lifecycle => ({ models:[{id:'claude-sonnet-5',lifecycle,line:'sonnet'}], catalog, failures:[] });

test('active model is never replaced for a documentation edit or new release', () => {
 assert.equal(proposeRepair({report:report('active'),configSource:source('claude-sonnet-5')}).status,'no_action');
});
test('deprecated and unavailable model propose newest verified same-line active replacement', () => {
 for(const lifecycle of ['deprecated','retired','unavailable']) {
  const r=proposeRepair({report:report(lifecycle),configSource:source('claude-sonnet-5')});
  assert.equal(r.status,'proposed');
  assert.equal(r.to,'claude-sonnet-5-5');
  assert.match(r.content, /"claude-sonnet-5-5"/);
  assert.doesNotMatch(r.content, /"claude-opus-5-5"/);
 }
});
test('missing catalog or model status, unknown family and env override block safely', () => {
 assert.equal(proposeRepair({report:{models:report('retired').models},configSource:source('claude-sonnet-5')}).status,'blocked');
 assert.equal(proposeRepair({report:{models:[]},configSource:source('claude-sonnet-5')}).status,'blocked');
 assert.equal(proposeRepair({report:report('retired'),configSource:source('claude-sonnet-5'),env:{AI_PRIMARY_MODEL:'claude-sonnet-4-6'}}).reason,'PRIMARY_MODEL_ENV_OVERRIDE');
});
test('a same-line candidate must be declared active and carry provider release metadata', () => {
 const x=report('retired');
 x.catalog=x.catalog.map(m=>({...m,lifecycle:'deprecated'}));
 assert.equal(proposeRepair({report:x,configSource:source('claude-sonnet-5')}).reason,'NO_VERIFIED_SAME_LINE_REPLACEMENT');
});

test('structured compatibility probe checks the same API shape as production without participant data', async () => {
  let seen;
  const fetchImpl = async (url, options) => {
    seen = { url, request: JSON.parse(options.body) };
    return Response.json({ model: 'claude-sonnet-5-5', stop_reason: 'end_turn',
      content: [{type:'text',text:'{"ok":true}'}] });
  };
  const result = await probeStructuredCompatibility({
    apiKey: 'dummy', model: 'claude-sonnet-5-5', fetchImpl,
  });
  assert.equal(result.status, 'pass');
  assert.deepEqual(seen.request.thinking, {type:'between_tools'});
  assert.equal(seen.request.output_config.format.type, 'json_schema');
  assert.equal(seen.request.messages[0].content.includes('participant'), false);
});
test('structured probe fails closed on unreadable replies', async () => {
  await assert.rejects(probeStructuredCompatibility({
    apiKey:'dummy',model:'claude-sonnet-5-5',
    fetchImpl: async () => Response.json({ model:'claude-sonnet-5-5', stop_reason:'end_turn',
      content:[{type:'text',text:'not json'}] }),
  }), /INVALID_JSON/);
});
