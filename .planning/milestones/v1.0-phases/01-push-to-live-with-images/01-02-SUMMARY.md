---
phase: 01-push-to-live-with-images
plan: 02
subsystem: validation
tags: [eleventy, validation, 404, front-matter]
requires: [01-01]
provides: [content validation, pages routing, 404 page, metadata dl]
affects: [eleventy.config.js, src/_includes/base.njk]
key-files:
  created: [lib/validate.js, content/pages/pages.11tydata.js, content/404.md, test/content-errors.test.js]
  modified: [eleventy.config.js, src/_includes/base.njk]
decisions:
  - Unparseable dates are stripped from Eleventy's parsed data (lenientFrontMatter in eleventy.config.js) so validate.js reports them with the file named
  - draft is not an allowed key until Phase 4
metrics:
  completed: 2026-10-28
---

# Phase 1 Plan 02: Content validation, 404 and metadata Summary

Build-failing validation of project and page front matter (collected in one report, file and field named), root-level pages, a plain 404 and an optional metadata `<dl>`.

## Commits
- Task 1 (RED tests): test(01-02) add failing tests
- Task 2: feat(01-02) add content validation and pages directory data
- Task 3: feat(01-02) add 404 page and metadata dl in layout

(`git log` on the branch shows the hashes.)

## Deviations from Plan

**[Rule 3 - Blocking] Bad dates hit Eleventy's own error first.** Eleventy throws "Data cascade value for `date` is invalid" before the validation collection runs, so the "must be YYYY, YYYY-MM or YYYY-MM-DD" message never appeared. Fix: eleventy.config.js wraps parseFrontMatter and drops string dates that do not match the allowed pattern; validate.js re-reads the raw value via readFrontMatter and reports it. Files: eleventy.config.js (not in the plan's file list beyond the validation wiring, but within it).

## Known Stubs
None.

## Verification
`npm test`: 24 pass, 0 fail. `npx eleventy` on real content builds 3 files.

## Self-Check: PASSED
