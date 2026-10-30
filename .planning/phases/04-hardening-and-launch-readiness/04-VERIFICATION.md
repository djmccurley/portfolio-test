---
phase: 04-hardening-and-launch-readiness
verified: 2026-10-30T23:00:00Z
status: human_needed
score: 5/5 must-haves verified (automated); 5 items await human confirmation
covered_files:
  - ".planning/phases/04-hardening-and-launch-readiness/04-01-PLAN.md"
  - ".planning/phases/04-hardening-and-launch-readiness/04-01-SUMMARY.md"
  - ".planning/phases/04-hardening-and-launch-readiness/04-02-PLAN.md"
  - ".planning/phases/04-hardening-and-launch-readiness/04-02-SUMMARY.md"
  - ".planning/phases/04-hardening-and-launch-readiness/04-03-PLAN.md"
  - ".planning/phases/04-hardening-and-launch-readiness/04-03-SUMMARY.md"
  - ".planning/phases/04-hardening-and-launch-readiness/04-04-PLAN.md"
  - ".planning/phases/04-hardening-and-launch-readiness/04-04-SUMMARY.md"
  - ".planning/phases/04-hardening-and-launch-readiness/04-05-PLAN.md"
  - ".planning/phases/04-hardening-and-launch-readiness/04-05-SUMMARY.md"
  - "README.md"
  - "content/robots.njk"
  - "content/sitemap.njk"
  - "content/style.css"
  - "eleventy.config.js"
  - "lib/drafts.js"
  - "lib/validate.js"
  - "scripts/check-reflow.mjs"
  - "src/_data/site.js"
  - "src/_includes/base.njk"
covered_digest: "v4:sha256:d3648a35e27a813e1ec2dc7c95a7baccf49ca8916c92fbd8c90c7f95677fc2e0"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Run `npm start` with a draft project, then compare with a clean `npm run build`"
    expected: "Draft appears with a Draft label under npm start; after deleting `_site/` and running `npm run build` it is absent everywhere (page, card, tag page, nav, sitemap)"
    why_human: "Live-vs-local draft behaviour end to end on the owner's machine; also covers WR-02 (stale draft in a local _site/)"
  - test: "Paste the deployed project URL into a link-preview service (e.g. Slack, Bluesky card validator, opengraph.xyz)"
    expected: "Title, description and the 1200px image preview render; sitemap.xml URLs resolve on the deployed site"
    why_human: "Needs the deployed site and a third-party scraper; local build can only prove the meta tags exist"
  - test: "With at least two projects, open a project page and use the pager with a screen reader and visually"
    expected: "'Previous: {title}' / 'Next: {title}' read without the arrows, links sit at the foot of the page and wrap cleanly"
    why_human: "Visual layout and screen-reader phrasing; only one project exists today so the pager is not rendered on the real site"
  - test: "Read README.md in VS Code preview and copy a few examples into a new project"
    expected: "Tables render, examples are copy-pasteable and build"
    why_human: "Usability judgement for the owner"
  - test: "On the deployed site https://djmccurley.github.io/portfolio-test/ check 320px wide, 200% and 400% zoom on every page, including opening the lightbox and reaching Close"
    expected: "No horizontal scrollbar, nothing cut off, lightbox Close visible and reachable"
    why_human: "ROADMAP criterion 5 says 'verified under the real deployed prefix'; the local headless check uses a local server and fallback fonts"
---

# Phase 4: Hardening and Launch Readiness Verification Report

**Phase Goal:** The site is verified, documented and ready to launch, with the chosen v1 extras in place
**Verified:** 2026-10-30
**Status:** human_needed
**Re-verification:** No, initial verification

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor can move to next/previous project from a project page | VERIFIED (code and tests) | `src/_includes/base.njk:58` renders `<nav class="pager" aria-label="Projects">` gated by `isProject`; `test/pager.test.js` builds fixtures covering order, ends, single project, drafts. Real site has one project, so 0 pagers in `tidepool-game/index.html` is correct per D-02. Visual and screen-reader check is human item 3. |
| 2 | Shared links show title, description and image previews; sitemap.xml has correct absolute URLs | VERIFIED (locally) | Clean build to a scratch dir: project page head has description, canonical, og:title/description/type(article)/url/site_name/image/image:alt and `twitter:card`, all absolute under `https://djmccurley.github.io/portfolio-test/`. `og:image` is `img/jURIZM13_b-1200.jpeg`, a processed derivative that exists in `_site/img/`. `sitemap.xml` lists home, work, tags/games, cv, teaching, tidepool-game once each as absolute URLs; no 404; `robots.txt` has an absolute `Sitemap:` line. Real scraper rendering is human item 2. |
| 3 | A page marked `draft: true` is absent from live site but visible locally | VERIFIED (tests, CI path) | `eleventy.config.js:47` preprocessor returns false when `draft === true && !showDrafts()`; `lib/drafts.js` fails closed on `ELEVENTY_RUN_MODE` (serve/watch only). `test/drafts.test.js` live vs serve matrix passes (includes media exclusion, boolean strictness, featured and nav warnings). CI (`deploy.yml`: `npm ci`, tests, `npm run build`) runs from a clean checkout and `_site/` is gitignored. No draft-label in the built output. Owner-machine behaviour is human item 1. |
| 4 | Owner can read a README listing every block and front matter field with examples | VERIFIED | `README.md` (265 lines) has headings in the required order (Quick reference, Day-to-day workflow, Drafts, Site settings, When the build fails). `test/readme.test.js` syncs it against `LAYOUT_SIZES`, `EMBEDS`, `PROJECT_KEYS`, `PAGE_KEYS` and builds the md examples. Usability judgement is human item 4. |
| 5 | Usable at 320px and 200% zoom without horizontal scrolling, verified under the real deployed prefix | PARTIAL: local VERIFIED, deployed UNVERIFIED | I ran `npm run check:reflow` myself: 8 pages x 320 and 640 CSS px under `/portfolio-test/` all ok, stress page ok, canary overflowed (check is measuring). `test/reflow.test.js` guards CSS (no overflow hidden, no 100vw, viewport not zoom-locked). The criterion explicitly requires the deployed site; that has not been done and is human item 5. |

**Score:** 5/5 truths verified at the automated level; criterion 5's deployed-site clause and the human-judgement items remain open. 0 behaviour-unverified truths.

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `lib/drafts.js` | VERIFIED | Substantive, imported in `eleventy.config.js:13`, used in preprocessor |
| `eleventy.config.js` (drafts preprocessor, `ogImage`, sitemap collection) | VERIFIED | Present and wired; see WR-01 |
| `src/_includes/base.njk` (head meta, pager, draft label) | VERIFIED | Confirmed in built HTML |
| `src/_includes/card.njk` | VERIFIED | draft-label per plan, tests pass |
| `content/sitemap.njk`, `content/robots.njk` | VERIFIED | Output inspected |
| `src/_data/site.js` | VERIFIED | `url`, `defaultImage`, `defaultImageAlt` present; `assets/site-share.webp` exists (placeholder for owner to swap) |
| `content/style.css` (reflow fixes, .pager) | VERIFIED | Guard test and live reflow check pass |
| `README.md` | VERIFIED | Present, test-synced |
| `scripts/check-reflow.mjs` + `check:reflow` script | VERIFIED | Ran, passes, canary works |
| test files (drafts, seo, pager, sitemap, readme, reflow) | VERIFIED | `npm test`: 356 pass, 0 fail |

### Key Link Verification

| From | To | Status |
|------|----|--------|
| eleventy.config.js to lib/drafts.js (`showDrafts()`) | WIRED |
| base.njk to site.js / `ogImage` filter | WIRED (meta tags render real values) |
| base.njk pager to `isProject` / collections.projects | WIRED |
| sitemap.njk to collections.sitemap | WIRED |
| package.json to scripts/check-reflow.mjs | WIRED (ran) |
| readme.test.js to lib/blocks.js, lib/validate.js | WIRED |

### Requirements Coverage

| Requirement | Plan | Status | Evidence |
|-------------|------|--------|----------|
| PUB-05 | 04-01 | SATISFIED (human check pending) | Draft exclusion tested; clean-build CI path confirmed |
| SITE-07 | 04-02, 04-03 | SATISFIED (human check pending) | OG/canonical/twitter tags and sitemap/robots in built output |
| SITE-06 | 04-03 | SATISFIED (human check pending) | Pager wired and tested |
| AUTH-05 | 04-04 | SATISFIED (human check pending) | README with sync tests |
| A11Y-02 | 04-05 | PARTIAL | Local reflow check passes; deployed-prefix verification outstanding |

All five IDs in ROADMAP/REQUIREMENTS for Phase 4 are claimed by plans; no orphans.

### Anti-Patterns Found

No TBD/FIXME/XXX debt markers or stub patterns blocking the goal. Code review (04-REVIEW.md): 0 critical, 2 warnings, 4 info, all dispositions still `open`.

| Finding | Severity | Assessment |
|---------|----------|------------|
| WR-01: `ogImage` hardcodes `urlPath`/`outputDir` instead of reusing `imageOptions` | Warning | Not a goal failure. Default build is correct (og:image file exists in `_site/img/`). Breaks only if the output dir or URL path changes (I observed that `eleventy --output=<other dir>` still writes images to `_site/img`). |
| WR-02: stale draft output can survive in a local `_site/` after `npm start` | Warning | Not a goal failure for the live site: CI builds from a clean checkout (`npm ci` then `npm run build`; `_site/` is gitignored). The README already tells the owner to delete `_site/` before inspecting a local production build. Residual risk is limited to manually deploying a local `_site/`. Recommend fixing (e.g. clean `_site` at build start) or recording as deferred. |
| IN-01 to IN-04 | Info | Canonical on 404, robots.txt ineffective under `/portfolio-test/`, reflow script font/Chrome lookup, duplicated nav list. None block the phase. |

### Behavioral Spot-Checks

| Behavior | Command | Result |
|----------|---------|--------|
| Full test suite | `npm test` | 356 pass, 0 fail |
| Clean build | `npx eleventy --output=<scratch>` | exit 0, 9 files written, head meta and sitemap as above |
| Reflow at 320/640 under real prefix | `npm run check:reflow` | all ok, canary detected |

Draft hiding was verified by the existing integration tests (they build real fixtures in live and serve modes), not by me adding a draft to the real content, since the real content has none.

### Probe Execution

SKIPPED: no probes declared.

### Human Verification Required

See frontmatter `human_verification`. Five items, mapped to the executors' open flags: draft behaviour under `npm start` vs clean build (04-01, includes WR-02), link previews on the deployed site (04-02), pager visual and screen-reader phrasing (04-03), README usability (04-04), and the deployed-site 320px / 200% / 400% check including lightbox Close (04-05, ROADMAP criterion 5). None of these are claimed as passed.

### Gaps Summary

No automated gaps. Every ROADMAP success criterion has working, wired code and passing tests; the local reflow check passes under the real prefix. The phase cannot be called `passed` because criterion 5 explicitly requires deployed-site verification and several UX/visual items need owner judgement. WR-02 is a low-risk robustness issue for local-to-live workflows that does not affect the CI deploy path; triage WR-01/WR-02 before launch.

---

_Verified: 2026-10-30_
_Verifier: Claude (gsd-verifier)_
