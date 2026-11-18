# AI Audit Report – HW04

**Declaration:** I use AI tools for the following tasks.

- **AI tool:** Claude Code (VS Code extension), model Claude Sonnet 5.5 (`claude-sonnet-5-5`).
- **Other tools:** Playwright 1.65.1 (test runner + HTML reporter), Node.js v24.20.0.
- **Dates:** 2026-11-17 to 2026-11-18 (local time).
- **Human responsibility:** I (student 23120034) reviewed the outputs, run the suite and am responsible for the final scripts.

> TODO (student): this log was assembled from the session. Paste your *exact* prompts from the Claude Code
> transcript where marked, and add your own prompts/outputs from any later sessions. Do not invent entries.

## Interaction log

| # | Step | Prompt (summary – replace with verbatim) | AI output / what was produced | Human review |
|---|------|--------------------------------------------|-------------------------------|--------------|
| 1 | Read the assignment | "kiểm tra giúp tui các nhiệm vụ của hw4" | Summary of HW04 tasks, deliverables, constraints (read from the PDF) | Compared with the PDF |
| 2 | Feature selection | (screenshot of the FR sign-up sheet) "tui chọn fr 4-9-17 là đủ fr cho hw4 chưa á" | Confirmed one feature per Pool A/B/C (FR-04, FR-09, FR-17) | Checked against my HW02 submission – TODO confirm |
| 3 | SUT readiness | "oke" | Started backend + both frontends; confirmed ports 3000/5173/5174 | – |
| 4 | Scaffolding, step by step | "hãy tạo thư mục mới cho hw4, đồng thời dẫn AI thực hiện từng bước theo yêu cầu của hw4" | New repo folder, `playwright.config.js` (3 browsers, "Run by" title + ISO timestamp), helpers, `scripts/run-matrix.js` | Verified the HTML header shows "Run by: 23120034 \| <ISO>" by opening a report |
| 5 | Source reading | (same session) | Read `Profile.jsx`, `Checkout.jsx`, admin `App.jsx`, `server.js` to learn selectors / endpoints | – |
| 6 | FR-04 | (same session) | `data/fr04-profile.json` (13 cases) + `tests/fr04-profile.spec.js` (19 tests) | Found that "accepted" cases fail because of the SUT's phone regex (BUG-01), confirmed by reading `Profile.jsx:43` |
| 7 | FR-09 | (same session) | `data/fr09-coupon.json` + `tests/fr09-coupon-checkout.spec.js` (24 tests) | Oracle recomputed from SRS; fixed e2e navigation (cart in React state) |
| 8 | FR-17 | (same session) | `data/fr17-coupon-admin.json` + `tests/fr17-coupon-admin.spec.js` (23 tests) | Fixed hanging dialog tests |
| 9 | Run + report | (same session) | 9 runs (3 FR × 3 browsers), HTML reports, bug report, review/gap analysis | See `docs/review-gap-analysis.md` |

## Notes on what was and was not AI-generated
- Test code, test data, docs: drafted by the AI, reviewed and run by me.
- **Not AI-generated (must be mine):** the HTML reports (produced by my own run), the demo video with my voice and
  `whoami`/`hostname`, the GitHub Issues, the git history, the AI Critique wording.
