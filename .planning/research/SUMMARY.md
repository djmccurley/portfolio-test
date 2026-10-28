# Project Research Summary

**Project:** Portfolio Site (markdown-authored, image-heavy, brutalist/accessible)
**Domain:** Hand-built static portfolio for a multidisciplinary creative (graphic, UX, art, games, teaching)
**Researched:** 2026-10-28
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is a one-way static pipeline. Markdown, front matter and a shared `assets/` folder go in, and plain HTML/CSS with processed images comes out. Nothing runs at request time. Experts build this with:
- a Node SSG;
- a markdown-it fence syntax for layout blocks;
- an HTML-level image transform that rewrites plain `<img>` into responsive `<picture>`;
- a CSS-grid page with named-line full-bleed;
- a GitHub Actions deploy with a persistent image cache.

The research converges firmly on **Eleventy 3.1.x + @11ty/eleventy-img 7.x + markdown-it-container + markdown-it-attrs on Node 22**. Authors keep writing `![alt](path)` and `::: grid-3` fences, which is the project's core value. Astro, Hugo and Jekyll each fail at least one requirement without a workaround.

Owner decisions made since research shape the plan:
- **Site URL:** undecided, so the base path must be a single config value (Eleventy `pathPrefix` plus the URL filter on every link, image URL and CSS reference). CI must be able to test a project-site prefix.
- **Images:** auto-resized at build, and only derivatives are published, never originals.
- **v1 scope:** lightbox, video and itch.io embeds are in. Blog, RSS, dark mode and Squarespace import are out.
- **Asset convention:** the VS Code paste plugin writes into one shared root `assets/` folder with prefixed filenames, so the build resolves images by basename and ignores the directory part of the path.

The key risks are all upstream of content:
1. Path resolution across VS Code preview, SSG input and deployed prefix.
2. Uncached image processing making CI slow.
3. Repo bloat from originals.
4. Fragile block syntax.

Mitigations:
- Make the asset resolver and base-path handling a first-phase spike.
- Fail the build on any missing image, bad fence or unresolved featured entry.
- Cache `.cache` and image output in CI.
- Cap source image size with a guard.
- Avoid Git LFS, and never passthrough-copy `assets/`.

## Key Findings

### Recommended Stack
(Details in STACK.md.) Eleventy 3.1.x is firm, and the owner already knows it. It ships no client JS, has a markdown-it plugin ecosystem that makes the fence shorthand about 10 lines of config, and has an official image transform that works on plain markdown images. Output is a host-neutral `_site/`. Versions were verified against npm on 2026-10-28.

**Core technologies:**
- Node 22 LTS: eleventy-img 7 requires >=22 and is ESM-only.
- @11ty/eleventy ^3.1.7: avoid the 4.0 alpha.
- @11ty/eleventy-img ^7.1.1 (sharp): `eleventyImageTransformPlugin` gives AVIF/WebP/JPEG, srcset, width/height and lazy loading.
- markdown-it-container ^4.0.0: `::: grid-3` blocks, one container per layout.
- markdown-it-attrs ^5.0.1: `{.class}` per-element tweaks (optional).
- GitHub Actions plus GitHub Pages: checkout, setup-node, actions/cache, upload-pages-artifact, deploy-pages. Cloudflare Pages is the fallback host, but its limits are unverified.
- Native `<dialog>` plus a small script: the only JS on the site, for the lightbox. Embeds use shortcodes or containers that emit `<iframe>`.

### Expected Features
(Details in FEATURES.md.)

**Must have (v1):**
- Project pages from `.md` with front matter and a metadata `<dl>`.
- Shared `assets/` resolution, and responsive images with alt, width/height and `<figure>` captions.
- Blocks: grid 2/3/4, full-bleed, uncropped mixed aspect ratios.
- Single feed, tag pages, hand-ordered homepage, About/CV, a student-work page with PDFs (outside the feed), and a 404.
- Lightbox: plain link baseline plus a shared `<dialog>` enhancement.
- Video: self-hosted `<video>` and a `youtube-nocookie` lazy iframe.
- itch.io embeds.
- Accessibility baseline: skip link, focus styles, contrast, reduced-motion, semantic HTML.

**Should have (v1.x, right after the pipeline works):**
- Next/prev navigation.
- OG tags with 1200x630 JPEG covers.
- Sitemap and robots.
- Draft flag.
- Broken-asset and orphan checker.
- Tag index with counts.
- Side-by-side text+image block.
- Click-to-load facades.

**Defer (v2+):**
- Lightbox prev/next.
- Related projects.
- Tag-scoped nav.
- Print CSS.
- Student index.
- Out of scope per owner: blog, RSS, dark mode, Squarespace import.

### Architecture Approach
(Details in ARCHITECTURE.md.) There are five cleanly separated seams:
- content store;
- asset resolver;
- markdown plus block plugin;
- image HTML transform;
- layouts plus CSS.

The markdown layer emits plain `<img>`. One post-transform resolves the file by basename from root `assets/` and generates `<picture>`, so blocks and images stay decoupled. Directory data (`projects.11tydata.js`) drives layout, permalink and feed membership.

**Major components:**
1. **Asset resolver** (`lib/assets.js`): basename lookup in `assets/`. It throws on a missing file and on case-insensitive duplicates.
2. **Markdown and block plugin** (`lib/markdown.js`, `lib/blocks/*`): flat, non-nested `:::` containers (grid-N, full, video, itch). Raw HTML stays as a fallback.
3. **Image pipeline** (`lib/images.js`): eleventy-img with hashed output in `_site/img/`, a capped large variant (about 2400px) for the lightbox, and a fast dev mode.
4. **Content model and collections:** front matter validated at build (controlled tag vocabulary, cover alt, featured order). Collections are `projects`, `featured` and `tagList`, with tag pages by pagination.
5. **CSS:** plain `@layer` files, a named-line content grid for full-bleed (not `100vw`), and container-query or `auto-fit` galleries.
6. **CI/CD:** `actions/cache` for `.cache` and image output keyed on `assets/**`, a `du -sh _site` budget step, and Pages deploy.

### Critical Pitfalls
(Details in PITFALLS.md.)
1. **Path breakage across preview, SSG input and deployed prefix** (worsened by the undecided URL). Resolve by basename, pass every URL through the base-path helper, fail the build on a missing image, and link-check a prefixed build.
2. **Uncached image processing makes CI slow.** Persist `.cache` and image output with `actions/cache` (hash key plus restore-keys), limit widths and formats, process only referenced images, and test with 200+ images.
3. **Repo bloat from originals, and Git LFS as a bad fix.** Commit capped sources only (about 3000px, per-file guard around 10 MB), keep masters elsewhere, avoid LFS, and never passthrough-copy `assets/`. Strip EXIF, auto-orient, and reject HEIC and giant inputs with a clear error.
4. **Fragile block syntax.** Use established `:::` containers and keep blocks flat. Throw build errors with file and line on unclosed or nested fences. Keep a fixture page with snapshot tests, and write the spec before adding layouts.
5. **Accessibility gaps in lightbox, embeds and alt text.** The lightbox is progressive: an `<a>` link first, `showModal()` second, with focus return and a close button. Iframes need `title`, lazy loading and a fallback link. Lint empty or filename alt text. No autoplay video.

Also watch:
- The first image must be eager with `fetchpriority="high"`, not lazy, and each block needs its own `sizes`.
- Tags need normalising.
- The student page stays out of the feed.
- A deploy-size budget needs enforcing.

## Implications for Roadmap

The architecture's 9-step build order collapses into 4 coarse phases, inside the owner's 3-5. The strict dependency chain is skeleton, then content model, then image pipeline, then blocks. Listings and standalone pages are independent of that chain.

### Phase 1: Foundation, Deploy and Image Pipeline
**Rationale:** This is the riskiest and slowest piece, and everything depends on it. Proving push-to-live early de-risks hosting. The base-path decision and the asset resolver must exist before any content, because they affect every URL.
**Delivers:**
- Eleventy 3 on Node 22, a base layout, and a GitHub Actions deploy to Pages.
- The base path as a single config value, with a CI check under a prefix.
- Repo and asset conventions: committed `.vscode/settings.json` for the paste plugin, size guard, allowed formats, no LFS.
- The content model: `content/projects|pages`, directory data, and front matter schema with validation.
- The asset resolver (basename, shared `assets/`) and the eleventy-img transform. This covers AVIF/WebP/JPEG, width/height, hashed output, a capped large variant, originals never published, `.cache` in CI, and a dev fast mode.
- A `du -sh _site` budget step and a `404.html`.

**Addresses:** shared assets resolution, responsive images, alt/width/height, 404, front matter.
**Avoids:** pitfalls 1, 2, 3, 4, 5, 7, 8, 14.

### Phase 2: Layout Blocks, Embeds and CSS System
**Rationale:** It depends on the image pipeline, because images sit inside blocks. The block syntax is the core value, so fix the spec before building more layouts. CSS and block classes co-evolve, so they belong together.
**Delivers:**
- `::: grid-2/3/4` and `full`, with `<figure>` captions.
- Per-block `sizes`, the raw-HTML fallback, flat-only enforcement with file and line errors, and fixture snapshot tests.
- Video: self-hosted `<video controls preload="metadata" poster>` and a `youtube-nocookie` lazy iframe.
- itch.io embed: a titled, lazy, aspect-ratio wrapper with a visible fallback link.
- The CSS system: tokens, named-line content grid with full-bleed, `auto-fit` galleries, focus, contrast, and a reduced-motion guard.
- Alt-text lint.

**Addresses:** gallery, full-bleed, mixed ratios, captions, video, itch.io, accessibility baseline.
**Avoids:** pitfalls 6, 10, 11, 12, 13.

### Phase 3: Lightbox, Listings and Standalone Pages
**Rationale:** The lightbox needs the large derivative and block markup from phases 1 and 2. Collections need the schema and cover images. Both are low risk and can be ordered freely inside the phase.
**Delivers:**
- Lightbox: every content image wrapped in `<a href=large-derivative>`, with one shared `<dialog>` and about 15-30 lines of script. It supports Tab, Enter, Escape, focus return and a labelled close button.
- Feed, tag pages from a controlled vocabulary, a hand-ordered homepage (`featured`/`order`), and a card partial.
- About/CV and the student-work page, with PDF passthrough and file size/type in the link text.
- A build that fails on unresolved featured entries, with the student page outside the feed.

**Addresses:** feed and tags, curated homepage, standalone pages, student page, lightbox.
**Avoids:** pitfalls 9, 15.

### Phase 4: Hardening and Launch Readiness
**Rationale:** Cross-cutting verification is cheaper once the features exist, and the v1.x items fit here.
**Delivers:**
- Link and asset checks (orphans, case duplicates).
- A Lighthouse CLS pass, an axe pass, a keyboard and VoiceOver pass, and a 320px and 200% zoom pass.
- A verification run under the real deployed prefix or domain, and a 200+ image cache and timing test.
- Block syntax docs and an authoring README.
- If time allows from v1.x: next/prev, OG tags, sitemap, draft flag.

**Avoids:** the items on the "looks done but isn't" checklist.

### Phase Ordering Rationale
- The strict chain is skeleton, content model, image pipeline, then blocks. Phase 1 front-loads it with the path and base-URL decisions, which are the most expensive to change late.
- Blocks and CSS are merged because the block class contract drives the CSS, and the pipeline already emits plain `<img>`.
- The lightbox follows blocks because it needs the large variant and the markup contract. Listings and standalone pages ride along in Phase 3 because they are independent and low risk.
- Hardening is last because the audits need real features, but each earlier phase carries its own acceptance checks.

### Research Flags
Needs `--research-phase` or a spike:
- **Phase 1:** Verify that the eleventy-img transform resolves paths against root `assets/`. Option A is input at repo root with `.eleventyignore`. Option B is a basename-rewrite rule. Also verify:
  - whether the disk cache repopulates outputs in CI;
  - `pathPrefix` behaviour with the transform;
  - current `actions/*` versions;
  - the paste plugin's settings (prefix, link format, save format).
- **Phase 2:** Verify the current itch.io embed snippet (iframe versus widget) and the per-block `sizes` convention. Test with a real game on a phone and with the keyboard.
- **Phase 3:** Verify `<dialog>` and invoker-command browser support on MDN or caniuse, then settle on the shared-dialog script.

Standard patterns (skip research):
- **Phase 4:** standard audits and CI checks.
- Listings and tags in Phase 3: standard Eleventy collections and pagination.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Versions verified against npm. Plugin behaviour is from the official 11ty docs. Repo-root `assets/` handling is unspiked. Astro and Hugo comparisons are MEDIUM. |
| Features | MEDIUM | Genre knowledge with no live verification. Browser support for newer platform features needs checking. |
| Architecture | MEDIUM | A well-worn Eleventy pattern, but current API details were not re-verified. |
| Pitfalls | MEDIUM | GitHub limits are well known but marked "verify". Accessibility and web-performance guidance is HIGH. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address
- **Site URL and base path (owner undecided):** Make `pathPrefix` one config value, run CI with both root and prefixed builds, and have the owner pick before launch. OG and sitemap absolute URLs depend on it.
- **Asset path resolution:** Spike in Phase 1 (Option A versus B) before building anything on top of it.
- **Paste plugin behaviour:** Confirm the prefix scheme, link format (relative versus absolute) and output format. Commit the settings in `.vscode/settings.json`.
- **CI cache behaviour:** Confirm the cache restores output files and not only metadata. Measure with 200+ images.
- **Lightbox browser support:** Verify before choosing between a `showModal()` script and invoker commands.
- **GitHub Pages and LFS numbers:** Re-verify the limits (1 GB site, 100 MB file, 100 GB/month bandwidth) before they drive decisions. Cloudflare and Netlify limits are unresearched.
- **Original-image policy:** Decide the capped-source threshold (about 3000px) and where true masters live.
- **Video hosting split:** Set a rule. Short loops are self-hosted under a size cap, and anything long goes on YouTube/Vimeo.

## Sources
- **Primary (HIGH):**
  - npm registry (2026-10-28) for versions.
  - https://www.11ty.dev/docs/plugins/image/
  - WCAG 2.2, MDN, web.dev and the CommonMark spec.
- **Secondary (MEDIUM):**
  - GitHub Docs on Pages limits, large files and LFS (numbers not re-fetched).
  - Hugo and Astro version checks.
  - The breakout-grid CSS pattern.
- **Tertiary (LOW):**
  - itch.io creator docs on embeds.
  - Cloudflare Pages and Netlify limits.
  - sharp HEIC support in prebuilt binaries.

---
*Research completed: 2026-10-28*
*Ready for roadmap: yes*
