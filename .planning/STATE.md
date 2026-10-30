---
gsd_state_version: "1.0"
milestone: v1.0
current_phase: 3
current_phase_name: Browsing, Lightbox and Standalone Pages
status: planning
stopped_at: Phase 02 complete, ready to plan Phase 3
last_updated: "2026-10-30T13:56:39.343Z"
last_activity: 2026-10-30
last_activity_desc: Phase 02 complete, transitioned to Phase 3
state_head: 5cf29b8271c355c23dd552dc83e9e8abd35458cc
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 11
  completed_plans: 11
  percent: 50
milestone_name: milestone
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-30)

**Core value:** Writing a new project page should be as fast as typing markdown, then push, and it's live, with no CMS, template fights or upload caps.
**Current focus:** Phase 3 — Browsing, Lightbox and Standalone Pages

## Current Position

Phase: 3 — Browsing, Lightbox and Standalone Pages
Plan: Not started
Status: Ready to plan
Last activity: 2026-10-30 — Phase 02 complete, transitioned to Phase 3

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1] Site URL undecided; base path must remain one config value (currently PATH_PREFIX /portfolio-test/).

## Session Continuity

Last session: 2026-10-30T15:10:00Z
Stopped at: Phase 02 complete, ready to plan Phase 3
Resume file: None
