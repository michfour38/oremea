import { execFileSync } from 'node:child_process';
const FILE='src/lib/ai/ai-config.ts';
export function assessProtection({files,headRef,unitResult,qualificationResult}) {
  if(unitResult!=='success') return {pass:false,reason:'ARGUS_TESTS_NOT_GREEN'};
  const touchesModel=files.includes(FILE);
  if(touchesModel && !headRef.startsWith('argus/')) return {pass:false,reason:'ARGUS_MODEL_CHANGE_REQUIRES_ARGUS_BRANCH'};
  if(touchesModel && (files.length!==1 || files[0]!==FILE)) return {pass:false,reason:'ARGUS_UNAUTHORIZED_FILES'};
  if((touchesModel || headRef.startsWith('argus/')) && qualificationResult!=='success')
    return {pass:false,reason:'ARGUS_MODEL_QUALIFICATION_NOT_GREEN'};
  return {pass:true,reason:'ARGUS_PROTECTION_PASS'};
}
function main(){
 const base=process.env.ARGUS_BASE_SHA||'';
 if(!/^[a-f0-9]{40}$/.test(base)) throw new Error('ARGUS_BASE_SHA_INVALID');
 const files=execFileSync('git',['diff','--name-only',base,'HEAD'],{encoding:'utf8'}).split('\n').filter(Boolean);
 const result=assessProtection({files,headRef:process.env.ARGUS_HEAD_REF||'',unitResult:process.env.ARGUS_UNIT_RESULT,qualificationResult:process.env.ARGUS_QUALIFICATION_RESULT});
 console.log(result.reason);
 if(!result.pass) process.exitCode=1;
}
if(process.argv[1] && import.meta.url === new URL('file://'+process.argv[1]).href) main();
