---
phase: 04-hardening-and-launch-readiness
plan: 01
subsystem: build
tags: [eleventy, drafts, preprocessor, validation, node-test]

requires:
  - phase: 03-publishing
    provides: "Validation collections, featured list, media registry, card and base templates"
provides:
  - "draft: true front matter: absent from the live build, shown with a Draft label under npm start"
  - "lib/drafts.js: showDrafts, findDrafts, NAV_PAGES, navDraftWarning, hiddenNavSlugs"
  - "buildServe() fixture builder in test/helpers/site.js"
affects: [04-02, 04-03, 04-04, 04-05]

actuals:
  tokens: 6948
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "Single exclusion point: an Eleventy preprocessor returning false skips the template, so no render, collection, tag page or media registration"
    - "Fail-closed run-mode check on Eleventy's own ELEVENTY_RUN_MODE (serve/watch only)"

key-files:
  created: [lib/drafts.js, test/drafts.test.js]
  modified: [eleventy.config.js, lib/validate.js, src/_includes/base.njk, src/_includes/card.njk, test/helpers/site.js, test/content-errors.test.js, test/workflow.test.js]

key-decisions:
  - "Drafts are dropped by one addPreprocessor('drafts') keyed on strict draft === true and showDrafts(); nothing else filters drafts"
  - "A drafted CV/Teaching page is both warned about and hidden from the live header nav via the hiddenNav global"
  - "resolveFeatured return shape stays { errors, items }; draft handling is an optional third argument"

requirements-completed: [PUB-05]

coverage:
  - id: D1
    description: "A draft: true project or page produces no output in a live build, including its card, draft-only tag page and media only it references"
    requirement: PUB-05
    verification:
      - kind: integration
        ref: "test/drafts.test.js#live build leaves out a draft page, card, tag page and every file only it uses"
        status: pass
      - kind: integration
        ref: "test/drafts.test.js#control: the same fixture without the draft lines publishes everything the live build left out"
        status: pass
    human_judgment: false
  - id: D2
    description: "Drafts show under serve with a Draft label; stray ELEVENTY_RUN_MODE cannot leak drafts; draft must be a boolean"
    requirement: PUB-05
    verification:
      - kind: integration
        ref: "test/drafts.test.js#serve mode builds drafts and labels the page and its card"
        status: pass
      - kind: unit
        ref: "test/workflow.test.js#the production build cannot show drafts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Drafted featured project or nav page warns instead of breaking the build or leaving a dead link"
    requirement: PUB-05
    verification:
      - kind: integration
        ref: "test/drafts.test.js#a drafted CV page is dropped from the live nav and warned about"
        status: pass
    human_judgment: false
  - id: D4
    description: "Day-to-day npm start vs clean npm run build experience on the owner's machine"
    verification: []
    human_judgment: true
    rationale: "Fixture builds only approximate the owner's real workflow; the plan's human-check asks the owner to try it"

duration: 20min
completed: 2026-10-30
status: complete
plan_head_before: bf50b11962a052ae352e3a6c0efa3240b192dcdb
plan_head_after: 50de07dd54ab497fba42db22202297121acfdd3f
commits: 6
---

# Phase 4 Plan 01: Draft pages Summary

**`draft: true` hides a project or page (card, draft-only tag page, featured slot, nav link and only-its media) from `npm run build` while `npm start` shows it with a plain "Draft" label, using one fail-closed Eleventy preprocessor.**

## Performance

- **Duration:** about 20 min
- **Completed:** 2026-10-30
- **Tasks:** 3
- **Files modified:** 9 (2 created)

## Accomplishments

- `lib/drafts.js` with `showDrafts()` true only for `ELEVENTY_RUN_MODE` exactly `serve` or `watch`; the `drafts` preprocessor skips draft templates in every other case, so no HTML, collection entry, tag page, image variant, video, poster or PDF is produced for them. A control build without the draft lines proves the live assertions are not vacuous.
- Serve-mode builds (`buildServe()` test helper) show the page `<p class="draft-label"><strong>Draft</strong></p>` after the `<h1>` and `<strong class="draft-label">Draft</strong>` inside the card link. `draft` is now an allowed key and must be a YAML boolean, otherwise the build fails naming the file in both modes.
- A featured slug that is a draft is skipped with a `WARN src/_data/featured.js` line; a drafted CV/Teaching page prints the nav warning and is removed from the live header nav via the `hiddenNav` global. With nothing drafted the nav markup is unchanged.
- Test suite went from 278 to 296 passing tests; `npm test` is green.

## TDD Gate Compliance

- **Task 1 RED (99e627f):** `test/drafts.test.js` live-build and `showDrafts` tests against a stub `showDrafts()` that always returns false. The target test "live build leaves out a draft page..." failed on its `r.code === 0` assertion because `draft` was still rejected as an unknown key. `gsd_run check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`). Semantic assessment: the target ran and failed on the planned behavior, not on a load or syntax fault. (An earlier run with no `lib/drafts.js` at all was a module-load failure and was discarded as INVALID_RED.)
- **Task 1 GREEN (ddba3e6):** `showDrafts()` and the `drafts` preprocessor.
- **Task 2 RED (1638854):** serve-mode, label and boolean-strictness tests failed with `unknown front matter key "draft"`. **GREEN (76fc8e9).**
- **Task 3 RED (7cdeebd):** featured/findDrafts/nav tests failed on missing exports and behavior. **GREEN (50de07d).**
- No refactor commits were needed.

## Task Commits

1. Task 1 (tracer): `99e627f` test, `ddba3e6` feat
2. Task 2: `1638854` test, `76fc8e9` feat
3. Task 3: `7cdeebd` test, `50de07d` feat

The tracer gate ran in auto-verify form: the automated verify was re-run after the tracer commit and passed, so expansion continued.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The human-check in Task 3 (`npm start` vs clean `npm run build` on the owner's machine) is open and left for the phase UAT, as the plan states.

## Known Stubs

None.

## Threat Flags

None. No new network endpoints, auth paths or trust-boundary file access beyond the plan's threat model (T-04-01 to T-04-04 mitigated by tests).

## Self-Check: PASSED

- Created files exist: `lib/drafts.js`, `test/drafts.test.js`.
- Commits 99e627f, ddba3e6, 1638854, 76fc8e9, 7cdeebd, 50de07d are ancestors of HEAD.
- `npm test`: 296 pass, 0 fail.
