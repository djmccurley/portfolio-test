---
phase: 02-layout-blocks-embeds-and-design-system
verified: 2026-10-29T00:00:00Z
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
  - test/contrast.test.js
  - test/design.test.js
  - test/embeds.test.js
  - test/video.test.js
covered_digest: "v4:sha256:7026fd251b9f5d5df51e8f3172f2c5dd8326c3f2f29dc6ccd71c53f03067dd72"
behavior_unverified: 0
overrides_applied: 0
gaps: []
deferred: []
human_verification:
  - test: "Open the built Tidepool page (npm start) at 1280px and 600px wide (also check 960px and 640px)"
    expected: "grid-2 shows two columns at 1280px and one column at 600px; images keep their own ratios (no crop); the full block reaches both viewport edges with no horizontal scrollbar; the full-block caption lines up with the text column; vertical rhythm looks right"
    why_human: "CSS layout is not measurable without a browser. The CSS rules and media queries exist and are correct on inspection, but no rendering was observed."
  - test: "Keyboard walk-through: Tab from the top of any page, press Enter on the skip link, keep tabbing through links, video controls and iframes"
    expected: "Skip link appears top-left (black/white); Enter moves focus to main; every focusable element shows a 3px accent ring. After the skip, NO ring should wrap the whole main area (see warning WR-01: the main:focus outline:none rule loses on specificity, so a page-wide ring is expected to appear and the owner should decide whether that is acceptable or fix it). Also check the skip-link ring is visible against the black skip-link background (UI-REVIEW fix 2, about 2.2:1 over black, likely fine because the 3px offset puts it over white)."
    why_human: "Focus rendering and the :focus-visible heuristic on programmatic focus are browser behaviours."
  - test: "Add one real YouTube, one real Vimeo and one real itch.io embed block to a scratch page (npm start)"
    expected: "All three players load and play. The itch embed URL host/shape that itch.io actually issues is accepted by the allow-list in lib/embeds.js (research assumption A3). The visible 'Play on itch.io' link is present and works."
    why_human: "Third-party players and the real itch.io embed URL format need network access. Only synthetic URLs were exercised."
  - test: "Play a real .mp4 via ::: video ../../assets/clip.mp4 \"Title\" (with and without poster=) on desktop and on iPhone Safari"
    expected: "Controls show, no autoplay, poster shows when given, a first frame paints when there is no poster (iOS honours preload=metadata + #t=0.001; research A4), no layout jump while metadata loads (--ink background holds the slot)"
    why_human: "Real media playback and iOS Safari behaviour. The build was tested only with a dummy byte file, so the markup and publish path are verified, not playback."
  - test: "Layout-shift check of grid, full and lone images on a throttled connection"
    expected: "No shift as images load (width/height are present in the output, which is the mechanism; the user-perceived result is unobserved)"
    why_human: "Plan truths tagged verification: backstop (UI E1/E2/E3/E4/E6 loading). The mechanism is verified, the behaviour is not."
  - test: "VS Code paste of an image under npm start (the 'VS Code paste-alt WARN' check)"
    expected: "Exactly one WARN line naming the file and image path while the alt is 'alt text', and it clears after the owner writes a description"
    why_human: "Requires the real VS Code paste plugin and live rebuilds. The WARN text, deduplication and build exit 0 were verified here with a synthetic page (see Behavioral Spot-Checks)."
---

# Phase 2: Layout Blocks, Embeds and Design System Verification Report

**Phase Goal:** Owner composes a rich project page by typing short block shorthand, mixing grids, full-width images, text, video and playable games, on an accessible brutalist page
**Verified:** 2026-10-29
**Status:** human_needed
**Re-verification:** No, initial verification

The goal is achieved in the code. Every roadmap success criterion has direct evidence from a fresh build and a scratch end-to-end page that mixes all block types. Nothing FAILED. The status is `human_needed` because several checks (real browser layout, keyboard focus rendering, real third-party players, real media playback on iOS, VS Code paste) cannot be observed from here, and because one code-review warning (WR-01) should get an owner decision.

## Goal Achievement

### Observable Truths (ROADMAP success criteria, the contract)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Owner types `::: grid-2/3/4` and a full-width block inline, mixes them freely with text on one page, and images keep their own aspect ratios in grids | VERIFIED | `lib/blocks.js` registers a catch-all `markdown-it-container` plus a core rule; `LAYOUT_SIZES` has grid-2/3/4/full. My scratch page (intro paragraph, raw HTML, grid-3, full, 3 embeds, file video, lone image) built with exit 0 and emitted all pieces as flat siblings in `<main>` in source order. Grid `<img>` got width/height from eleventy-img (1600x900 and 480x960 kept their own ratios), and `.layout img` is `width:100%; height:auto` with no `object-fit` anywhere in `content/style.css` (grep confirmed). |
| 2 | Images with captions render as figure/figcaption, and grids collapse to fewer columns on narrow screens with no layout JS | VERIFIED (layout observation is human) | Real build of `content/projects/tidepool-game.md` shows `<figure>...<figcaption>Early character study</figcaption></figure>`; a caption of `Cap <b>` was HTML-escaped; uncaptioned images render `<figure>` with no figcaption. CSS has `@media (max-width: 59.99em)` (grid-3/4 to 2 cols) and `(max-width: 39.99em)` (all to 1 col). No `<script>` in built HTML. Actual collapse in a browser: human item 1. |
| 3 | Owner can drop raw HTML into markdown as a fallback and it renders | VERIFIED | Scratch build: `<div class="note"><p>Raw HTML</p></div>` appears unchanged; inline `<em>` kept. `test/blocks.test.js` also covers a raw `<img>` becoming a responsive `<picture>` and passes. |
| 4 | Visitor can play a self-hosted video (controls, poster, no autoplay), a YouTube/Vimeo embed (privacy domain, lazy, titled) and an itch.io game with a visible "play on itch.io" fallback link | VERIFIED (markup and publish path; real playback is human) | Scratch build output: YouTube becomes `https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ` with `title`, `loading="lazy"`; Vimeo becomes `https://player.vimeo.com/video/123456789?dnt=1`; itch renders titled lazy iframe plus `<p class="embed-link"><a href="https://dmc.itch.io/tidepool">Play on itch.io<span class="visually-hidden">: Trailer...`; file video renders `<video controls preload="metadata" ... aria-label>` with fallback link, no autoplay/loop/muted, and `_site/video/clip.mp4` was published while `_site/assets` does not exist. Poster publishing (processed WebP, original never copied) is covered by `test/video.test.js` (passes). Look-alike host `youtube.com.evil.com` fails the build (exit 1). |
| 5 | Pages use semantic HTML and minimal brutalist CSS with no animation; keyboard users get a skip link, visible focus and AA contrast; the build warns on empty or filename-like alt text | VERIFIED (focus rendering is human; see WR-01) | `base.njk`: skip link first in `<body>`, `<main id="main" tabindex="-1">`, `<header>`, no script. `style.css`: `:focus-visible` 3px accent ring, only `transition/animation/scroll-behavior` occurrences are inside the `prefers-reduced-motion` guard (grep). Accent `#0000ee` on white is about 8.6:1; `test/contrast.test.js` reads the tokens and passes. Scratch build printed `WARN ./content/projects/probe.md: image ../../assets/a.webp still has the paste placeholder alt "alt text". Replace it with a description.` and exited 0 with the alt unchanged in the HTML. The real repo content builds with no WARN. |

**Score:** 5/5 roadmap truths verified. Plan-level truths from 02-01 to 02-05 were each traced to code or test; none FAILED. The `verification: backstop` truths (UI loading states, iOS first frame) are routed to human verification rather than counted as verified.

### Plan must-have spot traces (selected)

| Plan truth | Status | Evidence |
|-----------|--------|----------|
| 02-01 first markdown image stays eager + fetchpriority high even inside a block | VERIFIED | Tidepool build: first grid `<img>` has `loading="eager" fetchpriority="high"`, the rest `loading="lazy"`. |
| 02-01 per-block `sizes` | VERIFIED | grid-2 / grid-3 / full images carry the exact `LAYOUT_SIZES` strings; lone image carries `(min-width: 90em) 1280px, 90vw`. |
| 02-01 `{decorative}` gives `alt=""` and the marker never reaches HTML | VERIFIED | Scratch lone image rendered `alt=""`, no `decorative` attribute; no WARN printed for it. |
| 02-01 strict errors with file:line (unknown block, unclosed, CRLF, etc.) | VERIFIED | `test/block-errors.test.js` passes (166/166 suite). I additionally confirmed that `::: grid-5` with CRLF, an unclosed fence and a bad video host each exit 1. |
| 02-02 token-driven CSS, one left-aligned column, no 100vw, no centred text | VERIFIED | `style.css` tokens match the plan; named-line grid used; `grep` found `100vw` only in a comment and no `text-align`. |
| 02-02 Chivo via Google Fonts link before `/style.css` with preconnects | VERIFIED | Present in `_site/tidepool-game/index.html` head. |
| 02-02 "only outline removal is `main:focus`" | PARTIAL, see WR-01 | The rule exists but loses the cascade (specificity). |
| 02-03 alt lint (empty / paste-default / filename-like / raw HTML), warn-only | VERIFIED | `test/alt-lint.test.js` passes; paste-default WARN reproduced live. |
| 02-03 demo page uses `::: grid-2`, captions, `::: full` and builds with zero WARN | VERIFIED | `content/projects/tidepool-game.md` read; real build printed no WARN. |
| 02-04 embed escaping, src rebuilt from parsed ID, `full` keyword, no-content rule | VERIFIED | `test/embeds.test.js` passes; src values in my scratch output were rebuilt, not copied. |
| 02-05 video 50 MB cap, check:assets, hook, reserved slug `video` | VERIFIED | `test/video.test.js`, `test/check-assets.test.js`, `test/shrink.test.js` pass (hook e2e rename/reject cases visible in output). |

### Prohibitions

| Prohibition | Tier | Status | Evidence |
|------------|------|--------|----------|
| No analytics/trackers/client JS/third-party requests other than Google Fonts; no `no-referrer` meta (02-02) | test | RESOLVED | `base.njk` has no `<script>` or referrer meta; built HTML has no `<script>` (scratch and real). Only third-party origin in the shell is Google Fonts. |
| No auto-generated alt text (02-03) | test | RESOLVED | `lib/alt-lint.js` only returns warnings; scratch output alt equals the source alt verbatim. |
| Video never autoplay/loop/muted (02-05) | test | RESOLVED | Built `<video controls preload="metadata">` only. |
| Never publish unreferenced assets / poster originals (02-05) | test | RESOLVED | `_site` contains only `img/`, `video/clip.mp4` (the referenced one) and no `assets/`. |
| YouTube/Vimeo never from non-privacy hosts (02-04) | test | RESOLVED | Outputs on `youtube-nocookie.com` and `player.vimeo.com?dnt=1`; `youtube.com.evil.com` rejected. |

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `lib/blocks.js`, `lib/locate.js`, `lib/embeds.js`, `lib/media.js`, `lib/alt-lint.js`, `lib/limits.js` | VERIFIED | Exist, substantive, imported (blocks imports embeds and locate; embeds dispatches to media; markdown calls alt-lint; check-assets and shrink import limits). |
| `lib/images.js` global sizes default | VERIFIED | Lone and raw-HTML images got `(min-width: 90em) 1280px, 90vw`. |
| `lib/validate.js` reserves `video` | VERIFIED | `test/video.test.js` slug test passes. |
| `eleventy.config.js` (installBlocks before resolver, `eleventy.after` copyMedia, resetAltWarnings) | VERIFIED | Build works end to end; dedup and per-build reset covered by tests. |
| `src/_includes/base.njk`, `content/style.css` | VERIFIED | See truths 5 above; `style.css` far exceeds min_lines. |
| `content/projects/tidepool-game.md` | VERIFIED | Real demo page. |
| `scripts/check-assets.js`, `scripts/shrink.js` | VERIFIED | Per-extension cap implemented, tests pass. |
| `test/*` (blocks, block-errors, embeds, video, alt-lint, design, contrast) | VERIFIED | Entire suite ran once: 166 tests, 166 pass, 0 fail. |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| eleventy.config.js | lib/blocks.js | WIRED | Real build emits block output. |
| lib/blocks.js | markdown-it-container (catch-all `block`) | WIRED | `md.use(markdownItContainer, "block", ...)`. |
| lib/blocks.js | eleventy-img via `sizes` | WIRED | `sizes` honoured in output `<source>` and `<img>`. |
| lib/blocks.js | lib/embeds.js (`EMBEDS.set("video"/"itch")`) | WIRED | Video and itch output in scratch build. |
| lib/embeds.js | lib/media.js (`renderFileVideo`) | WIRED | File video rendered and `video/clip.mp4` copied. |
| lib/markdown.js | lib/alt-lint.js | WIRED | WARN printed in build. |
| base.njk | style.css, `#main` | WIRED | `href="#main"` targets `main id="main"`. |
| test/contrast.test.js | style.css tokens | WIRED | Test passes against current tokens. |

### Data-Flow Trace (Level 4)

Static site with no runtime data. The "data" is markdown to HTML at build time, which I traced end to end using the repo's Tidepool page and a scratch page. No hollow props or static fallbacks.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite | `npm test` (run once) | 166 pass, 0 fail | PASS |
| Real site build | `npx eleventy` | exit 0, 3 pages, no WARN, 3 images optimized | PASS |
| Mixed-content page incl. YouTube, Vimeo, itch, file video, raw HTML, decorative | scratch build via `test/helpers/site.js` | exit 0; markup as expected | PASS |
| Paste-default alt warning | same scratch build | WARN line printed, exit 0 | PASS |
| Hostile / malformed inputs (bad host, unknown block with CRLF, unclosed fence) | scratch builds | each exits 1 | PASS |
| Image line ending in a Markdown hard break (two trailing spaces) inside a grid | scratch build | exit 1 (see WR-02) | FAIL (warning, not a must-have) |

### Probe Execution

SKIPPED: no `probe-*.sh` scripts exist in this repo and none are declared by the plans (the `probe BLOCK-01`-style labels in the plans refer to test cases in `test/*.test.js`, which pass).

### Requirements Coverage

All 13 requirement IDs in the phase brief appear in PLAN frontmatter and in REQUIREMENTS.md mapped to Phase 2. No orphaned Phase 2 requirements.

| Requirement | Source Plan | Description | Status | Evidence |
|------------|-------------|-------------|--------|----------|
| BLOCK-01 | 02-01 | grid-2/3/4 shorthand | SATISFIED | `<div class="layout grid-N">` output |
| BLOCK-02 | 02-01, 02-02 | full-width block | SATISFIED | `<div class="layout full">`; `main > .full { grid-column: full }` |
| BLOCK-03 | 02-01, 02-03 | free mixing | SATISFIED | mixed scratch page; Tidepool demo |
| BLOCK-04 | 02-01 | figure/figcaption captions | SATISFIED | Tidepool output |
| BLOCK-05 | 02-01, 02-02 | grid aspect ratios kept | SATISFIED | width/height from source; no object-fit |
| BLOCK-06 | 02-02 | collapse, no layout JS | SATISFIED (browser check human) | media queries, no script |
| AUTH-04 | 02-01 | raw HTML fallback | SATISFIED | raw div preserved |
| MEDIA-01 | 02-05 | self-hosted video | SATISFIED (playback human) | `<video controls preload=metadata>`, published file |
| MEDIA-02 | 02-04 | YouTube/Vimeo | SATISFIED (real players human) | nocookie / dnt=1, lazy, titled |
| MEDIA-03 | 02-04 | itch.io game | SATISFIED (real embed human) | titled lazy iframe + visible link |
| A11Y-01 | 02-02 | semantic, brutalist, no animation | SATISFIED | CSS grep, no script |
| A11Y-03 | 02-02 | skip link, focus, AA contrast | SATISFIED with caveat WR-01 | skip link, ring, contrast test |
| A11Y-04 | 02-03 | alt-text warnings | SATISFIED | WARN output, decorative marker |

### Anti-Patterns Found

TBD/FIXME/XXX scan across `lib`, `content`, `src`, `scripts` and `eleventy.config.js` returned nothing. No stub or hollow implementations.

### Code Review (02-REVIEW.md) and UI Review (02-UI-REVIEW.md) Warnings: effect on must-haves

None of the 4 warnings or 3 UI warnings defeats a ROADMAP success criterion. Dispositions in `02-REVIEW-DISPOSITION.md` are all still `open`, so the owner should triage them.

| ID | Defeats a must-have? | Assessment |
|----|----------------------|------------|
| WR-01 `main:focus{outline:none}` loses on specificity | No for A11Y-03 (skip link, visible focus, contrast all hold). It does make one 02-02 detail ineffective: "the only outline removal is `main:focus`". I confirmed by specificity: `:is(... [tabindex]):focus-visible` is (0,2,0), `main:focus` is (0,1,1), and `<main tabindex="-1">` matches the ring rule. | WARNING. Likely a page-wide ring after using the skip link in Chromium. Accessible but ugly; also `test/design.test.js` only asserts the rule text, not that it wins. Owner decision: fix (one-line selector change) or accept. |
| WR-02 trailing hard break after an image in a block gives a wrong error | No. The build fails loudly (I reproduced exit 1). The line number and "contains text" message are wrong. | WARNING. Authoring friction: a trailing double-space or backslash from a paste fails a grid with a misleading message. |
| WR-03 out-of-range date (e.g. 2024-13-45) crashes with a raw Eleventy trace | No. Date validation is Phase 1 behaviour, not a Phase 2 requirement. | Out of scope for this phase's goal. |
| WR-04 CI hint for oversize WebP suggests `shrink`, which is a no-op | No. The 10 MB cap rejects loudly, only the advice is wrong. | Minor, relates to Phase 1 asset guard. |
| IN-02 Google Fonts CDN vs privacy-first embeds | No. Owner explicitly chose Google Fonts (D-10) and the plan prohibition allows it. | Note only. |
| IN-04 no aggregate video budget vs Pages 1 GB limit | No. Per-file 50 MB cap met. | Note for Phase 4 hardening. |
| UI-REVIEW fix 1 rhythm rules lose on specificity (h2 after a block gets 32px not 48px, block after h2 32px not 16px) | No. Cosmetic spacing deviation from 02-02 "vertical rhythm" detail, not a roadmap criterion. | WARNING. Fix is a selector reorder in `style.css`. |
| UI-REVIEW fix 2 skip-link ring contrast over black | No (3px offset puts most of the ring over white). | Untested; human item 2. |
| UI-REVIEW fix 3 no visual verification | n/a | Covered by human items 1 and 5. |

### Human Verification Required

See the `human_verification` list in the frontmatter. Six items remain unverifiable by me: browser layout at 1280/600px, keyboard skip-link and focus walk-through (including WR-01), real YouTube/Vimeo/itch.io embeds, real .mp4 playback on desktop and iPhone Safari, layout-shift under throttling, and the VS Code paste-alt WARN with the real plugin.

### Gaps Summary

No gaps. No truth FAILED and no requirement is blocked. The phase goal (compose a rich page from short block shorthand with grids, full-width images, text, video and games, on an accessible brutalist page) is realised in code and demonstrated both by the repo's Tidepool page and by an independent mixed-content scratch build. Recommended before moving on: decide on WR-01 and the UI-REVIEW rhythm specificity fix (both are small CSS edits), and do the browser/device checks above, since this phase's value is largely visual and none of it has been seen in a browser.

---

_Verified: 2026-10-29_
_Verifier: Claude (gsd-verifier)_
