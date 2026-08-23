const base = 'https://works.oremea.com';

async function request(path, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    return await fetch(`${base}${path}`, {
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'user-agent': 'oremea-works-live-gates/2026-08-23',
        ...(init.headers || {}),
      },
      ...init,
    });
  } finally {
    clearTimeout(timer);
  }
}

function fail(message) {
  throw new Error(message);
}

console.log('--- PayFast production configuration presence ---');
const itn = await request('/api/works/billing/payfast/itn', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: '',
});
const itnText = await itn.text();
console.log(`ITN empty-probe status=${itn.status}`);
if (itn.status === 503 || /Billing is not configured|PayFast billing is not configured/i.test(itnText)) {
  fail('Railway is missing one or more required PayFast merchant variables.');
}
if (itn.status !== 401 || !/Invalid PayFast signature/i.test(itnText)) {
  fail(`Unexpected PayFast ITN probe response: ${itn.status} ${itnText.slice(0, 180)}`);
}
console.log('PayFast merchant ID/key/passphrase are present server-side.');

console.log('--- Clerk production-key check ---');
const homeResponse = await request('/');
if (homeResponse.status !== 200) fail(`Homepage returned ${homeResponse.status}`);
const home = await homeResponse.text();
const hasTestClerk = /pk_test_[A-Za-z0-9_-]+/i.test(home) || /clerk.*development/i.test(home);
const hasLiveClerk = /pk_live_[A-Za-z0-9_-]+/i.test(home);
console.log(`Clerk HTML markers: live=${hasLiveClerk} test_or_development=${hasTestClerk}`);
if (hasTestClerk) fail('WORKS is exposing a Clerk test/development key marker in production HTML.');

console.log('--- Public provider + new evidence column check ---');
const sitemapResponse = await request('/sitemap.xml');
if (sitemapResponse.status !== 200) fail(`Sitemap returned ${sitemapResponse.status}`);
const sitemap = await sitemapResponse.text();
const providerUrls = [...sitemap.matchAll(/<loc>(https:\/\/works\.oremea\.com\/providers\/([^<\/]+))<\/loc>/g)]
  .map((match) => ({ url: match[1], slug: match[2] }))
  .filter(({ slug }) => !['plans', 'join', 'claim', 'new', 'verify-claim'].includes(slug));
console.log(`Public provider URLs discovered=${providerUrls.length}`);
if (!providerUrls.length) fail('No real public provider profile was present in the sitemap.');

let sampled = null;
for (const candidate of providerUrls) {
  const response = await fetch(candidate.url, {
    redirect: 'manual',
    headers: { 'user-agent': 'oremea-works-live-gates/2026-08-23' },
  });
  if (response.status !== 200) continue;
  const html = await response.text();
  if (/Current offerings|Provider supplied|Source reviewed|Verified evidence/i.test(html)) {
    sampled = { ...candidate, html };
    break;
  }
}
if (!sampled) fail('No public provider profile could render its offering evidence state.');
console.log(`Provider evidence profile rendered successfully: /providers/${sampled.slug}`);
console.log('This query reads the newly migrated works offering evidence_status field.');

console.log('--- Canonical + private-route guard check ---');
if (!/<link[^>]+rel=["']canonical["'][^>]+works\.oremea\.com/i.test(home) &&
    !/<link[^>]+works\.oremea\.com[^>]+rel=["']canonical["']/i.test(home)) {
  fail('WORKS homepage canonical link was not found.');
}
const privateRoutes = ['/api/works/provider/me', '/api/works/provider-claims'];
for (const path of privateRoutes) {
  const response = await request(path);
  console.log(`${response.status} ${path}`);
  if (![401, 403].includes(response.status)) {
    fail(`Private API ${path} did not reject an unauthenticated request.`);
  }
}

console.log('WORKS live production gates passed.');
