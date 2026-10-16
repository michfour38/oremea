import { validateCommitEvidence } from './argus-commit-evidence.mjs';

const OWNER='michfour38', REPO='oremea';
const SHA=/^[a-f0-9]{40}$/;
const API='https://api.github.com';
const FILE='src/lib/ai/ai-config.ts';
const REQUIRED={ 'argus-qualified-update.yml':'qualified-model-change', 'oremea-build-gate.yml':'pull-request-check' };
// Read-only GitHub API; never accepts a URL from the caller and never writes.
export async function verifyGithubProposal({pullNumber,token,modelId,fetchImpl=fetch}={}) {
 if(!Number.isSafeInteger(pullNumber)||pullNumber<1||!token) throw new Error('ARGUS_GITHUB_INPUT_INVALID');
 const headers={authorization:'Bearer '+token,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28'};
 async function get(path){
  if(!/^\/[a-zA-Z0-9_/?=&.%-]+$/.test(path)||path.includes('..')) throw new Error('ARGUS_PATH_INVALID');
  const response=await fetchImpl(API+'/repos/'+OWNER+'/'+REPO+path,{headers,redirect:'error',signal:AbortSignal.timeout(12000)});
  if(!response.ok) throw new Error('ARGUS_GITHUB_FETCH_FAILED_'+response.status);
  return response.json();
 }
 const pr=await get('/pulls/'+pullNumber);
 if(pr.state!=='open'||pr.base?.repo?.full_name!==OWNER+'/'+REPO||
    pr.head?.repo?.full_name!==OWNER+'/'+REPO||
    !pr.head?.ref?.startsWith('argus/')||pr.base?.ref!=='main'||
    !SHA.test(pr.head?.sha||'')||!SHA.test(pr.base?.sha||'')) throw new Error('ARGUS_PR_UNTRUSTED');
 const headSha=pr.head.sha,baseSha=pr.base.sha;
 // Refuse oversized or paginated diffs rather than accidentally overlooking a changed file.
 if(pr.changed_files!==1) throw new Error('ARGUS_DIFF_SCOPE_INVALID');
 const files=await get('/pulls/'+pullNumber+'/files?per_page=100');
 if(!Array.isArray(files)||files.length!==1||files[0].filename!==FILE||
    files[0].status!=='modified') throw new Error('ARGUS_DIFF_SCOPE_INVALID');
 // Read-only workflow runs. Each check must be from an approved workflow, for the exact head SHA.
 const runs=await get('/actions/runs?head_sha='+headSha+'&per_page=100');
 if(!Array.isArray(runs.workflow_runs)||runs.total_count>100) throw new Error('ARGUS_WORKFLOW_INCOMPLETE');
 const checks=[];
 for(const [file,job] of Object.entries(REQUIRED)){
  const candidates=runs.workflow_runs.filter(run=>run.head_sha===headSha&&
    run.head_repository?.full_name===OWNER+'/'+REPO&&run.event==='pull_request'&&
    run.path==='.github/workflows/'+file&&run.status==='completed'&&run.conclusion==='success');
  let confirmed=false;
  for(const run of candidates){
   const jobs=await get('/actions/runs/'+run.id+'/jobs?per_page=100');
   if(jobs.total_count>100||!Array.isArray(jobs.jobs)) continue;
   if(jobs.jobs.some(j=>j.name===job&&j.status==='completed'&&j.conclusion==='success')){
     checks.push({name:file==='argus-qualified-update.yml'?
       'ARGUS | Qualified model change gate / qualified-model-change':
       'Oremea build gate / pull-request-check',
       headSha,status:'completed',conclusion:'success',source:'github-actions'});
     confirmed=true;break;
   }
  }
  if(!confirmed) throw new Error('ARGUS_REQUIRED_WORKFLOW_NOT_GREEN:'+file);
 }
 const result=validateCommitEvidence({headSha,baseSha,checks,changedFiles:[files[0].filename],modelId});
 return {...result,pullNumber,source:'authenticated-github-api',promotionAllowed:false};
}
