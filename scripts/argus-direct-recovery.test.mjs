import assert from 'node:assert/strict';
import test from 'node:test';
import { sendDirectText } from '../src/lib/ai/legacy-model-recovery.ts';

const body = { model: 'claude-sonnet-4-6', temperature: 0.15, max_tokens: 700,
  messages: [{ role: 'user', content: 'application fixture' }] };
const init = { method: 'POST', body: JSON.stringify(body) };
const standby = 'claude-sonnet-5';
const missing = () => Response.json({error: {type:'not_found_error',message:'model: ' + body.model}}, {status:404});
function simulate(responses) {
  const requests = [];
  const send = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    assert.ok(responses.length);
    return responses.shift();
  };
  return { requests, send };
}
test('retired direct model verifies standby before resending the original request', async () => {
  const final = new Response('fixture result');
  const mock = simulate([missing(), Response.json({ model:standby, stop_reason:'end_turn',
    content:[{type:'text',text:'ARGUS_OK'}] }), final]);
  assert.equal(await sendDirectText(init, standby, mock.send), final);
  assert.deepEqual(mock.requests[0], body);
  assert.deepEqual(mock.requests[2].messages, body.messages);
  assert.deepEqual(mock.requests[2], {...mock.requests[1], messages:body.messages});
  assert.equal(mock.requests[0].temperature, body.temperature);
  assert.equal(Object.hasOwn(mock.requests[2], "temperature"), false);
  assert.equal(mock.requests[2].model, standby);
  assert.ok(!JSON.stringify(mock.requests[1]).includes('application fixture'));
});
test('normal replies and non-model errors do not switch models', async () => {
  for (const status of [200, 400, 401, 403, 404, 429, 503]) {
    const reply = new Response('', {status});
    const mock = simulate([reply]);
    assert.equal(await sendDirectText(init, standby, mock.send), reply);
  }
});
test('failed compatibility check blocks application data from standby', async () => {
  for (const probe of [new Response('', {status:400}), Response.json({model:standby, content:[]})]) {
    const original = missing();
    const mock = simulate([original, probe]);
    assert.equal(await sendDirectText(init, standby, mock.send), original);
    assert.equal(mock.requests.length, 2);
  }
});

test('model-not-found signals recovery even when the primary is already the standby', async () => {
  const response = missing()
  const mock = simulate([response])
  const signals = []
  const report = async (status, error, model) => {
    signals.push({status, model, kind:error?.error?.type})
    return true
  }
  assert.equal(await sendDirectText(init, body.model, mock.send, report), response)
  assert.deepEqual(signals,[{status:404,model:body.model,kind:'not_found_error'}])
  assert.equal(mock.requests.length, 1)
})

test('generic 404 never signals recovery or probes another model', async () => {
  const generic = Response.json({error:{type:'not_found_error',message:'Unknown API route'}},{status:404})
  const mock = simulate([generic])
  let calls = 0
  const report = async () => { calls++; return false }
  assert.equal(await sendDirectText(init, standby, mock.send, report), generic)
  assert.equal(calls, 1)
  assert.equal(mock.requests.length, 1)
})
