# AI Audit Report – HW04 Automation Testing (23120034)

**Declaration:** I use AI tools for the following tasks.

| Item | Value |
|------|-------|
| AI tool | Claude Code (VS Code extension), model Claude Sonnet 5.5 (`claude-sonnet-5-5`) |
| Non-AI tools | Playwright 1.65.1 (runner + HTML reporter), Node.js v24.20.0, Git, VS Code |
| Session | one Claude Code session, id `11cd80e1-1e52-44c2-b9de-02f340ebef1b` (transcript kept locally) |
| Time zone of the times below | local time, UTC+7 (the transcript stores UTC; converted) |
| Responsibility | I reviewed the outputs, ran the suites myself and take full responsibility for the final scripts. |

Prompts are copied **verbatim** from the session transcript (typos and Vietnamese informal wording kept). I did not
write one big prompt such as "write all automation scripts"; I asked for the task, then reviewed each step.

## Interaction log

### #1 – Read the assignment
- **Date-time:** 2026-11-15 20:21:51
- **Prompt:** `kiểm tra giúp tui các nhiệm vụ của hw4`
- **AI output:** read `2026.HW04.Automation Testing_En.pdf` and summarised the tasks (Task 1 scripts ≥ 12 cases per feature, data-driven, ≥ 3 assertion patterns, 3 browsers, HTML report with "Run by"; Task 2 video; Agent Skill; audit; critique; ≥ 8 spec commits), deliverables and anti-cheat rules.
- **My review:** compared the summary with the PDF.

### #2 – Feature selection
- **Date-time:** 2026-11-17 23:57:34
- **Prompt:** *(attached a screenshot of the FR sign-up sheet)* `tui chọn fr 4-9-17 là đủ fr cho hw4 chưa á`
- **AI output:** confirmed one feature per pool: FR-04 (Pool A), FR-09 (Pool B), FR-17 (Pool C).
- **My review:** the choice is the same as in HW02 (I picked these features); I checked that no other group member chose them.

### #3 – SUT readiness
- **Date-time:** 2026-11-17 23:57:57
- **Prompt:** `oke`
- **AI output:** started the backend (:3000), web (:5173) and admin (:5174) and checked the ports.
- **My review:** opened the three URLs.

### #4 – Scaffolding and step-by-step generation
- **Date-time:** 2026-11-18 00:03:00
- **Prompt:** `hãy tạo thư mục mới cho hw4, đồng thời dẫn AI thực hiện từng bước theo yêu cầu của hw4`
- **AI output (sub-steps in the order done):**
  1. New project `hw04-eshop-automation`: `playwright.config.js` (3 projects, serial worker, HTML reporter whose title carries `Run by: 23120034 | <ISO>`), `tests/helpers/*`, `scripts/run-matrix.js`.
  2. Read `Profile.jsx`, `Checkout.jsx`, admin `App.jsx`, `server.js` to get real selectors/endpoints.
  3. FR-04: `data/fr04-profile.json` + `tests/fr04-profile.spec.js` (19 tests).
  4. FR-09: `data/fr09-coupon.json` + `tests/fr09-coupon-checkout.spec.js`.
  5. FR-17: `data/fr17-coupon-admin.json` + `tests/fr17-coupon-admin.spec.js` (23 tests).
  6. Ran the 9-run matrix, traced each failure to the SUT source, wrote `docs/bug-report.md`, `docs/review-gap-analysis.md`, README.
- **My review:** read the generated specs; opened an HTML report in a browser to confirm the "Run by" header; confirmed failures by reading `Profile.jsx:43` and `server.js`; saw the FR-17 dialog tests hang (40 s) and the FR-09 e2e lose its cart, and had them fixed (see gap analysis #1–#3).

### #5 – Review question: coupon date boundary
- **Date-time:** 2026-11-18 09:36:23
- **Prompt:** `ủa mà chỗ test case coupon á, không kiểm tra biên ở phần ngày hả`
- **AI output:** admitted the first FR-09 data only used far-past / far-future dates; added `dateBoundaryCases` TC-09-22/23/24 (expired yesterday / today / valid tomorrow) with the dates computed in UTC (the server compares against 00:00 UTC); re-ran FR-09.
- **My review:** I found this gap myself while reading the test cases; the AI's first timezone-sensitive version failed at local UTC+7 and was changed to UTC arithmetic.

### #6 – Push to my GitHub, issues, demo script, voice question
- **Date-time:** 2026-11-18 10:17:37
- **Prompt:**
  ```
  https://github.com/UngDuong125/eshop-sut
  giúp tui commit lên đây được không? cái eshop này với eshop trong máy có mã nguồn giống nhau á, khác 1 cái là cái link này ở tài khoản tui còn bên kia là của nhóm, xong rồi hãy tạo issue và cho tui kịch bản demo, với phải lồng tiếng của tui hay lồng tiếng AI cũng được á
  ```
- **AI output:** cloned my repo to a separate folder (group copy untouched), put the project under `hw04-automation/`, pushed 12 commits (8 change `.spec.js`); wrote 11 issue texts (`docs/issues/`) and `scripts/create-issues.js`; wrote `docs/demo-script.md`; answered that the voice must be my own (HW04 §11). GitHub Issues were **not** created by the AI (Issues disabled on the fork, no token).
- **My review:** the commits were produced in one batch from the real order of work, so their timestamps are seconds apart (disclosed in the report).

### #7 – Missing-items check and Agent Skill
- **Date-time:** 2026-11-18 12:27:55
- **Prompt:** `giúp tui kiểm tra xem phần báo cáo còn thiếu gì và liệt kê chi tiết các phần cần bổ sung, cùng với đó là giúp tui phần agent skill`
- **AI output:** compared the repo with the PDF (§6–§14) and listed missing items; created the Agent Skill `.claude/skills/playwright-datadriven-automation/` (SKILL.md + templates); fixed the FR-09 test count (21 → 24) in this log; pushed commit `510647e`.
- **My review:** *(to be completed by me after reading the skill and running it on a feature)*

### #8 – Supplementary documents and verbatim prompts
- **Date-time:** 2026-11-18 12:48:08
- **Prompt:** `giúp tui bổ sung các tài liệu ở mục B và bổ sung phần prompt nguyên văn`
- **AI output:** `REPORT.md` (main report), this log rewritten with verbatim prompts, `docs/ai-critique.md` (my own text moved here, unchanged), PDF export, refreshed `git-log.txt`.
- **My review:** *(to be completed by me)*

## What was and was not AI-generated
- **AI-drafted, human-reviewed:** test code, test data, helper scripts, bug-report and issue texts, gap analysis, report, the Agent Skill.
- **Not AI-generated (mine):** the HTML reports (from my own run on my machine), the demo video and my voice, the GitHub Issues, the AI Critique wording, the final choice of grade.
