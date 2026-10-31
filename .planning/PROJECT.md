# Portfolio Site

## What This Is

A personal portfolio website for a multidisciplinary practice: graphic design, interactive/UX design, art, and videogame design/development. Projects and pages are written as markdown files in VS Code and pushed to GitHub Pages (or similar static hosting), where a static site builder turns them into plain, fast, accessible HTML. It replaces template-driven builders (Squarespace, Cargo) and a cap-limited Neocities blog with something the owner fully controls.

## Core Value

Writing a new project page should be as fast as typing markdown: headers, paragraphs, pasted images and short layout blocks (grids, full-width), then push, and it's live, with no CMS, template fights or upload caps.

## Current State

**v1.0 shipped 2026-10-30.** Live at https://djmccurley.github.io/portfolio-test/ (subpath `/portfolio-test/`; one config value moves it to a custom domain or root).

- Eleventy 3 + eleventy-img + markdown-it-container on Node 22; deploys through GitHub Actions to Pages with an image cache, in about 2 minutes per push.
- About 8,000 lines across `lib/`, `scripts/`, `content/`, `src/` and `test/`, with 356 passing tests.
- Authoring: one `.md` per project, VS Code paste into `assets/`, a commit hook that shrinks images, `:::` blocks (grid-2/3/4, full, video, itch), a draft flag and a README reference.
- Content is still placeholder: one real project (Tidepool), and the CV and Teaching pages have starter copy.

## Next Milestone Goals

- Migrate real projects from Squarespace by hand, and replace the placeholder CV and Teaching copy.
- Choose the final site URL (custom domain or `username.github.io`) and switch `PATH_PREFIX`.
- Clear the open review warnings in `.planning/milestones/v1.0-MILESTONE-AUDIT.md`, starting with the lightbox and dev-server ones.
- Candidates deferred from v1: a side-by-side block, blog/notes (Neocities replacement), RSS.

## Requirements

### Validated

- ✓ Author projects and pages as `.md` files; push to git → site builds and deploys to static hosting (GitHub Pages or similar) — v1.0 (Phase 1)
- ✓ Images pasted in VS Code resolve correctly from the single shared `assets/` folder (plugin writes prefixed filenames there) — v1.0 (Phase 1)
- ✓ Images auto-resized at build time (responsive sizes, modern formats, width/height to prevent layout shift); full-res originals stay as source — v1.0 (Phase 1)
- ✓ Inline, modular layout blocks inside a page body (e.g. multi-column image grid, full-width image, text) typed with fast markdown-like shorthand, not raw HTML (HTML allowed as fallback) — v1.0 (Phase 2)
- ✓ Several layout options available per block; blocks can be mixed freely within one page — v1.0 (Phase 2)
- ✓ Video support in project pages (self-hosted and/or YouTube/Vimeo embeds) — v1.0 (Phase 2)
- ✓ Playable games embedded via itch.io embeds — v1.0 (Phase 2)
- ✓ Brutalist, accessible design: semantic HTML, native browser elements, minimal CSS, no smooth scroll / fades / animation flourish — v1.0 (Phase 2)
- ✓ Responsive at all widths through plain HTML/CSS (no layout JS) — v1.0 (Phase 2)
- ✓ Image lightbox for viewing full-size images, using native elements (e.g. `<dialog>` or plain link to file), no heavy JS — v1.0 (Phase 3)
- ✓ Single project feed with tags (graphic, UX, art, games, etc.); browse by tag — v1.0 (Phase 3)
- ✓ Homepage with hand-picked, hand-ordered featured projects — v1.0 (Phase 3)
- ✓ Standalone pages (About / CV) — v1.0 (Phase 3)
- ✓ Student work: a simple standalone page with links and PDF downloads, kept out of the main project feed — v1.0 (Phase 3)
- ✓ Next/previous project navigation — v1.0 (Phase 4)
- ✓ Link previews (Open Graph) and sitemap.xml — v1.0 (Phase 4)
- ✓ `draft: true` keeps a page off the live site — v1.0 (Phase 4)
- ✓ Short authoring README covering every block and front matter field — v1.0 (Phase 4)
- ✓ Usable at 320px wide and 200%/400% zoom with no horizontal scroll — v1.0 (Phase 4, confirmed on the deployed site)

### Active

- [ ] Real content migrated (projects, CV, Teaching copy)
- [ ] Final site URL chosen and `PATH_PREFIX` switched
- [ ] Side-by-side text and image block (deferred from v1)

### Out of Scope

- CMS / admin UI — authoring is markdown in VS Code; a CMS is the bloat being escaped
- Squarespace import / migration tooling — owner will rebuild projects by hand
- Self-hosted game builds — games live on itch.io and are embedded; avoids large WebGL builds in the repo
- Blog / dated notes — not v1; may revisit (could replace Neocities blog later)
- RSS feed — not v1
- Dark mode — not v1
- Full student-work index or tag system — v1 is a simple page; a richer index (or excludable tag) may come later
- Smooth scrolling, fade-ins, scroll-jacking, animation libraries — conflicts with brutalist/native aesthetic and accessibility
- Client-side JS frameworks — site should be plain HTML/CSS with JS only where a native element can't do the job

## Context

- Owner is a graphic, interactive/UX designer, artist and game designer/developer. The site is for their own use.
- Has previously used Eleventy and Jekyll; comfortable with static site generators, markdown and git.
- Currently on Squarespace (portfolio) and Neocities (blog). Main frustrations: template/CMS bloat and storage/upload caps.
- Work is image-heavy: lots of images per project, gallery grids and full-bleed images are central.
- Authoring environment: VS Code with a paste-image plugin that saves pasted images into **one shared `assets/` folder** across all projects, adding a prefix to each filename. The build must work with this convention rather than per-project image folders.
- Teaches (student work page with PDF downloads).
- v1 goal is a working system (proof of concept): write a page in VS Code, push, live with layouts working. Content migration happens by hand afterward.

## Constraints

- **Hosting**: GitHub Pages or similar free static host. GitHub Pages limits: ~1 GB published site, 100 MB per file, ~100 GB/month soft bandwidth. Image pipeline and repo strategy must keep the site well under these.
- **Tech stack**: Eleventy 3.x on Node 22 (chosen in v1.0). Must output plain HTML/CSS with zero or near-zero client JS; the lightbox script is the only JS.
- **Authoring**: Layout syntax must be quick to type in plain markdown in VS Code; must not require a preview tool or GUI.
- **Accessibility**: Semantic HTML, alt text on images, keyboard-accessible lightbox/embeds, respects reduced-motion, good contrast.
- **Assets**: Single shared `assets/` folder with prefixed filenames (set by the VS Code plugin).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Markdown + static site generator, no CMS | Avoid bloat; owner already fluent in SSGs | ✓ Good (v1.0) |
| Resize images at build time | Avoid hosting caps and slow pages while keeping full-res sources | ✓ Good (v1.0); CI image cache keeps builds about 1 min |
| Inline layout blocks in markdown shorthand | Fast authoring; mix grids and full-width freely | ✓ Good (v1.0) |
| itch.io embeds for games | Keeps large builds out of repo/hosting limits | ✓ Good (v1.0) |
| One tagged feed + curated homepage | Multidisciplinary work in one place; owner controls featured order | ✓ Good (v1.0) |
| No Squarespace importer | Owner will rebuild by hand | — Pending (migration is next) |
| v1 = working system (POC), not content migration | Prove authoring flow first | ✓ Good (v1.0) |
| Eleventy 3 + eleventy-img + markdown-it-container (Node 22) | Research: best fit for `:::` block shorthand + plain-markdown image transform; owner knows it | ✓ Good (v1.0) |
| Site URL undecided; base path is one config value | Owner hasn't chosen domain vs github.io vs subpath | ✓ Base path works (v1.0); URL choice still pending |
| Paste full-size; commit step shrinks >~3000px, converts PNG/JPEG→WebP, rewrites .md links | Owner doesn't want to resize by hand; keeps repo small without LFS | ✓ Good (v1.0); ⚠️ Revisit `rewriteLinks` edge cases (03 WR-03) |
| Extras in v1: next/prev, OG + sitemap, draft flag | Owner selected; side-by-side block deferred to v2 | ✓ Shipped (v1.0) |
| One catch-all `:::` container; unknown block names fail the build with the valid list | Typos surface at build time, not as broken pages | ✓ Phase 2 |
| Embeds rebuilt from validated IDs with exact-host allow-lists (YouTube nocookie, Vimeo dnt=1, itch.io) | Privacy and no arbitrary iframes from markdown | ✓ Phase 2 |
| Self-hosted video: 50 MB cap, poster processed to one hashed WebP, `#t=0.001` only when no poster | Stays under Pages limits; poster shows, iOS still gets a first frame | ✓ Phase 2 |
| Tag list lives in `src/_data/tags.js` as `{slug,label}`; only used tags get pages; deep data merge off | One place to rename labels; no empty tag pages; projects never inherit every tag | ✓ Phase 3 |
| Featured projects are an ordered slug list in `src/_data/featured.js`; unknown/duplicate slugs fail the build | Owner controls order; typos never silently drop work | ✓ Phase 3 |
| PDFs: linked from plain markdown, only linked files published to `/pdf/`, 25 MB cap in build, CI and hook | No drafts leak; stays under Pages limits | ✓ Phase 3 |
| Lightbox = plain link to largest variant, enhanced by one ~60-line first-party `<dialog>` script loaded only on pages with zoom links | Works without JS; the only JS on the site | ✓ Phase 3 |
| Drafts dropped by one fail-closed Eleventy preprocessor; shown only under `npm start` | One place to get right; CI builds from a clean checkout | ✓ Phase 4 |
| Absolute URLs (canonical, og, sitemap) come only from `site.url` + PATH_PREFIX via `htmlBaseUrl` | Subpath and custom domain both work from one setting | ✓ Phase 4 |
| og:image is always a processed 1200px derivative, never an original | Keeps originals unpublished and previews light | ✓ Phase 4 |
| Reflow check (headless Chrome) stays local; CSS guard test runs in CI | Avoids a browser in CI; confirmed by hand on the live site | ⚠️ Revisit if layout regressions slip through |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-30 after v1.0 milestone*
