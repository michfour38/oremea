import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { validateConfig } from './argus-change-gate.mjs';
import { resolve } from 'node:path';
export function buildReadOnlyProposal(source, candidate) {
 const before=validateConfig(source);
 if(!/^claude-[a-z0-9.-]+$/.test(candidate||'')) throw new Error('ARGUS_INVALID_MODEL_ID');
 if(candidate===before) throw new Error('ARGUS_NO_CHANGE');
 const after=source.replace('"'+before+'"','"'+candidate+'"');
 if(validateConfig(after)!==candidate) throw new Error('ARGUS_CONFIG_REJECTED');
 return {from:before,to:candidate,path:'src/lib/ai/ai-config.ts',proposedContent:after,
  qualified:false,productionAuthorized:false,
  blockers:['live_model_metadata','compatibility_tests','quality_evaluation','cost_review','protected_commit_checks','production_recovery']};
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname){
 const candidate=process.env.ARGUS_CANDIDATE;
 const proposal=buildReadOnlyProposal(readFileSync('src/lib/ai/ai-config.ts','utf8'),candidate);
 mkdirSync('.argus-proposal',{recursive:true});
 writeFileSync('.argus-proposal/proposal.json',JSON.stringify(proposal,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log('ARGUS created a read-only, unqualified artifact. No source files or production changed.');
}
