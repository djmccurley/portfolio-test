---
phase: 01-push-to-live-with-images
fixed_at: 2026-10-28T00:00:00Z
review_path: .planning/phases/01-push-to-live-with-images/01-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 1: Code Review Fix Report

**Fixed at:** 2026-10-28
**Source review:** .planning/phases/01-push-to-live-with-images/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6
- Fixed: 6
- Skipped: 0

Test suite: 58/58 passing (was 51). Each fix added a regression test.

## Fixed Issues

### WR-06: `cancel-in-progress: true` on the Pages concurrency group

**Files modified:** `.github/workflows/deploy.yml`, `test/workflow.test.js`
**Commit:** edce19c
**Applied fix:** Set `cancel-in-progress: false`. Added a test asserting the concurrency group and flag.

### WR-05: `prune-img` can crash on a malformed percent sequence

**Files modified:** `scripts/prune-img.js`, `test/prune-img.test.js`
**Commit:** 5ba5257
**Applied fix:** The raw name is always added to the referenced set. The decoded name is added in a try/catch. Added a test with `/img/50%off`.

### WR-03: Hook skips renamed assets

**Files modified:** `scripts/shrink.js`, `test/shrink.test.js`
**Commit:** 7bfb809
**Applied fix:** Added `--no-renames` to the staged diff. Added an e2e test that renames a committed PNG and checks it is converted. The test fails without the fix.

### WR-01: Oversize animated WebP flattened to a single frame

**Files modified:** `scripts/shrink.js`, `test/shrink.test.js`
**Commit:** 2c6e0c3
**Applied fix:** `animated: true` in `metaOf` and `encode`. The edge check uses `pageHeight`. Added a test with a 3200px, 3-frame WebP that checks it is resized to 3000px with 3 frames preserved.

### WR-04: Alpha heuristic forces PNG fallbacks for opaque images

**Files modified:** `lib/assets.js`, `test/images.test.js`
**Commit:** 838c851
**Applied fix:** `refreshAssets` now treats an image as alpha only when `hasAlpha` is true and `stats().isOpaque` is false. Added a test with a fully opaque RGBA PNG that expects webp+jpeg output. The test fails without the fix. The optional `removeAlpha` in `encode` was not applied.

### WR-02: GIF/AVIF limits not enforced by shrink, CI advice misleading

**Files modified:** `scripts/shrink.js`, `scripts/check-assets.js`, `test/shrink.test.js`, `test/check-assets.test.js`
**Commit:** 33239cd
**Applied fix:** This is a logic and policy change, so it is fixed: requires human verification. `shrink` now fails the commit for a GIF or AVIF over 10 MB or 3000px, with a "reduce by hand" message. The CI guard labels those errors "shrink cannot fix .gif/.avif; reduce it by hand" and the closing advice distinguishes convertible formats from GIF/AVIF. Tests cover both.

---

_Fixed: 2026-10-28_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
