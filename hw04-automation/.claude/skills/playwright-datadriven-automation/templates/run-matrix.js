// Runs every feature on every browser, one HTML report per (feature, browser) = 9 reports.
// Usage: node scripts/run-matrix.js            (all 9 runs)
//        node scripts/run-matrix.js fr04       (one feature, 3 browsers)
const { spawnSync } = require('child_process');

const FEATURES = {
  fr04: 'tests/fr04-profile.spec.js',
  fr09: 'tests/fr09-coupon-checkout.spec.js',
  fr17: 'tests/fr17-coupon-admin.spec.js',
};
const BROWSERS = ['chromium', 'firefox', 'webkit'];
const only = process.argv[2];

let runs = 0;
for (const [fr, file] of Object.entries(FEATURES)) {
  if (only && only !== fr) continue;
  for (const browser of BROWSERS) {
    const tag = `${fr}-${browser}`;
    console.log(`\n===== ${tag} =====`);
    spawnSync('npx', ['playwright', 'test', file, `--project=${browser}`], {
      stdio: 'inherit', shell: true,
      env: { ...process.env, RUN_TAG: tag },
    });
    runs++;
  }
}
console.log(`\nDone: ${runs} browser runs. Reports in reports/<feature>-<browser>/html`);
