// FR-17 - Coupon management, admin CRUD (Pool C) - Web Admin at :5174
const { test, expect } = require('@playwright/test');
const { loadData } = require('./helpers/data');
const { ADMIN_URL, API_URL, ADMIN, USER } = require('./helpers/env');
const { adminToken, userLogin } = require('./helpers/api');

const { cases } = loadData('fr17-coupon-admin.json');
const RUN = Date.now().toString(36).toUpperCase(); // unique per run => no code collisions between browsers/runs

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const allCoupons = async (request, token) => (await request.get(`${API_URL}/coupons`, { headers: auth(token) })).json();

/** Open the admin app already logged in (token injected) and switch to the coupon tab. */
async function openCouponTab(page, token) {
  await page.addInitScript((t) => localStorage.setItem('adminToken', t), token);
  await page.goto(ADMIN_URL);
  await page.getByText('Mã Giảm Giá', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quản lý Mã Giảm Giá' })).toBeVisible();
}

async function fillCouponForm(page, c, code) {
  const f = page.locator('form');
  await f.locator('input').nth(0).fill(code);
  await f.locator('select').selectOption(c.ctype);
  await f.locator('input[type="number"]').nth(0).fill(c.value);
  await f.locator('input[type="number"]').nth(1).fill(c.min);
  if (c.expires) await f.locator('input[type="date"]').fill(c.expires);
  await f.locator('input[type="number"]').nth(2).fill(c.maxUses);
}

test.describe('FR-17 Coupon CRUD - data-driven create rules', () => {
  let token;
  const created = []; // codes to clean up

  test.beforeEach(async ({ request }) => { token = await adminToken(request); });

  test.afterEach(async ({ request }) => {
    // Cleanup through the API so the shared DB stays tidy even when an assertion failed.
    for (const c of await allCoupons(request, token)) {
      if (c.code.includes(`-${RUN}`)) await request.delete(`${API_URL}/admin/coupons/${c.id}`, { headers: auth(token) });
    }
    created.length = 0;
  });

  for (const c of cases) {
    test(`${c.id} [${c.type}] ${c.title}`, async ({ page, request }) => {
      const code = c.useExistingCode || `${c.codePrefix}-${RUN}`;
      const expectedCode = code.toUpperCase();
      const before = await allCoupons(request, token);
      await openCouponTab(page, token);

      const dialogs = [];
      page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss(); });
      await fillCouponForm(page, c, code);
      await page.getByRole('button', { name: 'Tạo mã' }).click();
      await page.waitForTimeout(600); // no DOM event to wait on for rejected submissions

      const after = await allCoupons(request, token);
      const matches = after.filter((x) => x.code === expectedCode);

      if (c.expect === 'created' || c.expect === 'created-expired') {
        // Pattern 1 - the new row becomes visible in the list with the entered values
        const row = page.getByRole('row').filter({ hasText: expectedCode });
        await expect(row).toBeVisible();
        await expect(row).toContainText(c.shownValue);
        await expect(row).toContainText(c.shownMin);
        await expect(row).toContainText(c.shownLimit);
        if (c.expect === 'created-expired') await expect(row).toContainText('Hết hạn');
        else await expect(row).toContainText(c.expires);
        // Pattern 2 - persisted exactly once on the backend
        expect(matches).toHaveLength(1);
        expect(matches[0].type).toBe(c.ctype);
        expect(Number(matches[0].discount_value)).toBe(Number(c.value));
        expect(dialogs, 'no error alert on success').toHaveLength(0);
      } else if (c.expect === 'duplicate') {
        // Pattern 3 - uniqueness: still one record, user is told (alert) and the list is unchanged
        expect(matches, 'code must stay unique').toHaveLength(1);
        expect(after.length).toBe(before.length);
        expect(dialogs.join('|')).toMatch(/Lỗi/);
      } else {
        // rejected: nothing may be stored, whatever mechanism blocked it (HTML5, UI or API)
        expect(matches, `invalid coupon "${code}" must NOT be stored`).toHaveLength(0);
        expect(after.length).toBe(before.length);
      }
    });
  }
});

test.describe('FR-17 Coupon CRUD - list, delete, access', () => {
  test('TC-17-16 [positive] list shows the seeded coupons with correct formatting', async ({ page, request }) => {
    await openCouponTab(page, await adminToken(request));
    const save10 = page.getByRole('row').filter({ hasText: 'SAVE10' });
    await expect(save10).toContainText('10%');
    await expect(save10).toContainText('300,000');
    await expect(page.getByRole('row').filter({ hasText: 'EXPIRED' })).toContainText('Hết hạn');
    await expect(page.getByRole('row').filter({ hasText: 'BIGBUY' })).toContainText('50,000');
  });

  test('TC-17-17 [positive] admin can delete a coupon from the list', async ({ page, request }) => {
    const token = await adminToken(request);
    const code = `AUTODEL-${RUN}`;
    const res = await request.post(`${API_URL}/admin/coupons`, {
      headers: auth(token),
      data: { code, type: 'fixed', discount_value: 1000, min_order_amount: 0, expired_at: '2099-12-31', max_uses_per_user: 1 },
    });
    expect(res.ok(), 'precondition: coupon created').toBeTruthy();

    await openCouponTab(page, token);
    const row = page.getByRole('row').filter({ hasText: code });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Xóa' }).click();
    await expect(row).toHaveCount(0);
    expect((await allCoupons(request, token)).some((c) => c.code === code)).toBe(false);
  });

  // NOTE: the dialog must be handled in a listener (accept/dismiss); a bare waitForEvent('dialog')
  // leaves the alert open and the following click() hangs until the test timeout.
  async function loginExpectingAlert(page, creds) {
    const messages = [];
    page.on('dialog', async (d) => { messages.push(d.message()); await d.dismiss(); });
    await page.goto(ADMIN_URL);
    await page.getByPlaceholder('Email').fill(creds.email);
    await page.getByPlaceholder('Password').fill(creds.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect.poll(() => messages.length).toBeGreaterThan(0);
    return messages[0];
  }

  test('TC-17-18 [negative] admin login with a wrong password is refused', async ({ page }) => {
    expect(await loginExpectingAlert(page, { email: ADMIN.email, password: 'WrongPass1!' })).toMatch(/thất bại/i);
    await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();
  });

  test('TC-17-19 [negative] a normal (non-admin) user cannot sign in to the admin app', async ({ page }) => {
    expect(await loginExpectingAlert(page, USER)).toMatch(/không phải là admin/i);
    await expect(page.getByRole('heading', { name: 'Admin Login' })).toBeVisible();
  });

  test('TC-17-20 [positive] real UI login as admin reaches the dashboard and coupon tab', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.getByPlaceholder('Email').fill(ADMIN.email);
    await page.getByPlaceholder('Password').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('heading', { name: 'EShop Admin' })).toBeVisible();
    await page.getByText('Mã Giảm Giá', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Quản lý Mã Giảm Giá' })).toBeVisible();
  });

  test('TC-17-21 [negative/security] creating a coupon without a token is refused (401/403)', async ({ request }) => {
    const res = await request.post(`${API_URL}/admin/coupons`, {
      data: { code: `NOAUTH-${RUN}`, type: 'fixed', discount_value: 1000, min_order_amount: 0, expired_at: '2099-12-31', max_uses_per_user: 1 },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('TC-17-22 [negative/security] a normal user token must not create coupons (role check)', async ({ request }) => {
    const { token } = await userLogin(request);
    const code = `USERMADE-${RUN}`;
    const res = await request.post(`${API_URL}/admin/coupons`, {
      headers: auth(token),
      data: { code, type: 'fixed', discount_value: 1000, min_order_amount: 0, expired_at: '2099-12-31', max_uses_per_user: 1 },
    });
    const status = res.status();
    // cleanup first, so a failing assertion does not leave the coupon behind
    const admin = await adminToken(request);
    for (const c of await allCoupons(request, admin)) {
      if (c.code === code) await request.delete(`${API_URL}/admin/coupons/${c.id}`, { headers: auth(admin) });
    }
    expect(status, 'non-admin must get 403').toBe(403);
  });

  test('TC-17-23 [negative/security] a normal user token must not delete coupons (role check)', async ({ request }) => {
    const admin = await adminToken(request);
    const code = `USERDEL-${RUN}`;
    const make = await request.post(`${API_URL}/admin/coupons`, {
      headers: auth(admin),
      data: { code, type: 'fixed', discount_value: 1000, min_order_amount: 0, expired_at: '2099-12-31', max_uses_per_user: 1 },
    });
    const id = (await make.json()).id;
    const { token } = await userLogin(request);
    const res = await request.delete(`${API_URL}/admin/coupons/${id}`, { headers: auth(token) });
    const status = res.status();
    await request.delete(`${API_URL}/admin/coupons/${id}`, { headers: auth(admin) }); // cleanup
    expect(status, 'non-admin must get 403').toBe(403);
  });
});
