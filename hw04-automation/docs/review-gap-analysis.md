# Review / gap analysis of the AI-generated automation (HW04 Task 1)

Method: the AI (Claude Code) generated each suite in steps – (1) read UI + API source to get real selectors and
rules, (2) derive test cases from the SRS (not from the code), (3) put data into JSON, (4) write the spec,
(5) run, (6) classify every failure as *SUT defect* or *test defect*. The items below are the test defects and
quality gaps found in the AI's own output during step 6 and the review pass.

## What the AI got wrong or missed

| # | Where | Problem | Fix | Why the AI missed it |
|---|-------|---------|-----|----------------------|
| 1 | FR-17 TC-17-18/19 | Used `page.waitForEvent('dialog')` without handling the dialog; `click()` hung 40 s and the test timed out. | Register a `page.on('dialog')` handler that records the message and dismisses it. | Playwright detail: once any dialog listener exists, auto-dismiss is off. Looks correct when reading; only a run reveals it (model limitation – no execution feedback in the first draft). |
| 2 | FR-09 TC-09-20 | Navigated with `page.goto('/cart')`; the cart lives in React state, so the page reload emptied it. | Navigate with the in-app "Giỏ hàng" link. | Feature characteristic – a non-obvious design flaw (FR-07) that is invisible from the spec. |
| 3 | FR-09 TC-09-20 | Assumed one click on "Thêm vào giỏ hàng" adds the item and shows "Đã thêm". The first click is ignored (SUT bug). | Click again when needed and add a `known-defect` annotation. | The spec says nothing about it; the AI trusted the spec over the code it had read. |
| 4 | FR-04, FR-09, FR-17 | **Fragile selectors (accepted risk, not a bug that occurred):** the SUT's `<label>`s are not bound to inputs, so `getByLabel` cannot be used. The AI avoided it after reading the JSX and used position-based locators (`form input`.nth(n)). They break if a field is added or reordered. | Kept, documented. Better fix: ask the SUT team for `data-testid`/`id` attributes. | Characteristic of the feature (no accessible names), not a model error. |
| 5 | FR-04 | `waitForTimeout(500)` after clicking "Cập nhật" – a fixed wait. | Kept deliberately: the SUT reports results through `alert()` and rejected submissions change no DOM, so there is no event to wait on; the assertion is on server state afterwards. Marked with a comment. | Honest trade-off, not a missed fix. A cleaner option is `page.waitForResponse` for accepted cases. |
| 6 | FR-17 | TC-17-08/09 (`max_uses_per_user` 0 / -3) pass only because the browser's `min="1"` blocks the form; the **backend** may still accept them. | Gap documented; add API-level tests (see below). | The test asserts "nothing stored", which is true for both mechanisms – a weak oracle that can hide a server bug. |
| 7 | FR-09 | **Risk avoided:** the AI had already read `server.js` before writing expected values. Expected discounts were deliberately derived from the SRS formula (`total*value/100`), not from the code; deriving them from the code would have encoded BUG-05 into the oracle. | Data file states this in its `note` field. | Needs an explicit instruction in the prompt ("oracle from spec only"); I gave it. |
| 8 | FR-09 | Rounding for percent discounts is not specified in the SRS. | Boundary data uses 300010 (discount 30001, an integer) to avoid depending on a rounding rule. | Spec ambiguity. |

## Assertion patterns used (≥ 3 required)
1. Web-first locator assertions with auto-wait: `toBeVisible`, `toHaveValue`, `toBeDisabled`, `toHaveCount(0)`, `toContainText`.
2. Exact equality on computed values: `expect(saved).toBe(c.discount)`, `expect(stored.phone).toBe(c.phone)`.
3. Regex / message matching: `toMatch(/không hợp lệ/i)`, `toContainText(new RegExp(c.error,'i'))`.
4. Backend state as oracle through the API (`GET /users/me`, `GET /coupons`).
5. Soft assertions (`expect.soft`) so one test reports discount, total and summary mismatches together.
6. HTTP status assertions: `toBe(403)`, `toBeGreaterThanOrEqual(400)`, `toContain([401,403])`.
7. Native validity API: `el.validity.valueMissing`.

## Not automated / limitations
- **FR-04** login lockout side effects, session expiry: out of scope.
- **FR-09** expiry-date boundary: now covered by TC-09-22/23/24 (yesterday / today / tomorrow, UTC). Added after review – the first version only tested far-past (2020) and far-future (2099) dates, missing the boundary. Timezone is unspecified in the SRS; the server reads the date as 00:00 UTC.
- **FR-09** "order is recorded with the discounted total" – there is no order-detail endpoint used here (FR-11 is not in scope).
- **FR-17** edit/update – the spec lists Add/View/Delete only; the UI has no edit.
- **FR-17** API-level validation for `max_uses_per_user` 0/-3 and `type` outside percent/fixed.
- File-upload and CSV import are other FRs.
- Cross-browser rendering differences were not observed: results are identical on Chromium, Firefox, WebKit.

## Results
See `README.md` for the counts. Every failure is identical across the three browsers, so none is flaky; every
failure was traced to a line of SUT source (see `bug-report.md`).
