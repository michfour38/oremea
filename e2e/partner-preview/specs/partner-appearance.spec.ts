import { clerk } from "@clerk/testing/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const slug = "angela";
const api = `/api/partner-appearance/${slug}`;
const adminEmail = process.env.OREMEA_E2E_ADMIN_EMAIL;
const editorEmail = process.env.OREMEA_E2E_EDITOR_EMAIL;
const editorUserId = process.env.OREMEA_E2E_EDITOR_USER_ID;

async function signIn(browser: Browser, email: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: email });
  return page;
}

test("real isolated Clerk sessions: grant, upload, save, approve, withdraw, revoke", async ({ browser, request, baseURL }) => {
  if (!adminEmail || !editorEmail || !editorUserId || !baseURL) {
    throw new Error("A dedicated admin, partner editor email and Clerk editor user ID are required.");
  }

  // The preview DB must contain ONLY fake test records. Never reuse customer data.
  const unauthenticated = await request.get(api, { maxRedirects: 0 });
  expect([401, 403, 404, 307, 308]).toContain(unauthenticated.status());

  const admin = await signIn(browser, adminEmail);
  await admin.goto("/admin/partner-appearance/editors");
  await expect(admin.getByRole("heading", { name: "Appearance editor permissions" })).toBeVisible();
  await admin.locator('select[name="partnerSlug"]').selectOption(slug);
  await admin.locator('input[name="userId"]').fill(editorUserId);
  await admin.getByRole("button", { name: "Grant editor" }).click();
  await expect(admin.getByText(editorUserId)).toBeVisible();

  const editor = await signIn(browser, editorEmail);
  await editor.goto(`/partner/studio/${slug}`);
  await expect(editor.getByText("Private partner studio")).toBeVisible();
  await expect(editor.getByRole("button", { name: "Save changes" })).toBeEnabled();

  const savedBefore = await editor.request.get(api);
  expect(savedBefore.ok()).toBeTruthy();
  const previous = await savedBefore.json() as { revision: number; appearance: unknown };

  await editor.getByLabel("Optional partner artwork").check();

  // Minimal PNG uploaded through the actual signed-in browser, never via an
  // admin bypass. This asset is permanently test-only in the disposable DB.
  const imageBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9mHRsAAAAASUVORK5CYII=",
    "base64",
  );
  const responsePromise = editor.waitForResponse(r =>
    r.url().endsWith(`${api}/assets`) && r.request().method() === "POST");
  await editor.locator("#partner-upload-desktop").setInputFiles({
    name: "isolated-test.png", mimeType: "image/png", buffer: imageBytes,
  });
  const uploadResponse = await responsePromise;
  expect([200, 201]).toContain(uploadResponse.status());
  const asset = await uploadResponse.json() as { path: string };
  expect(asset.path).toMatch(/^\/partner-assets\/angela\/img-[a-f0-9-]+\.png$/i);

  const privateRead = await editor.request.get(asset.path);
  expect(privateRead.status()).toBe(200);
  expect(privateRead.headers()["cache-control"]).toContain("no-store");
  expect((await request.get(asset.path, { maxRedirects: 0 })).status()).not.toBe(200);

  await editor.getByRole("button", { name: "Save changes" }).click();
  await expect(editor.getByText("Draft saved. It is not published and customers are unchanged.")).toBeVisible();
  const after = await editor.request.get(api);
  expect(after.ok()).toBeTruthy();
  const updated = await after.json() as { revision: number };
  expect(updated.revision).toBeGreaterThan(previous.revision);

  // Browser session carries the Clerk cookie; the server must reject an old
  // version even from a permitted editor. PUT uses same-origin Origin header.
  const stale = await editor.request.put(api, {
    headers: { origin: new URL(baseURL).origin },
    data: { revision: previous.revision, appearance: previous.appearance },
  });
  expect(stale.status()).toBe(409);

  // Partner editors must not be allowed to perform owner-only approvals.
  await editor.goto(`/admin/partner-appearance/review/${slug}`);
  await expect(editor.getByRole("heading", { name: `Review ${slug} appearance` })).not.toBeVisible();

  await admin.goto(`/admin/partner-appearance/review/${slug}`);
  await expect(admin.getByRole("heading", { name: `Review ${slug} appearance` })).toBeVisible();
  await expect(admin.getByText("Customer appearance: NOT LIVE")).toBeVisible();
  await admin.getByRole("button", { name: /Approve saved revision/ }).click();
  await expect(admin.getByText("Approval state: approved")).toBeVisible();
  await expect(admin.getByText("Customer appearance: NOT LIVE")).toBeVisible();

  const publicPath = asset.path.replace("/partner-assets/", "/partner-media/").replace(/\.png$/, ".webp");
  expect((await request.get(publicPath, { maxRedirects: 0 })).status()).toBe(404);

  await admin.getByRole("button", { name: /Withdraw approval/ }).click();
  await expect(admin.getByText("Approval state: not approved")).toBeVisible();
  expect((await request.get(publicPath, { maxRedirects: 0 })).status()).toBe(404);

  await admin.goto("/admin/partner-appearance/editors");
  const editorPermission = admin.locator("div").filter({ hasText: editorUserId })
    .filter({ has: admin.getByRole("button", { name: "Revoke" }) }).last();
  await editorPermission.getByRole("button", { name: "Revoke" }).click();
  expect((await editor.request.get(api, { maxRedirects: 0 })).status()).not.toBe(200);
  expect((await editor.request.get(asset.path, { maxRedirects: 0 })).status()).not.toBe(200);

  await editor.context().close();
  await admin.context().close();
});
