import { test as base, Page } from '@playwright/test';

const APP_ROUTES = [
  '/',
  '/dashboard',
  '/login',
  '/privacy-policy',
  '/cookies',
  '/accessibility',
  '/feed-monitoring',
  '/on-time',
  '/corridors',
  '/vehicle-journeys',
  '/data-monitoring',
  '/stop-analysis',
  '/service-monitoring',
];

async function loadAllRoutes(page: Page): Promise<void> {
  for (const route of APP_ROUTES) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
  }
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await loadAllRoutes(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
