import { test, expect } from "./fixtures";

test("page loads correctly", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#__next, app-root").first()).toBeVisible();
});
