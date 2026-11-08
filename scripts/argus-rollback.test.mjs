import assert from 'node:assert/strict';
import test from 'node:test';
import { qualifyRollback } from './argus-rollback.mjs';
import { services } from './argus-deployment-check.mjs';
const source = model => 'export const AI_MODELS = {\n  primary:\n    process.env.AI_PRIMARY_MODEL ||\n    "' + model + '",\n\n  fallback:\n    process.env.AI_FALLBACK_MODEL || null,\n} as const';
const before = source('claude-sonnet-5'), after = source('claude-sonnet-4-6');
const input = {paths:['src/lib/ai/ai-config.ts'], previous:before, current:after,
  priorStatuses:Object.keys(services).map(context=>({context,state:'success'}))};
test('failed rollout offers only the prior config after both roles pass live checks',async()=>{
  const seen=[];
  assert.equal(await qualifyRollback({...input,probeModel:async model=>seen.push(model)}),before);
  assert.deepEqual(seen,['claude-sonnet-5','claude-sonnet-5-5']);
});
test('retired prior model, unverified history and unrelated changes block rollback',async()=>{
  await assert.rejects(qualifyRollback({...input,probeModel:async()=>{throw Error('retired')}}),/retired/);
  await assert.rejects(qualifyRollback({...input,priorStatuses:[]}),/UNVERIFIED/);
  await assert.rejects(qualifyRollback({...input,paths:['app/page.tsx']}),/MODEL_ONLY/);
});
