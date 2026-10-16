import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessProtection } from './argus-required-check.mjs';
const file='src/lib/ai/ai-config.ts';
const base={files:['README.md'],headRef:'feature/docs',unitResult:'success',qualificationResult:'skipped'};
test('ordinary green PR passes despite skipped model job',()=>assert.equal(assessProtection(base).pass,true));
test('unit failure blocks all pull requests',()=>assert.equal(assessProtection({...base,unitResult:'failure'}).pass,false));
test('model change from ordinary branch is blocked',()=>assert.equal(assessProtection({...base,files:[file]}).pass,false));
test('ARGUS change needs successful model qualification',()=>{
 assert.equal(assessProtection({...base,headRef:'argus/proposed',files:[file]}).pass,false);
 assert.equal(assessProtection({...base,headRef:'argus/proposed',files:[file],qualificationResult:'success'}).pass,true);
});
test('ARGUS branch cannot hide other files',()=>assert.equal(assessProtection({...base,headRef:'argus/proposed',files:[file,'other.ts'],qualificationResult:'success'}).pass,false));
