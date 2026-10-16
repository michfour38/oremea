import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateChangePaths, validateConfig, validateModelCatalog } from './argus-change-gate.mjs';

const config = model => `export const AI_MODELS = {\n  primary:\n    process.env.AI_PRIMARY_MODEL ||\n    "${model}",\n\n  fallback:\n    process.env.AI_FALLBACK_MODEL || null,\n} as const\n`;
test('only designated model configuration may change',()=>{
 assert.doesNotThrow(()=>validateChangePaths(['src/lib/ai/ai-config.ts']));
 for(const paths of [[],['src/server.ts'],['src/lib/ai/ai-config.ts','README.md']]) assert.throws(()=>validateChangePaths(paths),/SCOPE_VIOLATION/);
});
test('canonical config passes; ancillary code, env changes, and malformed model fail closed',()=>{
 assert.equal(validateConfig(config('claude-sonnet-5')),'claude-sonnet-5');
 assert.throws(()=>validateConfig(config('claude-sonnet-5')+'\nconsole.log("side effect");'),/SHAPE_VIOLATION/);
 assert.throws(()=>validateConfig(config('not-anthropic')),/SHAPE_VIOLATION/);
 assert.throws(()=>validateConfig(config('claude-sonnet-5').replace('AI_PRIMARY_MODEL','ATTACKER_MODEL')), /SHAPE_VIOLATION/);
});
test('proposed model needs verified active catalog status',()=>{
 assert.doesNotThrow(()=>validateModelCatalog('claude-next',[{id:'claude-next',lifecycle:'active'}]));
 assert.throws(()=>validateModelCatalog('claude-next',[{id:'claude-next',lifecycle:'deprecated'}]),/NOT_VERIFIED/);
 assert.throws(()=>validateModelCatalog('claude-next',[]),/NOT_VERIFIED/);
});
