import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prepareModelProposal, readProposalInput } from './argus-proposal-preflight.mjs';

const source = [
  'export const AI_MODELS = {',
  '  primary:',
  '    process.env.AI_PRIMARY_MODEL ||',
  '    "claude-sonnet-5",',
  '',
  '  fallback:',
  '    process.env.AI_FALLBACK_MODEL || null,',
  '} as const',
  '',
].join('\n');
const evidence = { modelId: 'claude-sonnet-6', compatibilityPassed: true, pricingReviewed: true, qualityBenchmarked: true, reportSource: 'trusted-qualification' };
const input = { currentSource: source, candidate: 'claude-sonnet-6', verifiedCatalog: [{id:'claude-sonnet-6',lifecycle:'active'}], evidence };

test('a proposal is never a production promotion', () => {
  const result = prepareModelProposal(input);
  assert.equal(result.path, 'src/lib/ai/ai-config.ts');
  assert.equal(result.promotionAllowed, false);
  assert.equal(result.content, source.replace('claude-sonnet-5','claude-sonnet-6'));
});
test('missing evidence is rejected', () => {
  assert.throws(() => prepareModelProposal({...input,evidence:undefined}), /EVIDENCE_INCOMPLETE/);
  assert.throws(() => prepareModelProposal({...input,evidence:{...evidence,qualityBenchmarked:false}}), /EVIDENCE_INCOMPLETE/);
});
test('unverified or retired candidates are rejected', () => {
  assert.throws(() => prepareModelProposal({...input,verifiedCatalog:[]}), /NOT_VERIFIED_ACTIVE/);
  assert.throws(() => prepareModelProposal({...input,verifiedCatalog:[{id:input.candidate,lifecycle:'retired'}]}), /NOT_VERIFIED_ACTIVE/);
});
test('unrelated paths and config changes are rejected', () => {
  assert.throws(() => readProposalInput('README.md'), /PATH_NOT_ALLOWED/);
  assert.throws(() => prepareModelProposal({...input,currentSource:source+'console.log(1)'}), /SHAPE_VIOLATION/);
});
