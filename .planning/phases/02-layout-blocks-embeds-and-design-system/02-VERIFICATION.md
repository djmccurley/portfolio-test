---
phase: 02-layout-blocks-embeds-and-design-system
verified: 2026-10-30T14:00:00Z
status: human_needed
score: 5/5 roadmap success criteria verified (G-02-4 fix verified in code and tests; 0 failed)
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
  - .planning/phases/02-layout-blocks-embeds-and-design-system/02-06-PLAN.md
  - .planning/phases/02-layout-blocks-embeds-and-design-system/02-06-SUMMARY.md
  - content/projects/tidepool-game.md
  - content/style.css
  - eleventy.config.js
  - lib/blocks.js
  - lib/embeds.js
  - lib/limits.js
  - lib/markdown.js
  - lib/media.js
  - src/_includes/base.njk
  - test/build.test.js
  - test/video.test.js
covered_digest: "v4:sha256:4287952148c163ff5b1371445acaaa2605996fc8b536421eada364cb93e47a1b"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 5/5
  gaps_closed:
    - "G-02-4: self-hosted video shows its poster before playback (code and regression tests; browser display still needs the owner's recheck)"
  gaps_remaining: []
  regressions: []
gaps: []
deferred: []
advisory:
  - finding: "test/build.test.js:86-91 (02-06 review WR-01): 'originals not published' exempts every .mp4/.webm directly in _site/video/, not only videos a page references, and not only byte-identical ones as the 02-06 plan truth words it"
    category: other
    reason: "Weakens a regression guard only; the shipped publish logic (copyMedia) copies only block-named videos, confirmed by reading lib/media.js. Tighten to referenced videos (reviewer's suggested fix)."
    evidence_status: "reproduced by reading code; not a roadmap must-have"
  - finding: "lib/media.js:52 (02-06 review IN-01) src choice keys on poster, attribute on posterAttr"
    category: other
    reason: "Equal today (ctx.fail throws); latent coupling only"
    evidence_status: "reading code"
  - finding: "scripts/shrink.js:153 prints a false 'still over 10 MB' warning for renamed videos (review WR-01, carried forward)"
    category: other
    reason: "Message only; CI accepts videos up to 50 MB"
    evidence_status: "reproduced by reading code"
  - finding: "lib/blocks.js:157-162 says 'cannot hold linked images' for a plain text link in a layout block (review WR-02, carried forward)"
    category: other
    reason: "Wrong advice text; the build still fails loudly with file:line"
    evidence_status: "reproduced in an earlier scratch build"
human_verification:
  - test: "Re-run UAT test 4: open the built Tidepool page (npm start) and the deployed site; play the 'Tidepool trailer' block (has poster=) and the 'PM trailer' block (no poster) on desktop and iPhone Safari"
    expected: "The poster block shows poster-<hash>.webp before play (not a black frame), then plays and seeks; the no-poster block shows a first frame on iOS and plays and seeks; no layout jump while metadata loads"
    why_human: "Poster rendering in a real browser and iOS first-frame behaviour cannot be observed here. The built markup is verified (plain src plus poster attribute; no-poster keeps #t=0.001) and the mechanism is documented in .planning/debug/video-poster-not-shown.md, but the plan tags this truth verification: backstop."
---

# Phase 2: Layout Blocks, Embeds and Design System Verification Report

**Phase Goal:** Owner composes a rich project page by typing short block shorthand, mixing grids, full-width images, text, video and playable games, on an accessible brutalist page
**Verified:** 2026-10-30
**Status:** human_needed
**Re-verification:** Yes, after gap-closure plan 02-06 (G-02-4, commits ab36515 and 69759bf). Prior results (5/5 roadmap truths, 13 requirements) were carried forward with regression checks; the 02-06 must-haves received full verification.

The goal is achieved in code. The one failing UAT item (poster video not showing its poster) now has a correct fix and regression tests, and `npm test` passes 174/174 on the current tree (run once). Status stays `human_needed` solely because the poster display and iOS first-frame behaviour need a real-browser recheck by the owner (UAT test 4).

## Goal Achievement

### Observable Truths (ROADMAP success criteria, carried forward)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `::: grid-2/3/4` and full-width blocks mixed freely with text, images keep aspect ratios | VERIFIED | Prior scratch-page proof stands; `lib/blocks.js`, `lib/markdown.js`, `content/style.css` unchanged by 02-06 (`git show --stat` for 02-06 touches only `lib/media.js` and tests). Fresh build of the owner's current tidepool page succeeds (exit 0, 3 pages). UAT test 1 (layout at 1280/960/640/600) passed by the owner. |
| 2 | Captioned images render figure/figcaption, grids collapse with no layout JS | VERIFIED | Unchanged; UAT test 1 pass; built tidepool page contains 0 `<script>`. |
| 3 | Raw HTML in markdown renders as fallback | VERIFIED | Unchanged since prior scratch proof; covered by passing suite. |
| 4 | Visitor can play self-hosted video (controls, poster, no autoplay), YouTube/Vimeo, itch.io with visible link | VERIFIED (poster display in browser is human) | Fresh build of the owner's working-tree page (which includes YouTube, itch.io, a no-poster video and a poster video) wrote `<video controls="" preload="metadata" src="/portfolio-test/video/tidepool-game-output.mp4" poster="/portfolio-test/video/poster-40c7f770.webp" aria-label="Tidepool trailer">` and `<video ... src="/portfolio-test/video/tidepool-game-output.mp4#t=0.001" aria-label="PM trailer">`. No autoplay/loop/muted. UAT tests 3 (real embeds) passed. |
| 5 | Semantic HTML, brutalist CSS with no animation, skip link, focus, AA contrast, alt warnings | VERIFIED | Unchanged; UAT tests 2 and 6 passed by the owner; contrast and design tests in the passing suite. |

**Score:** 5/5 roadmap truths verified, 0 behavior-unverified.

### 02-06 must-haves (full verification)

| # | Must-have | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Poster block: `src` has no `#t=` fragment, `poster=` hashed `.webp`, default prefix applied | VERIFIED | `lib/media.js:52` `const src = poster ? url : \`${url}#t=0.001\``; built output above shows plain src with prefix `/portfolio-test/` and `poster-40c7f770.webp`. The file `poster-40c7f770.webp` is a real WebP (`file` confirms RIFF WebP) at `_site/video/`. |
| 2 | No-poster block keeps exact markup `src=".../video/clip.mp4#t=0.001"` | VERIFIED | Built "PM trailer" tag shows `#t=0.001`; `grep -c '#t=0.001' lib/media.js` outside comments is 1 (fragment moved into the branch, not duplicated). |
| 3 | Both forms keep `controls=""` + `preload="metadata"`, no autoplay/loop/muted; fallback `href` has no fragment | VERIFIED | Both built tags show exactly `controls="" preload="metadata"`; `lib/media.js:58` fallback link uses bare `url`; test asserts `<a href="${prefix}video/clip.mp4">`. |
| 4 | Regression tests pin src form for poster (+/- full, escaped title) and no-poster (+/- full) | VERIFIED | `test/video.test.js:194-236` four render-level tests with exact-string or regex matches, each also asserting `#t=` absent or `poster=` absent; full-build test at lines ~253-262 asserts exact attribute order including prefix and no `#t=`. Whole suite 174/174. |
| 5 | Committing a page with a `::: video` block no longer fails CI `originals not published` | VERIFIED (with warning) | `test/build.test.js:86-91` exempts files directly in `_site/video/` with a `VIDEO_EXTS` extension (imports from `lib/limits.js`); any other original anywhere still fails. The test passes against the repo tree that contains the owner's uncommitted video-bearing page (suite 174/174). Weaker than the plan wording ("byte-identical") and than ideal (review WR-01); advisory. |
| 6 | (backstop) Poster shows before play on desktop and iPhone Safari; no-poster still plays and seeks on deployed site | UNCERTAIN, routed to human | Mechanism is correct per the documented root cause; actual rendering is not observable here. See Human Verification. |

Scoping checks on 02-06: `git show --stat` shows ab36515 touches only `lib/media.js` and `test/video.test.js`, 69759bf only `test/build.test.js` and `test/video.test.js`. `lib/embeds.js`, poster hashing and `copyMedia` untouched. The owner's `content/projects/tidepool-game.md` and `assets/*` remain unstaged/untracked as required (`git status` confirms ` M` / `??`).

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `lib/media.js` | VERIFIED | Exists, substantive, one-branch src logic; wired from `lib/embeds.js` `renderVideo` and `eleventy.config.js` (`copyMedia` on `eleventy.after`). |
| `test/video.test.js` | VERIFIED | Contains `poster=`; new matrix present. |
| `test/build.test.js` | VERIFIED | Contains `VIDEO_EXTS`, imports from `lib/limits.js`. |
| Phase 1-5 artifacts (blocks, embeds, alt-lint, CSS, base.njk, scripts) | VERIFIED (carried forward) | Unchanged by 02-06; suite passes. |

### Key Link Verification

| From | To | Status | Details |
|------|----|--------|---------|
| lib/embeds.js | lib/media.js `renderFileVideo(` | WIRED | Real build routes the owner's poster path through to the poster-form tag. |
| test/build.test.js | lib/limits.js | WIRED | `VIDEO_EXTS` import in use. |
| eleventy.config.js | `copyMedia` | WIRED | Video and hashed poster appear in `_site/video/`; mp4 byte-identical to `assets/` source (by design, D-07). |

### Data-Flow Trace (Level 4)

Poster path: markdown `poster=../assets/poster.png` -> `resolveAsset` -> sha1 hash -> `poster-40c7f770.webp` in output markup -> `copyMedia` processes via eleventy-img into `_site/video/`. FLOWING. Note: running with the CLI `--output` flag, `copyMedia` still wrote into `_site/video` (it uses `dir.output` from config), which is harmless and unrelated to this phase's deliverables.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite (once) | `npm test` | 174 pass, 0 fail | PASS |
| Real-tree build including owner's video blocks | `npx eleventy --output=<scratch>` | exit 0, 3 pages, 0 `<script>`, expected two `<video>` tags | PASS |
| Poster file is real processed WebP | `file _site/video/poster-40c7f770.webp` | RIFF WebP | PASS |

### Probe Execution

SKIPPED: no `probe-*.sh` declared or present.

### Requirements Coverage

All 13 IDs (BLOCK-01..06, AUTH-04, MEDIA-01..03, A11Y-01, A11Y-03, A11Y-04) appear in PLAN frontmatter across 02-01..02-06 (02-06 declares MEDIA-01) and are marked `[x]` / `Phase 2 | Complete` in REQUIREMENTS.md. No other Phase 2 IDs are mapped there (A11Y-02 is Phase 4), so there are no orphans.

| Requirement | Source Plan | Status | Evidence |
|------------|-------------|--------|----------|
| BLOCK-01..06, AUTH-04 | 02-01, 02-02, 02-03 | SATISFIED | Carried forward; UAT test 1 pass; suite green |
| MEDIA-01 | 02-05, 02-06 | SATISFIED (poster browser recheck human) | Poster-form and no-poster-form markup verified in real build |
| MEDIA-02, MEDIA-03 | 02-04 | SATISFIED | UAT test 3 pass (real YouTube/Vimeo/itch.io) |
| A11Y-01, A11Y-03, A11Y-04 | 02-02, 02-03 | SATISFIED | UAT tests 2 and 6 pass |

### Prohibitions

| Prohibition | Tier | Status | Evidence |
|------------|------|--------|----------|
| Video never autoplay/loop/muted | test | RESOLVED | Neither built `<video>` tag carries them |
| Never publish unreferenced assets/originals (images) | test | RESOLVED | `originals not published` passes; see WR-01 advisory on video-dir looseness |
| No client JS / trackers | test | RESOLVED | 0 `<script>` in built page |

### Anti-Patterns Found

`TBD|FIXME|XXX` scan across `lib`, `scripts`, `src`, `content/style.css`, `eleventy.config.js`: none. No stubs. The 02-REVIEW-DISPOSITION lists the open warnings as unresolved, all recorded as advisory above; none defeats a must-have.

### Human Verification Required

1. **Poster and first-frame playback (UAT test 4 recheck)**
   - Test: Load the Tidepool page locally and on the deployed site, desktop and iPhone Safari. Play the "Tidepool trailer" (poster) and "PM trailer" (no poster) blocks.
   - Expected: Poster visible before play (not a black frame); no-poster block shows a first frame on iOS; both play and seek.
   - Why human: Real media rendering and iOS behaviour.

### Gaps Summary

No gaps. G-02-4 is closed in code and tests: the fragment is dropped when a poster is given and kept otherwise, the test matrix pins both forms, and CI no longer fails on a committed video page. The only remaining item is the owner's browser confirmation of the poster. Optionally tighten the build-test exemption (review WR-01) to videos referenced by built pages.

---

_Verified: 2026-10-30_
_Verifier: Claude (gsd-verifier)_
