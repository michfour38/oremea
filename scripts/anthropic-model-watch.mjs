import { createHash } from 'node:crypto';
import { readdir, readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SOURCES = {
  deprecations: 'https://platform.claude.com/docs/en/about-claude/model-deprecations.md',
  releases: 'https://platform.claude.com/docs/en/release-notes/overview.md',
  migration: 'https://platform.claude.com/docs/en/about-claude/models/migration-guide.md',
  pricing: 'https://platform.claude.com/docs/en/about-claude/pricing.md',
};

const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'build']);
const sha = value => createHash('sha256').update(value).digest('hex');

export async function inventory(root, env = {}) {
  const models = new Map();
  const add = (id, location) => {
    if (!/^claude-[a-z0-9.-]+$/.test(id)) throw new Error('Invalid configured model ID');
    models.set(id, [...new Set([...(models.get(id) || []), location])]);
  };
  async function walk(directory) {
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of entries) {
      if (SKIP.has(entry.name) || entry.isSymbolicLink()) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/\.[cm]?[jt]sx?$/.test(entry.name)) {
        const text = await readFile(path, 'utf8');
        for (const match of text.matchAll(/["'`](claude-[a-z0-9.-]+)["'`]/g)) {
          add(match[1], `${relative(root, path)}:${text.slice(0, match.index).split('\n').length}`);
        }
      }
    }
  }
  for (const dir of ['src', 'app']) await walk(join(root, dir));
  for (const name of ['AI_PRIMARY_MODEL', 'AI_FALLBACK_MODEL']) {
    if (env[name]) add(env[name].trim(), `environment:${name}`);
  }
  for (const id of (env.ANTHROPIC_WATCH_MODELS || '').split(',').map(v => v.trim()).filter(Boolean)) {
    add(id, 'environment:ANTHROPIC_WATCH_MODELS');
  }
  return [...models].sort(([a], [b]) => a.localeCompare(b)).map(([id, locations]) => ({ id, locations }));
}

async function request(url, { key, fetchImpl, json = false }) {
  const headers = key ? { 'x-api-key': key, 'anthropic-version': '2023-06-01' } : {};
  // Do not follow API redirects with a credential attached.
  const response = await fetchImpl(url, { headers, redirect: key ? 'error' : 'follow', signal: AbortSignal.timeout(20000) });
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return json ? response.json() : response.text();
}

export async function inspect({ root, env = {}, previous = {}, fetchImpl = fetch }) {
  const checkedAt = new Date().toISOString();
  const report = { checkedAt, models: await inventory(root, env), sources: {}, findings: [], failures: [] };
  const state = { sources: { ...previous.sources }, models: previous.models || [], resolutions: { ...previous.resolutions } };
  for (const [name, url] of Object.entries(SOURCES)) {
    try {
      const body = await request(url, { fetchImpl });
      if (body.length < 100 || /<!doctype|<html/i.test(body)) throw new Error('Expected Markdown documentation');
      const hash = sha(body.replace(/\r\n/g, '\n').trim());
      report.sources[name] = { url, hash, changed: Boolean(previous.sources?.[name] && previous.sources[name] !== hash) };
      if (report.sources[name].changed) report.findings.push({ kind: 'documentation_changed', source: name, url });
      state.sources[name] = hash;
    } catch (error) {
      // Provider error bodies and exceptions may contain sensitive details; omit them.
      report.failures.push({ source: name, kind: 'source_unavailable', httpStatus: error.status || null });
    }
  }
  try {
    const status = await request('https://status.claude.com/api/v2/summary.json', { fetchImpl, json: true });
    const api = status.components?.find(component => /Claude API|api\.anthropic\.com/i.test(component.name));
    if (!status.status?.indicator || !api?.status) throw new Error('Malformed status response');
    report.providerStatus = status.status.indicator;
    report.inferenceStatus = api.status;
    if (api.status !== 'operational') report.findings.push({ kind: 'provider_incident', component: api.name, status: api.status });
  } catch (error) {
    report.failures.push({ source: 'status', kind: 'source_unavailable', httpStatus: error.status || null });
  }

  if (!report.models.length) report.failures.push({ kind: 'no_models_found' });
  if (!env.ANTHROPIC_API_KEY) {
    report.failures.push({ kind: 'model_verification_unavailable', reason: 'ANTHROPIC_API_KEY is not configured for this watcher' });
  } else {
    try {
      const catalog = [];
      let cursor = null;
      const cursors = new Set();
      do {
        const url = new URL('https://api.anthropic.com/v1/models');
        url.searchParams.set('limit', '100');
        if (cursor) url.searchParams.set('after_id', cursor);
        const page = await request(url.toString(), { fetchImpl, key: env.ANTHROPIC_API_KEY, json: true });
        if (!Array.isArray(page.data) || page.data.some(m => typeof m.id !== 'string')) throw new Error('Malformed model catalog');
        catalog.push(...page.data.map(m => m.id));
        cursor = page.has_more ? page.last_id : null;
        if (page.has_more && (!cursor || cursors.has(cursor))) throw new Error('Invalid pagination');
        if (cursor) cursors.add(cursor);
        if (cursors.size > 100) throw new Error('Pagination limit');
      } while (cursor);
      if (!catalog.length) throw new Error('Empty model catalog');
      if (previous.models?.length) {
        for (const id of catalog.filter(id => !previous.models.includes(id))) report.findings.push({ kind: 'new_model', id });
        for (const id of previous.models.filter(id => !catalog.includes(id))) report.findings.push({ kind: 'catalog_model_removed', id });
      }
      state.models = [...new Set(catalog)].sort();
    } catch (error) {
      report.failures.push({ source: 'models_catalog', kind: 'source_unavailable', httpStatus: error.status || null });
    }
    for (const model of report.models) {
      try {
        const data = await request(`https://api.anthropic.com/v1/models/${encodeURIComponent(model.id)}`, { fetchImpl, key: env.ANTHROPIC_API_KEY, json: true });
        if (typeof data.id !== 'string' || !['active', 'deprecated', 'retired'].includes(data.lifecycle)) throw new Error('Missing lifecycle data');
        model.resolvedId = data.id;
        model.lifecycle = data.lifecycle;
        model.retiresAt = data.retires_at || null;
        const prior = previous.resolutions?.[model.id];
        if (prior && prior !== data.id) report.findings.push({ kind: 'alias_changed', id: model.id, from: prior, to: data.id });
        state.resolutions[model.id] = data.id;
        if (data.lifecycle !== 'active') report.findings.push({ kind: `model_${data.lifecycle}`, id: model.id, resolvedId: data.id, retiresAt: model.retiresAt, locations: model.locations });
      } catch (error) {
        if (error.status === 404) {
          model.lifecycle = 'unavailable';
          report.findings.push({ kind: 'configured_model_unavailable', id: model.id, locations: model.locations });
        } else report.failures.push({ kind: 'model_verification_failed', id: model.id, httpStatus: error.status || null });
      }
    }
  }
  report.attentionRequired = Boolean(report.findings.length || report.failures.length);
  // Never advance a baseline after an incomplete check.
  return { report, state: report.failures.length ? previous : { ...state, checkedAt } };
}

export function summary(report) {
  return ['# Anthropic model watch', '', `Checked: ${report.checkedAt}`, '',
    `Result: ${report.attentionRequired ? 'attention required' : 'no changes detected'}`, '',
    '| Configured model | API result | Retirement | Source locations |', '| --- | --- | --- | --- |',
    ...report.models.map(m => `| ${m.id} | ${m.lifecycle || 'unverified'} | ${m.retiresAt || '—'} | ${m.locations.join(', ')} |`), '',
    '## Findings', '', ...report.findings.map(f => `- ${JSON.stringify(f)}`), '',
    '## Incomplete checks', '', ...report.failures.map(f => `- ${JSON.stringify(f)}`), '',
    'Documentation changes require review; a new model is not proof that an upgrade is compatible.',
    'This check sends no participant text, makes no generation requests, and changes no production configuration.', '',
  ].join('\n');
}

async function atomicJSON(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(`${path}.tmp`, `${JSON.stringify(data, null, 2)}\n`);
  await rename(`${path}.tmp`, path);
}

async function main() {
  const root = process.cwd();
  const statePath = resolve(root, process.env.ANTHROPIC_WATCH_STATE || '.anthropic-watch/state.json');
  let previous = {};
  try { previous = JSON.parse(await readFile(statePath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const { report, state } = await inspect({ root, env: process.env, previous });
  await atomicJSON(resolve(root, '.anthropic-watch/report.json'), report);
  await writeFile(resolve(root, '.anthropic-watch/report.md'), summary(report));
  if (!report.failures.length) await atomicJSON(statePath, state);
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, summary(report), { flag: 'a' });
  console.log(summary(report));
  process.exitCode = report.attentionRequired ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(() => { console.error('Anthropic model watch could not complete; no production changes were made.'); process.exitCode = 1; });
}
