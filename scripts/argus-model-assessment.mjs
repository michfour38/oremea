// Read-only, conservative assessment of Anthropic model metadata.
// This module does not recommend automatic promotion or perform inference.
const MODEL_ID = /^claude-[a-z0-9.-]+$/;
const STATES = new Set(['active','deprecated','retired']);
export function assessCandidate({candidate,current,providerHealthy=true,documentationChanged=false}={}) {
  const reasons=[];
  if (!candidate || !MODEL_ID.test(candidate.id||'')) return {id:null,decision:'blocked',reasons:['invalid_model_id']};
  const id=candidate.id;
  if (!current || !MODEL_ID.test(current.id||'')) reasons.push('current_model_unverified');
  if (!STATES.has(candidate.lifecycle)) reasons.push('lifecycle_unverified');
  else if (candidate.lifecycle!=='active') reasons.push('model_not_active');
  if (!providerHealthy) reasons.push('provider_unhealthy');
  if (documentationChanged) reasons.push('documentation_review_required');
  // Metadata and release dates cannot establish application compatibility or quality.
  reasons.push('application_compatibility_not_tested');
  reasons.push('cost_not_verified');
  reasons.push('quality_not_benchmarked');
  if (current && current.id===id) return {id,decision:reasons.some(x=>x!=='application_compatibility_not_tested'&&x!=='cost_not_verified'&&x!=='quality_not_benchmarked')?'review':'retain',reasons};
  return {id,decision:reasons.some(x=>['lifecycle_unverified','model_not_active','provider_unhealthy'].includes(x))?'blocked':'evaluate_only',reasons};
}
export function assessCatalog({catalog,configuredModels,providerHealthy=true,documentationChanged=false}={}) {
  if (!Array.isArray(catalog)||!Array.isArray(configuredModels)) return {status:'incomplete',candidates:[]};
  const current=configuredModels.find(x=>x.locations?.some(p=>p.startsWith('src/lib/ai/ai-config.ts')))||configuredModels[0];
  const candidates=catalog
    .filter(m=>m&&typeof m.id==='string'&&MODEL_ID.test(m.id)&&m.id!==current?.id)
    .map(candidate=>assessCandidate({candidate,current,providerHealthy,documentationChanged}))
    .sort((a,b)=>a.id.localeCompare(b.id));
  return {status:'assessment_only',currentModel:current?.id||null,candidates};
}
