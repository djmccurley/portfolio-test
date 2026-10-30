---
phase: 02-layout-blocks-embeds-and-design-system
verified: 2026-10-30T00:00:00Z
status: human_needed
score: 5/5 roadmap success criteria verified (all plan-level truths verified in code; 0 failed)
covered_files:
  - .planning/phases/02-layout-blocks-embeds-and-design-system/02-01-PLAN.md
  - .planning/phases/02-layout-blocks-embeds-and-design-system/02-01-SUMMARY.md
  - .planning/phases/02-layout-blocks-embeds-and-design-system/02-02-PLAN.md
  - .planning/phases/02-layout-blocks-embeds-and-design-system/02-02-SUMMARY.md
  - .planning/phases/02-layout-blocks-embeds-and-design-system/02-03-PLAN.md
  - .planning/phases/02-layout-blocks-embeds-and-design-system/02-03-SUMMARY.md
  - .planning/phases/02-layout-blocks-embeds-and-design-system/02-04-PLAN.md
  - .planning/phases/02-layout-blocks-embeds-and-design-system/02-04-SUMMARY.md
  - .planning/phases/02-layout-blocks-embeds-and-design-system/02-05-PLAN.md
  - .planning/phases/02-layout-blocks-embeds-and-design-system/02-05-SUMMARY.md
  - content/projects/tidepool-game.md
  - content/style.css
  - eleventy.config.js
  - lib/alt-lint.js
  - lib/blocks.js
  - lib/embeds.js
  - lib/frontmatter.js
  - lib/images.js
  - lib/limits.js
  - lib/locate.js
  - lib/markdown.js
  - lib/media.js
  - lib/validate.js
  - scripts/check-assets.js
  - scripts/shrink.js
  - src/_includes/base.njk
  - test/alt-lint.test.js
  - test/block-errors.test.js
  - test/blocks.test.js
  - test/content-errors.test.js
  - test/contrast.test.js
  - test/design.test.js
  - test/embeds.test.js
  - test/shrink.test.js
  - test/video.test.js
covered_digest: "v4:sha256:5d7f3d9ee312667e06835558c84a011e0a158d77eef9381c81627fcbd66f67d0"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 5/5
  gaps_closed: []
  gaps_remaining: []
  regressions: []
gaps: []
deferred: []
advisory:
  - finding: "scripts/shrink.js:153 prints a false 'still over 10 MB' warning for renamed videos (review WR-01)"
    category: other
    reason: "Message-only regression; CI (check-assets) accepts videos up to 50 MB, nothing is blocked or mis-published"
    evidence_status: "reproduced by reading code; not a must-have"
  - finding: "lib/blocks.js:157-162 reports 'cannot hold linked images' for a plain text link inside a layout block (review WR-02)"
    category: other
    reason: "Wrong advice in an error message; the build still fails loudly on the correct line"
    evidence_status: "reproduced in a scratch build (exit 1, message as described)"
human_verification:
  - test: "Open the built Tidepool page (npm start) at 1280px, 960px, 640px and 600px wide"
    expected: "grid-2 is two columns at 1280px and one column at 600px; grid-3/4 drop to two columns below 60em; images keep their own ratios; the full block reaches both viewport edges with no horizontal scrollbar; the full-block caption lines up with the text column"
    why_human: "CSS layout is not measurable without a browser. The rules and media queries exist and read correctly; no rendering was observed."
  - test: "Keyboard walk-through: Tab from the top of a page, press Enter on the skip link, keep tabbing through links, video controls and iframes"
    expected: "Skip link appears top-left (black on white); Enter moves focus to main with NO page-wide ring (WR-01 fix, main[tabindex=-1] now outranks the ring rule); every other focusable element shows a 3px accent ring; the ring on the skip link is visible against its black background"
    why_human: "Focus rendering and :focus-visible behaviour on programmatic focus are browser behaviours."
  - test: "Add one real YouTube, one real Vimeo and one real itch.io embed block to a scratch page"
    expected: "All three players load and play; the real itch.io embed URL shape is accepted by the allow-list in lib/embeds.js; the visible 'Play on itch.io' link works"
    why_human: "Third-party players and the real itch.io embed URL format need network access. Only synthetic URLs were exercised."
  - test: "Play a real .mp4 via ::: video (with and without poster=) on desktop and iPhone Safari, on the deployed GitHub Pages site"
    expected: "Controls show, no autoplay, poster shows when given, a first frame paints without a poster (iOS), seeking works, no layout jump while metadata loads"
    why_human: "Real media playback and iOS behaviour. Builds used a dummy byte file, so markup and publish path are verified, not playback."
  - test: "Layout-shift check of grid, full and lone images and embeds on a throttled connection"
    expected: "No shift as images and embeds load (width/height and aspect-ratio are present in the output, which is the mechanism)"
    why_human: "Plan truths tagged verification: backstop. Mechanism verified, user-perceived result unobserved."
  - test: "VS Code paste of an image under npm start with the real paste plugin"
    expected: "Exactly one WARN naming the file and image path while the alt is 'alt text', clearing after a real description is written"
    why_human: "Requires the real plugin and live rebuilds. WARN text, dedup and exit 0 were verified with a synthetic page."
---

# Phase 2: Layout Blocks, Embeds and Design System Verification Report

**Phase Goal:** Owner composes a rich project page by typing short block shorthand, mixing grids, full-width images, text, video and playable games, on an accessible brutalist page
**Verified:** 2026-10-30
**Status:** human_needed
**Re-verification:** Yes, after code-review fixes 396e4c7 (WR-01 focus ring), 3212c85 (WR-02 hard breaks / linked images), e2d14ac (WR-03 dates) and ea1f318 (WR-04 shrink WebP cap). The prior report's covered-input fingerprint was stale; everything was re-checked against current code.

The goal is achieved in the code. A fresh build of the real Tidepool page and an independent scratch page mixing every block type both work, the full suite passes (`npm test`, run once: 170 tests, 170 pass, 0 fail), and nothing FAILED. Status is `human_needed` only because browser layout, focus rendering, real third-party players, real media playback and the real VS Code paste plugin cannot be observed here (they are the 6 items in `02-UAT.md`, all still `[pending]`).

## Goal Achievement

### Observable Truths (ROADMAP success criteria, the contract)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Owner types `::: grid-2/3/4` and a full-width block inline, mixes them freely with text, images keep their aspect ratios in grids | VERIFIED | Scratch page (intro paragraph, raw HTML, grid-3, full, YouTube, Vimeo, itch, file video, decorative lone image) built with exit 0, all pieces emitted as flat siblings in `<main>` in source order. Grid images carry their own `width`/`height` (1600x900, 480x960, 800x800). `grep object-fit content/style.css` finds nothing; `.layout img` is `width:100%; height:auto`. |
| 2 | Captioned images render as figure/figcaption; grids collapse on narrow screens with no layout JS | VERIFIED (visual collapse is human) | Real build of `content/projects/tidepool-game.md`: `<div class="layout grid-2">` and `<div class="layout full">`, three `<figcaption>` elements. Uncaptioned images render `<figure>` without figcaption. CSS has `@media (max-width: 59.99em)` (grid-3/4 to 2 cols) and `(max-width: 39.99em)` (all to 1 col). Built HTML contains 0 `<script>`. |
| 3 | Raw HTML in markdown renders as a fallback | VERIFIED | Scratch build: `<div class="note"><p>Raw HTML</p></div>` appears unchanged. |
| 4 | Visitor can play a self-hosted video (controls, poster, no autoplay), a YouTube/Vimeo embed (privacy domain, lazy, titled) and an itch.io game with a visible "play on itch.io" link | VERIFIED (markup and publish path; real playback is human) | Scratch output: `youtube-nocookie.com/embed/dQw4w9WgXcQ` and `player.vimeo.com/video/123456789?dnt=1`, both `title` + `loading="lazy"`; itch iframe titled and lazy with `<p class="embed-link"><a href="https://dmc.itch.io/tidepool">Play on itch.io<span class="visually-hidden">: Tidepool game</span>`; file video `<video controls preload="metadata" poster=... aria-label>` with a download fallback and no autoplay/loop/muted; `_site/video/clip.mp4` published, `_site/assets` absent. `youtube.com.evil.com` fails the build with exit 1 and file:line. |
| 5 | Semantic HTML, minimal brutalist CSS with no animation; skip link, visible focus, AA contrast; build warns on empty or filename-like alt | VERIFIED (focus rendering is human) | `base.njk`: skip link first in body, `<main id="main" tabindex="-1">`, `<header>`, no script. `style.css`: 3px accent `:focus-visible` ring; `main[tabindex="-1"]` override is (0,2,1) vs the ring rule's (0,2,0), so the skip target no longer gets a page-wide ring (code-review WR-01 fix confirmed by specificity and by `test/design.test.js` passing). Only `transition/animation/scroll-behavior` occurrences are inside the `prefers-reduced-motion` guard. Accent `#0000ee` on white is about 8.6:1, `test/contrast.test.js` passes. Scratch build printed `WARN ./content/projects/mixed.md: image ../../assets/c.webp still has the paste placeholder alt "alt text"...` and exited 0; filename-like alt (`"a"`, `"b"`) also warned. Real repo content builds with no WARN. |

**Score:** 5/5 roadmap truths verified, 0 behavior-unverified.

### Plan-level must-haves (spot traces, re-run on current code)

| Plan truth | Status | Evidence |
|-----------|--------|----------|
| 02-01 first markdown image stays eager + fetchpriority high even inside a block | VERIFIED | Scratch grid: first `<img>` has `loading="eager" fetchpriority="high"`, the others `loading="lazy"`. |
| 02-01 per-block `sizes` | VERIFIED | grid-3 images carry `(min-width: 90em) 416px, (min-width: 60em) 30vw, ...`; full carries `sizes="100vw"`. |
| 02-01 `{decorative}` gives `alt=""`, marker never reaches HTML | VERIFIED | Lone image rendered `alt=""`, no `decorative` attribute, no WARN. |
| 02-01 strict errors with file:line | VERIFIED | `test/block-errors.test.js` passes; scratch: bad video host exits 1 as `evil.md:9: video URL not recognised`. |
| 02-01 hard-break tolerance (WR-02 fix) | VERIFIED | Scratch grid with two lines ending in two trailing spaces built exit 0 (previously exit 1). |
| 02-02 token-driven CSS, one left-aligned column, no 100vw, no centred text | VERIFIED | `100vw` appears only in a comment; named-line grid used. |
| 02-02 Chivo via Google Fonts link before `/style.css` | VERIFIED | Present in `base.njk` head. |
| 02-03 alt lint warn-only; demo page builds with zero WARN | VERIFIED | WARN lines reproduced; `npx eleventy` on the real repo prints no WARN, exit 0. |
| 02-04 embed escaping, src rebuilt from parsed ID, no-content rule | VERIFIED | `test/embeds.test.js` passes; output srcs are rebuilt, not copied. |
| 02-05 video 50 MB cap, check:assets, hook, reserved slug `video` | VERIFIED | `test/video.test.js`, `test/check-assets.test.js`, `test/shrink.test.js` pass; slug `video` rejected in full build test. |

### Prohibitions

| Prohibition | Tier | Status | Evidence |
|------------|------|--------|----------|
| No analytics/trackers/client JS/third-party requests other than Google Fonts | test | RESOLVED | No `<script>` in built HTML; only third-party origin in the shell is Google Fonts. |
| No auto-generated alt text | test | RESOLVED | Scratch output alt equals source alt verbatim; lint only warns. |
| Video never autoplay/loop/muted | test | RESOLVED | Built `<video controls preload="metadata">` only. |
| Never publish unreferenced assets / poster originals | test | RESOLVED | `_site` has `img/` and the referenced `video/clip.mp4` only; no `assets/`. |
| YouTube/Vimeo never from non-privacy hosts | test | RESOLVED | nocookie / `dnt=1` outputs; look-alike host rejected. |

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `lib/blocks.js`, `lib/locate.js`, `lib/embeds.js`, `lib/media.js`, `lib/alt-lint.js`, `lib/limits.js`, `lib/images.js`, `lib/markdown.js` | VERIFIED | Exist, substantive, wired (real build emits all block types). |
| `lib/validate.js`, `lib/frontmatter.js`, `eleventy.config.js` | VERIFIED | Shared date validator and reserved `video` slug; `test/content-errors.test.js` and `test/video.test.js` pass. |
| `src/_includes/base.njk`, `content/style.css` | VERIFIED | Substantive and linked (`/style.css` copied to `_site`). |
| `content/projects/tidepool-game.md` | VERIFIED | Real demo page, builds clean. |
| `scripts/check-assets.js`, `scripts/shrink.js` | VERIFIED | Tests pass (see WR-01 advisory on a false warning text). |
| `test/*` | VERIFIED | 170/170 pass. |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| eleventy.config.js | lib/blocks.js | WIRED | Real build emits block output. |
| lib/blocks.js | markdown-it-container | WIRED | Catch-all block container; grid/full/video/itch all dispatch. |
| lib/blocks.js | eleventy-img (`sizes`) | WIRED | `sizes` honoured in output. |
| lib/blocks.js | lib/embeds.js, lib/media.js | WIRED | YouTube, Vimeo, itch and file video output in scratch build. |
| lib/markdown.js | lib/alt-lint.js | WIRED | WARN printed in build. |
| base.njk | style.css, `#main` | WIRED | `href="#main"` targets `main id="main"`. |
| test/contrast.test.js | style.css tokens | WIRED | Passes against current tokens. |

### Data-Flow Trace (Level 4)

Static site, no runtime data. Markdown to HTML at build time was traced end to end with the repo page and the scratch page: image dimensions come from real files via eleventy-img, embed srcs are rebuilt from parsed IDs, video and poster are copied from `assets/` into `_site/video`. No hollow props or static fallbacks.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite | `npm test` (once) | 170 pass, 0 fail | PASS |
| Real site build | `npx eleventy` | exit 0, 3 pages, no WARN, 0 `<script>` | PASS |
| Mixed page (grid, full, raw HTML, YouTube, Vimeo, itch, file video, decorative) | scratch build via `test/helpers/site.js` | exit 0, markup as expected | PASS |
| Paste-default / filename-like alt | same scratch build | WARN, exit 0 | PASS |
| Look-alike video host | scratch build | exit 1 with file:line | PASS |
| Hard break after image inside grid | scratch build | exit 0 | PASS |
| Text link inside grid (WR-02 of the new review) | scratch build | exit 1 but message says "linked images" | PASS (fails loudly; wording is wrong, see below) |

### Probe Execution

SKIPPED: no `probe-*.sh` exist and none are declared in the plans.

### Requirements Coverage

All 13 requirement IDs in the phase brief appear in PLAN frontmatter (02-01: BLOCK-01..05, AUTH-04; 02-02: A11Y-01, A11Y-03, BLOCK-06, BLOCK-05, BLOCK-02; 02-03: A11Y-04, BLOCK-03; 02-04: MEDIA-02, MEDIA-03; 02-05: MEDIA-01) and in REQUIREMENTS.md as `Phase 2 | Complete`. REQUIREMENTS.md maps no other Phase 2 IDs (A11Y-02 is Phase 4), so there are no orphans.

| Requirement | Source Plan | Description | Status | Evidence |
|------------|-------------|-------------|--------|----------|
| BLOCK-01 | 02-01 | grid-2/3/4 shorthand | SATISFIED | `<div class="layout grid-N">` output |
| BLOCK-02 | 02-01, 02-02 | full-width block | SATISFIED | `<div class="layout full">`; `main > .full { grid-column: full }` |
| BLOCK-03 | 02-01, 02-03 | free mixing | SATISFIED | Mixed scratch page; Tidepool demo |
| BLOCK-04 | 02-01 | figure/figcaption captions | SATISFIED | Tidepool output |
| BLOCK-05 | 02-01, 02-02 | aspect ratios kept | SATISFIED | width/height from source, no object-fit |
| BLOCK-06 | 02-02 | collapse, no layout JS | SATISFIED (browser check human) | Media queries, no script |
| AUTH-04 | 02-01 | raw HTML fallback | SATISFIED | Raw div preserved |
| MEDIA-01 | 02-05 | self-hosted video | SATISFIED (playback human) | `<video controls preload=metadata>`, published file |
| MEDIA-02 | 02-04 | YouTube/Vimeo | SATISFIED (real players human) | nocookie / dnt=1, lazy, titled |
| MEDIA-03 | 02-04 | itch.io game | SATISFIED (real embed human) | titled lazy iframe + visible link |
| A11Y-01 | 02-02 | semantic, brutalist, no animation | SATISFIED | CSS grep, no script |
| A11Y-03 | 02-02 | skip link, focus, AA contrast | SATISFIED (focus rendering human) | Skip link, ring, WR-01 now fixed, contrast test |
| A11Y-04 | 02-03 | alt-text warnings | SATISFIED | WARN output, decorative marker |

### Anti-Patterns Found

`TBD|FIXME|XXX` scan across `lib`, `content`, `src`, `scripts` and `eleventy.config.js` returned nothing. No stubs or hollow implementations.

### Open code-review warnings (02-REVIEW.md): effect on goal

Neither open warning defeats a roadmap success criterion or any of the 13 requirements. Both are recorded as advisory.

| ID | Defeats a must-have? | Assessment |
|----|----------------------|------------|
| WR-01 `scripts/shrink.js:153` false "still over 10 MB" warning for renamed `.mp4`/`.webm` | No | The warning is text only; `shrink` still renames correctly, CI (`check-assets`) accepts videos up to 50 MB, and nothing is blocked or mis-published. It tells the owner to do needless work for a large video, a small authoring friction. Worth a one-line fix (skip `VIDEO_EXTS`) plus a test. |
| WR-02 `lib/blocks.js:157-162` text link in a layout block says "cannot hold linked images" | No | The build still fails loudly with the right file:line, and the block rule (grids hold images only) is enforced. Only the advice is slightly wrong. Worth tightening with the reviewer's `linkWrapsImage` check. |
| UI-REVIEW fix 1 (cosmetic, carried over) | No | `style.css`: `main > * + :is(h2, h3)` (0,0,2) loses to `main > :is(.layout,...) + *` (0,1,1), so an h2 straight after a block gets 2rem rather than 3rem. Spacing only; not a success criterion. |

Fixes for earlier warnings confirmed: skip-link target ring (focus), hard-break tolerance in grids, out-of-range dates rejected with the friendly error (tests pass), and the shrink WebP byte-cap re-encode (tests pass).

### Human Verification Required

Six items, all pending in `02-UAT.md` and listed in the frontmatter: browser layout at 1280/960/640/600px, keyboard skip-link and focus walk-through (including confirming WR-01 is fixed in a real browser), real YouTube/Vimeo/itch.io embeds, real .mp4 playback on desktop and iPhone Safari, layout shift under throttling, and the VS Code paste-alt WARN with the real plugin.

### Gaps Summary

No gaps. No truth FAILED and no requirement is blocked. The phase goal is realised in code and demonstrated by the repo's Tidepool page and an independent mixed-content build. The code-review fixes did not regress anything (170/170). Remaining work before closing the phase is the human checks above; the two small message regressions and the heading-spacing specificity can be fixed at the owner's convenience.

---

_Verified: 2026-10-30_
_Verifier: Claude (gsd-verifier)_
