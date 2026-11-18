// <FR> - <feature name> (<Pool>) - data-driven skeleton. Replace the <...> markers.
const { test, expect } = require('@playwright/test');
const { loadData } = require('./helpers/data');
const { WEB_URL, API_URL, USER } = require('./helpers/env');
const { userLogin } = require('./helpers/api');

const { cases } = loadData('<fr>-<name>.json'); // all test data lives in /data, never inline
const RUN = Date.now().toString(36).toUpperCase(); // unique suffix per run -> no collisions across browsers/reruns

test.describe('<FR> data-driven', () => {
  let token;
  test.beforeEach(async ({ request }) => { ({ token } = await userLogin(request)); });
  test.afterEach(async ({ request }) => { /* delete everything this test created, via API */ });

  for (const c of cases) {
    test(`${c.id} [${c.type}] ${c.title}`, async ({ page, request }) => {
      // 1. session: inject the token instead of driving the login form
      await page.addInitScript((t) => localStorage.setItem('token', t), token);

      // 2. alert() handling: record AND close, otherwise the next click hangs
      const dialogs = [];
      page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss(); });

      // 3. act
      await page.goto(`${WEB_URL}/<route>`);
      await page.getByLabel('<label>').fill(c.input);
      await page.getByRole('button', { name: '<button>' }).click();

      // 4. assert - mix at least three patterns
      if (c.expect === 'accepted') {
        await expect(page.getByText(c.message)).toBeVisible();              // web-first locator assertion
        const me = await (await request.get(`${API_URL}/<resource>`, { headers: { Authorization: `Bearer ${token}` } })).json();
        expect(me.<field>).toBe(c.expectedValue);                            // exact equality, backend as oracle
      } else {
        await expect.poll(() => dialogs.join('|')).toMatch(new RegExp(c.messagePattern)); // regex
        // nothing must have been stored
      }
    });
  }
});
