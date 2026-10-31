# Milestones

## v1.0 MVP (Shipped: 2026-10-30)

**Phases completed:** 4 phases, 21 plans, 39 tasks

**Delivered:** A markdown-to-GitHub-Pages portfolio. Write a project `.md` in VS Code, paste images, type `:::` layout blocks, push, and it is live in about 2 minutes. Live at https://djmccurley.github.io/portfolio-test/.

**Stats:** 206 commits, 2026-10-28 → 2026-10-30 (3 days); 83 files, about 11,100 lines added outside `.planning/`; 356 tests passing.

**Audit:** tech_debt. 36/36 requirements, 4/4 phases, 17/19 integration links, 8/8 E2E flows ([audit](milestones/v1.0-MILESTONE-AUDIT.md)). 21 open review warnings and notes were carried forward as tech debt.

**Closeout:** override_closeout. Known verification overrides: 4 newly acknowledged, 0 carried forward from a prior close (see STATE.md Deferred Items): 1 debug session (fix shipped in 02-06), 1 human_needed verification (passed in 04-UAT), 2 stale verifications (phases 2 and 3, re-tested at close).

**Archive:** [roadmap](milestones/v1.0-ROADMAP.md) · [requirements](milestones/v1.0-REQUIREMENTS.md) · [phases](milestones/v1.0-phases/)

**Key accomplishments:**
- `::: grid-2/3/4` and `::: full` fences turn pasted `![alt](path "Caption")` lines into figure/figcaption markup with per-block responsive `sizes`, and every malformed block fails the build naming file and line (markdown-it-container catch-all + one core rule).
- Token-driven brutalist stylesheet (Chivo, black on white plus one accent, one wide left-aligned named-line column) with a skip link, 3px accent focus ring, AA contrast enforced from the CSS tokens, no motion, and CSS for grids, full bleed, figures and embed frames.
- The build now warns, once per image with file and path, about empty, paste-default ("alt text") and filename-like alt text in markdown and raw HTML (never failing, never rewriting), and the tidepool page is a clean live demo of grid, caption and full-bleed blocks.
- `::: video` and `::: itch` blocks turn a pasted link into a titled, lazy, privacy-friendly iframe (youtube-nocookie, Vimeo dnt=1, allow-listed itch hosts) with src rebuilt from a validated ID and every mistake failing the build with file and line.
- Self-hosted `::: video` blocks play from `_site/video/` with native controls, no autoplay, optional processed-WebP poster and a 50 MB cap enforced at build, CI and commit time.
- `::: video` blocks with `poster=` now emit a plain `src` so the poster shows before play, no-poster blocks keep the `#t=0.001` iOS first-frame trick, both forms are pinned by tests, and CI's originals check no longer rejects published videos.
- `/work/` card feed (4:3 cropped covers, newest first, deterministic ties) rendered through a single `card.njk`, plus a wrapping owner-name and Work/CV/Teaching header with `aria-current` and the card/rhythm CSS
- Plain markdown PDF links that render as `Label (PDF, 340 KB)`, publish only the linked file to `/pdf/`, fail the build on a missing or over-25 MB file, plus starter `/cv/` and `/teaching/` pages and matching CI and hook caps
- Static `/tags/{slug}/` pages from a single `{ slug, label }` list in `src/_data/tags.js`, a shared All/tag filter row on `/work/` and tag pages, and a Tags row on every project page, with a validator for malformed tag lists and fixtures that no longer depend on the owner's tags
- Homepage with the owner's name, a markdown intro, a "Selected work" grid driven by one ordered slug list in `src/_data/featured.js`, and an "All work" link; unknown, repeated, non-string and non-list entries fail the build with fix-it messages
- Grid and lone content images link to their largest published variant through a PostHTML transform at priority -1.5, enhanced by one 58-line first-party script into a native `<dialog>` viewer on an opaque ink stage (Escape, Close or surface click closes, focus returns to the image)
- `draft: true` hides a project or page (card, draft-only tag page, featured slot, nav link and only-its media) from `npm run build` while `npm start` shows it with a plain "Draft" label, using one fail-closed Eleventy preprocessor.
- Every page now emits description, canonical, Open Graph and Twitter-card tags with absolute URLs built from `site.url` + PATH_PREFIX, using a processed 1200px eleventy-img JPEG of the project cover (or a swappable default share image), with `site.js` settings validated at build time.
- Project pages now end with a Previous/Next pager over the existing `projects` collection (built-in neighbour filters, no wrap, drafts skipped live), and the site publishes a draft-free `/sitemap.xml` with absolute `site.url` + prefix URLs plus an allow-all `/robots.txt` pointing to it.
- A root README puts block and front matter quick-reference tables first, then the daily workflow, drafts, site settings and a build-error guide quoting the real messages, with a test that reads the block and key lists from the code and builds every example.
- A local headless-Chrome check (`npm run check:reflow`) proves every built page plus a worst-case stress page fits 320px and 640px with no horizontal scroll under the real `/portfolio-test/` prefix, CSS fixes for blockquote, pre, tables, the meta list and the pager make it pass, and `test/reflow.test.js` keeps those fixes (and unblocked zoom) in CI.

---
