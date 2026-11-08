import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { configuredPair } from './argus-change-gate.mjs';
import { deploymentState } from './argus-deployment-check.mjs';

const configPath = 'src/lib/ai/ai-config.ts';
export async function qualifyRollback({ paths, previous, current, priorStatuses, probeModel, env }) {
  if (paths.length !== 1 || paths[0] !== configPath) throw Error('ARGUS_ROLLBACK_REQUIRES_MODEL_ONLY_DIFF');
  if (previous === current || deploymentState(priorStatuses).length) throw Error('ARGUS_PRIOR_ROLLOUT_UNVERIFIED');
  const { primary, fallback } = configuredPair(previous, env);
  if (primary === fallback) throw Error('ARGUS_ROLLBACK_STANDBY_MISSING');
  for (const model of [primary, fallback]) await probeModel(model);
  return previous;
}

async function main() {
  const git = (...args) => execFileSync('git', args, {encoding:'utf8'});
  const currentSha = git('rev-parse','HEAD').trim();
  if (process.env.TARGET_COMMIT !== currentSha) throw Error('ARGUS_ROLLBACK_STALE_TARGET');
  const previous = git('show','HEAD^:' + configPath);
  const current = git('show','HEAD:' + configPath);
  const paths = git('diff','--name-only','HEAD^','HEAD').trim().split('\n');
  if (paths.length !== 1 || paths[0] !== configPath) throw Error('ARGUS_ROLLBACK_REQUIRES_MODEL_ONLY_DIFF');
  const { probeRecognition } = await import('./argus-recognition-probe.mjs');
  const { rehearseDirectRecovery } = await import('./argus-direct-rehearsal.mjs');
  // Workflow-only commits can lie between production rollouts. Stop at any config change.
  for (const sha of git('rev-list','--first-parent','--max-count=30','HEAD^').trim().split('\n')) {
    if (git('show',sha + ':' + configPath) !== previous) break;
    const result = await fetch('https://api.github.com/repos/michfour38/oremea/commits/' + sha + '/statuses?per_page=100', {
      headers:{Authorization:'Bearer ' + process.env.GH_TOKEN}, redirect:'error',signal:AbortSignal.timeout(15000),
    });
    if (!result.ok) throw Error('ARGUS_PRIOR_ROLLOUT_STATUS_UNREADABLE');
    const priorStatuses = await result.json();
    let pending;
    try { pending = deploymentState(priorStatuses); } catch { continue; }
    if (pending.length) continue;
    const source = await qualifyRollback({paths, previous, current, priorStatuses, env:process.env,
      probeModel:async model => {
        await probeRecognition(model, process.env.ANTHROPIC_API_KEY);
        await rehearseDirectRecovery(model, process.env.ANTHROPIC_API_KEY);
      }});
    await mkdir('.argus-rollback', {recursive:true});
    await writeFile('.argus-rollback/proposal.json',JSON.stringify({base:currentSha, priorVerifiedCommit:sha, path:configPath, source}));
    console.log('ARGUS_VERIFIED_MODEL_ONLY_ROLLBACK_QUEUED', sha);
    return;
  }
  throw Error('ARGUS_NO_VERIFIED_PRIOR_ROLLOUT');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
