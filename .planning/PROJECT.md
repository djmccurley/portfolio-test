# Portfolio Site

## What This Is

A personal portfolio website for a multidisciplinary practice: graphic design, interactive/UX design, art, and videogame design/development. Projects and pages are written as markdown files in VS Code and pushed to GitHub Pages (or similar static hosting), where a static site builder turns them into plain, fast, accessible HTML. It replaces template-driven builders (Squarespace, Cargo) and a cap-limited Neocities blog with something the owner fully controls.

## Core Value

Writing a new project page should be as fast as typing markdown: headers, paragraphs, pasted images and short layout blocks (grids, full-width), then push, and it's live, with no CMS, template fights or upload caps.

## Requirements

### Validated

- [x] Author projects and pages as `.md` files; push to git → site builds and deploys to static hosting (GitHub Pages or similar) — Validated in Phase 1: Push-to-Live with Images
- [x] Images pasted in VS Code resolve correctly from the single shared `assets/` folder (plugin writes prefixed filenames there) — Validated in Phase 1: Push-to-Live with Images
- [x] Images auto-resized at build time (responsive sizes, modern formats, width/height to prevent layout shift); full-res originals stay as source — Validated in Phase 1: Push-to-Live with Images

### Active

- [ ] Inline, modular layout blocks inside a page body (e.g. multi-column image grid, full-width image, text) typed with fast markdown-like shorthand, not raw HTML (HTML allowed as fallback)
- [ ] Several layout options available per block; blocks can be mixed freely within one page
- [ ] Image lightbox for viewing full-size images, using native elements (e.g. `<dialog>` or plain link to file), no heavy JS
- [ ] Video support in project pages (self-hosted and/or YouTube/Vimeo embeds)
- [ ] Playable games embedded via itch.io embeds
- [ ] Single project feed with tags (graphic, UX, art, games, etc.); browse by tag
- [ ] Homepage with hand-picked, hand-ordered featured projects
- [ ] Standalone pages (About / CV)
- [ ] Student work: a simple standalone page with links and PDF downloads, kept out of the main project feed
- [ ] Brutalist, accessible design: semantic HTML, native browser elements, minimal CSS, no smooth scroll / fades / animation flourish
- [ ] Responsive at all widths through plain HTML/CSS (no layout JS)

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
- **Tech stack**: Static site generator TBD by research (Eleventy, Jekyll, Hugo, Astro candidates). Must output plain HTML/CSS with zero or near-zero client JS.
- **Authoring**: Layout syntax must be quick to type in plain markdown in VS Code; must not require a preview tool or GUI.
- **Accessibility**: Semantic HTML, alt text on images, keyboard-accessible lightbox/embeds, respects reduced-motion, good contrast.
- **Assets**: Single shared `assets/` folder with prefixed filenames (set by the VS Code plugin).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Markdown + static site generator, no CMS | Avoid bloat; owner already fluent in SSGs | — Pending |
| Resize images at build time | Avoid hosting caps and slow pages while keeping full-res sources | — Pending |
| Inline layout blocks in markdown shorthand | Fast authoring; mix grids and full-width freely | — Pending |
| itch.io embeds for games | Keeps large builds out of repo/hosting limits | — Pending |
| One tagged feed + curated homepage | Multidisciplinary work in one place; owner controls featured order | — Pending |
| No Squarespace importer | Owner will rebuild by hand | — Pending |
| v1 = working system (POC), not content migration | Prove authoring flow first | — Pending |
| Eleventy 3 + eleventy-img + markdown-it-container (Node 22) | Research: best fit for `:::` block shorthand + plain-markdown image transform; owner knows it | — Pending |
| Site URL undecided; base path is one config value | Owner hasn't chosen domain vs github.io vs subpath | — Pending |
| Paste full-size; commit step shrinks >~3000px, converts PNG/JPEG→WebP, rewrites .md links | Owner doesn't want to resize by hand; keeps repo small without LFS | — Pending |
| Extras in v1: next/prev, OG + sitemap, draft flag | Owner selected; side-by-side block deferred to v2 | — Pending |

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
*Last updated: 2026-10-28 after Phase 1 (live at https://djmccurley.github.io/portfolio-test/)*
