/**
 * Reusable coverage collection utilities for Playwright tests.
 * Provides V8 coverage collection with source map support for Angular apps.
 */

import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import v8ToIstanbul from 'v8-to-istanbul';
import { createCoverageMap, CoverageMap } from 'istanbul-lib-coverage';
import { createContext } from 'istanbul-lib-report';
import * as reports from 'istanbul-reports';

const COVERAGE_DIR = path.join(process.cwd(), 'coverage', 'e2e');
const SOURCE_DIR = path.join(process.cwd(), 'frontend', 'src');

/**
 * All application routes - navigate these to load lazy-loaded modules
 */
export const APP_ROUTES = [
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

/**
 * Navigate through all routes to load lazy-loaded modules
 */
export async function loadAllRoutes(page: Page): Promise<void> {
  for (const route of APP_ROUTES) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Filter for application JavaScript files (excludes polyfills, vendor, etc.)
 */
export function isAppJsFile(url: string): boolean {
  if (!url.startsWith('http://localhost:4200/')) return false;

  const urlPath = url.replace('http://localhost:4200/', '');

  const excludes = [
    /polyfills/i,
    /vendor/i,
    /runtime/i,
    /zone\.js/i,
    /node_modules/,
    /govuk-frontend/,
    /\.css$/,
    /\.map$/,
    /\.html$/,
  ];

  for (const pattern of excludes) {
    if (pattern.test(urlPath)) return false;
  }

  return urlPath.endsWith('.js');
}

/**
 * Fix source paths to point to actual source files instead of temp/webpack paths
 */
export function fixSourcePath(originalPath: string): string {
  let fixedPath = originalPath;

  // Remove webpack:// prefix
  if (fixedPath.startsWith('webpack://')) {
    fixedPath = fixedPath.replace(/^webpack:\/\/[^/]*\//, '');
  }

  // Handle .temp directory references
  if (fixedPath.includes('.temp')) {
    const srcMatch = fixedPath.match(/\.temp[\/\\](.*)$/);
    if (srcMatch) fixedPath = srcMatch[1];
  }

  // Handle relative paths starting with ./
  if (fixedPath.startsWith('./')) {
    fixedPath = fixedPath.substring(2);
  }

  // If path starts with src/, prepend frontend directory
  if (fixedPath.startsWith('src/') || fixedPath.startsWith('src\\')) {
    fixedPath = path.join(process.cwd(), 'frontend', fixedPath);
  }

  // Try to resolve relative paths
  if (!path.isAbsolute(fixedPath) && !fixedPath.startsWith('node_modules')) {
    const possiblePath = path.join(SOURCE_DIR, fixedPath);
    if (fs.existsSync(possiblePath)) {
      fixedPath = possiblePath;
    } else {
      fixedPath = path.join(process.cwd(), 'frontend', 'src', fixedPath);
    }
  }

  return fixedPath;
}

/**
 * Extract inline source map from JavaScript source
 */
export function extractInlineSourceMap(source: string): any | null {
  const inlineMatch = source.match(
    /\/\/# sourceMappingURL=data:application\/json;[^,]+,(.+)$/
  );
  if (inlineMatch) {
    try {
      return JSON.parse(Buffer.from(inlineMatch[1], 'base64').toString('utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Start collecting JS coverage on a page
 */
export async function startCoverage(page: Page): Promise<void> {
  await page.coverage.startJSCoverage({
    resetOnNavigation: false,
    reportAnonymousScripts: false,
  });
}

/**
 * Stop coverage collection and process results into Istanbul format
 */
export async function stopCoverage(page: Page): Promise<CoverageMap> {
  // Ensure coverage directory exists
  if (!fs.existsSync(COVERAGE_DIR)) {
    fs.mkdirSync(COVERAGE_DIR, { recursive: true });
  }

  const v8Coverage = await page.coverage.stopJSCoverage();
  const appCoverage = v8Coverage.filter((entry) => isAppJsFile(entry.url));

  console.log(`\n Collected coverage from ${appCoverage.length} application files`);

  const coverageMap = createCoverageMap();
  const tempDir = path.join(COVERAGE_DIR, '.temp');

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  let processedFiles = 0;

  for (const entry of appCoverage) {
    if (!entry.source) continue;

    try {
      const urlPath = entry.url.replace('http://localhost:4200/', '');
      const tempFile = path.join(tempDir, urlPath.replace(/[\/\\:]/g, '_'));
      fs.writeFileSync(tempFile, entry.source);

      const sourceMap = extractInlineSourceMap(entry.source);

      const converterOptions: any = { source: entry.source };
      if (sourceMap) {
        converterOptions.sourceMap = { sourcemap: sourceMap };
      }

      const converter = v8ToIstanbul(tempFile, 0, converterOptions);
      await converter.load();
      converter.applyCoverage(entry.functions);

      const istanbulCoverage = converter.toIstanbul();

      for (const [, fileCoverage] of Object.entries(istanbulCoverage)) {
        const fc = fileCoverage as any;
        if (fc.path && !fc.path.includes('node_modules')) {
          const fixedPath = fixSourcePath(fc.path);
          const shouldInclude =
            fs.existsSync(fixedPath) ||
            fixedPath.endsWith('.ts') ||
            fixedPath.endsWith('.html') ||
            fixedPath.endsWith('.scss');

          if (shouldInclude) {
            fc.path = fixedPath;
            coverageMap.addFileCoverage(fc);
            processedFiles++;
          }
        }
      }
    } catch {
      // Skip files that fail to process
    }
  }

  console.log(`   Processed ${processedFiles} file coverage entries`);

  // Clean up temp files
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }

  return coverageMap;
}

/**
 * Generate coverage reports (HTML, LCOV, text) and print summary
 */
export function generateReports(coverageMap: CoverageMap): void {
  // Save coverage data
  fs.writeFileSync(
    path.join(COVERAGE_DIR, 'coverage-final.json'),
    JSON.stringify(coverageMap.toJSON(), null, 2)
  );

  // Generate reports
  const context = createContext({
    dir: COVERAGE_DIR,
    coverageMap,
    defaultSummarizer: 'nested',
  });

  reports.create('html', {}).execute(context);
  reports.create('lcov', {}).execute(context);
  reports.create('text', {}).execute(context);

  // Print summary
  const summary = coverageMap.getCoverageSummary();

  console.log('\n' + '='.repeat(60));
  console.log('📊 E2E COVERAGE SUMMARY');
  console.log('='.repeat(60));
  console.log(
    `Statements : ${summary.statements.pct.toFixed(2)}% (${summary.statements.covered}/${summary.statements.total})`
  );
  console.log(
    `Branches   : ${summary.branches.pct.toFixed(2)}% (${summary.branches.covered}/${summary.branches.total})`
  );
  console.log(
    `Functions  : ${summary.functions.pct.toFixed(2)}% (${summary.functions.covered}/${summary.functions.total})`
  );
  console.log(
    `Lines      : ${summary.lines.pct.toFixed(2)}% (${summary.lines.covered}/${summary.lines.total})`
  );
  console.log('='.repeat(60));
  console.log(`📁 HTML Report: ${path.join(COVERAGE_DIR, 'index.html')}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Convenience function: collect coverage, run actions, generate reports
 */
export async function withCoverage(
  page: Page,
  actions: () => Promise<void>
): Promise<void> {
  await startCoverage(page);
  await actions();
  const coverageMap = await stopCoverage(page);
  generateReports(coverageMap);
}
