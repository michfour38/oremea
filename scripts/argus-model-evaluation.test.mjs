import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assessModelEvaluation} from './argus-model-evaluation.mjs';
const good={candidateModel:'claude-sonnet-6',sourceCommit:'a'.repeat(40),providerCatalogVerified:true,
 providerModelId:'claude-sonnet-6',
 applicationCompatibility:{result:'pass',modelId:'claude-sonnet-6',sourceCommit:'a'.repeat(40)},
 quality:{result:'pass',modelId:'claude-sonnet-6',sourceCommit:'a'.repeat(40),sampleSize:20},
 cost:{reviewed:true,modelId:'claude-sonnet-6',currency:'USD',estimatedMonthlyUSD:12},reviewerApproved:true};
test('complete declared evidence never enables promotion',()=>{
 const x=assessModelEvaluation(good);assert.equal(x.evidenceComplete,true);
 assert.equal(x.automaticPromotionAllowed,false);assert.equal(x.productionMutated,false);
});
test('missing and conflicting model identity fail closed',()=>{
 for(const e of [{},{...good,providerModelId:'claude-other'},{...good,sourceCommit:'main'},
 {...good,applicationCompatibility:{...good.applicationCompatibility,modelId:'claude-other'}},
 {...good,quality:{...good.quality,sourceCommit:'b'.repeat(40)}}])
 assert.equal(assessModelEvaluation(e).evidenceComplete,false);
});
test('test failure, insufficient sampling, absent price evidence, review fail closed',()=>{
 for(const patch of [{applicationCompatibility:{...good.applicationCompatibility,result:'fail'}},
 {quality:{...good.quality,sampleSize:0}},{cost:{...good.cost,estimatedMonthlyUSD:-1}},
 {cost:{...good.cost,currency:'ZAR'}},{reviewerApproved:false}])
 assert.equal(assessModelEvaluation({...good,...patch}).evidenceComplete,false);
});
