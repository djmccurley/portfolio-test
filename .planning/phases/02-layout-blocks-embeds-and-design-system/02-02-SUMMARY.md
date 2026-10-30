---
phase: 02-layout-blocks-embeds-and-design-system
plan: 02
subsystem: ui
tags: [css, design-system, accessibility, chivo, skip-link, wcag-contrast, css-grid]

requires:
  - phase: 02-layout-blocks-embeds-and-design-system
    provides: "02-01 markup contract (div.layout grid-N/full, figure, p.lone-image); embed markup is produced by 02-04/02-05"
provides:
  - "Token-driven stylesheet: wide left-aligned named-line column, prose measure, four-size/two-weight type scale, margin-top rhythm"
  - "Grids that collapse with CSS only, uncropped images, full-bleed blocks with inset captions"
  - "Embed frame CSS (16/9 iframes, video, itch W/H ratio, full) ready for plans 02-04/02-05"
  - "Page shell: skip link, main#main target, Chivo via Google Fonts, 3px accent focus ring, reduced-motion guard"
  - "test/contrast.test.js: WCAG ratio computed from the CSS tokens (parseHex, ratio)"
  - "test/design.test.js: built-page shell assertions plus stylesheet contract checks"
affects: [02-03 tidepool conversion, 02-04 embeds, 02-05 itch embeds, phase 04 a11y audit]

actuals:
  tokens: 6000
  tasks: 2
  commits: 3
plan_head_before: d66943c3dd719f51cab17953a6bdcaed626c11db
plan_head_after: 76adf0013291b022552e6eae190e2e394bb566e3

tech-stack:
  added: []
  patterns:
    - "Named-line grid (full-start, content-start, content-end, full-end) shared by header and main; full blocks use the outer lines"
    - "Vertical rhythm via margin-top on main children only"
    - "Stylesheet contract tests read content/style.css, strip comments, then match rules by selector"

key-files:
  created:
    - test/design.test.js
    - test/contrast.test.js
  modified:
    - src/_includes/base.njk
    - content/style.css

key-decisions:
  - "visually-hidden uses clip-path inset(50%) only, with no overflow clipping, so the design test can forbid overflow:hidden everywhere (grid cells must never clip images)"
  - "Heading-then-block gap is 1rem (plan rule 'below h2/h3 1rem') rather than the 2rem block gap, so a heading stays close to the image it introduces"
  - "Built HTML serialises crossorigin as crossorigin=\"\"; the design test accepts both forms (equivalent HTML)"

patterns-established:
  - "Owner edits colour only in the :root token block; the contrast test then enforces AA on --accent"
  - "Embed CSS is keyed on .embed, .embed.itch, .embed.itch.full and the --w/--h custom properties"

requirements-completed: [A11Y-01, A11Y-03, BLOCK-06, BLOCK-05, BLOCK-02]

coverage:
  - id: D1
    description: "Skip link first in body and main#main target on every page (project, empty page, 404, home); no script and no referrer meta"
    requirement: A11Y-03
    verification:
      - kind: integration
        ref: "test/design.test.js#every page starts with the skip link and has the #main target"
        status: pass
      - kind: integration
        ref: "test/design.test.js#no page contains a script or a referrer meta tag"
        status: pass
    human_judgment: false
  - id: D2
    description: "Contrast of ink and accent on paper computed from the CSS tokens; non-hex and missing tokens fail with a clear message"
    requirement: A11Y-03
    verification:
      - kind: unit
        ref: "test/contrast.test.js (8 cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Chivo loaded via Google Fonts with preconnects before the stylesheet; token block, focus ring, skip link rules and reduced-motion guard present; no motion outside the guard"
    requirement: A11Y-01
    verification:
      - kind: integration
        ref: "test/design.test.js#head loads Chivo from Google Fonts before the stylesheet"
        status: pass
      - kind: unit
        ref: "test/design.test.js#no motion outside the reduced-motion guard"
        status: pass
    human_judgment: false
  - id: D4
    description: "Grids hold images uncropped and collapse 4/3 to 2 to 1 columns with media queries only"
    requirement: BLOCK-06
    verification:
      - kind: unit
        ref: "test/design.test.js#grids: gap, top alignment, columns and collapse queries"
        status: pass
      - kind: unit
        ref: "test/design.test.js#grid images are never cropped"
        status: pass
    human_judgment: false
  - id: D5
    description: "Full blocks span full-start to full-end with captions inset to the column edge; embed frames reserve their ratio"
    requirement: BLOCK-02
    verification:
      - kind: unit
        ref: "test/design.test.js#full blocks span full-start to full-end, children default to the content column"
        status: pass
      - kind: unit
        ref: "test/design.test.js#embed frames reserve their ratio"
        status: pass
    human_judgment: false
  - id: D6
    description: "Actual rendering: shared left edge, readable measure, side-by-side grids at 1280px, single column at 600px, no sideways scroll, visible focus ring and skip link on Tab"
    requirement: BLOCK-05
    verification: []
    human_judgment: true
    rationale: "Visual layout, breakpoints and keyboard focus visibility need a real browser and keyboard; tests only inspect stylesheet text. One headless Chrome screenshot at 1280px confirmed the shared left edge and Chivo."

duration: 4min
completed: 2026-10-30
status: complete
---

# Phase 2 Plan 02: Design System and Accessible Shell Summary

**Token-driven brutalist stylesheet (Chivo, black on white plus one accent, one wide left-aligned named-line column) with a skip link, 3px accent focus ring, AA contrast enforced from the CSS tokens, no motion, and CSS for grids, full bleed, figures and embed frames.**

## Performance

- **Duration:** about 4 min
- **Started:** 2026-10-30T04:14:49Z
- **Completed:** 2026-10-30T04:18Z
- **Tasks:** 2 (1 tracer, 1 TDD)
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- Every built page now starts with `Skip to main content` (target `main#main[tabindex=-1]`), loads Chivo from Google Fonts with preconnects before `/style.css`, and ships no script and no referrer meta.
- `content/style.css` is replaced by a 375-line, legible stylesheet: tokens, one named-line column shared by header and main, prose capped at 40rem and left aligned, four font sizes and two weights, margin-top rhythm, grid-2/3/4 with media-query collapse, uncropped images, full-bleed blocks with inset captions, and embed frame rules.
- `test/contrast.test.js` computes WCAG ratios from `--ink`, `--paper` and `--accent` in the stylesheet (ink on paper 21:1, accent on paper 9.4:1); I confirmed by hand that changing the accent to `#8888ee` turns it red (3.09:1).
- `test/design.test.js` asserts the shell on four page types and the stylesheet contract (tokens, focus ring, skip link, no motion outside the guard, named lines, measure, collapse queries, no object-fit, type scale, embed ratios, caption inset), plus a raw-HTML `layout grid-3` fixture proving the markup contract renders today.

## Task Commits

1. **Task 1: keyboard path end to end (tracer)** - `1cfff27` (feat)
2. **Task 2: layout CSS (TDD)**
   - RED `9f14607` (test), GREEN `76adf00` (feat)

Tracer gate: HUMAN_VERIFY_MODE is end-of-phase and the Task 1 `<verify>` is automated-only, so the verify command was re-run (38 pass) before expansion. Tracer verified end-to-end, expanding.

**Plan metadata:** committed separately (docs: complete plan).

## TDD Gate Compliance

- Task 2: RED `9f14607` precedes GREEN `76adf00`. RED run: 8 pass (Task 1 tests plus the type-scale and raw-HTML tests, which hold at both stages), 7 fail on the planned assertions (named-line grid, full/content grid-column, measure, grid and collapse rules, uncropped images, embed ratios, caption inset). No syntax, import or fixture faults. GREEN run: all pass; full suite 117 pass, 0 fail.
- `workflow.tdd_mode` is false, so the `tdd-red-evidence` classifier was not run; evidence is the node:test output above.
- Task 1 is a tracer, committed once with its tests (not a TDD task).
- No REFACTOR commit needed.

## Files Created/Modified

- `src/_includes/base.njk` - Google Fonts links, skip link, `main#main`, `class="meta"` on the date line
- `content/style.css` - complete design system (replaces the two-rule placeholder)
- `test/design.test.js` - built-page shell and stylesheet contract tests
- `test/contrast.test.js` - `parseHex`, `ratio` and the AA checks

## Decisions Made

- `.visually-hidden` uses `clip-path: inset(50%)` without `overflow: hidden`, so "no overflow clipping" can be asserted globally.
- A heading directly above a block keeps the plan's 1rem gap below (not the 2rem block gap) so it stays tied to its content.
- The test accepts `crossorigin` and `crossorigin=""` because the HTML transform re-serialises the attribute.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test expected the literal `crossorigin>` form**
- **Found during:** Task 1
- **Issue:** The built page serialises the attribute as `crossorigin=""` (the Eleventy HTML transform re-serialises the head), so the plan's literal assertion failed. The two forms are equivalent HTML.
- **Fix:** Regex accepts both forms. Source template still has the bare `crossorigin`.
- **Files modified:** test/design.test.js
- **Commit:** 1cfff27

**2. [Rule 1 - Bug] `visually-hidden` first drafted with `overflow: hidden`**
- **Found during:** Task 1 (caught while preparing the Task 2 "no overflow clipping" rule)
- **Fix:** Removed it; `clip-path` alone hides the text.
- **Commit:** 1cfff27

### Process notes (not code deviations)

- While proving the contrast test fails on a bad accent, I ran a `git checkout -- content/style.css` to undo my temporary edit. That reverted the uncommitted new stylesheet to the old two-rule version. I restored it from the `.bak` copy I had made with `sed -i.bak` and re-ran the suite (38 pass) before committing. No work was lost; nothing was committed in the bad state.
- The Step 0 guard reports `main` as protected; this project uses `git.branching_strategy: none` and plan 02-01 also committed on `main`. Committed on `main` as instructed by the dispatch.

**Total deviations:** 2 auto-fixed (both Rule 1) plus 2 process notes. **Impact:** none on scope.

## Issues Encountered

None beyond the notes above.

## Known Stubs

None.

## Threat Flags

None. T-02-05 and T-02-06 (Google Fonts) are accepted per the plan; the only third-party requests added are the two preconnects and the fonts stylesheet; the design test asserts no `<script` and no `name="referrer"` on any built page.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 02-03 can convert the Tidepool page; the stylesheet already styles `div.layout`, `figure`, `figcaption` and `p.lone-image` exactly as 02-01 emits them.
- 02-04/02-05 only need to emit `div.embed`, `div.embed.itch` (with `style="--w:..;--h:.."`), optional `full`, and `p.embed-link`; the CSS is in place.
- Human checks still owed at phase end (end-of-phase mode): the 1280px/600px layout check on the converted Tidepool page and the Tab/Enter skip-link and focus-ring walk-through. Not yet verifiable on game frames and video until 02-04/02-05 land.
- Flagged (from plan): very long h1 at 320px and wide raw-HTML tables are checked formally in Phase 4 (A11Y-02).

---
*Phase: 02-layout-blocks-embeds-and-design-system*
*Completed: 2026-10-30*

## Self-Check: PASSED

- Files present: src/_includes/base.njk, content/style.css, test/design.test.js, test/contrast.test.js
- Commits present: 1cfff27, 9f14607, 76adf00
- `npm test`: 117 pass, 0 fail; `npm run build` writes `_site/style.css` with the `:root` tokens
