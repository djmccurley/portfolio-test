---
phase: 02-layout-blocks-embeds-and-design-system
plan: 04
subsystem: ui
tags: [embeds, youtube, vimeo, itch, iframe, markdown-it-container]

requires:
  - phase: 02-layout-blocks-embeds-and-design-system
    provides: EMBEDS hook and locator in lib/blocks.js (02-01), .embed / .embed.itch / p.embed-link CSS (02-02)
provides:
  - "`::: video <url> \"Title\"` rendering a titled, lazy youtube-nocookie or Vimeo (dnt=1) iframe"
  - "`::: itch <embed-url> <W>x<H> \"Title\" <page-url>` rendering a titled lazy iframe plus a visible Play on itch.io link"
  - "`full` keyword for edge-to-edge embeds"
  - "Strict embed errors with file and line, including takes-no-content"
affects: [02-05 self-hosted video branch of ::: video]

actuals:
  tokens: 5100
  tasks: 2
  commits: 4
plan_head_before: d281fba70a995c308a056d65ab8d99cbda755dfd
plan_head_after: dc17600a3a5cd2bee8ed170f443d53e4c989882a

tech-stack:
  added: []
  patterns:
    - "Embed src is always rebuilt from a parsed, regex-validated ID; the pasted URL is never copied"
    - "Exact-hostname Sets plus new URL() parsing instead of substring matching"
    - "All attribute values and text nodes go through escapeAttr"

key-files:
  created:
    - lib/embeds.js
    - test/embeds.test.js
  modified:
    - lib/blocks.js
    - test/block-errors.test.js

key-decisions:
  - "Boolean attribute written as allowfullscreen=\"\" so markdown-level and built-page strings match"
  - "Vimeo hash only taken from a hex path segment or a hex ?h= param; a non-hex ?h= makes the URL unrecognised"
  - "Embed no-content check lives in the core rule (token after the open must be the close)"

patterns-established:
  - "New embed types register a handler with EMBEDS.set(name, handler(args, ctx))"

requirements-completed: [MEDIA-02, MEDIA-03]

coverage:
  - id: D1
    description: "YouTube/Vimeo URL shapes map to nocookie / dnt=1 players, hostile URLs rejected"
    requirement: MEDIA-02
    verification:
      - kind: unit
        ref: "test/embeds.test.js#every YouTube URL shape maps to the nocookie embed"
        status: pass
      - kind: unit
        ref: "test/embeds.test.js#hostile or malformed video URLs return null"
        status: pass
    human_judgment: false
  - id: D2
    description: "Built page has the exact privacy iframe, no wrapping paragraph, no script"
    requirement: MEDIA-02
    verification:
      - kind: integration
        ref: "test/embeds.test.js#full build: a youtu.be link becomes the privacy iframe, no paragraph, no script"
        status: pass
    human_judgment: false
  - id: D3
    description: "itch block renders titled lazy iframe and visible Play on itch.io link; hosts allow-listed"
    requirement: MEDIA-03
    verification:
      - kind: unit
        ref: "test/embeds.test.js#itch renders a titled lazy iframe and a visible play link"
        status: pass
      - kind: unit
        ref: "test/embeds.test.js#itch embed and page hosts are allow-listed"
        status: pass
    human_judgment: false
  - id: D4
    description: "Titles and URLs HTML-escaped; every mistake fails with file:line"
    requirement: MEDIA-02
    verification:
      - kind: unit
        ref: "test/embeds.test.js#titles are HTML-escaped in attributes and text nodes"
        status: pass
      - kind: unit
        ref: "test/embeds.test.js#embed blocks take no content"
        status: pass
    human_judgment: false
  - id: D5
    description: "Real YouTube, Vimeo and itch.io players load and the game is playable in its frame"
    requirement: MEDIA-03
    verification: []
    human_judgment: true
    rationale: "Third-party players and itch.io's real embed URL shape (research A3) cannot be exercised offline; plan Task 2 human-check, pending."

duration: ~15min
completed: 2026-10-30
status: complete
---

# Phase 2 Plan 04: YouTube, Vimeo and itch.io Embeds Summary

**`::: video` and `::: itch` blocks turn a pasted link into a titled, lazy, privacy-friendly iframe (youtube-nocookie, Vimeo dnt=1, allow-listed itch hosts) with src rebuilt from a validated ID and every mistake failing the build with file and line.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2 (1 tracer, 1 TDD)
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- `::: video [full] <url> "Title"` handles youtu.be, watch, m./music. hosts, /embed/, /shorts/, /live/, nocookie, and Vimeo (plain, hashed path, `?h=`, player URLs).
- `::: itch [full] <embed-url> <W>x<H> "Title" <page-url>` emits the `--w/--h` framed iframe and the always-visible Play on itch.io link with a hidden title suffix.
- Embed blocks reject content between fences; the unknown-block list now reads `grid-2, grid-3, grid-4, full, video, itch`.

## Task Commits

1. **Task 1: YouTube embed end to end (tracer)** - RED `96f7920` (test), `5bd541f` (feat)
2. **Task 2: Vimeo, itch, full, errors (TDD)** - RED `baa558e` (test), GREEN `dc17600` (feat)

Tracer gate: Task 1 `<verify>` and the whole suite (131 tests) were green before expansion.

## TDD Gate Compliance

- Task 2: RED `baa558e` precedes GREEN `dc17600`. RED run: 9 pass (Task 1 carry-overs), 10 fail on the planned assertions (Vimeo null, itch unknown block, no-content, unknown-block list). No syntax or import faults. `workflow.tdd_mode` is false, so `check tdd-red-evidence` was not run.
- Task 1 also got a RED commit (`96f7920`, 3 failures: unknown block "video").
- No REFACTOR commits.

## Deviations from Plan

None - plan executed exactly as written. Existing assertions in `test/block-errors.test.js` for the unknown-block list were updated to include the new block names (expected consequence of the plan's own change).

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

None. T-02-09 (exact-host Sets, rebuilt ID, hostile-input tests), T-02-10 (escapeAttr everywhere, quote-aware parser), T-02-11 (itch https + host allow-list, no extra `allow` permissions), T-02-12 (nocookie, dnt=1, strict-origin-when-cross-origin) are implemented and tested.

## User Setup Required

Human check pending (not blocking the build): run `npm start`, add one real YouTube, Vimeo and itch block to a scratch page and confirm they play and that the itch embed URL host is accepted. If itch uses another host, the error names it; widen `ITCH_EMBED_SUFFIXES` in lib/embeds.js.

## Next Phase Readiness

Plan 02-05 can add the `assets/` file branch in `renderVideo` (currently any non-http target fails with the not-recognised message).

## Self-Check: PASSED

- Files present: lib/embeds.js, test/embeds.test.js
- Commits present: 96f7920, 5bd541f, baa558e, dc17600
- `npm test`: 147 pass, 0 fail
