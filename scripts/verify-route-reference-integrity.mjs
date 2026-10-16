import {readdirSync,readFileSync,statSync,existsSync} from 'node:fs';
import {join,relative} from 'node:path';
const ROOT=process.cwd();
function walk(dir) {
 if(!existsSync(dir))return [];
 return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):e.isFile()?[join(dir,e.name)]:[]);
}
const files=[...walk('app'),...walk('components'),...walk('src')].filter(p=>/\.(tsx|ts|jsx|js)$/.test(p));
const pages=walk('app').filter(p=>/\/page\.(tsx|ts|jsx|js)$/.test(p));
const normalizeRoute=p=> {
 const bits=relative('app',p).replace(/\\\\/g,'/').replace(/\\/page\\.[^.]+$/,'').split('/');
 const segments=bits.filter(x=>x&&!/^\\(.*\\)$/.test(x));
 return segments.length?'/'+segments.join('/'):'/';
};
const patterns=pages.map(p=>{
 const route=normalizeRoute(p);
 const segments=route.split('/').filter(Boolean);
 const suffix=segments.map(seg=>{
  if(/^\\[\\[\\.\\.\\.[^\\]]+\\]\\]$/.test(seg)) return '(?:/.*)?';
  if(/^\\[\\.\\.\\.[^\\]]+\\]$/.test(seg)) return '/.+';
  if(/^\\[[^\\]]+\\]$/.test(seg)) return '/[^/]+';
  return '/'+seg.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&');
 }).join('');
 return new RegExp('^'+(suffix||'/')+'/?$');
});
const extraKnownRoutes=new Set(['/api','/sign-out']);
const ignorePrefixes=['/api/','/_next/','/images/','/fonts/','/icons/','/public/','/assets/'];
function valid(s) {
 const path=s.split(/[?#]/)[0].replace(/\/$/,'')||'/';
 if(ignorePrefixes.some(p=>path.startsWith(p))||extraKnownRoutes.has(path))return true;
 if(/\.(svg|png|jpg|jpeg|webp|ico|pdf|woff2?|txt|xml)$/i.test(path))return true;
 return patterns.some(p=>p.test(path));
}
const issues=[];
for(const file of files){
 const text=readFileSync(file,'utf8');
 // Only literal, root-relative destinations. Variables and external product hosts
 // require separate integration checks rather than guessing at runtime values.
 const patterns=[
  /\bhref\s*=\s*["'](\/[^"'\s]*)["']/g,
  /\bhref\s*:\s*["'](\/[^"'\s]*)["']/g,
  /\b(?:redirect|permanentRedirect|router\.push|router\.replace|window\.location\.replace)\s*\(\s*["'](\/[^"'\s]*)["']/g,
  /\bwindow\.location\.href\s*=\s*["'](\/[^"'\s]*)["']/g
 ];
 for(const pattern of patterns)for(const m of text.matchAll(pattern)) {
  const dest=m[1];if(!valid(dest))issues.push({file,dest,line:text.slice(0,m.index).split('\n').length});
 }
}
if(issues.length){
 console.error('Missing local page routes referenced by static links/redirects:');
 for(const issue of issues)console.error(`${issue.file}:${issue.line} -> ${issue.dest}`);
 process.exitCode=1;
}else console.log(`Local route reference integrity: OK (${pages.length} pages, ${files.length} sources)`);
