---
phase: 03-browsing-lightbox-and-standalone-pages
plan: 01
subsystem: ui
tags: [eleventy, nunjucks, css-grid, navigation, accessibility]

requires:
  - phase: 01-content-pipeline
    provides: validated project front matter, eleventy-img pipeline, resolveAsset, RESERVED_SLUGS
  - phase: 02-design-system
    provides: design tokens, named-line column grid, rhythm rules, test/design.test.js
provides:
  - "/work/ feed page listing every project as a card, newest first"
  - "src/_includes/card.njk, the single card partial for every browsing page"
  - "assetSrc filter (cover path relative to the rendering page)"
  - "site header with owner name and Main nav (Work, CV, Teaching) with aria-current"
  - "src/_data/site.js (site.name) and section: work directory data on projects"
  - "work and pdf reserved slugs"
  - "card grid, header row and heading-rhythm CSS"
affects: [03-02, 03-03, 03-04, 03-05, tag pages, homepage, standalone pages, lightbox]

actuals:
  tokens: 5242
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "One include (card.njk) renders every card grid; pages set `items` then include it"
    - "assetSrc filter is a regular function so this.page is bound; rewrites a cover to a path relative to the rendering page"
    - "Deterministic collection order via a secondary inputPath sort key"
    - "Fixture helper copies work.njk/tags.njk/lightbox.js and writes an empty featured.js so fixtures never inherit owner content"

key-files:
  created:
    - content/work.njk
    - src/_includes/card.njk
    - src/_data/site.js
    - test/browse.test.js
  modified:
    - eleventy.config.js
    - src/_includes/base.njk
    - content/projects/projects.11tydata.js
    - lib/validate.js
    - content/style.css
    - test/helpers/site.js
    - test/design.test.js

key-decisions:
  - "Only the first card cover is eager/high priority; the rest keep the pipeline default of lazy"
  - "Dates sort as written strings with input path as the tie-break, so equal dates are stable across builds"
  - "cv and teaching are not reserved slugs: a project slug clash with those pages already fails with 'already used by'"
  - "site.name ships as Dan McCurley (UI-SPEC default); the owner confirms in the end-of-phase check"

patterns-established:
  - "Card markup lives only in card.njk; tag pages and the homepage reuse it"
  - "aria-current styled via a[aria-current] placed after the global link rule"
  - "Crop is allowed only on selectors starting with .cards, enforced by test/design.test.js"

requirements-completed: [SITE-01, SITE-04, SITE-05]

duration: 15min
completed: 2026-10-30
status: complete
plan_head_before: f40f4e0eff864438b41f449d58342d92fbe826d9
plan_head_after: c19c7128c37e4401d210530d070f06a11d0ad6ad
commits: 3
---

# Phase 3 Plan 01: Work feed, card partial and site header Summary

**`/work/` card feed (4:3 cropped covers, newest first, deterministic ties) rendered through a single `card.njk`, plus a wrapping owner-name and Work/CV/Teaching header with `aria-current` and the card/rhythm CSS**

## Performance

- **Duration:** about 15 min
- **Completed:** 2026-10-30
- **Tasks:** 3
- **Files modified:** 11 (4 new, 7 changed)

## Accomplishments

- `/work/` lists every project as one `<li><a class="card">` with cover (srcset under the path prefix, first cover eager with `fetchpriority="high"`), title and the date exactly as written; zero projects shows `<p>No projects yet. Check back soon.</p>`.
- Every page header is now `header-row` with the `site.name` link and `<nav aria-label="Main">` (Work, CV, Teaching). Name is current on `/`, Work is `page` on `/work/` and `true` on project pages, CV and Teaching are `page` only on their own pages, and the 404 has no current item.
- `work` and `pdf` are reserved slugs; the build fails naming the file with `slug "work" is reserved` / `slug "pdf" is reserved`.
- CSS: 3/2/1 card columns with 4:3 centred covers (the only cropped images), wrapping header, `a[aria-current]` black and bold, prose cap excludes `ul.cards`, and heading gaps (3rem above, 1rem below) now beat the block rhythm rule.
- 17 new tests in `test/browse.test.js`, design tests narrowed and extended; full suite 191 pass, 0 fail (baseline 174).

## Task Commits

1. **Task 1: End-to-end `/work/` feed** - `e49da50` (feat)
2. **Task 2: Site header, nav, reserved slugs** - `5fe5eb0` (feat)
3. **Task 3: Card grid, header row and rhythm CSS** - `c19c712` (feat)

**Plan metadata:** committed with this SUMMARY (docs).

## Files Created/Modified

- `content/work.njk` - /work/ page: h1 Work, card grid or empty state
- `src/_includes/card.njk` - the one card partial (takes `items`)
- `src/_data/site.js` - owner name (`Dan McCurley`, to be confirmed)
- `eleventy.config.js` - `assetSrc` filter, tie-stable `projects` sort
- `src/_includes/base.njk` - header row, site name, Main nav, aria-current
- `content/projects/projects.11tydata.js` - `section: "work"`
- `lib/validate.js` - `work`, `pdf` reserved
- `content/style.css` - card grid, header row, current link, prose cap, rhythm
- `test/helpers/site.js` - fixtures carry work.njk, tags.njk, lightbox.js and an empty featured.js
- `test/browse.test.js`, `test/design.test.js` - feed, card, nav, reserved-slug and CSS contract tests

## Decisions Made

See key-decisions. All followed the plan; the owner name default is a flagged assumption from the plan.

## Deviations from Plan

None - plan executed exactly as written.

The human-check in Task 3 (open `/work/` in a browser at 1280, 800 and 360px, Tab through, confirm the name in `src/_data/site.js`) was not run by this executor; per `human_verify_mode: end-of-phase` it belongs to the phase verification. Automated checks cover markup, CSS contract and build output.

## Issues Encountered

None.

## Observations (not changed, out of plan scope)

- An `h1` directly followed by a `ul.cards` (the `/work/` page before plan 03-03 adds the filter row) gets the 2rem block gap rather than the 1.5rem `h1 + *` gap, because the block rule outranks `main > h1 + *`. The plan's selector lists were implemented exactly; if the 24px h1 gap is wanted there, add `main > h1 + :is(.layout, .embed, figure, .lone-image, .cards)` in a later plan.
- `content/index.md` still renders the old plain project list; plan 03-04 replaces it.
- The CV and Teaching nav links resolve once plan 03-02 adds those pages.

## Known Stubs

None.

## Threat Flags

None. Titles, `cover_alt`, dates and `site.name` render through Nunjucks autoescape with no `safe` filter (T-03-01, tested for the title case); `work`/`pdf` are reserved (T-03-02); covers go through `resolveAsset` and eleventy-img, so only `_site/img` derivatives publish (T-03-03).

## User Setup Required

None - no external service configuration required. Owner action at the end-of-phase check: confirm or edit the name in `src/_data/site.js`.

## Next Phase Readiness

- `card.njk`, the `assetSrc` filter, `section: "work"`, the reserved `pdf` slug and the fixture-helper hooks for `tags.njk`, `lightbox.js` and `featured.js` are in place for plans 03-02 to 03-05.
- No blockers.

## Self-Check: PASSED

- Files exist: content/work.njk, src/_includes/card.njk, src/_data/site.js, test/browse.test.js
- Commits exist: e49da50, 5fe5eb0, c19c712
- `npm test`: 191 pass, 0 fail; `npm run build` writes `_site/work/index.html` with the tidepool card

---
*Phase: 03-browsing-lightbox-and-standalone-pages*
*Completed: 2026-10-30*
