---
phase: 04-hardening-and-launch-readiness
plan: 02
subsystem: seo
tags: [eleventy, open-graph, eleventy-img, link-previews, validation, node-test]

requires:
  - phase: 04-hardening-and-launch-readiness
    provides: "Draft handling, base.njk Draft label and hiddenNav conditionals, buildServe() fixture helper (plan 04-01)"
provides:
  - "Head preview block on every page: meta description, canonical, og:title/description/type/url/site_name/image/image:alt, twitter:card"
  - "ogImage filter: processed 1200px JPEG (PNG for transparency) derivative of a cover or the default share image"
  - "site.url, site.description, site.defaultImage, site.defaultImageAlt settings and assets/site-share.webp placeholder"
  - "validateSite(site, { resolveAsset }) and the optional `description` front matter key"
  - "isProject: true on every project (og:type now, the pager in plan 04-03)"
affects: [04-03, 04-04, 04-05]

actuals:
  tokens: 6257
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "Absolute URLs only through htmlBaseUrl(site.url), never string concatenation"
    - "Preview image has its own eleventy-img options (own widths/format, no imageOptions reuse) and is called once, in the layout head"
    - "Site settings validated from the data cascade inside the _validated collection, so npm start picks up edits"

key-files:
  created: [assets/site-share.webp, test/seo.test.js]
  modified: [src/_data/site.js, eleventy.config.js, src/_includes/base.njk, content/projects/projects.11tydata.js, test/helpers/site.js, lib/validate.js, test/featured.test.js]

key-decisions:
  - "og:image is always an eleventy-img derivative (1200px JPEG, PNG when the source has alpha); no original from assets/ is ever linked"
  - "site.url holds the origin only and is validated as an https origin (port allowed); the subpath stays in PATH_PREFIX"
  - "Description fallback chain is description, then summary, then site.description; a non-string description fails the build, an empty one falls back"
  - "Fixture sites get a default share image written by test/helpers/site.js, overridable per test through `assets`"

requirements-completed: [SITE-07]

coverage:
  - id: D1
    description: "Every page carries description, canonical and og/twitter tags with absolute URLs under the prefix and at a root domain"
    requirement: SITE-07
    verification:
      - kind: integration
        ref: "test/seo.test.js#a project page carries the full preview tag set with absolute URLs under the prefix"
        status: pass
      - kind: integration
        ref: "test/seo.test.js#a root-domain build has no path prefix in any preview URL"
        status: pass
    human_judgment: false
  - id: D2
    description: "og:image is a processed derivative (1200px, not upscaled, PNG for alpha) that survives prune:img; originals are never named"
    requirement: SITE-07
    verification:
      - kind: integration
        ref: "test/seo.test.js#og:image is a processed 1200px derivative of the cover, not the original"
        status: pass
      - kind: integration
        ref: "test/seo.test.js#a transparent cover keeps PNG and a small cover is not upscaled"
        status: pass
      - kind: integration
        ref: "test/seo.test.js#the default image's original name never appears in the built HTML"
        status: pass
    human_judgment: false
  - id: D3
    description: "Pages without a cover preview with the default share image and alt text"
    requirement: SITE-07
    verification:
      - kind: integration
        ref: "test/seo.test.js#every page without a cover previews with the default image and its alt"
        status: pass
      - kind: integration
        ref: "test/seo.test.js#the owner's real site builds with a default-image preview on the homepage"
        status: pass
    human_judgment: false
  - id: D4
    description: "Description front matter, fallback chain, single escaping, and site.js validation errors naming src/_data/site.js"
    requirement: SITE-07
    verification:
      - kind: integration
        ref: "test/seo.test.js#description beats summary, summary beats the site description (D-06 chain)"
        status: pass
      - kind: integration
        ref: "test/seo.test.js#quotes, angle brackets and ampersands in preview text are escaped exactly once"
        status: pass
      - kind: unit
        ref: "test/seo.test.js#validateSite accepts the repo settings and an origin with a port"
        status: pass
    human_judgment: false
  - id: D5
    description: "Real link-preview services (Slack, Discord, iMessage, opengraph.xyz) render the title, description and image from the deployed site"
    verification: []
    human_judgment: true
    rationale: "Third-party crawlers fetch the deployed site over the network; fixture builds cannot prove they accept the tags and image. Left for the owner's end-of-phase UAT"

duration: 4min
completed: 2026-10-30
status: complete
plan_head_before: 046d4f8a02cb54e7b4e1c9498ea1ec0bbab3e789
plan_head_after: 1e77267a1a413c2fca3d9fa86bc98f2d67cb6c62
commits: 6
---

# Phase 4 Plan 02: Link previews Summary

**Every page now emits description, canonical, Open Graph and Twitter-card tags with absolute URLs built from `site.url` + PATH_PREFIX, using a processed 1200px eleventy-img JPEG of the project cover (or a swappable default share image), with `site.js` settings validated at build time.**

## Performance

- **Duration:** about 4 min
- **Started:** 2026-10-30T22:16:26Z
- **Completed:** 2026-10-30T22:20Z
- **Tasks:** 3
- **Files modified:** 9 (2 created)

## Accomplishments

- `ogImage` filter in `eleventy.config.js` with its own eleventy-img options (1200px, JPEG or PNG for alpha, no upscaling) and a `base.njk` head block placed between `</title>` and the font links. Canonical, `og:url` and `og:image` all come from `htmlBaseUrl(site.url)`: `https://djmccurley.github.io/portfolio-test/<slug>/` by default and no `/portfolio-test/` anywhere under `PATH_PREFIX=/`.
- Default share image: `assets/site-share.webp` (1200x630, white "Dan McCurley" on black, viewed and confirmed legible), named by `site.defaultImage` with `site.defaultImageAlt`. The owner swaps the file or the setting. `check:assets` passes.
- `description` front matter key (projects and pages) with the chain description, summary, `site.description`; `validateSite` fails the build with `src/_data/site.js:` messages for a bad `url`, a missing `defaultImage`, or an empty alt/description. Titles, descriptions and alts are autoescaped once (`Say "hi" <b> & bye` renders `Say &quot;hi&quot; &lt;b&gt; &amp; bye`).
- Test suite went from 296 to 319 passing tests; `npm test`, `npm run build` and `npm run check:assets` are green.

## TDD Gate Compliance

- **Task 1 (tracer) RED (719a52e):** 6 of 7 new tests failed on the missing tags and `siteData.url`/`description` assertions (the seventh, no client script, correctly passes before and after). **GREEN (2426588).** The tracer gate ran in auto-verify form: the five-file automated verify was re-run after the commit (69 pass, 0 fail) and expansion continued.
- **Task 2 RED (0c4f8c0):** default-image, real-site and own-default-file tests failed on the missing default image. **GREEN (2bb2b25).**
- **Task 3 RED (6d0d84e):** 11 of 23 tests failed (description chain, non-text description, all site.js validation cases, `validateSite` unit). The unit test calls `validate.validateSite` through a namespace import so the RED failure is an assertion, not a module-load error. **GREEN (1e77267).**
- No refactor commits were needed.

## Task Commits

1. Task 1 (tracer): `719a52e` test, `2426588` feat
2. Task 2: `0c4f8c0` test, `2bb2b25` feat
3. Task 3: `6d0d84e` test, `1e77267` feat

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The Task 3 human-check (paste the deployed project and homepage URLs into a link-preview checker) is open and left for the phase UAT, as the plan states.

## Known Stubs

- `assets/site-share.webp`, `site.defaultImageAlt` and `site.description` in `src/_data/site.js` are intentional starter content (a plain name-on-black image and a one-line description) for the owner to replace. They fully work as previews, so they do not block the plan goal. The README (plan 04-04) names where to change them.

## Threat Flags

None. The new surface (static meta tags and a derived image) is covered by T-04-06 to T-04-09, each mitigated by a test in `test/seo.test.js`.

## Self-Check: PASSED

- Created files exist: `assets/site-share.webp`, `test/seo.test.js`.
- Commits 719a52e, 2426588, 0c4f8c0, 2bb2b25, 6d0d84e, 1e77267 are ancestors of HEAD; `git rev-list --count` from the recorded base gives 6.
- `npm test`: 319 pass, 0 fail. `npm run check:assets`: OK.
