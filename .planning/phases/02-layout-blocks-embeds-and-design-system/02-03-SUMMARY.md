---
phase: 02-layout-blocks-embeds-and-design-system
plan: 03
subsystem: ui
tags: [eleventy, markdown-it, accessibility, alt-text, lint]

requires:
  - phase: 02-layout-blocks-embeds-and-design-system
    provides: "blocks rule (meta.decorative), locator(state), asset_resolver loop, grid/full/caption markup"
provides:
  - "lib/alt-lint.js: altIssue, altWarning, warnAlt (deduped), lintRawHtml, resetAltWarnings"
  - "Build WARN lines for empty, paste-default and filename-like alt text on markdown and raw-HTML images; {decorative} stays silent"
  - "Per-build reset of the warning dedupe so each npm start rebuild reprints current warnings"
  - "content/projects/tidepool-game.md as a live grid-2 / caption / full demo with real alt text"
affects: [02-04 embeds, 02-05, phase verification]

actuals:
  tokens: 9000
  tasks: 2
  commits: 3
plan_head_before: f5bb0250c5a1979d04a3f5493e4e3d5fc9b8aaad
plan_head_after: 629fdd3fcc3b1b5caf1e77cc19d0a1dda2c3a57f

tech-stack:
  added: []
  patterns:
    - "Lint warns via console.warn with the exact UI-SPEC line, deduped on file|src|kind, never touches HTML"
    - "Linear non-nested regexes for raw-HTML scanning (T-02-08)"

key-files:
  created:
    - lib/alt-lint.js
    - test/alt-lint.test.js
  modified:
    - lib/markdown.js
    - lib/images.js
    - eleventy.config.js
    - test/build.test.js
    - content/projects/tidepool-game.md

key-decisions:
  - "A raw <img> with no alt gets eleventy-img defaultAttributes alt:\"\" so it warns instead of aborting the build"
  - "Camera-name regex is anchored to the whole alt so sentences starting with img/dsc words do not warn"
  - "Alt compared NFC + lower-case against the percent-decoded basename and stem (query/fragment stripped, raw basename kept if decoding throws)"

patterns-established:
  - "New build-time diagnostics print through a deduped helper reset in eleventy.before"

requirements-completed: [A11Y-04, BLOCK-03]

coverage:
  - id: D1
    description: "Paste-default alt prints the exact WARN line naming file and path, build exits 0, HTML keeps the alt"
    requirement: A11Y-04
    verification:
      - kind: integration
        ref: "test/alt-lint.test.js#a pasted image with the default alt warns once, names file and path, and the build still passes"
        status: pass
    human_judgment: false
  - id: D2
    description: "Empty, whitespace-only, filename-like (camera, screenshot, extension, basename/stem, percent-decoded, NFC) alts are classified; real sentences and non-ASCII text are not"
    requirement: A11Y-04
    verification:
      - kind: unit
        ref: "test/alt-lint.test.js (altIssue cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Raw HTML <img> is linted: missing alt warns empty, alt=\"\" is decorative, single/double/bare quoting read"
    requirement: A11Y-04
    verification:
      - kind: unit
        ref: "test/alt-lint.test.js#lintRawHtml: missing alt warns empty, alt=\"\" is decorative, quotes styles are read"
        status: pass
    human_judgment: false
  - id: D4
    description: "Build prints each warning once on its own line, untruncated (180-char alt), decorative silent, exit 0"
    requirement: A11Y-04
    verification:
      - kind: integration
        ref: "test/alt-lint.test.js#build: every alt rule warns once on its own line, decorative is silent, exit 0, HTML untouched"
        status: pass
    human_judgment: false
  - id: D5
    description: "Repo content builds with zero WARN lines; tidepool page shows grid-2, full block and figcaptions"
    requirement: BLOCK-03
    verification:
      - kind: integration
        ref: "test/alt-lint.test.js#repo content builds with zero WARN lines and shows the grid, caption and full demo"
        status: pass
    human_judgment: false
  - id: D6
    description: "Warning noticeable in the owner's real npm start + VS Code paste loop; tidepool page looks right"
    requirement: A11Y-04
    verification: []
    human_judgment: true
    rationale: "Plan marks this as the end-of-phase human-check; not exercised here."

duration: ~15min
completed: 2026-10-29
status: complete
---

# Phase 2 Plan 03: Alt-Text Lint and Tidepool Demo Summary

**The build now warns, once per image with file and path, about empty, paste-default ("alt text") and filename-like alt text in markdown and raw HTML (never failing, never rewriting), and the tidepool page is a clean live demo of grid, caption and full-bleed blocks.**

## Accomplishments

- `lib/alt-lint.js` classifies alt text (empty, paste-default, filename) and prints the exact UI-SPEC copy; `{decorative}` and raw `alt=""` are silent.
- `asset_resolver` lints image tokens before the remote/data skip, plus `html_block` and `html_inline` raw HTML.
- `eleventy.before` resets the dedupe, so each `npm start` rebuild reprints current warnings.
- `tidepool-game.md` rewritten with `::: grid-2` (two captioned images), text and a captioned `::: full`; every alt written after viewing the image. `npm run build` prints no WARN.

## Task Commits

1. **Task 1 (tracer): paste-default alt warns end to end** - `0155503` (feat). Tracer verified end-to-end (alt-lint tests plus full suite green) before expansion.
2. **Task 2 (TDD): every alt rule, raw HTML, reset, demo page**
   - RED `1df8fc6` (test), GREEN `629fdd3` (feat)

## TDD Gate Compliance

- RED `1df8fc6` precedes GREEN `629fdd3`. RED run: 5 pass, 6 fail. The failures were the planned assertions: filename, basename/stem, NFC, raw HTML, the multi-rule build and the clean repo build. A no-op `lintRawHtml` stub was committed with the tests so the run exercised assertions rather than an import error. No syntax or fixture faults.
- `workflow.tdd_mode` is false, so the `tdd-red-evidence` classifier was not run; evidence is the node:test output above.
- No REFACTOR commit.

## Deviations from Plan

**1. [Rule 3 - Blocking] Raw `<img>` without alt aborted the build in eleventy-img**
- **Found during:** Task 2 GREEN
- **Issue:** The lint printed the warning, but eleventy-img then threw "Missing `alt` attribute", so the build exited 1, contradicting the plan truth that warnings never fail the build.
- **Fix:** `defaultAttributes: { alt: "" }` in `lib/images.js`. It has the lowest precedence, so it only applies when no alt attribute exists (markdown images always carry one). The output for such an image is `alt=""`; the owner is told to fix it by the warning.
- **Files modified:** lib/images.js
- **Commit:** 629fdd3

**2. [Rule 1 - Bug] Phase 1 `project page builds` test depended on the first image having a srcset**
- **Found during:** Task 2 GREEN
- **Issue:** After the plan-mandated tidepool rewrite, the first image with `width=` is a 308px source (no srcset, no `sizes`), so `/sizes=/` failed.
- **Fix:** The test now inspects the widest `<img>` in the page.
- **Files modified:** test/build.test.js
- **Commit:** 629fdd3

**Total deviations:** 2 auto-fixed (1 Rule 3, 1 Rule 1). **Impact:** within plan scope; no behaviour change beyond what the plan truths require.

## Process Note

The Step 0 guard flags `main` as protected. As in plans 02-01 and 02-02 and per the dispatch (`git.branching_strategy: none`, sequential executor), commits went directly to `main`.

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

None. T-02-08 mitigated: `lintRawHtml` uses `<img\b[^>]*>` plus a single-attribute matcher, no nested quantifiers; the camera regex's tail groups are separator-delimited so they cannot backtrack catastrophically. T-02-07 accepted (owner's own terminal).

## Next Phase Readiness

- Plan 02-04 can register embeds; raw HTML inside embed blocks is untouched by this lint.
- Images in Nunjucks layouts (src/_includes) are not linted (none exist).
- End-of-phase human check outstanding: paste an image in VS Code under `npm start`, confirm one WARN line, then confirm it clears after writing an alt.

## Self-Check: PASSED

- Files present: lib/alt-lint.js, test/alt-lint.test.js, content/projects/tidepool-game.md
- Commits present: 0155503, 1df8fc6, 629fdd3
- Acceptance greps pass (lintRawHtml export, `resetAltWarnings()`, `::: grid-2`, `::: full`, `warnAlt(`)
- `npm test`: 128 pass, 0 fail; `npm run build`: no WARN lines

---
*Phase: 02-layout-blocks-embeds-and-design-system*
*Completed: 2026-10-29*
