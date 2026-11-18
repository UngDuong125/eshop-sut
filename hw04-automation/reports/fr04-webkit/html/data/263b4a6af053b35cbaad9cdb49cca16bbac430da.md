# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fr04-profile.spec.js >> FR-04 Profile - data-driven phone/name/address rules >> TC-04-09 [positive] Vietnamese diacritics in name
- Location: tests\fr04-profile.spec.js:32:5

# Error details

```
Error: success alert shown

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 1

  Array [
-   "Cập nhật thành công!",
+   "Số điện thoại không hợp lệ. Vui lòng nhập đúng 9-10 chữ số.",
  ]
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "EShop" [ref=e5]:
      - /url: /
    - navigation [ref=e6]:
      - link "Giỏ hàng" [ref=e7]:
        - /url: /cart
      - generic [ref=e8]:
        - link "Chào, Baseline User" [ref=e9]:
          - /url: /profile
        - button "Thoát" [ref=e10] [cursor=pointer]
  - main [ref=e11]:
    - generic [ref=e12]:
      - generic [ref=e13]:
        - heading "Hồ sơ của bạn" [level=2] [ref=e14]
        - generic [ref=e15]:
          - generic [ref=e16]:
            - generic [ref=e17]: Email (Không đổi)
            - textbox [disabled] [ref=e18]: test@eshop.com
          - generic [ref=e19]:
            - generic [ref=e20]: Họ Tên
            - textbox [ref=e21]: Nguyễn Thị Ánh Tuyết
          - generic [ref=e22]:
            - generic [ref=e23]: Số điện thoại
            - 'textbox "VD: 0912345678" [ref=e24]': "0987654321"
          - generic [ref=e25]:
            - generic [ref=e26]: Địa chỉ giao hàng
            - textbox "Nhập địa chỉ của bạn" [ref=e27]: 45 Lê Lợi, Quận 1
          - button "Cập nhật" [ref=e28] [cursor=pointer]
      - generic [ref=e29]:
        - heading "Lịch sử đơn hàng" [level=2] [ref=e30]
        - paragraph [ref=e31]: Bạn chưa có đơn hàng nào.
  - contentinfo [ref=e32]: © 2026 EShop SUT. Dành cho mục đích kiểm thử.
```

# Test source

```ts
  1   | // FR-04 - Personal profile management (Pool A)
  2   | // Spec: name / phone / default shipping address editable; phone starts with 0 and has 10-11 digits;
  3   | //       email read-only; user cannot change own `role`.
  4   | const { test, expect } = require('@playwright/test');
  5   | const { loadData } = require('./helpers/data');
  6   | const { API_URL, USER } = require('./helpers/env');
  7   | const { userLogin } = require('./helpers/api');
  8   | 
  9   | const { baseline, cases } = loadData('fr04-profile.json');
  10  | const expandAddress = (a) => (a === '__REPEAT_A_500__' ? 'A'.repeat(500) : a);
  11  | 
  12  | /** Read the stored profile straight from the backend (source of truth). */
  13  | async function serverProfile(request, token) {
  14  |   const res = await request.get(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  15  |   return res.json();
  16  | }
  17  | 
  18  | test.describe('FR-04 Profile - data-driven phone/name/address rules', () => {
  19  |   let token;
  20  | 
  21  |   test.beforeEach(async ({ page, request }) => {
  22  |     ({ token } = await userLogin(request));
  23  |     // Reset the profile to a known baseline so every case is independent.
  24  |     await request.put(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` }, data: baseline });
  25  |     // Inject the session instead of re-typing credentials in every test (real UI login is covered by TC-04-20).
  26  |     await page.addInitScript((t) => localStorage.setItem('token', t), token);
  27  |     await page.goto('/profile');
  28  |     await expect(page.getByRole('heading', { name: 'Hồ sơ của bạn' })).toBeVisible();
  29  |   });
  30  | 
  31  |   for (const c of cases) {
  32  |     test(`${c.id} [${c.type}] ${c.title}`, async ({ page, request }) => {
  33  |       const nameInput = page.locator('form input[type="text"]').nth(1);
  34  |       const phoneInput = page.locator('form input[type="text"]').nth(2);
  35  |       const addressInput = page.locator('form textarea');
  36  |       const address = expandAddress(c.address);
  37  | 
  38  |       await expect(nameInput).toHaveValue(baseline.name); // wait until the user has been loaded
  39  |       await nameInput.fill(c.name);
  40  |       await phoneInput.fill(c.phone);
  41  |       await addressInput.fill(address);
  42  | 
  43  |       // Collect the alert() the page raises (the SUT reports results via window.alert).
  44  |       const dialogs = [];
  45  |       page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss(); });
  46  |       await page.getByRole('button', { name: 'Cập nhật' }).click();
  47  |       await page.waitForTimeout(500); // let the PUT + alert settle (no DOM change to wait on)
  48  | 
  49  |       const stored = await serverProfile(request, token);
  50  | 
  51  |       if (c.expect === 'accepted') {
  52  |         // Pattern 1 - alert message equality
> 53  |         expect(dialogs, 'success alert shown').toEqual(['Cập nhật thành công!']);
      |                                                ^ Error: success alert shown
  54  |         // Pattern 2 - persisted value equality on the backend
  55  |         expect(stored.phone).toBe(c.phone);
  56  |         expect(stored.name).toBe(c.name);
  57  |         expect(stored.shipping_address ?? '').toBe(address);
  58  |         // Pattern 3 - web-first UI assertion after a reload (data really persisted)
  59  |         await page.reload();
  60  |         await expect(page.locator('form input[type="text"]').nth(2)).toHaveValue(c.phone);
  61  |         await expect(page.locator('form textarea')).toHaveValue(address);
  62  |       } else if (c.expect === 'rejected') {
  63  |         // Invalid phone: the user must be told, and nothing may be stored.
  64  |         expect(dialogs.join('|'), 'validation alert shown').toMatch(/không hợp lệ/i);
  65  |         expect(dialogs.join('|')).not.toMatch(/thành công/i);
  66  |         expect(stored.phone, 'phone must stay unchanged').toBe(baseline.phone);
  67  |       } else if (c.expect === 'blocked-by-html5') {
  68  |         // The browser blocks submission: no alert, and the field reports valueMissing.
  69  |         expect(dialogs).toHaveLength(0);
  70  |         expect(await nameInput.evaluate((el) => el.validity.valueMissing)).toBe(true);
  71  |         expect(stored.name).toBe(baseline.name);
  72  |       }
  73  |     });
  74  |   }
  75  | });
  76  | 
  77  | test.describe('FR-04 Profile - read-only email, role protection, session', () => {
  78  |   test('TC-04-14 [positive] email field is disabled and shows the account email', async ({ page, request }) => {
  79  |     const { token } = await userLogin(request);
  80  |     await page.addInitScript((t) => localStorage.setItem('token', t), token);
  81  |     await page.goto('/profile');
  82  |     const email = page.locator('form input[type="text"]').first();
  83  |     await expect(email).toBeDisabled();
  84  |     await expect(email).toHaveValue(USER.email);
  85  |   });
  86  | 
  87  |   test('TC-04-15 [negative/security] user cannot escalate own role via PUT /users/me', async ({ request }) => {
  88  |     const { token } = await userLogin(request);
  89  |     const res = await request.put(`${API_URL}/users/me`, {
  90  |       headers: { Authorization: `Bearer ${token}` },
  91  |       data: { ...baseline, role: 'admin' },
  92  |     });
  93  |     const stored = await serverProfile(request, token);
  94  |     try {
  95  |       expect(stored.role, 'role must remain "user"').toBe('user');
  96  |       expect(res.status()).toBeLessThan(500);
  97  |     } finally {
  98  |       // Always restore, so a failing assertion does not leave the shared account as admin.
  99  |       await request.put(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` }, data: { ...baseline, role: 'user' } });
  100 |     }
  101 |   });
  102 | 
  103 |   test('TC-04-16 [negative/security] backend rejects an invalid phone sent directly to the API', async ({ request }) => {
  104 |     const { token } = await userLogin(request);
  105 |     const res = await request.put(`${API_URL}/users/me`, {
  106 |       headers: { Authorization: `Bearer ${token}` },
  107 |       data: { ...baseline, phone: 'not-a-phone' },
  108 |     });
  109 |     const status = res.status();
  110 |     await request.put(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` }, data: baseline });
  111 |     expect(status, 'server-side validation must reject').toBeGreaterThanOrEqual(400);
  112 |   });
  113 | 
  114 |   test('TC-04-17 [negative] profile API requires authentication', async ({ request }) => {
  115 |     const res = await request.put(`${API_URL}/users/me`, { data: baseline });
  116 |     expect([401, 403]).toContain(res.status());
  117 |   });
  118 | 
  119 |   test('TC-04-18 [negative] profile page without a session asks the user to log in', async ({ page }) => {
  120 |     await page.goto('/profile');
  121 |     await expect(page.getByText('Vui lòng đăng nhập')).toBeVisible();
  122 |   });
  123 | 
  124 |   test('TC-04-20 [positive] real UI login leads to an editable profile', async ({ page }) => {
  125 |     await page.goto('/login');
  126 |     const inputs = page.locator('form input');
  127 |     await inputs.nth(0).fill(USER.email);
  128 |     await inputs.nth(1).fill(USER.password);
  129 |     await page.getByRole('button', { name: 'Sign In' }).click();
  130 |     await expect(page).toHaveURL(/localhost:5173\/?$/);
  131 |     await page.goto('/profile');
  132 |     await expect(page.getByRole('heading', { name: 'Hồ sơ của bạn' })).toBeVisible();
  133 |   });
  134 | });
  135 | 
```