import { test, expect } from "@playwright/test";

const username = process.env.E2E_USERNAME!;
const password = process.env.E2E_PASSWORD!;

test("service monitoring page is reachable from nav after login", async ({
  page,
}) => {
  test.skip(
    !username || !password,
    "Set E2E_USERNAME and E2E_PASSWORD to run service monitoring e2e",
  );

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.locator("#username").fill(username!);
  await page.locator("#password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "Service monitoring" }).click();

  await expect(page).toHaveURL(/\/service-monitoring$/);
  await expect(
    page.getByRole("heading", { name: "Service monitoring" }),
  ).toBeVisible();

  const iframe = page.locator(".service-monitoring__iframe-container iframe");
  const errorMessage = page.getByText(
    "Unable to load dashboard. Please contact admin",
  );

  await expect
    .poll(async () => {
      const iframeCount = await iframe.count();
      const errorCount = await errorMessage.count();
      return iframeCount > 0 || errorCount > 0;
    })
    .toBe(true);
});
