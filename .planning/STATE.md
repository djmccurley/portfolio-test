---
gsd_state_version: "1.0"
milestone: v1.0
current_phase: 03
current_phase_name: Browsing, Lightbox and Standalone Pages
status: executing
stopped_at: Completed 03-03-PLAN.md
last_updated: "2026-10-30T16:57:54.632Z"
last_activity: 2026-10-30
last_activity_desc: Phase 03 execution started
state_head: 09b56193d11be281ad74367b545e6881ed702b6f
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 16
  completed_plans: 14
milestone_name: milestone
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-30)

**Core value:** Writing a new project page should be as fast as typing markdown, then push, and it's live, with no CMS, template fights or upload caps.
**Current focus:** Phase 03 — Browsing, Lightbox and Standalone Pages

## Current Position

Phase: 03 (Browsing, Lightbox and Standalone Pages) — EXECUTING
Plan: 4 of 5
Status: Ready to execute
Last activity: 2026-10-30 — Phase 03 execution started

Progress: [█████░░░░░] 50%

## Performance Metrics

**Velocity:**

- Total plans completed: 11
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 5 | - | - |
| 02 | 6 | - | - |
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

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1] Site URL undecided; base path must remain one config value (currently PATH_PREFIX /portfolio-test/).

## Session Continuity

Last session: 2026-10-30T16:57:54.520Z
Stopped at: Completed 03-03-PLAN.md
Resume file: None
