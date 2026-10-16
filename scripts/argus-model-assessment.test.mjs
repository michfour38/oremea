import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assessCandidate,assessCatalog} from './argus-model-assessment.mjs';
const current={id:'claude-sonnet-5',locations:['src/lib/ai/ai-config.ts:4']};
test('new active model never qualifies automatically',()=>{
 const result=assessCandidate({candidate:{id:'claude-sonnet-6',lifecycle:'active'},current});
 assert.equal(result.decision,'evaluate_only');
 assert.ok(result.reasons.includes('application_compatibility_not_tested'));
 assert.ok(result.reasons.includes('cost_not_verified'));
});
test('deprecated, retired, and unverified candidates are blocked',()=>{
 for(const lifecycle of ['deprecated','retired',undefined]){
  assert.equal(assessCandidate({candidate:{id:'claude-sonnet-4',lifecycle},current}).decision,'blocked');
 }
});
test('provider issues block promotion and documentation changes require review',()=>{
 assert.equal(assessCandidate({candidate:{id:'claude-sonnet-6',lifecycle:'active'},current,providerHealthy:false}).decision,'blocked');
 const result=assessCandidate({candidate:{id:'claude-sonnet-6',lifecycle:'active'},current,documentationChanged:true});
 assert.equal(result.decision,'evaluate_only');
 assert.ok(result.reasons.includes('documentation_review_required'));
});
test('invalid IDs and incomplete catalog fail closed',()=>{
 assert.equal(assessCandidate({candidate:{id:'../../secret',lifecycle:'active'},current}).decision,'blocked');
 assert.equal(assessCatalog({catalog:null,configuredModels:[current]}).status,'incomplete');
});
test('catalog output is deterministic and does not make provider requests',()=>{
 const result=assessCatalog({catalog:[{id:'claude-z',lifecycle:'active'},{id:'claude-a',lifecycle:'retired'},{id:current.id,lifecycle:'active'}],configuredModels:[current]});
 assert.deepEqual(result.candidates.map(x=>x.id),['claude-a','claude-z']);
 assert.deepEqual(result.candidates.map(x=>x.decision),['blocked','evaluate_only']);
});
