---
name: playwright-datadriven-automation
description: Turn one feature of a web SUT (SRS/requirements + UI source) into a data-driven, multi-browser Playwright suite with per-run HTML reports ("Run by: <StudentID>" + ISO timestamp), a bug report with GitHub Issue drafts, a review/gap analysis and an AI audit log. Use when asked to "automate feature FR-xx", "generate Playwright tests from test cases", "run on 3 browsers", "HW04", or to maintain/extend such a suite.
---

# Playwright data-driven multi-browser automation (HW04 workflow)

Works one feature at a time. **Never** produce the whole suite from one prompt: do the steps in order, and stop for the
student at the marked checkpoints. The student is responsible for the final scripts, so every step ends with a review.

Inputs to collect first (ask only if missing): `STUDENT_ID`, feature id (e.g. FR-17), SRS text for the feature,
SUT paths/ports, test accounts, target repo. Defaults used in this repo: ports backend 3000 / web 5173 / admin 5174.

## Step 0 - Scaffold (once per repo)
Copy `templates/` into the repo (see "Templates"). Result: `playwright.config.js`, `tests/helpers/{env,data,api}.js`,
`scripts/run-matrix.js`, `data/`, `docs/`. Set `STUDENT_ID`. `npm i -D @playwright/test && npx playwright install chromium firefox webkit`.
Check the SUT is up (curl the API and both frontends) before running anything.

## Step 1 - Read the SUT, do not guess
Read the real UI source (components) and server routes for the feature. Record: selectors that exist (role/label/text,
`data-testid` if any), endpoints, auth mechanism (how a session can be injected, e.g. `localStorage` token), validation
rules in code. **The code is used only to find selectors/endpoints - expected results come from the SRS.** Where code and SRS
disagree, the SRS wins and that disagreement is a candidate bug.

## Step 2 - Derive >= 12 test cases per feature (checkpoint: show the list to the student)
Cover positive, negative, boundary (both sides of every limit, dates included: yesterday / today / tomorrow, computed in the
timezone the server uses), role/auth, and persistence. Give each an id `TC-<FR>-NN`, a type tag, input, expected result.
List cases you cannot automate and why (feeds `docs/review-gap-analysis.md`).

## Step 3 - Put the data outside the code
One `data/<fr>-<name>.json` per feature (or CSV). The spec loads it with `loadData()` and generates one `test()` per row.
No inline arrays of cases in the spec. Expected values are literal numbers/strings from the SRS, not recomputed with the SUT's
formula.

## Step 4 - Write the spec
Rules:
- Locators: `getByRole` / `getByLabel` / `getByText` first; positional `nth()` only when the markup gives no better handle, and say so in a comment.
- Waits: web-first assertions (`await expect(locator)...`); no fixed sleeps except where there is no DOM event (comment why).
- `alert()` dialogs: register `page.on('dialog', ...)` that records the message **and** accepts/dismisses; then `expect.poll`. Never `waitForEvent('dialog')` followed by a click (hangs).
- State that lives in React memory (e.g. a cart) is lost by `page.goto` - navigate with in-app links.
- Each test creates its own data (unique suffix per run) and cleans up in `afterEach` via API, so reruns and 3 browsers don't collide; `workers: 1` when the SUT shares one DB.
- Use >= 3 distinct assertion patterns, e.g. visible text via locator, exact equality, regex, backend state via API as oracle, HTTP status, `expect.soft`, `validity.valueMissing`.
- A test that fails because the SUT violates the SRS stays red and gets annotated `known-defect` - never weaken the assertion to make it green.

## Step 5 - Run, then triage every failure (checkpoint)
Run `npx playwright test <spec> --project=chromium` first. For each red test decide and record: **test bug** (fix the script, note what the AI got wrong) vs **SUT bug** (confirm in source, keep red) vs **flaky** (find the cause; rerun 3x). Fix test bugs, commit each fix separately (`fix(FR-xx): ...`) - these commits are the evidence of review.

## Step 6 - Multi-browser matrix
`node scripts/run-matrix.js [fr]` -> `reports/<fr>-<browser>/html` + `results.json`. Report title must contain
`Run by: <StudentID> | <ISO timestamp>`. Compare the three browsers; differences are findings, identical results prove the failures are not flaky.
The student must run this on their own machine (reports must be genuinely theirs).

## Step 7 - Bug report + issues
For each distinct SUT defect: id, severity, steps, expected (SRS clause), actual, probable cause (file:line), failing test ids, screenshot
(browser failures: test screenshot; API-only: screenshot of the failing assertion in the HTML report). Write `docs/issues/BUG-xx.md`
(first line = title) and `docs/bug-report.md`. `node scripts/create-issues.js --dry-run`, then real run needs Issues enabled + `GITHUB_TOKEN`
(ask the student; do not reuse stored git credentials).

## Step 8 - Review / gap analysis (honest)
`docs/review-gap-analysis.md`: what the AI got wrong or missed, **only things that actually happened** (fragile selector, hanging dialog,
lost state, timezone-dependent boundary, missing boundary cases...), why (prompt quality / model limit / feature trait), how fixed,
plus untested cases and limitations. Do not invent mistakes.

## Step 9 - AI audit log (after every step)
Append to `docs/ai-audit-log.md`: tool + model, date-time, the student's prompt **verbatim**, summary of AI output, what the student reviewed/changed.
Mark entries the student must complete as TODO. The 200-300-word AI Critique is written by the student; the skill may only provide notes.

## Step 10 - Hand-off checklist (what the AI must NOT do for the student)
Own-voice demo video (+ `whoami`/`hostname` or face-cam), unlisted YouTube link, GitHub Issues URLs, AI Critique text, final PDF export,
zip `<StudentID>_HW04_AI_Automation_<grade>.zip`. Remind the student; never fabricate links, reports or timestamps. Commit history must be real:
commit after each step, not in one batch at the end.

## Templates
`templates/` next to this file: `playwright.config.js`, `run-matrix.js`, `helpers/{data,env,api}.js`, `feature.spec.js` (data-driven skeleton),
`feature-data.json` (case schema), `bug-report.md`, `issue.md`, `ai-audit-log.md`.
Replace `<FR>`, `<STUDENT_ID>`, URLs and selectors; keep the structure.
