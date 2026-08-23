import { spawnSync } from 'node:child_process';

const result = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
});

let report;
try {
  report = JSON.parse(result.stdout || '{}');
} catch (error) {
  console.error(result.stdout);
  console.error(result.stderr);
  throw error;
}

console.log('PROD_AUDIT_METADATA', JSON.stringify(report.metadata?.vulnerabilities ?? {}));
for (const [name, entry] of Object.entries(report.vulnerabilities ?? {})) {
  if (!['critical', 'high'].includes(entry.severity)) continue;
  const via = (entry.via ?? []).map((item) =>
    typeof item === 'string'
      ? item
      : `${item.source ?? 'unknown'}:${item.severity ?? 'unknown'}:${item.title ?? ''}`
  );
  console.log('PROD_AUDIT_ITEM', JSON.stringify({
    name,
    severity: entry.severity,
    range: entry.range,
    fixAvailable: entry.fixAvailable,
    via,
  }));
}

if ((report.metadata?.vulnerabilities?.critical ?? 0) > 0) {
  process.exitCode = 2;
}
