---
phase: 02-layout-blocks-embeds-and-design-system
fixed_at: 2026-10-30T00:00:00Z
review_path: .planning/phases/02-layout-blocks-embeds-and-design-system/02-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-10-30
**Source review:** .planning/phases/02-layout-blocks-embeds-and-design-system/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (Critical and Warning; Info excluded by `fix_scope`)
- Fixed: 4
- Skipped: 0

**Verification:** run in the main checkout, because `git.branching_strategy` is "none" and a hand-rolled worktree has no `node_modules`. No worktree, temp branch or recovery sentinel was created. `npm test` passed 170 of 170 (166 before, plus 4 new regression tests).

## Fixed Issues

### WR-01: `main:focus { outline: none }` loses to the global focus-visible rule, so the skip link target gets a page-wide ring

**Files modified:** `content/style.css`, `test/design.test.js`
**Commit:** 396e4c7
**Applied fix:** The skip target rule is now `main[tabindex="-1"]:focus, main[tabindex="-1"]:focus-visible { outline: none; }`. Its specificity is (0,2,1), which beats the (0,2,0) ring rule. The design test now asserts this selector instead of the old text. Whether the specificity actually wins is not measured by the test, which only matches the CSS text. Worth a quick check in a browser.

### WR-02: A trailing hard break after an image inside a layout block gives a wrong and misleading error

**Files modified:** `lib/blocks.js`, `test/block-errors.test.js`
**Commit:** 3212c85
**Applied fix:** `isImageOnly` now accepts hard breaks via `isBreak`, so a paste with trailing spaces is no longer rejected. The failure path guards `firstNonImage() === -1` and falls back to the paragraph's first line. Linked images (`link_open`) now raise a specific message: "cannot hold linked images. Remove the link or move the image outside the block." The existing linked-image test was updated to expect the new message. New tests cover the hard-break case and the linked-image error line.

### WR-03: An out-of-range date passes validation and crashes Eleventy without naming the field's error format

**Files modified:** `lib/frontmatter.js`, `lib/validate.js`, `eleventy.config.js`, `test/content-errors.test.js`
**Commit:** e2d14ac
**Applied fix:** Added a shared `validDate()` helper in `lib/frontmatter.js` that checks real calendar months and days. `lenientFrontMatter` in `eleventy.config.js` and the validator in `lib/validate.js` both use it, and the duplicated `DATE_RE` is gone. `2024-13-45`, `2024-02-30` and `2024-00-10` now get the friendly "must be YYYY, YYYY-MM or YYYY-MM-DD" error with the file named. A new build-level test covers all three. Status is "fixed" rather than "requires human verification", because the logic was exercised by the build test.

### WR-04: CI error tells the owner to run `shrink` for an oversize WebP that `shrink` never touches

**Files modified:** `scripts/shrink.js`, `test/shrink.test.js`
**Commit:** ea1f318
**Applied fix:** `shrink` now re-encodes a WebP that is over `MAX_BYTES` as lossy (`webp-lossy`), even when it is within the pixel cap. WebPs that are only too wide keep the lossless path. After each conversion, `convertOne` warns if the output is still over 10 MB. A new test builds a 17 MB lossless noise WebP and checks that `shrink` brings it under 10 MB. I also ran this by hand: 17.3 MB went to 4.1 MB.

## Skipped Issues

None. The Info findings (IN-01 to IN-04) were out of scope for `fix_scope: critical_warning`.

---

_Fixed: 2026-10-30_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
