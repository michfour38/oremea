import { sendDirectText } from '../src/lib/ai/legacy-model-recovery.ts';

export async function rehearseDirectRecovery(primary, apiKey) {
  // Intercept only the invented primary. All standby calls use real synthetic inference.
  const simulated = 'claude-argus-retired-fixture';
  for (const temperature of [undefined, 0, 0.15]) {
    const init = {method:'POST', headers:{'content-type':'application/json',
      'x-api-key':apiKey, 'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:simulated, max_tokens:700, temperature,
        messages:[{role:'user',content:'Synthetic recovery rehearsal. Reply exactly: ARGUS_OK'}]})};
    const result = await sendDirectText(init, primary, (url, options) =>
      JSON.parse(options.body).model === simulated
        ? Promise.resolve(Response.json({error:{type:'not_found_error',message:'model: ' + simulated}}, {status:404}))
        : fetch(url, options));
    const reply = await result.json();
    if (!result.ok || reply.model !== primary || reply.stop_reason !== 'end_turn' ||
        !reply.content?.some(b => b.type === 'text' && b.text.trim() === 'ARGUS_OK'))
      throw Error('ARGUS_DIRECT_RECOVERY_REHEARSAL_FAILED temperature=' + temperature);
  }
}
