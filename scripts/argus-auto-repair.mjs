// ARGUS changes only the canonical model ID, only when the configured model
// is deprecated, retired or unavailable, and only after a live provider probe.
// It never mutates participant data, credentials or other source files.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateConfig } from './argus-change-gate.mjs';
import { probe } from './argus-synthetic-probe.mjs';

export const CONFIG_PATH = 'src/lib/ai/ai-config.ts';
const LINES = new Set(['sonnet', 'haiku', 'opus']);
const ID = /^claude-[a-z0-9.-]+$/;

export function proposeRepair({ report, configSource, env = {} } = {}) {
  const current = validateConfig(configSource);
  if (env.AI_PRIMARY_MODEL && env.AI_PRIMARY_MODEL.trim() !== current)
    return { status: 'blocked', reason: 'PRIMARY_MODEL_ENV_OVERRIDE', from: current };
  if (!report || !Array.isArray(report.models))
    return { status: 'blocked', reason: 'WATCH_REPORT_MISSING', from: current };
  const live = report.models.find(model => model.id === current);
  if (!live) return { status: 'blocked', reason: 'CURRENT_MODEL_NOT_VERIFIED', from: current };
  if (live.lifecycle === 'active') return { status: 'no_action', reason: 'CURRENT_MODEL_ACTIVE', from: current };
  if (live.lifecycle === 'deprecated') return { status: 'no_action', reason: 'CURRENT_MODEL_DEPRECATED', from: current };
  if (!['retired', 'unavailable'].includes(live.lifecycle))
    return { status: 'blocked', reason: 'CURRENT_MODEL_LIFECYCLE_UNKNOWN', from: current };
  if (!Array.isArray(report.catalog) || report.failures?.some(f => f.source === 'models_catalog'))
    return { status: 'blocked', reason: 'PROVIDER_CATALOG_UNVERIFIED', from: current };

  // The provider supplies the actual model line; names alone cannot certify a new line.
  const expectedLine = live.line || /^claude-(sonnet|haiku|opus)-/.exec(current)?.[1];
  if (!LINES.has(expectedLine)) return { status: 'blocked', reason: 'MODEL_LINE_UNVERIFIED', from: current };

  // Catalog lists newest first; choose the most recently released ACTIVE same-line model.
  // Other model lines (including experimental ones) must never be automatically selected.
  const candidates = report.catalog
    .filter(m => m && ID.test(m.id || '') && m.id !== current &&
      m.lifecycle === 'active' && m.line === expectedLine &&
      typeof m.created_at === 'string' && !Number.isNaN(Date.parse(m.created_at)))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  if (!candidates.length)
    return { status: 'blocked', reason: 'NO_VERIFIED_SAME_LINE_REPLACEMENT', from: current };

  const candidate = candidates[0];
  const nextSource = configSource.replace('"' + current + '"', '"' + candidate.id + '"');
  if (nextSource === configSource || validateConfig(nextSource) !== candidate.id)
    return { status: 'blocked', reason: 'CONFIG_REPLACEMENT_UNSAFE', from: current };
  return { status: 'proposed', reason: 'CURRENT_MODEL_' + live.lifecycle.toUpperCase(),
    from: current, to: candidate.id, content: nextSource };
}

export async function probeStructuredCompatibility({ apiKey, model, fetchImpl = fetch } = {}) {
  if (!apiKey || !ID.test(model || '')) throw new Error('ARGUS_STRUCTURED_PROBE_INVALID_INPUT');
  const thinking = model === 'claude-sonnet-5' ? { type: 'disabled' } :
    model === 'claude-sonnet-5-5' ? { type: 'between_tools' } : undefined;
  const response = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model, max_tokens: 192, ...(thinking ? { thinking } : {}),
      output_config: { format: { type: 'json_schema',
        schema: { type: 'object', properties: { ok: { type: 'boolean' } },
          required: ['ok'], additionalProperties: false } } },
      messages: [{ role: 'user', content: 'ARGUS synthetic structured compatibility test. Respond with ok=true.' }],
    }),
  });
  if (!response.ok) throw new Error('ARGUS_STRUCTURED_PROBE_HTTP_' + response.status);
  const data = await response.json();
  const text = Array.isArray(data?.content)
    ? data.content.filter(block => block?.type === 'text').map(block => block.text).join('').trim()
    : '';
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('ARGUS_STRUCTURED_PROBE_INVALID_JSON'); }
  if (data.model !== model || data.stop_reason !== 'end_turn' || parsed.ok !== true)
    throw new Error('ARGUS_STRUCTURED_PROBE_RESPONSE_INVALID');
  return { status: 'pass', model, customerDataUsed: false };
}

async function main() {
  const root = process.cwd();
  const configPath = resolve(root, CONFIG_PATH);
  const report = JSON.parse(await readFile(resolve(root, '.anthropic-watch/report.json'), 'utf8'));
  const configSource = await readFile(configPath, 'utf8');
  const proposal = proposeRepair({ report, configSource, env: process.env });
  if (proposal.status === 'no_action') {
    console.log('ARGUS_MODEL_RETAINED:', proposal.reason);
    return;
  }
  if (proposal.status === 'blocked') {
    console.error('ARGUS_AUTO_REPAIR_BLOCKED:', proposal.reason);
    process.exitCode = 1;
    return;
  }
  // A no-customer-data provider call establishes actual availability before editing code.
  await probe({ apiKey: process.env.ANTHROPIC_API_KEY, configSource: proposal.content });
  await probeStructuredCompatibility({ apiKey: process.env.ANTHROPIC_API_KEY, model: proposal.to });
  await writeFile(configPath, proposal.content);
  console.log('ARGUS_VERIFIED_SAME_LINE_REPAIR:', proposal.from, '->', proposal.to);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error('ARGUS_AUTO_REPAIR_FAILED:', /^ARGUS_/.test(error?.message || '') ? error.message : 'REPAIR_CANNOT_COMPLETE');
    process.exitCode = 1;
  });
}
