import { test, expect } from './fixtures';

test('page title loads correctly', async ({ page }) => {
  // Coverage collection and route loading handled automatically by fixture
  const title = await page.title();
  expect(title).toBeTruthy();
  expect(title.length).toBeGreaterThan(0);
  console.log('Page title:', title);
});
