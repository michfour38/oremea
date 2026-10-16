import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(join(dir, entry.name)) :
    entry.isFile() ? [join(dir, entry.name)] : []
  );
}

const files = [...walk('app'), ...walk('components'), ...walk('src')]
  .filter(p => /\.(tsx|ts|jsx|js)$/.test(p));
const pages = walk('app').filter(p => /\/page\.(tsx|ts|jsx|js)$/.test(p));

function pageMatcher(page) {
  const segments = page.replace(/^app\//, '').replace(/(^|\/)page\.(tsx|ts|jsx|js)$/, '')
    .split('/').filter(s => s && !/^\(.*\)$/.test(s));
  const suffix = segments.map(s => {
    if (/^\[\[\.\.\.[^\]]+\]\]$/.test(s)) return '(?:/.*)?';
    if (/^\[\.\.\.[^\]]+\]$/.test(s)) return '/.+';
    if (/^\[[^\]]+\]$/.test(s)) return '/[^/]+';
    return '/' + s;
  }).join('');
  return new RegExp('^' + (suffix || '/') + '/?$');
}

const routes = pages.map(pageMatcher);
const ignoredPrefixes = ['/api/', '/_next/', '/images/', '/fonts/', '/icons/', '/public/', '/assets/'];
const issues = [];

function valid(destination) {
  const path = destination.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  if (ignoredPrefixes.some(prefix => path.startsWith(prefix))) return true;
  // Explicitly mapped host-aware entry flow in middleware.ts.
  if (path === '/begin') return true;
  // Legacy legal document links belong to the separately deployed WORKS app.
  // Their remote health must be checked by WORKS, not treated as local Next.js pages.
  if (path.startsWith('/works/')) return true;
  if (/\.(svg|png|jpg|jpeg|webp|ico|pdf|woff2?|txt|xml)$/i.test(path)) return true;
  return routes.some(route => route.test(path));
}

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const references = [
    /\bhref\s*=\s*["'](\/[^"'\s]*)["']/g,
    /\bhref\s*:\s*["'](\/[^"'\s]*)["']/g,
    /\b(?:redirect|permanentRedirect|router\.push|router\.replace|window\.location\.replace)\s*\(\s*["'](\/[^"'\s]*)["']/g,
    /\bwindow\.location\.href\s*=\s*["'](\/[^"'\s]*)["']/g
  ];
  for (const regex of references) {
    for (const match of content.matchAll(regex)) {
      if (!valid(match[1])) issues.push({
        file, destination: match[1], line: content.slice(0, match.index).split('\n').length
      });
    }
  }
}

if (issues.length) {
  console.error('Missing local pages referenced by literal links/redirects:');
  for (const issue of issues)
    console.error(issue.file + ':' + issue.line + ' -> ' + issue.destination);
  process.exitCode = 1;
} else {
  console.log('Local route reference integrity: OK (' + pages.length + ' pages, ' + files.length + ' sources)');
}
