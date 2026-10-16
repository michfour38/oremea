// Pure verification of GitHub-supplied check metadata. This does not grant write access.
const REQUIRED = ['ARGUS | Qualified model change gate / qualified-model-change','Oremea build gate / pull-request-check'];
const SHA=/^[a-f0-9]{40}$/;
export function validateCommitEvidence({headSha,baseSha,checks,changedFiles,modelId}={}) {
 const issues=[];
 if(!SHA.test(headSha||'')||!SHA.test(baseSha||'')||headSha===baseSha) issues.push('invalid_commit_binding');
 if(!Array.isArray(changedFiles)||changedFiles.length!==1||changedFiles[0]!=='src/lib/ai/ai-config.ts') issues.push('scope_unverified');
 if(!/^claude-[a-z0-9.-]+$/.test(modelId||'')) issues.push('model_unverified');
 for(const required of REQUIRED) {
   const valid=Array.isArray(checks)&&checks.some(c=>c.name===required&&c.headSha===headSha&&c.status==='completed'&&c.conclusion==='success'&&c.source==='github-actions');
   if(!valid) issues.push('required_check_not_green:'+required);
 }
 return { qualified:issues.length===0,headSha:SHA.test(headSha||'')?headSha:null,issues,
   // Never authorize merge based solely on metadata supplied to this pure function.
   promotionAllowed:false };
}
export { REQUIRED as REQUIRED_CHECKS };
