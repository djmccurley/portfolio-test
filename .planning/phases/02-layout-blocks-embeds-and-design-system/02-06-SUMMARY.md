---
phase: 02-layout-blocks-embeds-and-design-system
plan: 06
subsystem: ui
tags: [video, poster, media-fragment, ios-safari, regression-tests, ci]

requires:
  - phase: 02-layout-blocks-embeds-and-design-system
    provides: renderFileVideo and copyMedia self-hosted video block (02-05)
provides:
  - "A `::: video ... poster=...` block emits a plain `src` (no `#t=` fragment), so the browser stays in poster mode and shows the poster before play"
  - "No-poster video blocks keep `src=...#t=0.001` for the iOS Safari first-frame trick"
  - "Regression tests pin the `<video src>` form for poster and no-poster blocks, with and without `full` and with an escaped title"
  - "CI `originals not published` check allows byte-identical videos directly inside `_site/video/`, so committing a page with a `::: video` block no longer fails `npm test`"
affects: [verify-work UAT for MEDIA-01, phase-03 deploy]

actuals:
  tokens: 1460
  tasks: 2
  commits: 2
plan_head_before: bbbd38a513bae9210036a73c1371eb1840c2a2bf
plan_head_after: 69759bf94fe3461f00e7a6da635b9ba544eecb7f

tech-stack:
  added: []
  patterns:
    - "Media-fragment seek (#t=) only on poster-less video: a fragment makes the browser leave poster mode"
    - "CI originals guard shares VIDEO_EXTS from lib/limits.js with the renderer, check-assets and the hook"

key-files:
  created: []
  modified:
    - lib/media.js
    - test/video.test.js
    - test/build.test.js

key-decisions:
  - "Fix by omitting `#t=0.001` when a poster is given (keep preload=metadata) rather than switching to preload=none"
  - "Video exemption in the originals check is scoped to files directly in `_site/video/` with a VIDEO_EXTS extension; any other original anywhere still fails"

requirements-completed: [MEDIA-01]

coverage:
  - id: D1
    description: "A poster video block renders a plain src plus the poster attribute under the default prefix; a no-poster block keeps #t=0.001"
    requirement: MEDIA-01
    verification:
      - kind: integration
        ref: "test/video.test.js#full build: a poster is published as a processed WebP no wider than 1600px"
        status: pass
      - kind: unit
        ref: "test/video.test.js#poster block: plain src with the poster attribute and no #t= fragment"
        status: pass
      - kind: unit
        ref: "test/video.test.js#no-poster block keeps the #t=0.001 first-frame fragment and has no poster attribute"
        status: pass
    human_judgment: false
  - id: D2
    description: "Poster + full + escaped title and no-poster + full keep the correct class, escaped label and fallback link"
    requirement: MEDIA-01
    verification:
      - kind: unit
        ref: "test/video.test.js#poster + full + escaped title: plain src, full class, escaped label and link"
        status: pass
      - kind: unit
        ref: "test/video.test.js#no-poster full block keeps the #t=0.001 fragment"
        status: pass
    human_judgment: false
  - id: D3
    description: "CI originals-not-published check passes with a committed ::: video page and still fails on any other original"
    requirement: MEDIA-01
    verification:
      - kind: integration
        ref: "test/build.test.js#originals not published"
        status: pass
    human_judgment: false
  - id: D4
    description: "The poster is visible before play on desktop and iPhone Safari, play and seeking work, and the no-poster block still plays on the deployed GitHub Pages site"
    verification: []
    human_judgment: true
    rationale: "Poster display mode, iOS Safari first-frame behaviour and GitHub Pages byte-range seeking need a real browser and device; the debug session only drove Chrome"

duration: 11 min
completed: 2026-10-30
status: complete
---

# Phase 02 Plan 06: Video poster fix (G-02-4) Summary

**`::: video` blocks with `poster=` now emit a plain `src` so the poster shows before play, no-poster blocks keep the `#t=0.001` iOS first-frame trick, both forms are pinned by tests, and CI's originals check no longer rejects published videos.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-10-30T13:39:26Z
- **Completed:** 2026-10-30T13:50:00Z
- **Tasks:** 2 (1 tracer, 1 TDD)
- **Files modified:** 3

## Accomplishments
- Root cause fixed in `renderFileVideo`: the `#t=0.001` media fragment seeks on load with `preload="metadata"`, which dropped poster mode. It is now appended only when no poster is given. Controls, `preload="metadata"`, attribute order and the bare fallback link are unchanged.
- The strengthened full-build poster test was seen failing on the old `#t=0.001` src (red) before the fix and passes after. Four new render tests pin the matrix (poster, poster + `full` + escaped title, no-poster, no-poster + `full`). With the fragment made unconditional again, the poster tests went red, then the fix was restored.
- `originals not published` previously failed on `_site/video/tidepool-game-output.mp4` as soon as any committed page used `::: video`. It now exempts only video-extension files directly in `_site/video/`. `npm test` is 174 tests, 0 fail, with the owner's tidepool content present.
- A fresh `npm run build` of the owner's tidepool page shows the poster block as `src=".../tidepool-game-output.mp4" poster=".../poster-40c7f770.webp"` and the no-poster block still ending in `#t=0.001`.

## Task Commits

1. **Task 1: End-to-end poster fix (tracer)** - `ab36515` (fix). The red run (test failing on the old src) was observed before the lib edit, committed together with the fix per the plan.
2. **Task 2: Render matrix and CI originals check** - `69759bf` (test)

**Plan metadata:** committed with this SUMMARY (docs: complete plan)

## Files Created/Modified
- `lib/media.js` - `src` is `url` with a poster, `url#t=0.001` without
- `test/video.test.js` - exact poster full-build assertion; four render-matrix tests (14 -> 18 tests)
- `test/build.test.js` - imports `VIDEO_EXTS`; scoped video exemption in "originals not published"

## Decisions Made
- Omit the fragment for poster blocks and keep `preload="metadata"`, as the gap specified (debug variant G, `preload="none"`, was not used).
- Scope the CI exemption narrowly (directory plus extension) so T-02-18 holds: any other original, including a video outside `_site/video/`, still fails.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- The protected-branch commit guard initially halted the run (HEAD on `main`, `git.allow_default_branch_commits` unset). The owner allowed commits on `main`, the orchestrator set the config key, and the run resumed.

## Known Stubs
None.

## Threat Flags
None. Both `src` forms are built from the same encoded basename; title and poster escaping is unchanged (T-02-17) and the CI exemption is scoped as in T-02-18.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
G-02-4 is closed in code. Remaining human check: open the tidepool page (`npm start`) and confirm the poster block shows the poster before play, then, after the owner commits and pushes the tidepool content, confirm on iPhone Safari that the poster shows, play and seeking work, and the no-poster block still plays. Frame 0 of `tidepool-game-output.mp4` is pure black, so the no-poster block's pre-play frame may be black (a content quirk).

## Self-Check: PASSED

`lib/media.js`, `test/video.test.js` and `test/build.test.js` exist; commits `ab36515` and `69759bf` are ancestors of HEAD; `node --test test/video.test.js` is 18 pass / 0 fail; `npm test` is 174 pass / 0 fail; the preservation guard `grep -v '^ *//' lib/media.js | grep -c '#t=0.001'` prints 1; `VIDEO_EXTS` appears twice and `lib/limits.js` once in `test/build.test.js`; the owner's uncommitted files are unstaged and untouched.

---
*Phase: 02-layout-blocks-embeds-and-design-system*
*Completed: 2026-10-30*
