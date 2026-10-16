import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateCommitEvidence,REQUIRED_CHECKS} from './argus-commit-evidence.mjs';
const headSha='a'.repeat(40),baseSha='b'.repeat(40);
const checks=REQUIRED_CHECKS.map(name=>({name,headSha,status:'completed',conclusion:'success',source:'github-actions'}));
const good={headSha,baseSha,checks,changedFiles:['src/lib/ai/ai-config.ts'],modelId:'claude-sonnet-6'};
test('commit-specific green results produce qualified evidence, never an auto-merge permission',()=>{
 const r=validateCommitEvidence(good);assert.equal(r.qualified,true);assert.equal(r.promotionAllowed,false);
});
test('stale checks and incomplete checks fail closed',()=>{
 for(const bad of [{...checks[0],headSha:baseSha},{...checks[0],conclusion:'failure'},{...checks[0],status:'queued'}]){
   assert.equal(validateCommitEvidence({...good,checks:[bad,checks[1]]}).qualified,false);
 }
});
test('other files and absent required checks fail closed',()=>{
 assert.equal(validateCommitEvidence({...good,changedFiles:['src/lib/ai/ai-config.ts','other.ts']}).qualified,false);
 assert.equal(validateCommitEvidence({...good,checks:[checks[0]]}).qualified,false);
});
test('invalid commit sha or model fails closed',()=>{
 assert.equal(validateCommitEvidence({...good,headSha:'HEAD'}).qualified,false);
 assert.equal(validateCommitEvidence({...good,modelId:'../other'}).qualified,false);
});
