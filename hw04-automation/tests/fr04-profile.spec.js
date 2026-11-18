// FR-04 - Personal profile management (Pool A)
// Spec: name / phone / default shipping address editable; phone starts with 0 and has 10-11 digits;
//       email read-only; user cannot change own `role`.
const { test, expect } = require('@playwright/test');
const { loadData } = require('./helpers/data');
const { API_URL, USER } = require('./helpers/env');
const { userLogin } = require('./helpers/api');

const { baseline, cases } = loadData('fr04-profile.json');
const expandAddress = (a) => (a === '__REPEAT_A_500__' ? 'A'.repeat(500) : a);

/** Read the stored profile straight from the backend (source of truth). */
async function serverProfile(request, token) {
  const res = await request.get(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

test.describe('FR-04 Profile - data-driven phone/name/address rules', () => {
  let token;

  test.beforeEach(async ({ page, request }) => {
    ({ token } = await userLogin(request));
    // Reset the profile to a known baseline so every case is independent.
    await request.put(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` }, data: baseline });
    // Inject the session instead of re-typing credentials in every test (real UI login is covered by TC-04-20).
    await page.addInitScript((t) => localStorage.setItem('token', t), token);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Hồ sơ của bạn' })).toBeVisible();
  });

  for (const c of cases) {
    test(`${c.id} [${c.type}] ${c.title}`, async ({ page, request }) => {
      const nameInput = page.locator('form input[type="text"]').nth(1);
      const phoneInput = page.locator('form input[type="text"]').nth(2);
      const addressInput = page.locator('form textarea');
      const address = expandAddress(c.address);

      await expect(nameInput).toHaveValue(baseline.name); // wait until the user has been loaded
      await nameInput.fill(c.name);
      await phoneInput.fill(c.phone);
      await addressInput.fill(address);

      // Collect the alert() the page raises (the SUT reports results via window.alert).
      const dialogs = [];
      page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss(); });
      await page.getByRole('button', { name: 'Cập nhật' }).click();
      await page.waitForTimeout(500); // let the PUT + alert settle (no DOM change to wait on)

      const stored = await serverProfile(request, token);

      if (c.expect === 'accepted') {
        // Pattern 1 - alert message equality
        expect(dialogs, 'success alert shown').toEqual(['Cập nhật thành công!']);
        // Pattern 2 - persisted value equality on the backend
        expect(stored.phone).toBe(c.phone);
        expect(stored.name).toBe(c.name);
        expect(stored.shipping_address ?? '').toBe(address);
        // Pattern 3 - web-first UI assertion after a reload (data really persisted)
        await page.reload();
        await expect(page.locator('form input[type="text"]').nth(2)).toHaveValue(c.phone);
        await expect(page.locator('form textarea')).toHaveValue(address);
      } else if (c.expect === 'rejected') {
        // Invalid phone: the user must be told, and nothing may be stored.
        expect(dialogs.join('|'), 'validation alert shown').toMatch(/không hợp lệ/i);
        expect(dialogs.join('|')).not.toMatch(/thành công/i);
        expect(stored.phone, 'phone must stay unchanged').toBe(baseline.phone);
      } else if (c.expect === 'blocked-by-html5') {
        // The browser blocks submission: no alert, and the field reports valueMissing.
        expect(dialogs).toHaveLength(0);
        expect(await nameInput.evaluate((el) => el.validity.valueMissing)).toBe(true);
        expect(stored.name).toBe(baseline.name);
      }
    });
  }
});

test.describe('FR-04 Profile - read-only email, role protection, session', () => {
  test('TC-04-14 [positive] email field is disabled and shows the account email', async ({ page, request }) => {
    const { token } = await userLogin(request);
    await page.addInitScript((t) => localStorage.setItem('token', t), token);
    await page.goto('/profile');
    const email = page.locator('form input[type="text"]').first();
    await expect(email).toBeDisabled();
    await expect(email).toHaveValue(USER.email);
  });

  test('TC-04-15 [negative/security] user cannot escalate own role via PUT /users/me', async ({ request }) => {
    const { token } = await userLogin(request);
    const res = await request.put(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { ...baseline, role: 'admin' },
    });
    const stored = await serverProfile(request, token);
    try {
      expect(stored.role, 'role must remain "user"').toBe('user');
      expect(res.status()).toBeLessThan(500);
    } finally {
      // Always restore, so a failing assertion does not leave the shared account as admin.
      await request.put(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` }, data: { ...baseline, role: 'user' } });
    }
  });

  test('TC-04-16 [negative/security] backend rejects an invalid phone sent directly to the API', async ({ request }) => {
    const { token } = await userLogin(request);
    const res = await request.put(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { ...baseline, phone: 'not-a-phone' },
    });
    const status = res.status();
    await request.put(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` }, data: baseline });
    expect(status, 'server-side validation must reject').toBeGreaterThanOrEqual(400);
  });

  test('TC-04-17 [negative] profile API requires authentication', async ({ request }) => {
    const res = await request.put(`${API_URL}/users/me`, { data: baseline });
    expect([401, 403]).toContain(res.status());
  });

  test('TC-04-18 [negative] profile page without a session asks the user to log in', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByText('Vui lòng đăng nhập')).toBeVisible();
  });

  test('TC-04-20 [positive] real UI login leads to an editable profile', async ({ page }) => {
    await page.goto('/login');
    const inputs = page.locator('form input');
    await inputs.nth(0).fill(USER.email);
    await inputs.nth(1).fill(USER.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/localhost:5173\/?$/);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Hồ sơ của bạn' })).toBeVisible();
  });
});
