import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ALLOWED = 'src/lib/ai/ai-config.ts';
export function validateChangePaths(paths) {
  if (paths.length !== 1 || paths[0] !== ALLOWED) throw new Error('ARGUS_CHANGE_SCOPE_VIOLATION');
}
export function validateConfig(content) {
  const expected = /^export const AI_MODELS = \{\n  primary:\n    process\.env\.AI_PRIMARY_MODEL \|\|\n    "(claude-[a-z0-9.-]+)",\n\n  fallback:\n    process\.env\.AI_FALLBACK_MODEL \|\| null,\n\} as const\s*$/;
  const match = content.match(expected);
  if (!match) throw new Error('ARGUS_CONFIG_SHAPE_VIOLATION');
  return match[1];
}
export function validateModelCatalog(model, models) {
  if (!Array.isArray(models) || !models.some(m => m?.id === model && m?.lifecycle === 'active')) throw new Error('ARGUS_MODEL_NOT_VERIFIED_ACTIVE');
}
function main() {
 const base = process.env.ARGUS_BASE_SHA;
 if (!/^[a-f0-9]{40}$/.test(base || '')) throw new Error('ARGUS_BASE_SHA_REQUIRED');
 const files = execFileSync('git',['diff','--name-only',base,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 validateChangePaths(files);
 const current = readFileSync(ALLOWED,'utf8');
 const previous = execFileSync('git',['show',base+':'+ALLOWED],{encoding:'utf8'});
 validateConfig(previous);
 validateConfig(current);
 console.log('ARGUS_SCOPE_AND_CONFIG_GATE_PASS: exactly one authorized model configuration file changed');
}
if(process.argv[1] && import.meta.url === new URL('file://'+process.argv[1]).href) main();
