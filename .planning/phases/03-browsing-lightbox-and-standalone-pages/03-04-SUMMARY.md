---
phase: 03-browsing-lightbox-and-standalone-pages
plan: 04
subsystem: ui
tags: [eleventy, nunjucks, homepage, validation, collections]

requires:
  - phase: 03-01
    provides: card.njk partial, site.name global, fixture featured.js default
  - phase: 03-03
    provides: addValidation structure and the "Content validation failed" error convention
provides:
  - "resolveFeatured(slugs, projects) in lib/validate.js"
  - "featured collection in file order, never re-sorted"
  - "home.njk layout: intro, Selected work grid, All work link"
  - "src/_data/featured.js, the owner's ordered list of featured project slugs"
affects: [03-05, verification]

actuals:
  tokens: 3100
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Owner-edited data lists are validated by a pure resolver that returns { errors, items }, and the collection throws the joined errors"
    - "Global data is read from the data cascade inside a collection so a running npm start picks up edits"
    - "Computed page titles are JS functions so site.name is escaped once by base.njk"

key-files:
  created:
    - src/_includes/home.njk
    - content/index.11tydata.js
    - src/_data/featured.js
    - test/featured.test.js
  modified:
    - lib/validate.js
    - content/index.md
    - test/pdf.test.js

key-decisions:
  - "The non-list guard in resolveFeatured was written with the tracer (Task 1) because the function was written whole; Task 2's RED was therefore the shipped-list repo-build test"
  - "A missing featured value maps to an empty list (no heading, no grid), not an error"

patterns-established:
  - "Featured cards reuse card.njk, so they match feed cards and the first cover is eager"

requirements-completed: [SITE-03]

duration: 15min
completed: 2026-10-30
status: complete
plan_head_before: 2ed9f5affe3781cc23b24a508e458f00e1535703
plan_head_after: b29719594c870a0dd0a1989057ef17cad7e8bdfa
commits: 4
---

# Phase 3 Plan 04: Curated homepage Summary

**Homepage with the owner's name, a markdown intro, a "Selected work" grid driven by one ordered slug list in `src/_data/featured.js`, and an "All work" link; unknown, repeated, non-string and non-list entries fail the build with fix-it messages**

## Performance

- **Duration:** about 15 min
- **Completed:** 2026-10-30
- **Tasks:** 2
- **Files modified:** 7 (4 new, 3 changed)

## Accomplishments

- `resolveFeatured` walks the list in order and reports every bad entry (unknown, duplicate, non-string, non-list) with the exact UI-SPEC copy; one build reports all of them together.
- The `featured` collection matches a slug by `slug` front matter or file name (the permalink rule) and reads the list from the data cascade, so editing `featured.js` during `npm start` updates the homepage.
- `home.njk` keeps `h1`, intro `p`, `h2`, `ul.cards` and the All work `p` as direct children of `<main>`, so the existing rhythm rules apply. An empty list omits the heading and grid but keeps the link.
- `Ann & <Bo>` renders as `Ann &amp; &lt;Bo&gt;` exactly once in `<title>`, `<h1>` and the header link.
- Shipped `featured.js` features `tidepool-game`; the repo build shows its card.
- Test suite 229 to 243 passing, 0 failing.

## Task Commits

1. **Task 1 (tracer): RED** - `5bcc52c` (test)
2. **Task 1 (tracer): GREEN, resolveFeatured, featured collection, home.njk, index.md** - `a65e201` (feat)
3. **Task 2: RED, shipped-list and non-list tests** - `4155fca` (test)
4. **Task 2: GREEN, featured.js, pdf test update** - `b297195` (feat)

Tracer gate (end-of-phase mode, automated verify only): re-ran the tracer verify (`featured`, `browse`, `design` tests, 54 passing) and a real build, passed, expanded.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Old homepage test asserted the removed all-projects list**
- **Found during:** Task 2 (full `npm test`)
- **Issue:** `test/pdf.test.js` "a standalone page never joins the projects on the homepage" expected a project to appear on the homepage without featuring it; the homepage now lists only featured projects.
- **Fix:** The fixture supplies `src/_data/featured.js` of `["thing"]`; both assertions (page absent, project present) are kept.
- **Files modified:** test/pdf.test.js
- **Commit:** b297195

**2. [Process] Task 2 guard implemented in Task 1**
- The non-list guard went in with the rest of `resolveFeatured`, so only the repo-build test was RED in Task 2. All planned behaviors are still tested.

## Authentication Gates

None.

## Known Stubs

- `content/index.md` intro ("Graphic design, interactive and UX design, art and videogames.") is starter text the owner rewrites (planned; RESEARCH Open Question 2). It does not block the plan goal.

## Human Check Pending

Run `npm start`, open the homepage, add a nonexistent slug to `src/_data/featured.js` and confirm the build stops with the "does not match any project" message and recovers when removed. Then rewrite the intro and choose featured projects.

## Threat Flags

None.

## Self-Check: PASSED

- Files exist: lib/validate.js, src/_includes/home.njk, content/index.md, content/index.11tydata.js, src/_data/featured.js, test/featured.test.js.
- Commits 5bcc52c, a65e201, 4155fca, b297195 are ancestors of HEAD; `npm test` 243/243.
