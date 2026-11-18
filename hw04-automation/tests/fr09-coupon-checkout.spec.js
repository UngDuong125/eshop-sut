// FR-09 - Discount coupons at checkout (Pool B)
// Spec: 5 conditions C1..C5 (exists+active, not expired, total >= min_order_amount, logged in, uses < max_uses_per_user)
//       percent: total*value/100, fixed: value, final = total - discount.
const { test, expect } = require('@playwright/test');
const { loadData } = require('./helpers/data');
const { API_URL } = require('./helpers/env');
const { registerFreshUser } = require('./helpers/api');

const { cases, disabledButtonCases, e2e } = loadData('fr09-coupon.json');

const toInt = (text) => Number(text.replace(/[^\d-]/g, ''));

/** Find a seeded coupon id by code through the API. */
async function couponId(request, token, code) {
  const res = await request.get(`${API_URL}/coupons`, { headers: { Authorization: `Bearer ${token}` } });
  const list = await res.json();
  return list.find((c) => c.code === code).id;
}

/** Record N previous uses of a coupon for a user (precondition for the per-user limit rule C5). */
async function seedUsage(request, token, code, times) {
  if (!times) return;
  const id = await couponId(request, token, code.trim().toUpperCase());
  for (let i = 0; i < times; i++) {
    const r = await request.post(`${API_URL}/coupon-usage`, {
      headers: { Authorization: `Bearer ${token}` }, data: { coupon_id: id },
    });
    expect(r.ok(), 'precondition: usage recorded').toBeTruthy();
  }
}

const couponInput = (page) => page.getByPlaceholder('Nhập mã giảm giá...');
const applyButton = (page) => page.getByRole('button', { name: /Áp dụng|\.\.\./ });
const totalInput = (page) => page.locator('input[type="number"]');

test.describe('FR-09 Coupon at checkout - data-driven rules C1..C5', () => {
  for (const c of cases) {
    test(`${c.id} [${c.type}] ${c.title}`, async ({ page, request }) => {
      if (c.loggedIn) {
        const fresh = await registerFreshUser(request, 'fr09');
        await seedUsage(request, fresh.token, c.code, c.usesBefore);
        await page.addInitScript((t) => localStorage.setItem('token', t), fresh.token);
      }
      await page.goto('/checkout');
      await expect(page.getByRole('heading', { name: 'Xác Nhận Đơn Hàng' })).toBeVisible();

      await totalInput(page).fill(String(c.total));
      await couponInput(page).fill(c.code);
      await applyButton(page).click();

      if (c.expect === 'applied') {
        // Pattern 1 - visibility of the success message
        await expect(page.getByText(/Áp dụng thành công/)).toBeVisible();
        const saved = toInt(await page.getByText(/Tiết kiệm:/).locator('strong').innerText());
        const finalAmt = toInt(await page.getByText(/Thành tiền:/).locator('strong').innerText());
        // Pattern 2 - exact numeric equality against the value computed from the SRS formula
        expect.soft(saved, 'discount amount').toBe(c.discount);
        expect.soft(finalAmt, 'final amount').toBe(c.final);
        // Pattern 3 - the summary line must agree with the result panel
        await expect.soft(page.getByText(/Tổng thanh toán:/)).toContainText(c.final.toLocaleString('en-US'));
      } else {
        // Pattern 4 - regex on the error message, and absence of any discount result
        await expect(page.locator('p.text-red-600.text-sm')).toBeVisible();
        await expect(page.locator('p.text-red-600.text-sm')).toContainText(new RegExp(c.error, 'i'));
        await expect(page.getByText(/Thành tiền:/)).toHaveCount(0);
      }
    });
  }
});

test.describe('FR-09 Coupon UI state', () => {
  for (const c of disabledButtonCases) {
    test(`${c.id} [negative] ${c.title}`, async ({ page }) => {
      await page.goto('/checkout');
      await couponInput(page).fill(c.code);
      await expect(applyButton(page)).toBeDisabled();
    });
  }

  test(`${e2e.id} [positive] end-to-end: add product, checkout with ${e2e.code}, order succeeds`, async ({ page, request }) => {
    const fresh = await registerFreshUser(request, 'fr09e2e');
    await page.addInitScript((t) => localStorage.setItem('token', t), fresh.token);

    await page.goto(`/product/${e2e.productId}`);
    const addBtn = page.getByRole('button', { name: 'Thêm vào giỏ hàng' });
    await addBtn.click();
    // Known SUT defect (FR-06, out of scope here): the FIRST click on "Thêm vào giỏ hàng" is ignored.
    // The test records it and clicks again so the FR-09 flow can continue.
    if (!(await page.getByRole('button', { name: 'Đã thêm' }).isVisible())) {
      test.info().annotations.push({ type: 'known-defect', description: 'FR-06: first "Thêm vào giỏ hàng" click does nothing' });
      await addBtn.click();
    }
    await expect(page.getByRole('button', { name: 'Đã thêm' })).toBeVisible();

    // The cart lives only in React state, so navigate inside the SPA (page.goto would empty it).
    await page.getByRole('link', { name: 'Giỏ hàng' }).click();
    await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();
    await expect(page).toHaveURL(/\/checkout/);
    await expect(totalInput(page)).toHaveValue(String(e2e.price));

    await couponInput(page).fill(e2e.code);
    await applyButton(page).click();
    await expect(page.getByText(/Thành tiền:/).locator('strong')).toHaveText(new RegExp(e2e.final.toLocaleString('en-US')));

    await page.getByRole('button', { name: 'Xác Nhận Thanh Toán' }).click();
    await expect(page.getByRole('heading', { name: 'Thanh toán thành công!' })).toBeVisible();
  });

  test('TC-09-21 [negative/security] apply-coupon API must reject a request with no code', async ({ request }) => {
    const res = await request.post(`${API_URL}/apply-coupon`, { data: { total_amount: 400000 } });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toMatch(/mã giảm giá/i);
  });
});
