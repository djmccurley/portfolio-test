---
phase: 03-browsing-lightbox-and-standalone-pages
plan: 03
subsystem: ui
tags: [eleventy, nunjucks, pagination, taxonomy, validation, accessibility]

requires:
  - phase: 03-01
    provides: card.njk partial, /work/ page, header with section-aware aria-current, collections.projects
provides:
  - "/tags/{slug}/ pages for exactly the tags that have projects, titled Work: {label}"
  - "src/_data/tags.js as the single { slug, label } tag list"
  - "src/_includes/filters.njk: All + used tags row under the h1 of /work/ and tag pages"
  - "Tags row in every project page's meta dl via projectTags"
  - "validateTagDefs and FIXTURE_TAGS (tests independent of the owner's tag list)"
affects: [03-04, 03-05, homepage, verification]

actuals:
  tokens: 9000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Tag defs are paginated as plain { slug, label } objects (collections.tagPages), not collection items"
    - "Computed titles and permalinks are JS functions so labels are escaped exactly once"
    - "Templates read projectTags, never plain tags (pages inherit the global list once deep merge is off)"
    - "Fixture sites get their own tags.js from the test helper"

key-files:
  created:
    - content/tags.njk
    - content/tags.11tydata.js
    - src/_includes/filters.njk
  modified:
    - src/_data/tags.js
    - eleventy.config.js
    - lib/validate.js
    - content/work.njk
    - content/style.css
    - content/projects/projects.11tydata.js
    - src/_includes/base.njk
    - test/helpers/site.js
    - test/browse.test.js
    - test/content-errors.test.js
    - test/blocks.test.js
    - test/design.test.js

key-decisions:
  - "A non-list tags.js export is reported from the config function: Eleventy otherwise aborts on the global tags with a message that does not name the file"
  - "Project dl now always renders (every project has at least one tag), so the blocks test skips three top-level elements"
  - "The prose-cap test in design.test.js now expects ul:not(.cards, .filters)"

patterns-established:
  - "Shared include filters.njk keyed on a `current` slug (unset means All)"

requirements-completed: [SITE-02, SITE-05]

duration: 25min
completed: 2026-10-30
status: complete
plan_head_before: 5639aa1cc93e4ea6ef574494bed6015190c1470e
plan_head_after: 169d43ae21897548eac9abf0101b63f172f8b349
commits: 3
---

# Phase 3 Plan 03: Tag pages, filter row and project Tags row Summary

**Static `/tags/{slug}/` pages from a single `{ slug, label }` list in `src/_data/tags.js`, a shared All/tag filter row on `/work/` and tag pages, and a Tags row on every project page, with a validator for malformed tag lists and fixtures that no longer depend on the owner's tags**

## Performance

- **Duration:** about 25 min
- **Completed:** 2026-10-30
- **Tasks:** 3
- **Files modified:** 15 (3 new, 12 changed)

## Accomplishments

- Tag pages exist only for tags with at least one project, newest first through `card.njk`, titled and headed `Work: {label}` with the label escaped once (`Alpha & Co` becomes `Alpha &amp; Co`, no `&amp;amp;` in any page).
- `setDataDeepMerge(false)` stops the global tag list merging into each project; no built page contains `[object Object]`.
- `filters.njk` renders `<nav aria-label="Filter work by tag">` with `All` plus used tags in `tags.js` order and `aria-current="page"` on the current one; omitted when no tag is used. `.filters` wraps and never scrolls.
- Project pages show a Tags row (after Year, before Link) linking to each tag page; the `<dl>` renders for every project.
- `validateTagDefs` fails the build with four distinct `src/_data/tags.js:` messages (bad shape, non-list, bad slug, duplicate slug).
- Test suite 215 to 229 passing, 0 failing.

## Task Commits

1. **Task 1 (tracer): tag pages, `{ slug, label }` tags, validation** - `4998547` (feat)
2. **Task 2: filter row on /work/ and tag pages** - `854405e` (feat)
3. **Task 3: Tags row and fixture tag list** - `169d43a` (feat)

Tracer gate (end-of-phase mode, automated verify only): re-ran the tracer verify, passed, expanded.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Non-list `tags.js` export aborted in Eleventy before validation ran**
- **Found during:** Task 1 (`export default {}` test)
- **Issue:** With deep merge off, Eleventy reads the global `tags` as every page's tags and throws `String or Array expected for tags` without naming the file, so the planned `must export a list of tags` message never appeared.
- **Fix:** `eleventy.config.js` calls `validateTagDefs` at config time and throws `Content validation failed:` plus the message when the export is not an array.
- **Files modified:** `eleventy.config.js`
- **Commit:** 4998547

**2. [Rule 3 - Blocker] design.test.js asserted the old `ul:not(.cards)` selector**
- **Found during:** Task 2
- **Fix:** Updated the assertion to `ul:not(.cards, .filters)` (the plan widens the selector; the test file was not listed in `files_modified`).
- **Files modified:** `test/design.test.js`
- **Commit:** 854405e

**Total deviations:** 2 auto-fixed. **Impact:** none on scope.

## Spacing check (note from 03-01)

With the filter row present, h1 to filter row is 1.5rem (`main > h1 + *`, matching the UI-SPEC 24px) and filter row to cards is 2rem (block gap). With no tags in use the filter row is omitted and h1 to cards stays at the existing 2rem. Verified from the CSS rules, not in a browser.

## Human check not run

Task 3's human-check (view `/work/` and a tag page in a browser, edit a label, restart `npm start`, decide whether the four starter tags are the wanted list) belongs to end-of-phase verification.

## Known Stubs

None.

## Threat Flags

None. T-03-09 (escaping), T-03-10 (slug pattern) and T-03-11 (deep merge) are mitigated and covered by tests.

## Next

Ready for 03-04.

## Self-Check: PASSED

- Files present: content/tags.njk, content/tags.11tydata.js, src/_includes/filters.njk
- Commits 4998547, 854405e, 169d43a present on main
- `npm test`: 229 pass, 0 fail; `npm run build` writes `_site/tags/games/` only
