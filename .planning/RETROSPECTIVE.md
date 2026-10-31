# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-10-30
**Phases:** 4 | **Plans:** 21 | **Sessions:** not tracked

### What Was Built
- Push-to-live pipeline: Eleventy 3, eleventy-img, a repo-root `assets/` resolver, a one-value base path, and GitHub Actions to Pages with an image cache (about 2 minutes per push).
- A commit hook that shrinks and converts pasted images and rewrites the `.md` links, with matching CI caps for images, videos and PDFs.
- `:::` layout blocks (grid-2/3/4, full, video, itch) with captions, privacy-friendly embeds and self-hosted video, plus a brutalist, accessible design system.
- Browsing: the `/work/` feed, tag pages, a curated homepage, CV and Teaching pages, and a native `<dialog>` lightbox (the only JS on the site).
- Launch extras: drafts, a next/previous pager, Open Graph and sitemap, an authoring README with example-building tests, and the 320px/zoom reflow check.

### What Worked
- Phase 1 tackled the riskiest pieces first (asset path resolution, base path, CI image cache), so later phases only added features on top of a deployed site.
- Build-time validation that names the file and line for every authoring mistake (bad block, missing image, unknown featured slug) caught typos before they became broken pages.
- Sharing one limit constant across the renderer, the CI guard and the commit hook (`lib/limits.js`) kept the three in sync.
- UAT found one real bug (video poster hidden by a `#t=` fragment, G-02-4). The debug session pinned it to its root cause, and plan 02-06 closed it with regression tests.

### What Was Inefficient
- Paperwork drifted: phases 2 and 3 verification went "stale" after Phase 4 touched shared files, Phase 4 stayed `human_needed` after UAT passed, and the debug session was never closed. All four had to be acknowledged at close.
- Some SUMMARY files have no `requirements` frontmatter (01-02, 01-03), so PUB-04 had to be checked by hand during the audit.
- Code-review warnings piled up as "open" in phases 2–4 (21 at close) instead of being fixed or explicitly deferred at the end of each phase.
- One deploy hung at the Pages upload step and was cancelled. It was a GitHub-side stall, but nothing alerted on it.

### Patterns Established
- One fail-closed Eleventy preprocessor for drafts. Absolute URLs come only from `site.url` + PATH_PREFIX.
- PostHTML transforms ordered by priority around eleventy-img (-1) and HtmlBasePlugin (-2).
- README examples are built by a test, so the documentation can't drift from the code.
- Only files that a built page links (PDFs, videos, og images) are published. Originals never are.

### Key Lessons
1. Close the review findings and debug sessions at the end of each phase, so they don't pile up for the milestone close.
2. Re-run the verifier, or record why not, whenever a later phase edits files an earlier phase verified.
3. Make every SUMMARY list the requirements it completes, so the audit's three-way check never falls back to manual review.

### Cost Observations
- Model mix: not tracked (balanced profile; the integration checker ran on Sonnet)
- Sessions: not tracked
- Notable: 21 plans in 3 days; most plans took 3–25 minutes

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | — | 4 | Baseline: coarse phases, end-of-phase human verification, code review on every phase |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 356 | not measured | — |

### Top Lessons (Verified Across Milestones)

1. (Needs a second milestone to cross-validate.)
