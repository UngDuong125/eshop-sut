# Bug report – HW04 (EShop FR-04, FR-09, FR-17)

Expected behaviour comes from the SRS in `eshop-sut/README.md`, not from what the SUT does.
All bugs reproduce identically on Chromium, Firefox and WebKit (see `reports/<fr>-<browser>/html`).
Screenshots are in `docs/screenshots/`. API-only bugs (BUG-03, 04, 11) have no browser page, so their "screenshot" is the failing assertion in the Playwright HTML report (`*_report.png`).

> Issues: issue text is prepared in `docs/issues/BUG-xx.md`; create them with `node scripts/create-issues.js` (needs Issues enabled on the repo + a token). Paste the issue URLs in the last column.

| ID | FR | Sev. | Title | Failing tests | Screenshot | Issue |
|----|----|------|-------|---------------|------------|-------|
| BUG-01 | FR-04 | High | Valid phone numbers (start with 0, 10–11 digits) are rejected by the profile form | TC-04-01, 02, 09, 11, 12, 13 | `BUG-01_TC-04-01_chromium.png` | |
| BUG-02 | FR-04 | Medium | Phone numbers NOT starting with 0 are accepted and saved | TC-04-05, 06 | `BUG-02_TC-04-05_chromium.png` | |
| BUG-03 | FR-04 | **Critical** | Any user can make themselves admin: `PUT /api/users/me` accepts `role` | TC-04-15 | `BUG-03_TC-04-15_report.png` | |
| BUG-04 | FR-04 | Medium | Backend does not validate the phone number at all (`not-a-phone` returns 200) | TC-04-16 | `BUG-04_TC-04-16_report.png` | |
| BUG-05 | FR-09 | **Critical** | Percent coupon computes `total*(1-value)` instead of `total*value/100` → negative discount, higher total | TC-09-01, 04, 11 | `BUG-05_TC-09-01_chromium.png` | |
| BUG-06 | FR-09 | High | Order total exactly equal to `min_order_amount` is rejected (code uses `>` not `>=`) | TC-09-02, 05, 07 | `BUG-06_TC-09-02_chromium.png` | |
| BUG-07 | FR-09 | High | Guest (no login) can apply a coupon – condition C4 not enforced | TC-09-14 | `BUG-07_TC-09-14_chromium.png` | |
| BUG-08 | FR-17 | High | Admin coupon with `discount_value` 0 or negative is stored | TC-17-05, 06 | `BUG-08_…`, `BUG-08b_…` | |
| BUG-09 | FR-17 | Medium | Negative `min_order_amount` (-1) is stored | TC-17-07 | `BUG-09_TC-17-07_chromium.png` | |
| BUG-10 | FR-17 | Medium | Percent coupon with value 150 (>100%) is stored | TC-17-10 | `BUG-10_TC-17-10_chromium.png` | |
| BUG-11 | FR-17 | **Critical** | No role check: a normal user token can create and delete coupons (HTTP 200) | TC-17-22, 23 | `BUG-11_TC-17-22_report.png` | |

## Details

### BUG-01 – Phone validation regex rejects valid numbers
- **Steps:** log in as `test@eshop.com` → `/profile` → phone `0912345678` → "Cập nhật".
- **Expected (FR-04):** accepted (starts with 0, 10 digits). **Actual:** alert "Số điện thoại không hợp lệ. Vui lòng nhập đúng 9-10 chữ số."
- **Cause (from source, `Profile.jsx:43`):** `/^[1-9][0-9]{8,9}$/` – first digit 1-9, 9–10 digits total; the opposite of the spec. Consequence: **no** spec-valid phone can be saved, so every "accepted" case with a phone fails, regardless of name/address.

### BUG-02 – Number without leading 0 accepted
- **Steps:** phone `9123456789` (or `912345678`) → "Cập nhật". **Expected:** rejected. **Actual:** "Cập nhật thành công!" and stored.

### BUG-03 – Privilege escalation via profile update
- **Steps:** `PUT /api/users/me` with body `{…, "role":"admin"}` and a normal user's token; then `GET /api/users/me`.
- **Expected:** role ignored/rejected, stays `user`. **Actual:** role becomes `admin`. (`server.js:118-135` appends `role = ?` when present.)
- The test restores the role in `finally`, so the shared account is not left as admin.

### BUG-04 – No server-side phone validation
- `PUT /api/users/me` with `phone: "not-a-phone"` → HTTP 200. Validation exists only in the client.

### BUG-05 – Percent coupon formula
- **Steps:** `/checkout`, total 400000, code `SAVE10` (10%). **Expected:** discount 40,000, final 360,000.
- **Actual:** "Tiết kiệm: -3,600,000 ₫", "Thành tiền: 4,000,000 ₫". (`server.js:399` → `total*(1-10)`; the DB stores 10, not 0.1.) Customers would be *charged more*.

### BUG-06 – Threshold boundary
- Total 300000 with `SAVE10` (min 300000) → "Đơn hàng chưa đủ giá trị tối thiểu…". Spec C3: total **>=** min. (`server.js:379`.) Same for BIGBUY at 500000 and VIP100 at 300000.

### BUG-07 – Guest can use coupons
- Not logged in, total 400000, `SAVE10` → success message. Spec C4 requires a valid token. `/api/apply-coupon` has no auth, and the checkout page does not require login.

### BUG-08 / BUG-09 / BUG-10 – Missing validation in coupon creation
- Admin app → Mã Giảm Giá → fill the form with value `0`, `-5000`, min `-1`, or percent `150` → "Tạo mã". All are created and appear in the list/DB. Spec: `discount_value` positive, `min_order_amount >= 0`; a percent over 100 would make the final amount negative.

### BUG-11 – Coupon endpoints lack authorisation
- `POST /api/admin/coupons` and `DELETE /api/admin/coupons/:id` with a **user** token → 200. Only `authenticateToken` is applied, no admin role check. (No-token requests are correctly refused – TC-17-21 passes.)

## Other defects observed while automating (outside the three chosen FRs – not counted)
- FR-06: the first click on "Thêm vào giỏ hàng" does nothing (`ProductDetail.jsx:23`); needs a second click.
- Cart is held only in React state – a page reload empties it (FR-07).
- Login page heading says "Đăng Ký"; the password field is `type="text"`.
- `POST /api/login` returns the user's **plain-text password** in the JSON response.
- `GET /api/products?search=` builds SQL by string concatenation (SQL injection, FR-05).
