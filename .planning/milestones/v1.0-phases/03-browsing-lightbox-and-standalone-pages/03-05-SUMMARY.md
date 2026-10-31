---
phase: 03-browsing-lightbox-and-standalone-pages
plan: 05
subsystem: ui
tags: [eleventy, posthtml, lightbox, dialog, accessibility, progressive-enhancement]

requires:
  - phase: 03-01
    provides: lightbox.js registered in the fixture-site helper, visually-hidden utility, card partial
  - phase: 03-03
    provides: prose-cap selector excluding .cards and .filters, base.njk meta list
provides:
  - "zoomHref(a) and zoomPlugin() in lib/zoom.js: PostHTML transform at priority -1.5 that fills href, data-width, data-height from the published picture, or unwraps"
  - "a.zoom wrapper (with hidden ' (full size)' suffix) emitted by the image renderer for grid images and lone images"
  - "content/lightbox.js: the site's only script, a native showModal() viewer, published at /lightbox.js"
  - "base.njk gate: deferred lightbox.js only on pages whose content contains a zoom link"
  - "dialog.lightbox CSS: opaque ink stage, uncropped fit-to-viewport image, white in-dialog focus ring"
affects: [verification, 03-phase-human-check]

actuals:
  tokens: 13000
  tasks: 3
  commits: 6

tech-stack:
  added: []
  patterns:
    - "Links to hashed pipeline output are finished by a PostHTML plugin between eleventy-img (-1) and HtmlBasePlugin (-2), never predicted at markdown time"
    - "Browser scripts are unit-tested by running them under node:vm against a small fake DOM, no jsdom"
    - "Progressive enhancement: the plain link is the baseline; the script only intercepts plain primary clicks"

key-files:
  created:
    - lib/zoom.js
    - content/lightbox.js
    - test/zoom.test.js
    - test/lightbox.test.js
  modified:
    - lib/blocks.js
    - eleventy.config.js
    - src/_includes/base.njk
    - content/style.css
    - test/design.test.js
    - test/contrast.test.js

key-decisions:
  - "Zoom decision split in two: the core rule tags images that may zoom (grid, lone, titled lone, not ::: full), the renderer wraps at render time because decorative status is only known then"
  - "Remote and data: images are never wrapped, since the pipeline publishes no variant for them"
  - "Script URL is the plain root-absolute /lightbox.js; HtmlBasePlugin adds the path prefix"
  - "The design test 'no script' guard was narrowed, not deleted: every script must be a deferred /lightbox.js with no inline body, and only on pages with a zoom link"

patterns-established:
  - "a.zoom opening tag is the literal gate string that base.njk tests for"

requirements-completed: [IMG-05]

duration: 5min
completed: 2026-10-30
status: complete
plan_head_before: 11a287492559e0220e08718a46d8e03cb8561c74
plan_head_after: 4f44c06c5b66c44584b259a4109e71b07707b5b3
commits: 6

coverage:
  - deliverable: "Zoom links to the largest published variant, working without JS, prefix-correct"
    verification:
      - { kind: test, ref: "test/zoom.test.js", status: pass }
    human_judgment: false
  - deliverable: "Native dialog viewer behaviour (open, close paths, focus return, error fallback, modifier clicks)"
    verification:
      - { kind: test, ref: "test/lightbox.test.js", status: pass }
    human_judgment: false
  - deliverable: "Script gating: deferred lightbox.js only on pages with a zoom link"
    verification:
      - { kind: test, ref: "test/lightbox.test.js and test/design.test.js", status: pass }
    human_judgment: false
  - deliverable: "Dialog visual: opaque stage, uncropped image, white focus ring, no motion"
    verification:
      - { kind: test, ref: "test/design.test.js and test/contrast.test.js", status: pass }
    human_judgment: false
  - deliverable: "Real-browser focus behaviour, Safari, no-JS fallback and perceived layout stability on a throttled connection"
    human_judgment: true
    rationale: "Needs a real browser; no Playwright in this project. Covered by the end-of-phase human check in the plan's Task 3."
---

# Phase 3 Plan 05: Full-size image viewer Summary

**Grid and lone content images link to their largest published variant through a PostHTML transform at priority -1.5, enhanced by one 58-line first-party script into a native `<dialog>` viewer on an opaque ink stage (Escape, Close or surface click closes, focus returns to the image)**

## Performance

- **Duration:** about 5 min
- **Completed:** 2026-10-30
- **Tasks:** 3 (one tracer, two auto, all TDD)
- **Files modified:** 10 (4 new, 6 changed)

## Accomplishments

- The image renderer wraps grid, lone and titled-lone images in `<a class="zoom">` with a hidden ` (full size)` suffix. `::: full`, decorative, mixed-with-text, linked, raw HTML, remote and `data:` images stay plain. The caption stays outside the link.
- `lib/zoom.js` runs after eleventy-img and before HtmlBasePlugin, so it reads the final hashed names and the path prefix lands afterwards. A 3000px original links its `-2400.webp`, a 2000px one its `-1600.webp`, a 308px one its `-308.webp`; GIFs and SVGs link their own published file. An anchor left without an image is unwrapped and its suffix dropped.
- `content/lightbox.js` (58 lines, classic IIFE, no innerHTML, timers or animation frames) creates one dialog on first use, fills it with the large image, same alt and the figure caption, focuses a `Close` button, closes on Escape, Close and surface clicks, returns focus to the opening link, clears the image source on close and falls back to plain navigation (same origin only) if the large file fails to load. Modified, non-primary, handled and targeted clicks are not intercepted; with no `HTMLDialogElement` the script does nothing.
- `base.njk` loads `/lightbox.js` with `defer` only when the page content contains `<a class="zoom"`. Verified in a built Tidepool page; the homepage, `/work/` and pages without zoomable images have no script.
- Dialog CSS: fixed full-viewport `--ink` stage, `display: grid` only when open, image `max-height: calc(100dvh - 10rem)` with no object-fit or aspect-ratio, white `--paper` focus ring (21:1), no transition or animation, no `overflow: hidden`.
- Suite: 243 to 278 tests, all passing.

## Task Commits

1. **Task 1 (tracer): end-to-end zoom link** - RED `1562576`, GREEN `615a87f`
2. **Task 2: native dialog viewer and script gate** - RED `b225cfd`, GREEN `517f19b`
3. **Task 3: dialog visual** - RED `1f3cef7`, GREEN `4f44c06`

Tracer gate: `<verify>` was automated-only, `human_verify_mode` is end-of-phase, so it was re-run (48 tests, then the full suite) and passed before expansion.

## Serve-mode smoke check (RESEARCH A3)

`PATH_PREFIX=/ npx @11ty/eleventy --serve --port 8089`, `curl /tidepool-game/`: zoom links are wrapped and carry `data-width`/`data-height`, and the page includes `<script src="/lightbox.js" defer="">`. Under serve the hrefs point at Eleventy's on-demand image endpoint (`/.11ty/image/?src=assets%2F...&width=1600&format=webp&via=transform`) instead of `/img/<hash>-1600.webp`. This is a dev-only difference: the endpoint is same-origin and serves the processed variant, never the original file path as a static asset. One dev-only gap: the animated GIF's zoom link asks for `format=webp` under serve (still an animated webp for the dev server); production builds link the published `.gif` (verified by tests and `npm run build`: `/portfolio-test/img/XA9PMoxAvf-256.gif`). Server stopped afterwards.

## Deviations from Plan

None - plan executed exactly as written. Two small notes, neither a deviation from a rule:

- The stub-DOM test also exercises `hasAttribute` and `getAttribute` on the fake elements; the script itself uses `hasAttribute("target")` for the target-link check, one method beyond the plan's listed DOM surface (it is a standard Element method and the fake DOM implements it).
- `content/lightbox.js` already existed in the working tree when its RED commit was made; it was moved aside for the RED run so the failing state was real, then restored for GREEN.

**Total deviations:** 0.

## Pending human check

Task 3's `<human-check>` (keyboard walk-through in Chrome and Safari, JS-off click, throttled "Slow 4G" open) was not run here; per `human_verify_mode: end-of-phase` it belongs to the phase's verification. Backstop truths (no layout shift from the thumbnail, no stage jump while the large file loads) are covered by that same check.

## Known Stubs

None.

## Threat Flags

None. The only new surface is the first-party `/lightbox.js`, already covered by T-03-14 to T-03-18 (DOM built with `textContent`, same-origin-only fallback navigation, targets limited to `_site/img/`, one deferred script gated by a design test).

## Self-Check: PASSED

- Created files present: lib/zoom.js, content/lightbox.js, test/zoom.test.js, test/lightbox.test.js
- Commits 1562576, 615a87f, b225cfd, 517f19b, 1f3cef7, 4f44c06 are ancestors of HEAD
- Acceptance criteria for all three tasks re-run and passing; `npm test` 278/278; `npm run build` shows Tidepool zoom hrefs under `/portfolio-test/img/` and no script on `/`, `/work/`
