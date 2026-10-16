// Evidence-only recovery readiness assessment. Never mutates branches, settings or production.
const SHA=/^[a-f0-9]{40}$/;
export function assessRecoveryReadiness(input={}) {
 const blockers=[];
 if(!SHA.test(input.baselineCommit||'')||!SHA.test(input.candidateCommit||'')||input.baselineCommit===input.candidateCommit)
   blockers.push('immutable_baseline_and_candidate_required');
 if(input.rollbackConfigPath!=='src/lib/ai/ai-config.ts'||input.rollbackScopeFiles?.length!==1||
    input.rollbackScopeFiles[0]!=='src/lib/ai/ai-config.ts') blockers.push('rollback_scope_not_single_file');
 if(input.baselineBuildPassed!==true) blockers.push('baseline_build_not_verified');
 if(input.rollbackBuildPassed!==true) blockers.push('rollback_build_not_verified');
 if(input.protectedRollbackCheckPassed!==true) blockers.push('protected_rollback_check_not_verified');
 if(input.monitoringHealthy!==true) blockers.push('production_monitoring_not_verified');
 if(input.rollbackOperatorAcknowledged!==true) blockers.push('human_recovery_operator_not_ready');
 return {ready:blockers.length===0,blockers,automaticPromotionAllowed:false,productionMutated:false};
}
