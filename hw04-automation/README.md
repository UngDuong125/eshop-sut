# HW04 – Automation Testing (EShop) – Student 23120034

Playwright, data-driven, 3 browsers, HTML report per run with **"Run by: 23120034 | ISO timestamp"** in the header.
SUT: https://github.com/ttbhanh/eshop-sut (local copy at `D:\KiemThuPM\eshop-sut`).

| Pool | Feature | Spec | Data file |
|------|---------|------|-----------|
| A | FR-04 Personal profile management | `tests/fr04-profile.spec.js` | `data/fr04-profile.json` |
| B | FR-09 Discount coupons (checkout) | `tests/fr09-coupon-checkout.spec.js` | `data/fr09-coupon.json` |
| C | FR-17 Coupon management CRUD (admin) | `tests/fr17-coupon-admin.spec.js` | `data/fr17-coupon-admin.json` |

## Test summary (run on 2026-11-17 / FR-09 re-run 2026-11-18, `node scripts/run-matrix.js`)

| Metric | Value |
|--------|-------|
| Features | 3 |
| Test cases automated | 66 (FR-04: 19, FR-09: 24, FR-17: 23) |
| Browser runs | 9 (3 features × chromium / firefox / webkit) = 9 HTML reports |
| Test executions | 198 (66 × 3) |
| Executed | 198 |
| Passed | 129 (43 per browser) |
| Failed | 69 (23 per browser – identical on all 3 browsers) |
| Flaky / skipped | 0 / 0 |
| Distinct bugs found | 11 (see `docs/bug-report.md`) |
| Demo video | TODO – paste unlisted YouTube link |
| GitHub repo | https://github.com/UngDuong125/eshop-sut/tree/main/hw04-automation |

A "failed" test here means the SUT violates the SRS – not that the test is broken (each failure is traced to SUT source).

| Feature | Passed / Failed (per browser) | Failing test cases |
|---------|------------------------------|--------------------|
| FR-04 | 9 / 10 | TC-04-01, 02, 05, 06, 09, 11, 12, 13, 15, 16 |
| FR-09 | 17 / 7 | TC-09-01, 02, 04, 05, 07, 11, 14 |
| FR-17 | 17 / 6 | TC-17-05, 06, 07, 10, 22, 23 |

## Self-assessment (fill in your own grade)

| No. | Criteria | Grade | Self-assessed |
|-----|----------|-------|---------------|
| 1 | Task 1 – Feature A (FR-04) | 25 | |
| 1 | Task 1 – Feature B (FR-09) | 25 | |
| 1 | Task 1 – Feature C (FR-17) | 25 | |
| 2 | Task 2 – Demo video | 15 | |
| 3 | Agent Skills | 10 | |
| | **Total** | 100 | |

## How to run

```bash
# 1. start the SUT (backend :3000, web :5173, admin :5174)
# 2. in this folder
npm install
npx playwright install chromium firefox webkit
node scripts/run-matrix.js            # all 9 runs  -> reports/<fr>-<browser>/html
node scripts/run-matrix.js fr09       # one feature on 3 browsers
npx playwright show-report reports/fr09-chromium/html
STUDENT_ID=23120034 npx playwright test --project=firefox   # single ad-hoc run
```

Tests share one SQLite DB, so they run serially (`workers: 1`). Each test creates its own fresh user/coupon codes
and cleans up, so repeated runs do not collide. To reset the SUT: `node database.js` in `eshop-sut/backend`.

## Documents
- `docs/review-gap-analysis.md` – review of the AI-generated scripts (what the AI got wrong/missed and why)
- `docs/bug-report.md` + `docs/screenshots/` – bugs with evidence
- `docs/ai-audit-log.md`, `docs/ai-critique-notes.md` – AI Audit Report and critique notes
- `docs/demo-script.md` – script for the demo video; `docs/issues/` – ready-to-post GitHub issue texts
- `git-log.txt` – generate with `git log --stat > git-log.txt` before submitting

## Still to do by the student (cannot be produced by the AI)
1. Create the public GitHub repo and push; **≥ 8 commits that change `.spec.js` files** (a commit that only touches docs does not count).
2. Enable Issues on the repo (it is a fork, so off by default), run `node scripts/create-issues.js` with a token, then paste the issue URLs into `docs/bug-report.md`.
3. Record the ≥ 5-min Vietnamese demo video (own voice, face-cam or `whoami` + `hostname`), upload as unlisted, add the link.
4. Write the 200–300-word AI Critique yourself; paste your verbatim prompts into the audit log.
5. Re-run `node scripts/run-matrix.js` yourself so the reports carry your own run timestamp; export README/report to PDF.
6. Optional: Agent Skill (10 points) – package this workflow and demo it.
7. Zip as `23120034_HW04_AI_Automation_<grade>.zip`.
