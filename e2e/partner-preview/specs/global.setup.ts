import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";

setup.describe.configure({ mode: "serial" });
setup("configure isolated Clerk test token", async () => {
  await clerkSetup();
});
