import { defineConfig, devices } from "@playwright/test";

const rawUrl = process.env.OREMEA_PARTNER_PREVIEW_URL;
if (!rawUrl) throw new Error("OREMEA_PARTNER_PREVIEW_URL required; never target live OREMEA.");
const url = new URL(rawUrl);
const host = url.hostname.toLowerCase();
const localhost = host === "localhost" || host === "127.0.0.1";
const namedPreview = /(?:^|[-.])(preview|pr-293|partner-e2e)(?:[-.]|$)/.test(host);
const trustedHosting = host.endsWith(".up.railway.app") ||
  host.endsWith(".vercel.app") || host.endsWith(".railway.app");
if ((!localhost && (!trustedHosting || !namedPreview || url.protocol !== "https:")) ||
  /(^|\.)oremea\.com$/.test(host) ||
  Boolean(url.username || url.password || url.search || url.hash) ||
  url.pathname !== "/") {
  throw new Error("Refusing target: use an isolated preview hostname or local test server, never production.");
}
if (process.env.OREMEA_E2E_ISOLATED_PREVIEW !== "true" ||
  process.env.OREMEA_E2E_ALLOW_WRITES !== "true") {
  throw new Error("Requires explicit isolated-preview AND disposable-database write acknowledgments.");
}
if (!process.env.CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_") ||
  !process.env.CLERK_SECRET_KEY?.startsWith("sk_test_")) {
  throw new Error("A separate Clerk development instance (pk_test_/sk_test_) is required.");
}

export default defineConfig({
  testDir: "./specs",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 12_000 },
  reporter: [["list"]],
  use: {
    baseURL: url.origin,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "setup", testMatch: /global\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testMatch: /partner-appearance\.spec\.ts/,
    },
  ],
});
