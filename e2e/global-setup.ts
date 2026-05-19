import { chromium, FullConfig } from "@playwright/test";
import { mkdir } from "fs/promises";

export const AUTH_STATE_PATH = "e2e/.auth/user.json";

export default async function globalSetup(config: FullConfig) {
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;

  if (!username || !password) {
    // No credentials provided — authenticated tests will fail with a clear
    // message from the fixture rather than a confusing redirect.
    return;
  }

  const baseURL = config.projects[0].use.baseURL ?? "http://localhost:4200";
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/login`);
  await page.getByLabel("Email", { exact: false }).fill(username);
  await page.getByLabel("Password", { exact: false }).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/dashboard**");

  await mkdir("e2e/.auth", { recursive: true });
  await page.context().storageState({ path: AUTH_STATE_PATH });
  await browser.close();
}
