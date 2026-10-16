// Fail-closed assessment of model-evaluation evidence. This is not a live API test
// and cannot permit production changes, even when evidence is complete.
const SHA=/^[a-f0-9]{40}$/;
const MODEL=/^claude-[a-z0-9.-]+$/;
export function assessModelEvaluation(e={}) {
 const blockers=[];
 if(!MODEL.test(e.candidateModel||'')) blockers.push('candidate_id_invalid');
 if(!SHA.test(e.sourceCommit||'')) blockers.push('source_commit_unbound');
 if(e.providerCatalogVerified!==true||e.providerModelId!==e.candidateModel)
   blockers.push('provider_catalog_unverified');
 if(e.applicationCompatibility?.result!=='pass'||e.applicationCompatibility?.modelId!==e.candidateModel||
    e.applicationCompatibility?.sourceCommit!==e.sourceCommit)
   blockers.push('compatibility_not_verified');
 if(e.quality?.result!=='pass'||e.quality?.modelId!==e.candidateModel||
    e.quality?.sourceCommit!==e.sourceCommit||!Number.isInteger(e.quality?.sampleSize)||e.quality.sampleSize<1)
   blockers.push('quality_not_verified');
 if(e.cost?.reviewed!==true||e.cost?.modelId!==e.candidateModel||
    e.cost?.currency!=='USD'||!Number.isFinite(e.cost?.estimatedMonthlyUSD)||e.cost.estimatedMonthlyUSD<0)
   blockers.push('cost_not_verified');
 if(e.reviewerApproved!==true) blockers.push('evaluation_review_missing');
 return {evidenceComplete:blockers.length===0,blockers,automaticPromotionAllowed:false,productionMutated:false};
}
