---
phase: 01-push-to-live-with-images
plan: 03
subsystem: asset-pipeline
tags: [git-hook, sharp, webp, ci-guard]
requires: [01-01]
provides:
  - "Pre-commit hook that shrinks/converts pasted images to WebP (<=3000px), slugifies names, rewrites .md links in the same commit"
  - "npm run shrink (manual) and npm run check:assets (CI guard)"
affects: [01-05]
tech-stack:
  added: []
  patterns: ["core.hooksPath .githooks via npm prepare", "index-only rewrite via hash-object/update-index"]
key-files:
  created: [scripts/shrink.js, scripts/check-assets.js, .githooks/pre-commit, test/shrink.test.js, test/check-assets.test.js]
  modified: [package.json]
decisions:
  - "Name collisions get -N suffix instead of failing (D-10 + D-14)"
  - "Oversize WebP detection lives in main(), since planConversions is pure and name-based"
metrics:
  tasks: 3
  completed: 2026-10-28
---

# Phase 1 Plan 03: Commit-time image shrink hook and CI guard Summary

Pre-commit hook (`scripts/shrink.js --staged`) turns staged PNG/JPEG/HEIC into <=3000px WebP with metadata stripped and slug names, deletes the original, and rewrites `.md` links in the index and working tree, with no unstaged hunks swept in. `scripts/check-assets.js` is the CI backstop.

## Commits
- Task 1 (RED tests): test(01-03) failing tests for shrink and check-assets
- Task 2: feat(01-03) shrink hook and prepare install (`.githooks/pre-commit` is 100755)
- Task 3: feat(01-03) check-assets CI guard

## Verification
`npm test`: 22 pass, 0 fail. `npm run check:assets` prints "check-assets: OK (1 files)".

## Deviations from Plan
- [Rule 1 - Test fixture] The JPEG orientation fixture uses `withMetadata({ orientation: 6 })` because sharp's `withExif` Orientation was not written to the fixture.
- check-assets per-file error for unconverted images also contains "run npm run shrink" so the library function's own message carries the guidance (CLI also prints the final line).

## Orchestrator action required
`core.hooksPath` was deliberately NOT set during the wave (shared repo config). After merge, run `npm run prepare` (or `npm install`) in the main checkout. The hook was exercised only in temp repos by the tests.

## Known Stubs
None.

## Self-Check: PASSED
