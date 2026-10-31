---
phase: 03-browsing-lightbox-and-standalone-pages
plan: 02
subsystem: content
tags: [eleventy, markdown-it, pdf, standalone-pages, ci-guard]

requires:
  - phase: 01-content-pipeline
    provides: resolveAsset, locator (authored line numbers), pages folder, slug validation
  - phase: 03-browsing-lightbox-and-standalone-pages (plan 01)
    provides: site header nav (CV, Teaching), reserved pdf slug
provides:
  - "Plain markdown links to PDFs in assets/ render as /pdf/ links labelled (PDF, size)"
  - "Only linked PDFs are copied to _site/pdf/; PDFs capped at 25 MB in renderer, CI guard and hook"
  - "/cv/ and /teaching/ starter pages and a sample syllabus PDF"
affects: [03-03, 03-04, 03-05, phase 4 README (AUTH-05)]

actuals:
  tokens: 6800
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "link_open branch in the asset_resolver core rule rewrites the href and splices a text token before link_close"
    - "Additive pdfs Map in lib/media.js, copied by copyMedia in eleventy.after"
    - "One cap constant (PDF_MAX_MB) in lib/limits.js read by renderer, CI guard and hook"

key-files:
  created:
    - test/pdf.test.js
    - content/pages/cv.md
    - content/pages/teaching.md
    - assets/teaching-sample-syllabus.pdf
  modified:
    - lib/limits.js
    - lib/markdown.js
    - lib/media.js
    - scripts/check-assets.js
    - scripts/shrink.js
    - test/build.test.js
    - test/check-assets.test.js
    - test/shrink.test.js

key-decisions:
  - "PDF sizes are 1024-based: whole KB (minimum 1 KB) below 1024 KB, else one-decimal MB"
  - "The size suffix is a markdown-it text token inside the link, so it wraps with the label and is escaped by the renderer"
  - "Table-cell links have no block.map, so a missing PDF there reports the file with line ? (loc.fail fallback)"

patterns-established:
  - "Link-driven publishing: a file in assets/ reaches _site only when a page links it (D-17)"
  - "Raw HTML <a> links and remote .pdf URLs are never rewritten or published"

requirements-completed: [SITE-04, SITE-05]

duration: 20min
completed: 2026-10-30
status: complete
plan_head_before: 18769843e4a9ba71c5fa03cc7afa00d1d2e5202c
plan_head_after: d751e305bcc0db1bb4649b88126182ab9a045c84
commits: 5
---

# Phase 3 Plan 02: PDF links, CV and Teaching pages Summary

**Plain markdown PDF links that render as `Label (PDF, 340 KB)`, publish only the linked file to `/pdf/`, fail the build on a missing or over-25 MB file, plus starter `/cv/` and `/teaching/` pages and matching CI and hook caps**

## Performance

- **Duration:** about 20 min
- **Completed:** 2026-10-30
- **Tasks:** 3 (two TDD RED/GREEN pairs plus the tracer pair)
- **Files modified:** 12 (4 new, 8 changed)

## Accomplishments

- `[Syllabus](../../assets/syllabus.pdf)` renders `<a href="{prefix}pdf/syllabus.pdf">Syllabus (PDF, 1 KB)</a>` on any page, with no `target` and no `download`; `#page=2` and `?v=2` survive, upper-case `.PDF` resolves, remote URLs, other schemes and raw HTML anchors are untouched.
- `_site/pdf/` holds only PDFs some page links, byte for byte; an unlinked PDF appears nowhere and `_site/assets` never exists.
- A missing PDF fails with `{file}:{line}: PDF not found in assets/: {link}` at the link's own line (including the second line of a paragraph and with front matter); a PDF over 25 MB fails with `PDF {name} is {N} MB; the limit is 25 MB.`, while exactly 25 MB passes.
- `PDF_MAX_MB = 25` in `lib/limits.js` feeds the renderer, `npm run check:assets` (own branch, never decoded, no 10 MB image rule) and the pre-commit hook (`PDFs are never converted; ...`); the hook renames a PDF to its slug byte-identically and rewrites links.
- `/cv/` and `/teaching/` render through `base.njk` and stay out of `collections.projects`; a project with `slug: cv` or `slug: teaching` fails with `already used by`.
- Suite: 215 pass, 0 fail (baseline 191). `npm run build` writes `_site/cv`, `_site/teaching` and `_site/pdf/teaching-sample-syllabus.pdf`; `npm run check:assets` OK.

## Task Commits

1. **Task 1: End-to-end PDF link (tracer)** - `532cb67` (test, RED), `a663808` (feat, GREEN)
2. **Task 2: CV and Teaching starter pages with sample PDF** - `94e8396` (feat; its tests passed on first run because Task 1 already implemented the behaviour, so no separate RED commit)
3. **Task 3: CI guard and hook accept PDFs up to 25 MB** - `e441fa9` (test, RED), `d751e30` (feat, GREEN)

**Plan metadata:** committed with this SUMMARY (docs).

## Files Created/Modified

- `lib/limits.js` - `PDF_EXTS`, `PDF_MAX_MB`, `PDF_MAX_BYTES` (still import-free)
- `lib/markdown.js` - `link_open` branch: resolve, cap, register, rewrite href, splice size suffix; index-based loop with a per-block line counter
- `lib/media.js` - `pdfs` Map, `registerPdf`, `formatPdfSize`, `copyMedia` publishes `_site/pdf/`
- `scripts/check-assets.js`, `scripts/shrink.js` - PDF branches and guidance text using the constants
- `content/pages/cv.md`, `content/pages/teaching.md`, `assets/teaching-sample-syllabus.pdf` - starter pages and a 590-byte one-page PDF (generated by a throwaway script in the scratchpad, not committed; Spotlight reads it as a 1-page PDF)
- `test/pdf.test.js` - 19 tests: size format, unit renders, full builds, starter pages, slug collisions
- `test/build.test.js` - originals test exempts linked PDFs in `_site/pdf`
- `test/check-assets.test.js`, `test/shrink.test.js` - cap tests

## Decisions Made

See key-decisions. The plan was followed as written.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Observations (not changed)

- Links inside table cells have no `block.map`, so a missing PDF there reports `{file}:?:`. The file is named, as the plan requires; a precise row line would need the table rule to set a map.
- The human check in Task 2 (open `/teaching/` under `npm start`, click the syllabus, read `/cv/`) was not run by this executor; per `human_verify_mode: end-of-phase` it belongs to the phase verification. The owner should rewrite `cv.md` and `teaching.md` and swap the sample PDF.
- The SITE-04 concurrency backstop (complete-artifact Pages deploys, `pages` concurrency group, additive Maps under `npm start`) is carried as a backstop truth; no new code was needed beyond the additive `pdfs` Map.

## Known Stubs

None that block the goal. `content/pages/cv.md`, `content/pages/teaching.md` and the sample syllabus are intentional starter text (RESEARCH Open Question 2) for the owner to rewrite.

## Threat Flags

None. T-03-04 (traversal) is handled by `resolveAsset` basename lookup, T-03-05 by publishing only registered PDFs (tested), T-03-06 by the cap in all three places (tested), T-03-07 by `encodeURIComponent` and a text token, T-03-08 by no `target`/`download` (tested).

## User Setup Required

None. Owner actions at the end-of-phase check: rewrite the two starter pages and replace the sample PDF.

## Next Phase Readiness

- Header nav targets `/cv/` and `/teaching/` now exist. Plans 03-03 to 03-05 are unaffected.
- No blockers.

## Self-Check: PASSED

- Files exist: test/pdf.test.js, content/pages/cv.md, content/pages/teaching.md, assets/teaching-sample-syllabus.pdf
- Commits exist: 532cb67, a663808, 94e8396, e441fa9, d751e30
- `npm test`: 215 pass, 0 fail; `npm run check:assets`: OK; `npm run build` writes the CV, Teaching and PDF outputs

---
*Phase: 03-browsing-lightbox-and-standalone-pages*
*Completed: 2026-10-30*
