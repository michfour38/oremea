import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

export const services = {
  'Oremea - oremea': 'https://www.oremea.com/terms',
  'Oremea - Compass': 'https://compass.oremea.com/terms',
  'Oremea - resonance': 'https://resonance.oremea.com/terms',
  'Oremea - recognition': 'https://recognition.oremea.com/terms',
};

export function deploymentState(statuses) {
  // GitHub returns the newest status for each context first.
  const pending = [];
  for (const context of Object.keys(services)) {
    const state = statuses.find(status => status.context === context)?.state;
    if (state === 'error' || state === 'failure') throw Error('ARGUS_DEPLOY_FAILED ' + context);
    if (state !== 'success') pending.push(context);
  }
  return pending;
}

export async function verifyDeployment({ sha, token, send = fetch, sleep = delay, attempts = 80 }) {
  if (!/^[0-9a-f]{40}$/.test(sha) || !token) throw Error('ARGUS_DEPLOY_VERIFICATION_INPUT_MISSING');
  for (let attempt = 0; attempt < attempts; attempt++) {
    const result = await send('https://api.github.com/repos/michfour38/oremea/commits/' + sha + '/statuses?per_page=100', {
      redirect: 'error', headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(15000),
    });
    if (!result.ok) throw Error('ARGUS_DEPLOY_STATUS_UNREADABLE HTTP ' + result.status);
    const pending = deploymentState(await result.json());
    if (!pending.length) {
      for (const [name, url] of Object.entries(services)) {
        const health = await send(url, { redirect: 'error', signal: AbortSignal.timeout(15000) });
        if (!health.ok) throw Error('ARGUS_DEPLOY_HEALTH_FAILED ' + name + ' HTTP ' + health.status);
      }
      return;
    }
    if (attempt + 1 === attempts) throw Error('ARGUS_DEPLOY_TIMEOUT ' + pending.join(', '));
    await sleep(15000);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await verifyDeployment({ sha: process.argv[2], token: process.env.GH_TOKEN });
  console.log('ARGUS_ALL_FOUR_DEPLOYMENTS_VERIFIED', process.argv[2]);
}
