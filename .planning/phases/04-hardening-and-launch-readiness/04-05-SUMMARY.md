---
phase: 04-hardening-and-launch-readiness
plan: 05
subsystem: accessibility-reflow
tags: [css, reflow, headless-chrome, wcag-1.4.10, node-test]

requires:
  - phase: 04-hardening-and-launch-readiness
    provides: "Project pager markup and CSS (04-03) that this plan keeps reflowing"
provides:
  - "npm run check:reflow: local headless-Chrome check that serves _site under the real /portfolio-test/ prefix and measures every built page, a stress page and a canary at 320 and 640 CSS px"
  - "CSS reflow fixes: wider break-word list, anywhere on pre/td/th, minmax(0, 1fr) meta dl, shrinkable pager and filter list items"
  - "test/reflow.test.js: CI guards for those fixes, no fixed widths, no 100vw, no overflow clipping, nowrap limited, exact viewport meta without zoom blocking"
affects: [phase-04-verification, phase-04-uat]

actuals:
  tokens: 4400
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Measure narrow widths in headless Chrome through a same-origin iframe of the target width, because headless will not shrink its window below about 500px"
    - "Fail on documentElement.scrollWidth vs clientWidth; per-element scrollWidth is diagnostics only"
    - "A canary page with a 2000px box proves the check is really measuring"
    - "Flex items that hold long words need min-width: 0, since overflow-wrap: break-word does not lower min-content"

key-files:
  created: [scripts/check-reflow.mjs, test/reflow.test.js]
  modified: [content/style.css, package.json]

key-decisions:
  - "check:reflow stays out of npm test and CI because it needs a browser; test/reflow.test.js is the deterministic CI half"
  - "No overflow clipping and no zoom blocking: reflow comes only from wrapping and shrinking, enforced by test"
  - "Table display is untouched (keeps table semantics); overflow-wrap: anywhere on td/th lets columns shrink"

patterns-established:
  - "Reflow guard: any new flex row of links gets li { min-width: 0 }"

requirements-completed: [A11Y-02]

coverage:
  - id: D1
    description: "Every built page and a worst-case stress page have no horizontal overflow at 320 and 640 CSS px in headless Chrome under the real /portfolio-test/ prefix; a canary proves the check measures"
    requirement: A11Y-02
    verification:
      - kind: e2e
        ref: "npm run build && npm run check:reflow (exit 0, 8 pages x 2 widths, canary overflowed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A future CSS edit that removes a reflow fix, clips overflow, adds fixed widths or 100vw, widens nowrap, or blocks zoom fails npm test"
    requirement: A11Y-02
    verification:
      - kind: unit
        ref: "test/reflow.test.js (8 tests)"
        status: pass
      - kind: unit
        ref: "test/design.test.js"
        status: pass
    human_judgment: false
  - id: D3
    description: "No horizontal scrollbar and nothing cut off on the deployed site at 320px and at 200% and 400% zoom, including the lightbox Close button"
    requirement: A11Y-02
    verification: []
    human_judgment: true
    rationale: "ROADMAP criterion 5 requires verification on the deployed prefix with real fonts and GitHub Pages serving; the local check uses fallback-or-network fonts and a local server. Open for the owner's end-of-phase UAT (see Human Verification Pending). Not claimed as passed."

duration: 9min
completed: 2026-10-30
status: complete
plan_head_before: 26a7a55a279cdcdc454b030714273e5c5964cfb0
plan_head_after: 82e0e2f35e0df04350c62fdc89237945f3254fcc
commits: 2
---

# Phase 4 Plan 05: Reflow check and overflow fixes Summary

**A local headless-Chrome check (`npm run check:reflow`) proves every built page plus a worst-case stress page fits 320px and 640px with no horizontal scroll under the real `/portfolio-test/` prefix, CSS fixes for blockquote, pre, tables, the meta list and the pager make it pass, and `test/reflow.test.js` keeps those fixes (and unblocked zoom) in CI.**

## Performance

- **Duration:** about 9 min
- **Completed:** 2026-10-30T22:31Z
- **Tasks:** 2
- **Files modified:** 4 (2 created)

## Accomplishments

- `scripts/check-reflow.mjs` (ESM, `node:` built-ins only): binds `127.0.0.1` on a random port, serves `_site` under the prefix parsed from `eleventy.config.js` (traversal returns 404, `/__measure` validates `w` and `p`), and drives Chrome with async `execFile` (argument array, no shell). It measures the 8 real pages, a stress page and a canary at 320 and 640. Exits 2 with a clear message when Chrome or `_site/index.html` is missing.
- CSS fixes: `blockquote, dt, summary` join the break-word list; `pre, td, th { overflow-wrap: anywhere }`; meta `dl` uses `auto minmax(0, 1fr)` with `dd { min-width: 0 }`; `.pager li, .filters li { min-width: 0 }` so long titles wrap.
- `test/reflow.test.js` (8 tests) guards the fixes and the prohibitions (no `overflow: hidden`, no `100vw`, no fixed widths of 100px or more, `nowrap` only in `.skip-link` and `.visually-hidden`) and asserts every built page's viewport meta is exactly `width=device-width, initial-scale=1`.
- Test suite: 348 to 356 passing; `npm test` green. Final `npm run check:reflow` printed `check-reflow: 8 pages x 2 widths, no horizontal overflow` (7 site pages including the 404, plus the stress page).

## Red run (before any CSS change)

```
FAIL 320 /__reflow/stress/ scrollWidth=2831 clientWidth=320 offenders=main,blockquote,pre,nav.pager,ul
FAIL 640 /__reflow/stress/ scrollWidth=2847 clientWidth=640 offenders=main,dl,blockquote,pre,nav.pager,ul
```

All 7 real site pages and the 404 were already clean at both widths; the canary overflowed at both. After the planned CSS only, the stress page still failed on the pager (`scrollWidth=766` at 320, `782` at 640); adding the `li { min-width: 0 }` rule cleared it.

## Task Commits

1. Task 1 (tracer): `251f623` feat - check script, `check:reflow` script, CSS fixes. Tracer gate (auto/end-of-phase, automated-only verify): `npm run build && npm run check:reflow` re-run after the commit and passed; `npm test` 348 pass.
2. Task 2 (tdd): `82e0e2f` test - `test/reflow.test.js`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pager list items did not shrink, so long titles widened the page**
- **Found during:** Task 1 (first green run)
- **Issue:** the stress page's two 60-character pager titles still overflowed (`nav.pager`, `ul`) after the CSS the plan listed. `overflow-wrap: break-word` does not lower min-content, and a flex item's `min-width: auto` equals its longest word.
- **Fix:** added `.pager li, .filters li { min-width: 0; }` (a separate rule, so the exact `.filters` rule asserted by `test/browse.test.js` is untouched).
- **Files modified:** content/style.css
- **Verification:** `npm run check:reflow` exit 0; `npm test` green
- **Commit:** 251f623

**2. [Process - TDD ordering] RED shown by reverting the CSS, not by a separate failing commit**
- **Found during:** Task 2
- **Issue:** Task 2 is `tdd="true"` but the CSS it guards was already committed in Task 1 (the plan's order), so a committed test could not fail at HEAD.
- **Handling:** wrote the test, temporarily restored the pre-plan stylesheet (`git show 26a7a55:content/style.css`), ran it, then restored the fixed stylesheet. Result: 4 of 8 tests failed on the intended assertions (break-word list, `anywhere`, meta `dl`, `min-width: 0` rules); the 4 prohibition and viewport guards passed, as they should on an already-compliant site. Then committed the test alone. No separate RED commit exists.

**Total deviations:** 2 (1 bug fix, 1 TDD-ordering note). **Impact:** none on scope; one extra CSS rule.

## TDD Gate Compliance

Plan type is `execute`, so the plan-level gate sequence does not apply. For Task 2: RED evidence is the reverted-stylesheet run above (4 fail, 4 pass, assertion failures on the planned selectors, not crashes); GREEN is the committed stylesheet (`node --test test/reflow.test.js test/design.test.js`: 31 pass, 0 fail). No refactor commit.

## Human Verification Pending (end-of-phase UAT, not claimed here)

ROADMAP success criterion 5 is NOT closed by this plan. After the phase is pushed to `main` and the Deploy workflow finishes, the owner checks https://djmccurley.github.io/portfolio-test/ pages `/`, `/work/`, a tag page, `/tidepool-game/` (grid, full-width image, videos, itch game, PDF link), `/cv/`, `/teaching/` and `/no-such-page/` (404):

1. DevTools device toolbar at width 320.
2. DevTools closed, window about 1280px wide, browser zoom 200%, then 400%.
3. At 320px, open an image full-size, close it with Escape, open it again and close it with the Close button.

Expected on every page at every setting: no horizontal scrollbar, nothing cut off at the right edge, text wraps, header and filter row wrap, next/previous links wrap (once a second project exists), embeds shrink to the column, and the lightbox Close button is visible and reachable. Record pass or fail per page in the phase UAT.

## Issues Encountered

None. Automated measurement used Chrome with the network-loaded Chivo font link left as-is (the page still renders if the font fails); the live check on the deployed site covers real fonts.

## Known Stubs

None.

## Threat Flags

None. T-04-15 (localhost-only server, path containment, `w`/`p` validation), T-04-16 (`execFile` with an argument array, no shell) and T-04-17 (clipping and zoom blocking forbidden in `test/reflow.test.js`) are mitigated as planned. No packages were installed (T-04-SC).

## Self-Check: PASSED

- Created files exist: scripts/check-reflow.mjs, test/reflow.test.js.
- Commits 251f623 and 82e0e2f are ancestors of HEAD; `git rev-list --count` from the recorded base gives 2.
- Acceptance: `scripts/check-reflow.mjs` contains `__measure`, `127.0.0.1`, `execFile`; `package.json` contains `check:reflow`; `content/style.css` contains `auto minmax(0, 1fr)` and `overflow-wrap: anywhere`; `test/reflow.test.js` contains `minmax(0, 1fr)`, `user-scalable`, `overflow-wrap: anywhere`.
- `npm run build && npm run check:reflow` exit 0 ("no horizontal overflow"); `npm test` 356 pass, 0 fail.
