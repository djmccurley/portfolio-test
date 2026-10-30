# Requirements: Portfolio Site

**Defined:** 2026-10-28
**Core Value:** Writing a new project page should be as fast as typing markdown: headers, paragraphs, pasted images and short layout blocks, then push, and it's live, with no CMS, template fights or upload caps.

## v1 Requirements

### Publishing

- [x] **PUB-01**: Owner can push a markdown change to the repo and the site rebuilds and deploys automatically (GitHub Actions → GitHub Pages)
- [x] **PUB-02**: Owner can switch the site between root hosting (custom domain / username.github.io) and a repo subpath by changing one config value, with all links, images and CSS still working
- [x] **PUB-03**: Owner can run the site locally with live reload while writing
- [x] **PUB-04**: Owner sees a failed build with a clear file-level message when an image is missing, a layout block is malformed, or a featured project doesn't exist
- [ ] **PUB-05**: Owner can mark a page `draft: true` and it is excluded from the live site
- [x] **PUB-06**: Visitor sees a plain 404 page for unknown URLs

### Authoring

- [x] **AUTH-01**: Owner can create a project by adding one `.md` file with front matter (title, date, tags, summary, cover image + alt, role/client/tools)
- [x] **AUTH-02**: Owner can paste an image in VS Code (saved to the shared `assets/` folder with a prefixed filename) and the resulting `![alt](path)` link renders correctly on the built site
- [x] **AUTH-03**: Owner can paste full-size images of any size; on commit, images over ~3000px are scaled down, PNG/JPEG are converted to WebP, and the `.md` links are rewritten automatically (GIFs and transparency handled safely)
- [x] **AUTH-04**: Owner can write raw HTML inside markdown as a fallback for anything the block syntax doesn't cover
- [ ] **AUTH-05**: Owner has a short authoring reference (README) listing every block and front matter field with examples

### Layout Blocks

- [x] **BLOCK-01**: Owner can type a multi-column image grid (2, 3 or 4 columns) inline with markdown shorthand (e.g. `::: grid-3` … `:::`)
- [x] **BLOCK-02**: Owner can type a full-width (full-bleed) image block inline
- [x] **BLOCK-03**: Owner can freely mix grids, full-width images and normal text within one page
- [x] **BLOCK-04**: Owner can add captions to images that render as `<figure>`/`<figcaption>`
- [x] **BLOCK-05**: Images in grids keep their own aspect ratios (no forced cropping)
- [x] **BLOCK-06**: Grids collapse to fewer columns on narrow screens with no layout JS

### Images

- [x] **IMG-01**: Visitor receives build-generated responsive images (multiple widths, modern formats) sized for each block layout
- [x] **IMG-02**: Every image has width/height set so pages don't shift while loading; the first image loads eagerly, the rest lazily
- [x] **IMG-03**: Only processed derivatives are published; the source files in `assets/` are never copied to the live site
- [x] **IMG-04**: Builds in CI reuse previously processed images instead of reprocessing all of them on every push
- [ ] **IMG-05**: Visitor can open any content image full-size: a plain link to a large version that works without JS, enhanced to a native `<dialog>` viewer (keyboard-operable, Escape closes, focus returns)

### Media Embeds

- [x] **MEDIA-01**: Owner can embed a self-hosted video (controls, poster, no autoplay)
- [x] **MEDIA-02**: Owner can embed a YouTube or Vimeo video with a short block (privacy-friendly domain, lazy-loaded, titled iframe)
- [x] **MEDIA-03**: Owner can embed a playable itch.io game with a short block (titled, lazy-loaded, sized iframe with a visible "play on itch.io" fallback link)

### Site Structure

- [x] **SITE-01**: Visitor can browse all projects in one feed, newest first
- [x] **SITE-02**: Visitor can browse projects by tag (graphic, UX, art, games, etc.) on tag pages
- [x] **SITE-03**: Owner can choose which projects appear on the homepage and in what order
- [x] **SITE-04**: Owner can add standalone pages (About / CV) as markdown files
- [x] **SITE-05**: Owner can maintain a student-work page with links and PDF downloads that never appears in the project feed or tag pages
- [ ] **SITE-06**: Visitor can move to the next/previous project from a project page
- [ ] **SITE-07**: Shared links show a preview (Open Graph title, description, image), and the site publishes a sitemap.xml

### Design & Accessibility

- [x] **A11Y-01**: Pages use semantic HTML and native elements with a brutalist, minimal CSS style: no smooth scrolling, fades or animation
- [ ] **A11Y-02**: Site is usable at 320px wide and at 200% zoom without horizontal scrolling
- [x] **A11Y-03**: Keyboard users get a skip link and visible focus outlines; text meets WCAG AA contrast
- [x] **A11Y-04**: Build warns when an image has empty or filename-like alt text (with a deliberate way to mark decorative images)

## v2 Requirements

### Layout

- **BLOCK-07**: Text + image side-by-side block

### Content

- **CONT-01**: Blog / dated notes (may replace Neocities blog)
- **CONT-02**: RSS feed
- **CONT-03**: Fuller student-work index (or excludable tag) instead of a single page

### Polish

- **POL-01**: Dark mode following system preference
- **POL-02**: Lightbox previous/next navigation
- **POL-03**: Click-to-load facades for video embeds
- **POL-04**: Tag index page with counts
- **POL-05**: Orphaned-asset checker (images in `assets/` no page uses)

## Out of Scope

| Feature | Reason |
|---------|--------|
| CMS / admin UI | Authoring is markdown in VS Code; a CMS is the bloat being escaped |
| Squarespace import tooling | Owner will rebuild projects by hand |
| Self-hosted game builds | Games live on itch.io; keeps large builds out of the repo and hosting limits |
| Git LFS for images | Free LFS bandwidth quota runs out quickly in CI; commit-time shrinking keeps plain git viable |
| Smooth scroll, fades, scroll animations, carousels, infinite scroll | Conflicts with the brutalist/native aesthetic and accessibility |
| JS frameworks, JS lightbox/masonry libraries | Plain HTML/CSS; JS only where a native element can't do the job |
| Comments, contact-form backend, analytics trackers | Not needed for a static personal portfolio |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| A11Y-01 | Phase 2 | Complete |
| A11Y-02 | Phase 4 | Pending |
| A11Y-03 | Phase 2 | Complete |
| A11Y-04 | Phase 2 | Complete |
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 4 | Pending |
| BLOCK-01 | Phase 2 | Complete |
| BLOCK-02 | Phase 2 | Complete |
| BLOCK-03 | Phase 2 | Complete |
| BLOCK-04 | Phase 2 | Complete |
| BLOCK-05 | Phase 2 | Complete |
| BLOCK-06 | Phase 2 | Complete |
| IMG-01 | Phase 1 | Complete |
| IMG-02 | Phase 1 | Complete |
| IMG-03 | Phase 1 | Complete |
| IMG-04 | Phase 1 | Complete |
| IMG-05 | Phase 3 | Pending |
| MEDIA-01 | Phase 2 | Complete |
| MEDIA-02 | Phase 2 | Complete |
| MEDIA-03 | Phase 2 | Complete |
| PUB-01 | Phase 1 | Complete |
| PUB-02 | Phase 1 | Complete |
| PUB-03 | Phase 1 | Complete |
| PUB-04 | Phase 1 | Complete |
| PUB-05 | Phase 4 | Pending |
| PUB-06 | Phase 1 | Complete |
| SITE-01 | Phase 3 | Complete |
| SITE-02 | Phase 3 | Complete |
| SITE-03 | Phase 3 | Complete |
| SITE-04 | Phase 3 | Complete |
| SITE-05 | Phase 3 | Complete |
| SITE-06 | Phase 4 | Pending |
| SITE-07 | Phase 4 | Pending |

**Coverage:**

- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-10-28*
*Last updated: 2026-10-28 after initial definition*
