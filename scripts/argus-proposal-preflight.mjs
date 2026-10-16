import { readFileSync } from 'node:fs';
import { validateConfig, validateModelCatalog } from './argus-change-gate.mjs';

export const CONFIG_PATH = 'src/lib/ai/ai-config.ts';
export function prepareModelProposal({ currentSource, candidate, verifiedCatalog, evidence } = {}) {
  const currentModel = validateConfig(currentSource);
  if (!candidate || !/^claude-[a-z0-9.-]+$/.test(candidate)) throw new Error('ARGUS_INVALID_CANDIDATE');
  if (candidate === currentModel) throw new Error('ARGUS_NO_CHANGE');
  validateModelCatalog(candidate, verifiedCatalog);
  if (!evidence || evidence.modelId !== candidate || evidence.compatibilityPassed !== true ||
      evidence.pricingReviewed !== true || evidence.qualityBenchmarked !== true ||
      evidence.reportSource !== 'trusted-qualification') throw new Error('ARGUS_EVIDENCE_INCOMPLETE');
  const replacement = currentSource.replace('"' + currentModel + '"', '"' + candidate + '"');
  if (replacement === currentSource || validateConfig(replacement) !== candidate)
    throw new Error('ARGUS_INVALID_REPLACEMENT');
  return { path: CONFIG_PATH, from: currentModel, to: candidate, content: replacement,
    promotionAllowed: false, requires: ['one-file-diff', 'launch-contracts','typecheck','production-build','protected-review'] };
}
export function readProposalInput(path = CONFIG_PATH) {
  if (path !== CONFIG_PATH) throw new Error('ARGUS_PATH_NOT_ALLOWED');
  return readFileSync(path, 'utf8');
}
// No CLI that accepts arbitrary untrusted model suggestions. No GitHub write credentials.
