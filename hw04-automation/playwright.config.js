// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const STUDENT_ID = process.env.STUDENT_ID || '23120034';
const RUN_AT = new Date().toISOString(); // ISO timestamp, required by HW04 §11
const RUN_TAG = process.env.RUN_TAG || 'all'; // e.g. fr04-chromium (set by scripts/run-matrix.js)

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  // The SUT shares one SQLite DB, so tests must not run in parallel.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: `reports/${RUN_TAG}/results.json` }],
    ['html', {
      outputFolder: `reports/${RUN_TAG}/html`,
      open: 'never',
      // Visible in the HTML report header.
      title: `EShop HW04 - ${RUN_TAG} | Run by: ${STUDENT_ID} | ${RUN_AT}`,
    }],
  ],
  // Also shown in report metadata.
  metadata: { 'Run by': STUDENT_ID, 'Run at (ISO)': RUN_AT, 'Run tag': RUN_TAG },
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },
  outputDir: `test-results/${RUN_TAG}`,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
