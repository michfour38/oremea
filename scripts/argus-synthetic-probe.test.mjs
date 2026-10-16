import {test} from 'node:test';
import assert from 'node:assert/strict';
import {probe} from './argus-synthetic-probe.mjs';
const source='export const AI_MODELS = {\n  primary:\n    process.env.AI_PRIMARY_MODEL ||\n    "claude-sonnet-5",\n\n  fallback:\n    process.env.AI_FALLBACK_MODEL || null,\n} as const';
test('synthetic request uses config model and does not send customer text',async()=>{
 let seen;
 const fetchImpl=async(url,init)=>{seen={url,init};return Response.json({model:'claude-sonnet-5',stop_reason:'end_turn',content:[{type:'text',text:'ARGUS_OK'}]});};
 const r=await probe({apiKey:'dummy',configSource:source,fetchImpl});
 assert.equal(r.status,'pass');const b=JSON.parse(seen.init.body);
 assert.equal(b.model,'claude-sonnet-5');
 assert.equal(b.messages[0].content,'Synthetic availability check. Reply exactly: ARGUS_OK');
 assert.deepEqual(b.thinking,{type:'disabled'});
 assert.equal(r.productionMutation,false);
});
test('bad status, incorrect model, text or missing key are failures',async()=>{
 await assert.rejects(probe({configSource:source}),/KEY_MISSING/);
 for(const response of [new Response('x',{status:503}),Response.json({model:'wrong',stop_reason:'end_turn',content:[{type:'text',text:'ARGUS_OK'}]}),Response.json({model:'claude-sonnet-5',stop_reason:'end_turn',content:[{type:'text',text:'No'}]})])
 await assert.rejects(probe({apiKey:'dummy',configSource:source,fetchImpl:async()=>response}));
});
