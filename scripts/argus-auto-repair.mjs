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
  if (!['deprecated', 'retired', 'unavailable'].includes(live.lifecycle))
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

async function main() {
  const root = process.cwd();
  const configPath = resolve(root, CONFIG_PATH);
  const report = JSON.parse(await readFile(resolve(root, '.anthropic-watch/report.json'), 'utf8'));
  const configSource = await readFile(configPath, 'utf8');
  const proposal = proposeRepair({ report, configSource, env: process.env });
  if (proposal.status === 'no_action') {
    console.log('ARGUS_MODEL_CURRENTLY_ACTIVE: no source changes');
    return;
  }
  if (proposal.status === 'blocked') {
    console.error('ARGUS_AUTO_REPAIR_BLOCKED:', proposal.reason);
    process.exitCode = 1;
    return;
  }
  // A no-customer-data provider call establishes actual availability before editing code.
  await probe({ apiKey: process.env.ANTHROPIC_API_KEY, configSource: proposal.content });
  await writeFile(configPath, proposal.content);
  console.log('ARGUS_VERIFIED_SAME_LINE_REPAIR:', proposal.from, '->', proposal.to);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error('ARGUS_AUTO_REPAIR_FAILED:', /^ARGUS_/.test(error?.message || '') ? error.message : 'REPAIR_CANNOT_COMPLETE');
    process.exitCode = 1;
  });
}
