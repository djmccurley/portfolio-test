<!-- GSD:project-start source:PROJECT.md -->

## Project

**Portfolio Site**

A personal portfolio website for a multidisciplinary practice: graphic design, interactive/UX design, art, and videogame design/development. Projects and pages are written as markdown files in VS Code and pushed to GitHub Pages (or similar static hosting), where a static site builder turns them into plain, fast, accessible HTML. It replaces template-driven builders (Squarespace, Cargo) and a cap-limited Neocities blog with something the owner fully controls.

**Core Value:** Writing a new project page should be as fast as typing markdown: headers, paragraphs, pasted images and short layout blocks (grids, full-width), then push, and it's live, with no CMS, template fights or upload caps.

### Constraints

- **Hosting**: GitHub Pages or similar free static host. GitHub Pages limits: ~1 GB published site, 100 MB per file, ~100 GB/month soft bandwidth. Image pipeline and repo strategy must keep the site well under these.
- **Tech stack**: Static site generator TBD by research (Eleventy, Jekyll, Hugo, Astro candidates). Must output plain HTML/CSS with zero or near-zero client JS.
- **Authoring**: Layout syntax must be quick to type in plain markdown in VS Code; must not require a preview tool or GUI.
- **Accessibility**: Semantic HTML, alt text on images, keyboard-accessible lightbox/embeds, respects reduced-motion, good contrast.
- **Assets**: Single shared `assets/` folder with prefixed filenames (set by the VS Code plugin).

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommendation: Eleventy 3.x (firm)

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js | 22 LTS (>=22 required by eleventy-img 7) | Runtime | eleventy-img 7 requires Node >=22 and is ESM-only. Eleventy itself only needs >=18. |
| @11ty/eleventy | ^3.1.7 (npm `latest`; 4.0 is alpha only, avoid) | SSG | ESM config, markdown-it 15, no client JS, simple data cascade and collections (tags, hand-ordered featured list). |
| markdown-it | ^15.0.3 (bundled with Eleventy; configure via `eleventyConfig.amendLibrary`) | Markdown | Plugin-friendly. |
| markdown-it-container | ^4.0.0 | `::: grid-3` ... `:::` blocks | Gives the fast block shorthand. Register one container per layout (`grid-2`, `grid-3`, `grid-4`, `full`, `text`, `cols`...) using a loop that emits `<div class="layout grid-3">`. |
| markdown-it-attrs | ^5.0.1 | `{.class #id}` on any element | Per-image or per-paragraph tweaks, e.g. `![](x.png){.span-2}`. Optional but cheap. |
| @11ty/eleventy-img | ^7.1.1 (uses sharp ^0.35.5) | Image processing | Official HTML-transform plugin and the standard for Eleventy. |

### Database

### Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| GitHub Actions (`actions/checkout@v4`, `actions/setup-node@v4` with `cache: npm`, `actions/cache@v4`, `actions/upload-pages-artifact`, `actions/deploy-pages`) | current majors; confirm at implementation time | Build and deploy | Official Pages flow. Cache `.cache/` and the image output dir keyed on the hash of `assets/**` to keep rebuilds fast. |
| GitHub Pages | n/a | Hosting | Free. Limits: ~1 GB published site, 100 MB per file, ~100 GB/month soft bandwidth. Processed images (AVIF/WebP at ~4 widths) stay far under this for a portfolio. |
| Cloudflare Pages (fallback) | n/a | Alternative host | Same `_site/` output. Move here if you hit the bandwidth soft cap. It has no bandwidth cap on static assets but has file-count and size limits. Verify its current limits before migrating (not researched in depth, LOW confidence). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sharp | ^0.35.5 (pulled in by eleventy-img) | Resize/encode | Do not install separately. |
| markdown-it-anchor | latest at install | Heading ids | Only if you want deep links to headings. |
| @11ty/eleventy-plugin-rss | n/a | RSS | Out of scope for v1. |
| Native `<dialog>` + about 10 lines of inline JS (or a `:target` CSS lightbox) | n/a | Lightbox | The only JS on the site. A plain `<a href="full-image">` link is the zero-JS fallback. |

## Image Pipeline Details (requirement 1 and 3)

- Use `eleventyImageTransformPlugin` with `formats: ["avif","webp","jpeg"]`, `widths: [480, 800, 1200, 1800, 2400]` or similar, and `htmlOptions.imgAttributes` of `{ loading: "lazy", decoding: "async", sizes: "(min-width: 60em) 60em, 100vw" }`.
- The plugin adds `width` and `height` automatically, which prevents layout shift. It requires a `sizes` attribute when there are multiple widths and has no default, so set one globally. Per-layout `sizes` (e.g. a 3-column grid) can be set via `eleventy:` attributes or a custom transform.
- AVIF roughly adds a +1 cost factor to the build (Eleventy docs). It is slow on large originals, so cache aggressively.
- **Caching:** eleventy-img's disk cache skips images that are unchanged and already in the output dir. In CI, persist the processed image output directory (`_site/img`, or a separate dir copied into `_site`) and `.cache` with `actions/cache`. Without it, every build reprocesses everything. This is the main build-speed risk for "LOTS of images".
- **Path resolution caveat (MEDIUM confidence, needs a spike in the first phase):** per Eleventy docs, relative `src` values are resolved relative to the template, and absolute `/x.png` values resolve from the Eleventy *input* directory, not the repo root. Because `assets/` is at repo root and the VS Code plugin emits links like `../assets/prefix-image.png`, choose one of these:
- Keep originals out of `_site` (do not passthrough-copy `assets/`). Only the processed outputs are published. If a "full-size" lightbox is needed, generate a large (about 2400px) AVIF/WebP/JPEG variant rather than linking the original, to protect the Pages size cap.
- Repo size: large originals in git will grow the repo (a GitHub soft recommendation is under ~1-5 GB). Consider Git LFS only if originals exceed a few hundred MB. Note that LFS has its own quota and complicates Actions checkout (needs `lfs: true`).

## Layout Shorthand (requirement 2)

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| SSG | Eleventy 3.1 | Astro 7.x (npm latest 7.4.4) | Excellent built-in `<Image>`/`<Picture>` and ships zero JS by default, but its optimization applies to imports/content-collection images and `.astro`/MDX components. Plain `![](path)` in markdown works only for paths Astro can resolve (relative to the file or `src/`), so the single repo-root `assets/` folder needs extra config or a custom remark plugin. `:::` directives need remark-directive plus a hand-written plugin. The toolchain is Vite-based, heavier, and churns on major versions, which is overkill for a brutalist HTML site. Good fallback if the owner later wants components. |
| SSG | Eleventy 3.1 | Hugo (v0.169.0) | Fastest builds and built-in image processing with a persistent resource cache, but processing works through `resources.Get`/render hooks (`render-image.html`) with Go templates, and the image resource must live in `assets/` or page bundles (Hugo's `assets/` dir is a mount, so a root-level `assets/` is actually a native fit). Block-level layout shorthand needs shortcodes (`{{< grid3 >}}...{{< /grid3 >}}`), which is slower to type than `:::`, though Goldmark attribute/passthrough extensions help somewhat. Choose Hugo only if build time becomes painful at thousands of images. Owner has no Hugo experience, which is a real cost. |
| SSG | Eleventy 3.1 | Jekyll | No built-in image processing (plugins are not allowed on GitHub's native Pages builder, and any plugin route needs Actions plus ImageMagick/libvips tooling). kramdown block attributes are weaker than `:::` containers. Slowest at scale. Eliminates the main requirement. |
| Image tool | eleventy-img | Hand-rolled sharp scripts | Reinvents hashing, cache, srcset and HTML generation. |
| Markdown layout | markdown-it-container | Nunjucks/Liquid shortcodes (paired) | `{% grid 3 %}...{% endgrid %}` works and is more explicit, but is slower to type and renders markdown inside less predictably. Keep paired shortcodes for embeds only. |
| Host | GitHub Pages | Cloudflare Pages / Netlify | Fine as a fallback. Pages is simplest for a git-pushed site, with no extra account. |
| Plugin | eleventyImageTransformPlugin | `{% image %}` shortcode | A shortcode forces authors out of plain `![alt](path)`. Violates the core value. |

## Installation

# Node 22 LTS required

## What NOT to Use

- **Jekyll on GitHub's built-in Pages builder:** no image processing, restricted plugins.
- **Astro with islands/React/MDX components:** violates the no-client-JS-frameworks constraint in spirit. Not needed.
- **Pagination or tag libraries beyond core:** Eleventy collections and `pagination` handle tags natively.
- **Lightbox libraries (GLightbox, PhotoSwipe, lightGallery):** heavy JS, against the brief. Use `<dialog>` or links.
- **Eleventy 4.0 alpha / beta releases:** unstable.
- **Passthrough copying `assets/` to `_site`:** would publish full-res originals and risk the size cap.
- **Committing generated images to git:** unnecessary. Cache them in CI instead.

## Confidence

| Area | Level | Notes |
|------|-------|-------|
| Versions (eleventy 3.1.7, eleventy-img 7.1.1, markdown-it 15.0.3, container 4.0.0, attrs 5.0.1, sharp 0.35.5, Node >=22) | HIGH | From the npm registry on 2026-10-28 |
| Image transform plugin behavior and path resolution | MEDIUM-HIGH | From the official 11ty image docs. The repo-root `assets/` handling needs a first-phase spike. |
| Eleventy as best fit | MEDIUM-HIGH | Based on requirement fit and owner familiarity |
| Astro/Hugo comparisons | MEDIUM | Based on training knowledge plus version checks (Astro 7.4.4, Hugo 0.169.0). Not re-verified against current docs. |
| Cloudflare/Netlify limits | LOW | Not researched; verify before migrating |
| GitHub Pages limits | MEDIUM | From project brief, matches long-standing published limits |

## Sources

- https://www.11ty.dev/docs/plugins/image/ (HTML transform, path resolution, caching, formats, Node 22 requirement)
- npm registry (`npm view`) for versions, 2026-10-28
- https://api.github.com/repos/gohugoio/hugo/releases/latest (Hugo v0.169.0)

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
