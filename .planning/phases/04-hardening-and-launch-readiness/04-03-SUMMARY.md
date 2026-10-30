---
phase: 04-hardening-and-launch-readiness
plan: 03
subsystem: navigation-seo
tags: [eleventy, pager, sitemap, robots, collections, node-test]

requires:
  - phase: 04-hardening-and-launch-readiness
    provides: "Draft preprocessor and buildServe() fixture helper (04-01); isProject flag and site.url (04-02)"
provides:
  - "Project pager: nav.pager (aria-label Projects) as the last child of main on project pages, Previous = newer, Next = older, no wrap, none for a single project"
  - "sitemap collection (sorted public URLs, drafts and draft-only tag pages excluded) and usedTagDefs(items) helper"
  - "/sitemap.xml (absolute URLs via htmlBaseUrl(site.url), no lastmod) and /robots.txt (allow all, absolute Sitemap line)"
affects: [04-04, 04-05]

actuals:
  tokens: 4400
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Neighbour links come from Eleventy's built-in getPreviousCollectionItem/getNextCollectionItem over collections.projects, so ends never wrap"
    - "Sitemap built from api.getAll() plus explicit tag-page URLs, because collections.all holds only the first page of a paginated template"
    - "Machine-readable text outputs (xml, txt) are njk templates with no layout and eleventyExcludeFromCollections"

key-files:
  created: [content/sitemap.njk, content/robots.njk, test/pager.test.js, test/sitemap.test.js]
  modified: [src/_includes/base.njk, content/style.css, eleventy.config.js, test/helpers/site.js]

key-decisions:
  - "The pager needs no draft code: the live collection never contains drafts, and serve mode keeps them in the chain"
  - "The sitemap re-checks data.draft === true itself so drafts stay unlisted under npm start, and builds tag URLs from non-draft projects only"
  - ".pager ul / .pager a are separate CSS rules rather than added to the .filters selector list, because test/browse.test.js asserts the exact .filters rule"
  - "No lastmod in the sitemap: a project date is a creation date, not a modified date"

requirements-completed: [SITE-06, SITE-07]

coverage:
  - id: D1
    description: "Project pages end with a Previous (newer) / Next (older) pager in feed order that stops at the ends, with a root-relative href that gets the path prefix"
    requirement: SITE-06
    verification:
      - kind: integration
        ref: "test/pager.test.js#a middle project has Previous (newer) then Next (older)"
        status: pass
      - kind: integration
        ref: "test/pager.test.js#the newest project has only a Next link, to the older neighbour"
        status: pass
      - kind: integration
        ref: "test/pager.test.js#the oldest project has only a Previous link, to the newer neighbour"
        status: pass
      - kind: integration
        ref: "test/pager.test.js#a root-domain build links without the path prefix"
        status: pass
    human_judgment: false
  - id: D2
    description: "No pager on single-project sites, standalone pages, /work/, tag pages, home or 404; pager is last child of main and distinct from the Main nav"
    requirement: SITE-06
    verification:
      - kind: integration
        ref: "test/pager.test.js#standalone pages, /work/, tag pages, the homepage and 404 have no pager"
        status: pass
      - kind: integration
        ref: "test/pager.test.js#a single project gets no pager element at all"
        status: pass
      - kind: integration
        ref: "test/pager.test.js#the pager is the last child of <main>, after the content, and distinct from the Main nav"
        status: pass
    human_judgment: false
  - id: D3
    description: "Drafts are skipped by the pager in the live build and take part under serve mode; neighbour titles are escaped once"
    requirement: SITE-06
    verification:
      - kind: integration
        ref: "test/pager.test.js#a live build skips a draft: neighbours link to each other and nothing points at it"
        status: pass
      - kind: integration
        ref: "test/pager.test.js#under npm start (serve mode) drafts take part in the chain"
        status: pass
      - kind: integration
        ref: "test/pager.test.js#a neighbour title with an ampersand is escaped exactly once"
        status: pass
    human_judgment: false
  - id: D4
    description: "/sitemap.xml lists each public page exactly once, sorted, with absolute URLs (all tag pages, no 404, drafts, draft-only tag pages, sitemap or robots), in live and serve builds and at a root domain"
    requirement: SITE-07
    verification:
      - kind: integration
        ref: "test/sitemap.test.js#sitemap.xml lists every public page once, sorted, with absolute URLs"
        status: pass
      - kind: integration
        ref: "test/sitemap.test.js#serve mode builds the draft page but still never lists it or its tag page"
        status: pass
      - kind: integration
        ref: "test/sitemap.test.js#with several used tags every tag page is listed, not just the first"
        status: pass
      - kind: integration
        ref: "test/sitemap.test.js#a root-domain build has no path prefix in either file"
        status: pass
    human_judgment: false
  - id: D5
    description: "/robots.txt allows everything and ends with the absolute Sitemap line; the real site lists its project"
    requirement: SITE-07
    verification:
      - kind: integration
        ref: "test/sitemap.test.js#robots.txt allows everything and ends with the absolute Sitemap line"
        status: pass
      - kind: integration
        ref: "test/sitemap.test.js#the owner's real site lists its project"
        status: pass
    human_judgment: false
  - id: D6
    description: "The pager looks right (spacing, rule, wrapping row) and reads well with a screen reader"
    verification: []
    human_judgment: true
    rationale: "Visual spacing and screen-reader phrasing are judgment calls that no fixture test asserts; left for the owner's end-of-phase UAT. The deployed site has one project, so the pager only shows once a second project exists"

duration: 5min
completed: 2026-10-30
status: complete
plan_head_before: 2d57f7c4b11a3d7fd20aaaf20b4f57d721a4b770
plan_head_after: e591098989cf1653083b6ad09884caa47fd780da
commits: 4
---

# Phase 4 Plan 03: Project pager and sitemap Summary

**Project pages now end with a Previous/Next pager over the existing `projects` collection (built-in neighbour filters, no wrap, drafts skipped live), and the site publishes a draft-free `/sitemap.xml` with absolute `site.url` + prefix URLs plus an allow-all `/robots.txt` pointing to it.**

## Performance

- **Duration:** about 5 min
- **Started:** 2026-10-30T22:18Z
- **Completed:** 2026-10-30T22:24Z
- **Tasks:** 2
- **Files modified:** 8 (4 created)

## Accomplishments

- `<nav class="pager" aria-label="Projects">` is the last child of `<main>` on project pages: `← Previous: {newer}` (`rel="prev"`) and `Next: {older} →` (`rel="next"`), arrows `aria-hidden`. The newest project has only Next, the oldest only Previous, a single project has no pager element. CSS adds a wrapping link row and a 2px ink rule above it, using only existing font sizes and weights.
- `usedTagDefs(items)` is extracted in `eleventy.config.js` and shared by `tagPages` (behaviour unchanged) and the new `sitemap` collection, which adds every used tag page explicitly (not just the first, per RESEARCH Pitfall 3) and drops `data.draft === true` items so serve mode never lists drafts either.
- `content/sitemap.njk` and `content/robots.njk` render through `htmlBaseUrl(site.url)`. Real build: `https://djmccurley.github.io/portfolio-test/` home, `cv/`, `tags/games/`, `teaching/`, `tidepool-game/`, `work/`; robots ends with `Sitemap: https://djmccurley.github.io/portfolio-test/sitemap.xml`. `_site/tidepool-game/index.html` has no pager (one project).
- Test suite went from 319 to 337 passing tests; `npm test` and `npm run build` are green.

## TDD Gate Compliance

- **Task 1 (tracer) RED (ab31081):** 8 of 10 new pager tests failed on assertions about the missing pager (the two no-pager cases correctly pass before and after). Builds succeeded, so the failures are assertion failures, not crashes. **GREEN (ee20d7a).** Tracer gate (auto form): the five-file automated verify (87 tests) was run after the change and passed before expansion.
- **Task 2 RED (b4c3457):** all 8 sitemap tests failed because `_site/sitemap.xml` and `robots.txt` did not exist (ENOENT on the planned output). **GREEN (e591098).** `npm test` 337 pass, 0 fail.
- No refactor commits were needed.

## Task Commits

1. Task 1 (tracer): `ab31081` test, `ee20d7a` feat
2. Task 2: `b4c3457` test, `e591098` feat

## Files Created/Modified

- `src/_includes/base.njk` - pager after the content, gated by `isProject`
- `content/style.css` - `.pager ul`, `.pager a`, `main > .pager`
- `eleventy.config.js` - `usedTagDefs`, refactored `tagPages`, new `sitemap` collection
- `content/sitemap.njk`, `content/robots.njk` - `/sitemap.xml`, `/robots.txt`
- `test/helpers/site.js` - fixture allow-list includes the two new templates
- `test/pager.test.js`, `test/sitemap.test.js` - 10 and 8 tests

## Decisions Made

See `key-decisions`. In short: no draft code in the pager (the collection is already draft-free live), an explicit draft check in the sitemap for serve mode, separate `.pager` CSS rules to keep the exact-rule `.filters` test intact, and no `lastmod`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Merged `.pager` into the `.filters` selector lists broke an existing test**
- **Found during:** Task 1 (first GREEN attempt)
- **Issue:** `test/browse.test.js` ("filter row CSS") asserts a standalone `.filters` rule and that `.filters a` is in the padding selector list; grouping `.pager ul` into the `.filters` rule changed that selector.
- **Fix:** Kept `.filters` rules untouched and added separate `.pager ul` and `.pager a` rules (as the plan text actually specified).
- **Files modified:** content/style.css
- **Verification:** five-file verify green (87 pass, 0 fail)
- **Committed in:** ee20d7a (never committed in the broken form)

---

**Total deviations:** 1 auto-fixed (1 bug, pre-commit, in my own first draft)
**Impact on plan:** None; the committed result matches the plan.

## Issues Encountered

None. The human-visible check (how the pager looks) is open for the phase UAT.

## Known Stubs

None.

## Threat Flags

None. T-04-10 (draft exposure) and T-04-11 (injection) are mitigated and asserted in `test/pager.test.js` and `test/sitemap.test.js`. T-04-12 (robots.txt is not access control) is accepted; robots.txt is inert on a github.io project path until a custom domain, as decided in D-12.

## Self-Check: PASSED

- Created files exist: content/sitemap.njk, content/robots.njk, test/pager.test.js, test/sitemap.test.js.
- Commits ab31081, ee20d7a, b4c3457, e591098 are ancestors of HEAD; `git rev-list --count` from the recorded base gives 4.
- Acceptance greps: base.njk has `aria-label="Projects"`, `getPreviousCollectionItem`, `getNextCollectionItem`; style.css has `.pager`; eleventy.config.js has `addCollection("sitemap"` and `usedTagDefs`; sitemap.njk has `permalink: /sitemap.xml`, `eleventyExcludeFromCollections: true`, `htmlBaseUrl(site.url)`; robots.njk has `Sitemap:` and `Allow: /`; helper has `sitemap.njk`.
- `npm test`: 337 pass, 0 fail. `npm run build`: exit 0.
