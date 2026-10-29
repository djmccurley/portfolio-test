# Roadmap: Portfolio Site

## Overview

Markdown plus a shared `assets/` folder goes in; plain, fast, accessible HTML/CSS comes out on GitHub Pages. Phase 1 front-loads the riskiest pieces (asset path resolution, base-path config, image pipeline, CI cache) and ends with a real deployed site where the owner writes a project `.md` with a pasted image, pushes, and it is live. Each later phase adds an end-to-end capability: layout blocks and embeds, then browsing and the lightbox, then hardening and launch extras.

## Phases

- [ ] **Phase 1: Push-to-Live with Images** - Minimal deployed site: write a project .md with a pasted image, push, it's live
- [ ] **Phase 2: Layout Blocks, Embeds and Design System** - Mix grids, full-width images, video, and itch.io games in a page with accessible brutalist CSS
- [ ] **Phase 3: Browsing, Lightbox and Standalone Pages** - Feed, tags, curated homepage, About/CV, student page, and full-size image viewing
- [ ] **Phase 4: Hardening and Launch Readiness** - Next/prev, share previews, sitemap, drafts, authoring README, and zoom/small-screen verification

## Phase Details

### Phase 1: Push-to-Live with Images

**Goal**: Owner writes a project markdown file with a pasted image, pushes to GitHub, and sees it live on a deployed site with optimized images
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: PUB-01, PUB-02, PUB-03, PUB-04, PUB-06, AUTH-01, AUTH-02, AUTH-03, IMG-01, IMG-02, IMG-03, IMG-04
**Success Criteria** (what must be TRUE):

  1. Owner pushes a new project `.md` (front matter plus a VS Code-pasted `![alt](path)` image from the shared `assets/` folder) and the live site shows the page with the image after the automatic build
  2. Owner changes one config value to switch between root hosting and a repo subpath, and all links, images and CSS still work in both builds
  3. Owner runs the site locally with live reload while writing
  4. Visitor receives responsive images (multiple widths, modern formats) with width/height set, first image eager and others lazy, and the originals from `assets/` are not published
  5. Committing a full-size pasted image scales it to ~3000px, converts PNG/JPEG to WebP and rewrites the `.md` links; a repeat CI build reuses cached images
  6. A missing image or malformed front matter fails the build with a file-level message, and unknown URLs show a plain 404 page

**Plans:** 4/5 plans executed
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Walking skeleton: scaffold, asset resolver, image transform, base path, live reload, sample project (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Strict content validation, standalone pages, metadata dl, plain 404 (wave 2)
- [x] 01-03-PLAN.md — Pre-commit shrink hook (WebP, <=3000px, slugify, link rewrite) and CI asset guard (wave 2)
- [x] 01-04-PLAN.md — Image edge cases: transparency PNG fallback, animated GIF, SVG (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 01-05-PLAN.md — GitHub Actions deploy with image cache + prune, repo/Pages setup, live verification (wave 3)

**UI hint**: yes

### Phase 2: Layout Blocks, Embeds and Design System

**Goal**: Owner composes a rich project page by typing short block shorthand, mixing grids, full-width images, text, video and playable games, on an accessible brutalist page
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: BLOCK-01, BLOCK-02, BLOCK-03, BLOCK-04, BLOCK-05, BLOCK-06, AUTH-04, MEDIA-01, MEDIA-02, MEDIA-03, A11Y-01, A11Y-03, A11Y-04
**Success Criteria** (what must be TRUE):

  1. Owner types `::: grid-2/3/4` and a full-width block inline, mixes them freely with text on one page, and images keep their own aspect ratios in grids
  2. Images with captions render as figure/figcaption, and grids collapse to fewer columns on narrow screens with no layout JS
  3. Owner can drop raw HTML into markdown as a fallback and it renders
  4. Visitor can play a self-hosted video (controls, poster, no autoplay), a YouTube/Vimeo embed (privacy domain, lazy, titled) and an itch.io game with a visible "play on itch.io" fallback link
  5. Pages use semantic HTML and minimal brutalist CSS with no animation; keyboard users get a skip link, visible focus and AA contrast; the build warns on empty or filename-like alt text

**Plans**: TBD
**UI hint**: yes

### Phase 3: Browsing, Lightbox and Standalone Pages

**Goal**: Visitors can browse the work by feed, tag and curated homepage, read standalone pages, and open any image full-size
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: IMG-05, SITE-01, SITE-02, SITE-03, SITE-04, SITE-05
**Success Criteria** (what must be TRUE):

  1. Visitor sees all projects newest first in one feed and can browse by tag on tag pages
  2. Owner picks and orders homepage featured projects, and the build fails if a featured project does not exist
  3. Owner adds About/CV as a markdown page and it appears on the site
  4. Student-work page lists links and PDF downloads and never shows in the feed or tag pages
  5. Visitor can open any content image full-size via a plain link without JS, enhanced to a keyboard-operable native dialog (Escape closes, focus returns)

**Plans**: TBD
**UI hint**: yes

### Phase 4: Hardening and Launch Readiness

**Goal**: The site is verified, documented and ready to launch, with the chosen v1 extras in place
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: SITE-06, SITE-07, PUB-05, AUTH-05, A11Y-02
**Success Criteria** (what must be TRUE):

  1. Visitor can move to the next/previous project from a project page
  2. Shared links show title, description and image previews, and the site publishes sitemap.xml with correct absolute URLs
  3. A page marked `draft: true` is absent from the live site but visible locally
  4. Owner can read a README listing every block and front matter field with examples
  5. Site is usable at 320px wide and 200% zoom without horizontal scrolling, verified under the real deployed prefix or domain

**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Push-to-Live with Images | 4/5 | In Progress|  |
| 2. Layout Blocks, Embeds and Design System | 0/? | Not started | - |
| 3. Browsing, Lightbox and Standalone Pages | 0/? | Not started | - |
| 4. Hardening and Launch Readiness | 0/? | Not started | - |
