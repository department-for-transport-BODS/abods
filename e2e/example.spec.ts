import { test, expect } from './fixtures';

test('page title loads correctly', async ({ page }) => {
  const title = await page.title();
  expect(title).toBeTruthy();
  expect(title.length).toBeGreaterThan(0);
  console.log('Page title:', title);
});
