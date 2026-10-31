---
gsd_state_version: "1.0"
milestone: v1.0
status: Awaiting next milestone
stopped_at: Completed 04-05-PLAN.md
last_updated: "2026-10-31T03:41:00.725Z"
last_activity: 2026-10-30
last_activity_desc: Milestone v1.0 completed and archived
state_head: a345a0649db774ef5065c57be8f8e3cd46472aa7
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 21
  completed_plans: 21
milestone_name: milestone
current_phase: 04
current_phase_name: Hardening and Launch Readiness
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-30)

**Core value:** Writing a new project page should be as fast as typing markdown, then push, and it's live, with no CMS, template fights or upload caps.
**Current focus:** Planning next milestone (v1.0 shipped 2026-10-30)

## Current Position

Phase: Milestone v1.0 complete
Plan: —
Status: Awaiting next milestone
Last activity: 2026-10-30 — Milestone v1.0 completed and archived

## Performance Metrics

**Velocity:**

- Total plans completed: 16
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 5 | - | - |
| 02 | 6 | - | - |
| 03 | 5 | - | - |
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 02 P01 | 25 min | 3 tasks | 9 files |
| Phase 02 P02 | 4 min | 2 tasks | 4 files |
| Phase 02 P03 | 15min | 2 tasks | 7 files |
| Phase 02 P04 | 15min | 2 tasks | 4 files |
| Phase 02 P05 | 3 min | 3 tasks | 11 files |
| Phase 02 P06 | 11 min | 2 tasks | 3 files |
| Phase 03 P01 | 15 min | 3 tasks | 11 files |
| Phase 03 P02 | 20min | 3 tasks | 12 files |
| Phase 03 P03 | 25 min | 3 tasks | 15 files |
| Phase 03 P04 | 15min | 2 tasks | 7 files |
| Phase 03 P05 | 5 min | 3 tasks | 10 files |
| Phase 04 P01 | 20min | 3 tasks | 9 files |
| Phase 04 P02 | 4 min | 3 tasks | 9 files |
| Phase 04 P03 | 5 min | 2 tasks | 8 files |
| Phase 04 P04 | 6 min | 2 tasks | 2 files |
| Phase 04 P05 | 9 min | 2 tasks | 4 files |

## Accumulated Context

| Phase 01 P01 | 15min | 4 tasks | 18 files |

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

- Roadmap: 4 coarse phases; Phase 1 front-loads asset resolver, base path, image pipeline and CI cache.
- [Phase 01]: Phase 01-01: js-yaml pinned ^4; packages approved by owner
- [Phase ?]: 01-05: repo portfolio-test public, PATH_PREFIX /portfolio-test/, image cache key img-v1-hash(assets)
- [Phase 02]: Single catch-all markdown-it-container named block so unknown fence names reach our own rule and fail with the valid-block list
- [Phase 02]: Images outside blocks: titled image-only paragraph becomes one figure per image, untitled keeps p.lone-image (class instead of :has())
- [Phase 02]: Captions are plain escaped text from the markdown title; title attribute removed from img
- [Phase 02]: Per-image source line (meta.lineIndex) so block and missing-image errors point at the right line of a multi-line paste
- [Phase 02]: visually-hidden uses clip-path only (no overflow clipping) so the stylesheet can forbid overflow:hidden globally
- [Phase 02]: Heading above a block keeps a 1rem gap below; accent contrast enforced by test/contrast.test.js from the CSS tokens
- [Phase 02]: Raw img without alt: eleventy-img defaultAttributes alt empty so the lint warns instead of aborting the build
- [Phase 02]: Embed iframe src is rebuilt from a validated ID (YouTube nocookie, Vimeo dnt=1) with exact-host allow-lists; itch hosts itch.io, *.itch.io, *.itch.zone
- [Phase 02]: Video posters processed to a single 1600px hashed WebP rather than copied; videos capped at 50 MB in renderer, CI guard and hook via lib/limits.js
- [Phase 02]: 02-06: omit #t=0.001 from poster video src (keep preload=metadata) so the poster shows; no-poster blocks keep the iOS first-frame fragment
- [Phase 02]: 02-06: CI originals check exempts only VIDEO_EXTS files directly in _site/video/
- [Phase 03]: Plan 03-01: card covers are the only cropped images (4:3, CSS only); first cover eager, rest lazy — UI-SPEC owner decision; enforced by narrowed design test
- [Phase 03]: Plan 03-01: projects sort ties break on input path; work and pdf reserved slugs, cv/teaching not — Deterministic builds; cv/teaching clashes already fail with 'already used by'
- [Phase 03]: PDF sizes use 1024-based units (whole KB, one-decimal MB); suffix is a text token inside the link
- [Phase 03]: PDF cap is 25 MB via one constant PDF_MAX_MB read by renderer, CI guard and hook
- [Phase 03]: Only PDFs a page links are published to _site/pdf/ (link-driven publishing)
- [Phase 03]: tags.js holds { slug, label } objects; tag pages paginate plain defs, setDataDeepMerge(false), templates read projectTags never tags
- [Phase 03]: A non-list tags.js export is reported from the config function because Eleventy aborts on global tags without naming the file
- [Phase 03]: Featured slugs are read from the data cascade in the featured collection and validated by resolveFeatured; missing list means no featured projects
- [Phase 03]: Zoom decision split: core rule tags images that may zoom, renderer wraps at render time because decorative status is only known then; remote and data: images never wrapped
- [Phase 03]: Zoom hrefs finished by a PostHTML plugin at priority -1.5 (after eleventy-img, before HtmlBasePlugin) so hashed names and path prefix are both right
- [Phase 03]: Lightbox script URL is plain /lightbox.js (HtmlBasePlugin prefixes it); loaded with defer only on pages containing a zoom link
- [Phase 03]: Design test no-script guard narrowed to deferred first-party lightbox.js with no inline body, only on pages with zoom links
- [Phase 04]: 04-01: drafts dropped by a single fail-closed Eleventy preprocessor keyed on ELEVENTY_RUN_MODE serve/watch; drafted CV/Teaching pages warn and are hidden from the live nav
- [Phase 04]: og:image is always a processed eleventy-img derivative (1200px JPEG, PNG for alpha); originals in assets/ are never linked
- [Phase 04]: site.url holds the https origin only (validated); the subpath stays in PATH_PREFIX; absolute URLs come only from htmlBaseUrl(site.url)
- [Phase 04]: Pager uses built-in getPreviousCollectionItem/getNextCollectionItem over collections.projects; no draft code needed since live collection is draft-free
- [Phase 04]: Sitemap collection re-checks data.draft so serve mode never lists drafts; tag URLs come from non-draft projects only; no lastmod
- [Phase 04]: Separate .pager CSS rules rather than grouping with .filters, to keep the exact-rule .filters test valid
- [Phase 04]: 04-04: README fence convention: md fences are built by the test, yaml fences key-checked, broken examples in text fences; raw HTML example in html fence
- [Phase 04]: check:reflow (headless Chrome) stays local; test/reflow.test.js guards reflow CSS and unblocked zoom in CI. Reflow never via overflow clipping or zoom blocking.

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1] Site URL undecided; base path must remain one config value (currently PATH_PREFIX /portfolio-test/).

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| debug_sessions | video-poster-not-shown | diagnosed (fix shipped in 02-06; session never closed) | 2026-10-30 | v1.0 |
| verification_gaps | 04/04-VERIFICATION.md | human_needed (all 5 items passed in 04-UAT.md) | 2026-10-30 | v1.0 |
| verification_override | 02/02-VERIFICATION.md | stale (Phase 4 later edited covered files; 356/356 tests pass at close) | 2026-10-30 | v1.0 |
| verification_override | 03/03-VERIFICATION.md | stale (Phase 4 later edited covered files; 356/356 tests pass at close) | 2026-10-30 | v1.0 |

## Session Continuity

Last session: 2026-10-30T22:32:09.024Z
Stopped at: Completed 04-05-PLAN.md
Resume file: None

## Operator Next Steps

- Start the next milestone with /gsd-new-milestone
