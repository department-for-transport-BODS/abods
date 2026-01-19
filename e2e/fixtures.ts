import { test as base } from '@playwright/test';
import {
  startCoverage,
  stopCoverage,
  generateReports,
  loadAllRoutes,
} from './utils/coverage';

export const test = base.extend({
  page: async ({ page }, use) => {
    // Start coverage before test
    await startCoverage(page);

    // Load all routes to trigger lazy-loaded modules - gives better covg accuracy
    await loadAllRoutes(page);

    // Run the test
    await use(page);

    // Stop coverage and generate reports after test
    const coverageMap = await stopCoverage(page);
    generateReports(coverageMap);
  },
});

export { expect } from '@playwright/test';
