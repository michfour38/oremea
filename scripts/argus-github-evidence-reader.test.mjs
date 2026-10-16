import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyGithubProposal } from './argus-github-evidence-reader.mjs';
const repo={full_name:'michfour38/oremea'},head='a'.repeat(40),base='b'.repeat(40);
function fake({wrongSha=false,otherFile=false,failedJob=false,wrongRepo=false}={}){
 return async url=>{
  const path=new URL(url).pathname;
  if(path.endsWith('/pulls/100')) return Response.json({state:'open',head:{sha:head,ref:'argus/proposal-1',repo:wrongRepo?{full_name:'other/repo'}:repo},base:{sha:base,ref:'main',repo},changed_files:1});
  if(path.endsWith('/files')) return Response.json([{filename:otherFile?'README.md':'src/lib/ai/ai-config.ts',status:'modified'}]);
  if(path.endsWith('/runs'))return Response.json({total_count:2,workflow_runs:[
   ...['argus-qualified-update.yml','oremea-build-gate.yml'].map((file,i)=>({id:i+1,head_sha:wrongSha?base:head,head_repository:repo,event:'pull_request',path:'.github/workflows/'+file,status:'completed',conclusion:'success'}))]});
  if(path.endsWith('/jobs'))return Response.json({total_count:1,jobs:[{name:path.includes('/1/')?'qualified-model-change':'pull-request-check',status:'completed',conclusion:failedJob?'failure':'success'}]});
  throw Error('Unexpected API endpoint: '+url);
 };
}
const args={pullNumber:100,token:'test-placeholder',modelId:'claude-sonnet-6'};
test('verified check results are bound to the exact PR commit; promotion remains disabled',async()=>{
 const r=await verifyGithubProposal({...args,fetchImpl:fake()});
 assert.equal(r.qualified,true);assert.equal(r.promotionAllowed,false);assert.equal(r.headSha,head);
});
test('refuse stale checks, unrelated files, unsuccessful jobs and wrong repositories',async()=>{
 for(const variant of [{wrongSha:true},{otherFile:true},{failedJob:true},{wrongRepo:true}]){
  await assert.rejects(verifyGithubProposal({...args,fetchImpl:fake(variant)}));
 }
});
test('reject invalid PR number and missing token',async()=>{
 await assert.rejects(verifyGithubProposal({...args,pullNumber:0,fetchImpl:fake()}));
 await assert.rejects(verifyGithubProposal({...args,token:'',fetchImpl:fake()}));
});
