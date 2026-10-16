import { readFileSync } from 'node:fs';
import { validateConfig } from './argus-change-gate.mjs';
const ENDPOINT='https://api.anthropic.com/v1/messages';
export async function probe({apiKey,configSource,fetchImpl=fetch}={}) {
 const model=validateConfig(configSource);
 if(!apiKey) throw new Error('ARGUS_PROBE_KEY_MISSING');
 const response=await fetchImpl(ENDPOINT,{
  method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),
  headers:{'content-type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},
  body:JSON.stringify({model,max_tokens:48,
   ...(model==='claude-sonnet-5'?{thinking:{type:'disabled'}}:{}),
   messages:[{role:'user',content:'Synthetic availability check. Reply exactly: ARGUS_OK'}]})
 });
 if(!response.ok) throw new Error('ARGUS_PROBE_HTTP_'+response.status);
 const body=await response.json();
 const text=Array.isArray(body?.content)?body.content.filter(x=>x?.type==='text').map(x=>x.text).join(' ').trim():'';
 if(body?.model!==model||body?.stop_reason!=='end_turn'||text!=='ARGUS_OK')
  throw new Error('ARGUS_PROBE_RESPONSE_INVALID');
 return {status:'pass',model,synthetic:true,customerDataUsed:false,productionMutation:false};
}
if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1]) {
 try {
  const result=await probe({apiKey:process.env.ANTHROPIC_API_KEY,
   configSource:readFileSync('src/lib/ai/ai-config.ts','utf8')});
  console.log('ARGUS_SYNTHETIC_PROVIDER_PROBE_PASS',result.model);
 } catch(e) {
  console.error(e instanceof Error&&/^ARGUS_PROBE_/.test(e.message)?e.message:'ARGUS_PROBE_UNAVAILABLE');
  process.exitCode=1;
 }
}
