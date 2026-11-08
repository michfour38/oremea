import assert from 'node:assert/strict';
import test from 'node:test';
import { services, deploymentState, verifyDeployment } from './argus-deployment-check.mjs';
const statuses = Object.keys(services).map(context => ({context, state:'success'}));
test('failed, missing and stale service statuses cannot pass deployment verification', () => {
  assert.throws(() => deploymentState([{...statuses[0], state:'failure'}, ...statuses]), /DEPLOY_FAILED/);
  assert.deepEqual(deploymentState(statuses.slice(1)), [statuses[0].context]);
  assert.deepEqual(deploymentState(statuses), []);
});
test('green provider statuses still require every public health check', async () => {
  let calls = 0;
  const send = async (url, opts) => {
    if (url.startsWith('https://api.github.com/')) return Response.json(statuses);
    calls++;
    assert.equal(opts.headers, undefined);
    return new Response('', {status: calls === 4 ? 503 : 200});
  };
  await assert.rejects(verifyDeployment({sha:'a'.repeat(40), token:'fixture', send}), /HEALTH_FAILED/);
  assert.equal(calls, 4);
});
