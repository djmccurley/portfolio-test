---
phase: 04-hardening-and-launch-readiness
plan: 04
subsystem: documentation
tags: [readme, authoring-reference, sync-test, node-test]

requires:
  - phase: 04-hardening-and-launch-readiness
    provides: "draft front matter and PROJECT_KEYS/PAGE_KEYS (04-01), description field and site.js validation (04-02)"
provides:
  - "README.md: quick-reference tables for blocks, project front matter and page front matter, then workflow, drafts, site settings and an error guide"
  - "test/readme.test.js: sync test reading LAYOUT_SIZES, EMBEDS, PROJECT_KEYS and PAGE_KEYS from the real code, plus an example-build test"
affects: [04-05]

actuals:
  tokens: 5300
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "README fence convention: md fences are built by the test, yaml fences are key-checked, broken examples go in text fences"
    - "Documentation drift guard: the test imports the real block and key lists, so adding a block or field without documenting it fails npm test"

key-files:
  created: [README.md, test/readme.test.js]
  modified: []

key-decisions:
  - "Raw-HTML fallback example uses an html fence, so the md example build (one fixture project) never sees it"
  - "Heading names and the md/yaml/text fence convention are planner choices; renaming a heading means updating the test"
  - "The error guide lists the CI asset-guard messages (over 10 MB, exceeds 3000px, unconverted .png) alongside build errors, since the owner meets both in the same terminal flow"

requirements-completed: [AUTH-05]

coverage:
  - id: D1
    description: "Every layout and embed block name the renderer accepts is documented as `::: <name>`, with `::: video full` and `::: itch full` kept apart from the `::: full` layout block"
    requirement: AUTH-05
    verification:
      - kind: unit
        ref: "test/readme.test.js#every block name the renderer accepts is documented as `::: <name>`"
        status: pass
      - kind: unit
        ref: "test/readme.test.js#the `full` keyword on embeds is documented apart from the `::: full` layout block"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every non-internal key in PROJECT_KEYS and PAGE_KEYS is documented in its own front matter section; the lists are guarded against being empty"
    requirement: AUTH-05
    verification:
      - kind: unit
        ref: "test/readme.test.js#README exists and the lists it is checked against are not empty"
        status: pass
      - kind: unit
        ref: "test/readme.test.js#every project front matter key is documented in the Project front matter section"
        status: pass
      - kind: unit
        ref: "test/readme.test.js#every page front matter key is documented in the Page front matter section"
        status: pass
    human_judgment: false
  - id: D3
    description: "Section order is Quick reference, Day-to-day workflow, Drafts, Site settings, When the build fails; no machine-setup section"
    requirement: AUTH-05
    verification:
      - kind: unit
        ref: "test/readme.test.js#the ## headings appear in the documented order"
        status: pass
      - kind: unit
        ref: "test/readme.test.js#the README has no machine-setup section"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every md example builds with exit 0 as one fixture project; every yaml example uses only known front matter keys"
    requirement: AUTH-05
    verification:
      - kind: integration
        ref: "test/readme.test.js#every md example in the README builds as one project"
        status: pass
      - kind: unit
        ref: "test/readme.test.js#every yaml example in the README uses only known front matter keys"
        status: pass
    human_judgment: false
  - id: D5
    description: "README covers the workflow commands, each site setting and the real error and warning text for common failures"
    requirement: AUTH-05
    verification:
      - kind: unit
        ref: "test/readme.test.js#the README covers the workflow commands, site settings and common errors"
        status: pass
    human_judgment: false
  - id: D6
    description: "The README reads clearly and its examples work after only renaming the images (Task 2 human-check)"
    verification: []
    human_judgment: true
    rationale: "Whether the reference is clear and quick to use is the owner's judgement. The tests prove completeness and that every example builds, not readability. Open for the phase UAT: preview README.md in VS Code, paste the grid-2 and video examples into a project, run npm start"

duration: 6min
completed: 2026-10-30
status: complete
plan_head_before: 6766ce3e6e806d53964b9b1200164b9fe4908878
plan_head_after: 6a08c01d4c0706a18a41cc0d00eec7712ee25596
commits: 4
---

# Phase 4 Plan 04: README authoring reference Summary

**A root README puts block and front matter quick-reference tables first, then the daily workflow, drafts, site settings and a build-error guide quoting the real messages, with a test that reads the block and key lists from the code and builds every example.**

## Performance

- **Duration:** about 6 min
- **Completed:** 2026-10-30
- **Tasks:** 2
- **Files modified:** 2 (both created)

## Accomplishments

- `## Quick reference` holds `### Blocks` (table plus one buildable example per block, `full` keyword explained separately from the `::: full` layout block), `### Images, captions and PDFs`, `### Project front matter` and `### Page front matter`, each with a yaml example.
- `## Day-to-day workflow` (six steps including the pre-commit shrink hook, `npm run shrink` and `git push`), `## Drafts` (states that only `draft: true` withholds a page and robots.txt hides nothing, T-04-13), `## Site settings` (table plus custom-domain note) and `## When the build fails` (22 rows quoting real message fragments, plus a Warnings subsection).
- `test/readme.test.js` has 11 tests. Full suite: 348 pass, 0 fail.

## TDD Gate Compliance

- **Task 1 (tracer) RED (c52c99a):** all 6 new tests failed because README.md did not exist. **GREEN (ec1aff4):** 6 of 6 pass. Tracer gate (auto form): the automated verify (`node --test test/readme.test.js`) passed before expansion.
- **Task 2 RED (afbed75):** 2 of 11 failed (heading order and the settings/error-fragment coverage). The example-build and yaml tests already passed because Task 1's README examples were valid, so they act as regression guards. **GREEN (6a08c01):** 11 of 11 pass, `npm test` 348 pass.
- No refactor commits were needed.

## Task Commits

1. Task 1 (tracer): `c52c99a` test, `ec1aff4` feat
2. Task 2: `afbed75` test, `6a08c01` feat

## Files Created/Modified

- `README.md` - authoring reference
- `test/readme.test.js` - sync test and example-build test

## Decisions Made

See `key-decisions`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The readability check (Task 2 `<human-check>`) is open for the phase UAT and is not claimed as passed.

## Known Stubs

None.

## Threat Flags

None. T-04-13 (README implying robots.txt hides work) is mitigated by the Drafts section. T-04-14 (examples drifting from the grammar) is mitigated by the sync and example-build tests.

## Self-Check: PASSED

- README.md and test/readme.test.js exist.
- Commits c52c99a, ec1aff4, afbed75 and 6a08c01 are on main.
- `npm test`: 348 pass, 0 fail.
