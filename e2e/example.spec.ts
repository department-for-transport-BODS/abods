import { test, expect } from "./fixtures";

// Example spec file(nextjs)
test("page loads correctly", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#__next, app-root").first()).toBeVisible();
});
