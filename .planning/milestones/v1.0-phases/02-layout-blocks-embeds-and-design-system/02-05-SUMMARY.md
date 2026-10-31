---
phase: 02-layout-blocks-embeds-and-design-system
plan: 05
subsystem: ui
tags: [video, self-hosted, eleventy-img, poster, asset-guard, pre-commit-hook]

requires:
  - phase: 02-layout-blocks-embeds-and-design-system
    provides: renderVideo with a placeholder for non-URL targets (02-04), resolveAsset and the eleventy.before wiring (02-01), HtmlBasePlugin path prefix (02-03)
provides:
  - "`::: video [full] ../../assets/clip.mp4 \"Title\" [poster=../../assets/img.webp]` rendering a native, non-autoplaying <video> with a prefixed absolute /video/ URL"
  - "lib/media.js copyMedia on eleventy.after: only referenced videos are copied to _site/video/; posters are published as hashed WebP derivatives capped at 1600px"
  - "50 MB video cap enforced at render, in CI (check-assets) and in the pre-commit hook; videos are never re-encoded"
  - "Reserved slug `video`"
affects: [phase-03 deploy, verify-work UAT for MEDIA-01]

actuals:
  tokens: 6200
  tasks: 3
  commits: 6
plan_head_before: e97f287554400bab0c8cadc5600377f0939be035
plan_head_after: 752cd2104265852241f57e9949fc268aa53339b9

tech-stack:
  added: []
  patterns:
    - "Shared dependency-free limits module (lib/limits.js) imported by renderer, CI guard and hook so the cap lives in one place"
    - "Additive module-level Maps of referenced media, flushed by an eleventy.after handler (publish-on-reference, never passthrough-copy assets/)"
    - "Content-hashed poster filenames via eleventy-img filenameFormat so edits never serve stale files"

key-files:
  created:
    - lib/limits.js
    - lib/media.js
    - test/video.test.js
  modified:
    - lib/embeds.js
    - lib/validate.js
    - eleventy.config.js
    - scripts/check-assets.js
    - scripts/shrink.js
    - test/check-assets.test.js
    - test/shrink.test.js
    - test/embeds.test.js

key-decisions:
  - "Posters are processed to a single 1600px WebP (hash in name) rather than copied, resolving research Open Question 2 in favour of processing"
  - "Emit controls=\"\" (not bare controls) because the HTML transform re-serializes boolean attributes as name=\"\""
  - "media.js carries its own four-character escape helper instead of importing escapeAttr, avoiding an embeds.js <-> media.js import cycle"
  - "check-assets skips the sharp decode path entirely for videos and applies VIDEO_MAX_BYTES instead of the 10 MB cap"

patterns-established:
  - "Publish-on-reference: assets are copied into _site only when a block names them"
  - "Hook and CI share one limits module so a cap change is a one-line edit"

requirements-completed: [MEDIA-01]

coverage:
  - id: D1
    description: "Self-hosted video block renders a native player (controls, preload=metadata, #t=0.001, no autoplay/loop/muted) with a prefix-aware absolute URL and a download fallback"
    requirement: MEDIA-01
    verification:
      - kind: integration
        ref: "test/video.test.js#full build: a self-hosted video renders a native player under the default prefix and is published"
        status: pass
      - kind: integration
        ref: "test/video.test.js#full build: PATH_PREFIX=/ gives root-relative video URLs"
        status: pass
    human_judgment: false
  - id: D2
    description: "Only referenced videos are published byte-identical under _site/video; _site/assets never exists; posters are processed WebP never copied originals"
    requirement: MEDIA-01
    verification:
      - kind: integration
        ref: "test/video.test.js#full build: a poster is published as a processed WebP no wider than 1600px"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every video mistake fails the build with file and line (missing, wrong type, over 50 MB, no title, bad poster) and the slug video is reserved"
    requirement: MEDIA-01
    verification:
      - kind: unit
        ref: "test/video.test.js (error tests) and test/embeds.test.js"
        status: pass
      - kind: integration
        ref: "test/video.test.js#full build: a project with slug: video fails because the slug is reserved"
        status: pass
    human_judgment: false
  - id: D4
    description: "CI guard and pre-commit hook accept videos up to 50 MB unchanged (slug-renamed with link rewrite) and reject larger ones"
    requirement: MEDIA-01
    verification:
      - kind: unit
        ref: "test/check-assets.test.js#a video over 50 MB names the video limit"
        status: pass
      - kind: integration
        ref: "test/shrink.test.js#hook rejects a video over 50 MB before the commit lands"
        status: pass
    human_judgment: false
  - id: D5
    description: "iOS Safari paints a first frame without a poster, the --ink slot holds during load, and GitHub Pages serves byte-range requests so seeking works"
    requirement: MEDIA-01
    verification: []
    human_judgment: true
    rationale: "Real codecs, iOS Safari first-frame behaviour and GitHub Pages range serving cannot be checked offline (plan human-check; research A2, A4)"

duration: 3 min
completed: 2026-10-30
status: complete
---

# Phase 02 Plan 05: Self-hosted video Summary

**Self-hosted `::: video` blocks play from `_site/video/` with native controls, no autoplay, optional processed-WebP poster and a 50 MB cap enforced at build, CI and commit time.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-30T04:26:34Z
- **Completed:** 2026-10-30T04:29:19Z
- **Tasks:** 3 (1 tracer, 2 TDD)
- **Files modified:** 11 (3 created, 8 modified)

## Accomplishments
- Tracer: `::: video ../../assets/clip.mp4 "Title"` builds to the exact native `<video>` markup under both the default prefix and `PATH_PREFIX=/`, publishes only that video byte-identical, and never creates `_site/assets`. Tracer re-verified end-to-end before expansion.
- Posters (`poster=`) are published as `<stem>-<8 hex>.webp` at most 1600px wide; originals are never copied. Five new/changed build errors name file and line; `full` renders `embed full`; slug `video` is reserved so it cannot collide with `_site/video/`.
- `npm run check:assets` and the pre-commit hook share `lib/limits.js`: videos up to 50 MB pass unchanged (hook only slug-renames and rewrites links), larger ones fail with the planned copy. Full suite: 166 tests pass; `npm run check:assets` OK; `npm run build` leaves no `_site/assets`.

## Task Commits

1. **Task 1: Self-hosted video end to end (tracer)** - RED `001793b` (test), GREEN `fd0bf2c` (feat)
2. **Task 2: Posters, errors, full, reserved slug** - RED `f1f7720` (test), GREEN `be0571b` (feat)
3. **Task 3: CI guard and hook 50 MB cap** - RED `dcd49f5` (test), GREEN `752cd21` (feat)

**Plan metadata:** committed with this SUMMARY (docs: complete plan)

## Files Created/Modified
- `lib/limits.js` - VIDEO_EXTS, VIDEO_MAX_BYTES, VIDEO_MAX_MB with no imports
- `lib/media.js` - renderFileVideo (resolve, validate, register) and copyMedia (copy videos, process posters), POSTER_WIDTH
- `lib/embeds.js` - renderVideo dispatches file targets to renderFileVideo and parses `poster=`; new usage tail
- `lib/validate.js` - `video` added to RESERVED_SLUGS
- `eleventy.config.js` - `eleventy.after` handler awaits copyMedia(dir.output)
- `scripts/check-assets.js`, `scripts/shrink.js` - per-extension video cap
- `test/video.test.js` (new), `test/check-assets.test.js`, `test/shrink.test.js` (makeRepo copies lib/), `test/embeds.test.js`

## Decisions Made
See key-decisions in frontmatter. Otherwise the plan was followed as specified.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test assertion for "no loop attribute" matched the title text**
- **Found during:** Task 1
- **Issue:** The plan truth says the page contains none of `autoplay`, `loop`, `muted`, but the sample title "Crab walk loop" (and its aria-label) legitimately contains the word `loop`.
- **Fix:** The test asserts no autoplay/loop/muted *attributes* on the `<video>` tag (regex requires whitespace before and `=`/space/`>` after) and no autoplay/muted anywhere in the page.
- **Files modified:** test/video.test.js
- **Commit:** fd0bf2c

**2. [Rule 1 - Bug] 02-04 tests asserted the old usage tail verbatim**
- **Found during:** Task 2
- **Issue:** Two 02-04 tests in test/embeds.test.js compare the full `unexpected "..." in video block. Use: ::: video [full] <url> "Title"` message; the plan mandates the new tail, so they failed (the plan expected a prefix match).
- **Fix:** Updated both expectations to the new usage tail; the `unexpected "poster=x.webp" in video block.` prefix and behaviour for URL targets are unchanged.
- **Files modified:** test/embeds.test.js
- **Commit:** be0571b

---

**Total deviations:** 2 auto-fixed (2 Rule 1, both test-side)
**Impact on plan:** None on shipped behaviour.

## Issues Encountered
None.

## Known Stubs
None.

## Threat Flags
None. New publish surface (`_site/video/`) is covered by T-02-13/14/15/16 (cap enforced in three places, publish-on-reference, resolveAsset basename lookup, escaped titles and URL-encoded names).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
MEDIA-01 is implemented. Pending human verification (plan human-check): play a real .mp4 with and without a poster on desktop and iPhone Safari, and confirm range-request seeking on the deployed GitHub Pages site (research A2, A4).

## Self-Check: PASSED

All created files exist (lib/limits.js, lib/media.js, test/video.test.js); commits 001793b, fd0bf2c, f1f7720, be0571b, dcd49f5, 752cd21 are ancestors of HEAD; `npm test` (166 pass), `npm run check:assets` and `npm run build` pass.

---
*Phase: 02-layout-blocks-embeds-and-design-system*
*Completed: 2026-10-30*
