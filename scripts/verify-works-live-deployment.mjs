const base = 'https://works.oremea.com';
const expectedRoutes = [
  '/',
  '/my',
  '/providers/plans',
  '/providers/join',
  '/provider',
  '/provider/capabilities',
  '/provider/billing',
  '/verification',
  '/terms',
  '/reviews-policy',
  '/partner-disclosure',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(path, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    return await fetch(`${base}${path}`, {
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'user-agent': 'oremea-works-release-smoke/2026-08-23' },
      ...init,
    });
  } finally {
    clearTimeout(timer);
  }
}

function acceptable(status) {
  return status === 200 || [301, 302, 307, 308].includes(status);
}

let live = false;
for (let attempt = 1; attempt <= 48; attempt += 1) {
  try {
    const [robotsResponse, sitemapResponse, verifyResponse] = await Promise.all([
      get('/robots.txt'),
      get('/sitemap.xml'),
      get('/providers/verify-claim'),
    ]);
    const robots = await robotsResponse.text();
    const sitemap = await sitemapResponse.text();

    if (
      robotsResponse.status === 200 &&
      sitemapResponse.status === 200 &&
      acceptable(verifyResponse.status) &&
      /sitemap/i.test(robots) &&
      /works\.oremea\.com/i.test(sitemap)
    ) {
      console.log(`New WORKS release signature is live on attempt ${attempt}.`);
      console.log('--- robots.txt ---');
      console.log(robots.trim());
      console.log('--- sitemap URL count ---');
      console.log((sitemap.match(/https:\/\/works\.oremea\.com/g) || []).length);
      live = true;
      break;
    }

    console.log(
      `attempt=${attempt} robots=${robotsResponse.status} sitemap=${sitemapResponse.status} verify-claim=${verifyResponse.status}`,
    );
  } catch (error) {
    console.log(`attempt=${attempt} network-error=${error instanceof Error ? error.message : String(error)}`);
  }
  await sleep(10_000);
}

if (!live) {
  throw new Error('WORKS did not expose the freshly promoted release signature.');
}

for (const path of expectedRoutes) {
  const response = await get(path);
  console.log(`${response.status} ${path}`);
  if (!acceptable(response.status)) {
    throw new Error(`Unexpected status ${response.status} for ${path}`);
  }
}

const homeResponse = await get('/');
const home = await homeResponse.text();
if (!/WORKS/i.test(home)) throw new Error('Homepage does not identify WORKS.');
if (!/canonical/i.test(home)) throw new Error('Homepage canonical metadata is missing.');

console.log('WORKS live smoke passed.');
