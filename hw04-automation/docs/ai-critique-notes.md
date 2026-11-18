# AI Critique – notes (write the 200–300 words yourself)

HW04 §10 asks for *your* critique, in your own words. These are the factual points from this project to build it from.

**Where the AI was wrong / incomplete**
- First-draft tests hung on an alert: `waitForEvent('dialog')` leaves the dialog open (TC-17-18/19).
- Assumed a one-click "add to cart" and `page.goto('/cart')` keeping the cart; both false in this SUT.
- Selectors: labels are not tied to inputs, so the suite relies on position-based locators – fragile.
- Weak oracle: tests for `max_uses_per_user` 0/-3 pass because the browser blocks the form, which hides a possible server bug.
- Risk (avoided, not an incident): after reading the server code, the AI could have copied its behaviour into the expected value (percent formula) instead of using the spec.

**Why it did not catch these**
- No execution feedback in the first draft; Playwright dialog semantics are a runtime detail.
- Spec says nothing about the cart implementation or click-count behaviour.
- A generic prompt ("write tests for coupons") does not force "derive expected results from the SRS only".

**Principle learned (examples)**
- Make the AI derive the oracle from the spec, run the tests, and classify every failure (SUT bug vs test bug) before trusting it.
- Identical failures on three browsers are strong evidence for a real defect.
- A green test is not proof – check what the assertion can actually detect.
