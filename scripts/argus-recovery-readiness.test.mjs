import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assessRecoveryReadiness} from './argus-recovery-readiness.mjs';
const good={baselineCommit:'a'.repeat(40),candidateCommit:'b'.repeat(40),
 rollbackConfigPath:'src/lib/ai/ai-config.ts',rollbackScopeFiles:['src/lib/ai/ai-config.ts'],
 baselineBuildPassed:true,rollbackBuildPassed:true,protectedRollbackCheckPassed:true,
 monitoringHealthy:true,rollbackOperatorAcknowledged:true};
test('fully evidenced readiness is still not automatic deployment authorisation',()=>{
 const x=assessRecoveryReadiness(good);
 assert.equal(x.ready,true);assert.equal(x.automaticPromotionAllowed,false);assert.equal(x.productionMutated,false);
});
test('missing rollback evidence fails closed',()=>{
 for(const key of ['baselineBuildPassed','rollbackBuildPassed','protectedRollbackCheckPassed','monitoringHealthy','rollbackOperatorAcknowledged'])
  assert.equal(assessRecoveryReadiness({...good,[key]:false}).ready,false,key);
});
test('reject non-immutable identifiers, same SHA and cross-file rollback',()=>{
 for(const bad of [{baselineCommit:'main'},{candidateCommit:good.baselineCommit},
  {rollbackScopeFiles:['src/lib/ai/ai-config.ts','package.json']},{rollbackConfigPath:'package.json'}])
  assert.equal(assessRecoveryReadiness({...good,...bad}).ready,false);
});
test('empty record is not ready',()=>assert.equal(assessRecoveryReadiness({}).ready,false));
