import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inventory, inspect, SOURCES, summary } from './anthropic-model-watch.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'anthropic-watch-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'src'), { recursive: true });
  await writeFile(join(root, 'src', 'models.ts'), 'const primary = "claude-test-primary";\nconst secondary = "claude-test-secondary";');
  return root;
}

const docs = '# Official documentation\n' + 'A documented model lifecycle and migration policy. '.repeat(10);
function mock({ lifecycle = 'active', fail, missing = false, alias = false, changedDocs = false, paginated = false, incident = false, notFound = false } = {}) {
  return async (url, options) => {
    if (Object.values(SOURCES).includes(url)) {
      assert.deepEqual(options.headers, {});
      return new Response(changedDocs ? `${docs}\nNew guidance.` : docs);
    }
    if (url.includes('status.claude.com')) {
      assert.deepEqual(options.headers, {});
      return Response.json({ status: { indicator: 'minor' }, components: [{ name: 'Claude API (api.anthropic.com)', status: incident ? 'degraded_performance' : 'operational' }] });
    }
    assert.equal(options.headers['x-api-key'], 'secret-fixture');
    assert.equal(options.redirect, 'error');
    if (fail) return new Response('secret-provider-error-text', { status: fail });
    if (url.includes('/v1/models?')) {
      if (paginated && !url.includes('after_id=')) return Response.json({ data: [{ id: 'claude-test-primary' }], has_more: true, last_id: 'claude-test-primary' });
      return Response.json({ data: [{ id: 'claude-test-primary' }, { id: 'claude-test-secondary' }], has_more: false });
    }
    if (notFound) return new Response('', { status: 404 });
    const id = url.split('/').at(-1);
    return Response.json({ id: alias ? `${id}-resolved` : id, lifecycle: missing ? undefined : lifecycle, retires_at: '2026-01-01T00:00:00Z' });
  };
}
const env = { ANTHROPIC_API_KEY: 'secret-fixture' };

test('inventory includes all source locations and environment models, excluding dependencies', async t => {
  const root = await fixture(t);
  await mkdir(join(root, 'src', 'node_modules'));
  await writeFile(join(root, 'src', 'node_modules', 'vendor.js'), '"claude-ignore-me"');
  const models = await inventory(root, { AI_PRIMARY_MODEL: 'claude-env', AI_FALLBACK_MODEL: 'claude-fallback', ANTHROPIC_WATCH_MODELS: 'claude-extra' });
  assert.deepEqual(models.map(m => m.id), ['claude-env', 'claude-extra', 'claude-fallback', 'claude-test-primary', 'claude-test-secondary']);
  assert.deepEqual(models.find(m => m.id === 'claude-test-secondary').locations, ['src/models.ts:2']);
});

test('complete first run establishes baseline; past tentative date does not retire an active model', async t => {
  const result = await inspect({ root: await fixture(t), env, fetchImpl: mock() });
  assert.equal(result.report.attentionRequired, false);
  assert.equal(Object.keys(result.state.sources).length, 4);
  assert.equal(result.state.models.length, 2);
});

test('deprecated and retired configured models are flagged on first run', async t => {
  const root = await fixture(t);
  for (const lifecycle of ['deprecated', 'retired']) {
    const result = await inspect({ root, env, fetchImpl: mock({ lifecycle }) });
    assert.equal(result.report.findings.filter(f => f.kind === `model_${lifecycle}`).length, 2);
    assert.equal(result.report.attentionRequired, true);
  }
});

test('missing credential and auth failure are incomplete checks, never healthy; baseline is retained', async t => {
  const root = await fixture(t);
  const previous = { sources: { releases: 'old' }, models: ['claude-old'] };
  for (const options of [{ env: {}, fetchImpl: mock() }, { env, fetchImpl: mock({ fail: 401 }) }]) {
    const result = await inspect({ root, previous, ...options });
    assert.equal(result.report.attentionRequired, true);
    assert.equal(result.state, previous);
    assert.doesNotMatch(JSON.stringify(result.report), /secret-fixture|secret-provider-error-text/);
  }
});

test('missing lifecycle metadata is reported as unverified', async t => {
  const result = await inspect({ root: await fixture(t), env, fetchImpl: mock({ missing: true }) });
  assert.equal(result.report.failures.filter(f => f.kind === 'model_verification_failed').length, 2);
  assert.match(summary(result.report), /unverified/);
});

test('404 models are unavailable; catalogue removal alone does not imply retirement', async t => {
  const result = await inspect({ root: await fixture(t), env, previous: { models: ['claude-old'] }, fetchImpl: mock({ notFound: true }) });
  assert.equal(result.report.findings.filter(f => f.kind === 'configured_model_unavailable').length, 2);
  assert.equal(result.report.findings.some(f => f.kind === 'catalog_model_removed'), true);
  assert.equal(result.report.findings.some(f => f.kind === 'model_retired'), false);
});

test('pagination is exhausted and additions are detected against a prior baseline', async t => {
  const result = await inspect({ root: await fixture(t), env, previous: { models: ['claude-test-primary'] }, fetchImpl: mock({ paginated: true }) });
  assert.equal(result.report.findings.some(f => f.kind === 'new_model' && f.id === 'claude-test-secondary'), true);
  assert.equal(result.state.models.length, 2);
});

test('changed aliases and official documentation require review', async t => {
  const root = await fixture(t);
  const baseline = await inspect({ root, env, fetchImpl: mock() });
  const result = await inspect({ root, env, previous: baseline.state, fetchImpl: mock({ alias: true, changedDocs: true }) });
  assert.equal(result.report.findings.filter(f => f.kind === 'alias_changed').length, 2);
  assert.equal(result.report.findings.filter(f => f.kind === 'documentation_changed').length, 4);
});

test('source failure does not advance baseline or claim a healthy check', async t => {
  const root = await fixture(t);
  const baseline = await inspect({ root, env, fetchImpl: mock() });
  const fetchImpl = async (url, options) => url === SOURCES.releases ? new Response('failure', { status: 503 }) : mock()(url, options);
  const result = await inspect({ root, env, previous: baseline.state, fetchImpl });
  assert.equal(result.state, baseline.state);
  assert.equal(result.report.failures[0].httpStatus, 503);
});

test('provider outage is distinct from model lifecycle findings', async t => {
  const result = await inspect({ root: await fixture(t), env, fetchImpl: mock({ incident: true }) });
  assert.equal(result.report.findings.some(f => f.kind === 'provider_incident'), true);
  assert.equal(result.report.findings.some(f => f.kind === 'model_retired'), false);
});
