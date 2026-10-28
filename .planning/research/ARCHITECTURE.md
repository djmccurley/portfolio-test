# Architecture Research

**Domain:** Markdown-authored, image-heavy static portfolio (GitHub Pages)
**Researched:** 2026-10-28
**Confidence:** MEDIUM. The structure is the well-worn Eleventy pattern and comes from training knowledge plus the project constraints. I did not re-verify current Eleventy/eleventy-img APIs against live docs in this pass. Items marked VERIFY need a check at the start of the relevant phase.

## Standard Architecture

### System Overview

```
 AUTHORING (VS Code)                BUILD (CI or local)                       OUTPUT
┌────────────────────┐   ┌───────────────────────────────────────────┐   ┌──────────────┐
│ content/projects/* │──▶│ 1. Collect + front matter validate        │   │ _site/       │
│ content/pages/*    │   │ 2. Markdown parse (markdown-it)           │   │  index.html  │
│ assets/<prefix>-*  │   │    + block-syntax plugin  (::: grid etc.) │──▶│  projects/…  │
│ (originals)        │   │ 3. Template render (layouts, partials)    │   │  tags/…      │
└────────────────────┘   │ 4. HTML post-transform: <img> → <picture> │   │  img/ (hash) │
          │              │    via image pipeline (cached)            │   │  css/        │
          │              │ 5. Write CSS (copy / bundle, no JS)       │   └──────┬───────┘
          ▼              └───────────────────┬───────────────────────┘          │
   git push main                             │ reads/writes                      ▼
                                   ┌─────────▼─────────┐              GitHub Pages
                                   │ .cache/ (img meta │              (actions/deploy-pages)
                                   │  + processed)     │
                                   └───────────────────┘
```

Everything is a one-way pipeline: source files in, static files out. There is no runtime, no database, no server. The only state that persists between builds is the image cache.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Content store | Markdown + front matter for projects and pages | `content/projects/*.md`, `content/pages/*.md` |
| Asset store | Original images/PDFs, one flat folder, prefixed names | `assets/` at repo root (outside the SSG input dir) |
| Directory data | Per-folder defaults (layout, permalink, tags) | `content/projects/projects.11tydata.js` |
| Markdown engine | MD to HTML, with custom block syntax | markdown-it + plugin(s) (`markdown-it-container` or a small custom block rule) |
| Block renderers | Turn `::: grid 3` etc. into semantic HTML with CSS-class hooks | One small module per block type in `lib/blocks/` |
| Asset resolver | Map any image reference (relative `../assets/x.png`, bare name) to a real file by basename | Small function in `lib/assets.js` |
| Image pipeline | Resize, convert to AVIF/WebP, emit width/height, `srcset`, `<picture>` | `@11ty/eleventy-img` (transform plugin or shortcode) with disk cache |
| Collections | `projects`, `featured`, `byTag`, `tagList` | Eleventy `addCollection` / pagination over `tagList` |
| Layouts and partials | base, project, page, home, feed, tag-index | Nunjucks or Liquid (or WebC); pick the one the owner knows (Liquid ~ Jekyll) |
| CSS | Brutalist responsive grid, no layout JS | Hand-written CSS files, `@layer`-ordered, copied or lightly concatenated |
| Embeds | Video, YouTube/Vimeo, itch.io iframes | Block renderers producing `<iframe loading="lazy">` or `<video controls>` |
| CI/CD | Build, cache, deploy | GitHub Actions: checkout, setup-node, restore cache, build, upload-pages-artifact, deploy-pages |

## Recommended Project Structure

```
.
├── assets/                       # ONE shared folder; plugin-prefixed names; originals
│   ├── hollow-knight-ui-01.png
│   └── cv-2026.pdf               # student PDFs also here (copied through, not resized)
├── content/
│   ├── projects/
│   │   ├── projects.11tydata.js  # layout: project.njk, tags: ["projects"], permalink
│   │   └── my-game.md
│   ├── pages/
│   │   ├── pages.11tydata.js     # layout: page.njk
│   │   ├── about.md
│   │   └── student-work.md       # excluded from feed by simply not living in projects/
│   └── index.md                  # home; reads `featured` collection
├── src/                          # SSG input dir (templates, css); content can be input instead, see note
│   ├── _includes/layouts/{base,project,page,home,feed,tag}.njk
│   ├── _includes/partials/{card,nav,footer}.njk
│   ├── _data/site.js             # title, url, nav
│   └── css/{reset,tokens,layout,blocks,type}.css
├── lib/
│   ├── markdown.js               # builds the markdown-it instance
│   ├── blocks/{grid,full,columns,video,itch,gallery}.js
│   ├── assets.js                 # basename resolver, build-fails on missing file
│   └── images.js                 # eleventy-img config (widths, formats, cache dir)
├── eleventy.config.js
├── .cache/                       # gitignored; eleventy-img output/meta cache
├── .github/workflows/deploy.yml
└── package.json
```

### Structure Rationale

- **`assets/` at repo root, not inside the input dir:** the paste plugin owns that path and filenames. The build reads originals from there and never publishes them as-is. Only hashed, resized derivatives land in `_site/img/`.
- **Content separate from templates:** `content/` holds only things the owner writes daily. Keep `content/` the Eleventy input if possible (set `dir.input = "content"`, `dir.includes = "../src/_includes"`). Either layout works; pick one in phase 1 and don't churn it.
- **`lib/` for custom code:** block parsing and image config are the only real "software" in the repo. Isolating them makes them unit-testable without Eleventy.
- **Folder = type:** `projects/` vs `pages/` determines layout and feed membership through directory data. Student work is a plain page, so it is out of the feed with no flag logic.

## Front Matter Schema

```yaml
---
title: "Project Title"          # required
date: 2026-03-14                # required for projects; feed sort (desc) fallback
tags: [games, ux]               # required for projects; controlled vocab (see below)
summary: "One line for cards and meta description"   # recommended
cover: hollow-knight-ui-01.png  # basename in assets/, resolved by asset resolver; also og:image
coverAlt: "Screenshot of ..."   # required if cover set (build warns/fails otherwise)
featured: true                  # optional, default false
order: 2                        # only meaningful when featured; lower first
draft: false                    # optional; skip in production builds
feed: false                     # optional; false = exclude from main feed (default true)
---
```

Decisions:
- **Do not use `tags: projects` as the collection key by itself.** Eleventy's `tags` field creates collections per tag. Use a directory-data tag (`"projects"`) for the all-projects collection and a separate field if you want to keep user tags clean. Common trap: the internal tag shows up in the tag index. Filter it out in `tagList`.
- **Validate at build time** in a small `eleventyComputed`/collection step: unknown tag, missing cover alt, featured without order, missing asset file all fail the build with the filename. Cheap, and prevents silent broken pages.
- **Tag vocabulary:** keep a list in `_data/site.js` (graphic, ux, art, games). Unknown tags fail the build; this prevents `Games` vs `games` splits.
- **Featured sort:** `featured` collection = projects where `featured` is true, sorted by `order` ascending, then date descending as tie-break. Items with no `order` go last.
- **`feed: false`** is the escape hatch for future cases (e.g. a student-work project later). v1 does not need it for student work because that is a page, but the flag costs nothing.

## Architectural Patterns

### Pattern 1: Fenced block syntax parsed at the markdown layer

**What:** Layout blocks are written as container fences and parsed by markdown-it into tokens, rather than shortcodes in templates or raw HTML. The content inside is ordinary markdown (images, captions), so VS Code's paste plugin works unchanged.

```markdown
::: grid 3
![alt one](../assets/proj-01.png)
![alt two](../assets/proj-02.png)
![alt three](../assets/proj-03.png)
:::

::: full
![Wide shot](../assets/proj-04.png)
:::

::: video https://youtu.be/xxxx
:::

::: itch https://itch.io/embed/123456 | 552x167
:::
```

**When to use:** Always for layout blocks. The paste plugin emits `![](path)`, so images stay standard markdown and remain legible in VS Code's preview and on GitHub.
**Trade-offs:** Needs a small custom plugin (markdown-it-container handles the fence and info string; per-block renderers are about 20 lines each). Nesting is deliberately unsupported in v1. Prefer a flat block list; each block is a `<div class="block block--grid" data-cols="3">` or better a semantic `<figure>`/`<section>`.
**Alternative considered:** Eleventy paired shortcodes (`{% grid %}`). Works, but breaks markdown preview, and markdown inside shortcodes needs extra handling. Not recommended.

```js
// lib/markdown.js (sketch)
import MarkdownIt from "markdown-it";
import container from "markdown-it-container";
export default function build() {
  const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
  for (const [name, render] of Object.entries(blocks)) {
    md.use(container, name, {
      validate: (p) => p.trim().split(/\s+/)[0] === name,
      render: (tokens, i) => tokens[i].nesting === 1
        ? render.open(tokens[i].info.trim().split(/\s+/).slice(1))
        : render.close(),
    });
  }
  return md;
}
```

### Pattern 2: Parse produces plain `<img>`; image transform runs on final HTML

**What:** The markdown layer emits ordinary `<img src="../assets/x.png" alt="..">` (no image logic). A single HTML post-transform finds every local `<img>`, resolves the file through the asset resolver, and replaces it with `<picture>` with `srcset`, `width`, `height`, `loading="lazy"`, `decoding="async"`. Eleventy's `eleventyImageTransformPlugin` does exactly this and `@11ty/eleventy-img` is the engine (VERIFY current options and path-resolution rules, including how a `../assets/` path resolves from a file in `content/`).
**When to use:** Always. Block renderers don't need to know about processing, and `sizes` hints can come from a `data-` attribute or from the block context (e.g. grid-3 gets smaller `sizes`).
**Trade-offs:** Transform is whole-output so it sees images from layouts too (cover images on cards). Per-block `sizes` needs a convention: the block renderer sets `sizes` on the `<img>`, and the transform respects an existing `sizes`.

### Pattern 3: Asset resolution by basename

**What:** The resolver ignores the directory part of a reference and looks up the basename in `assets/` (built once into a Map at startup). Handles `../assets/x.png`, `/assets/x.png`, and bare `x.png` (front matter `cover`). It throws with the referencing file on a miss and on duplicate basenames.
**Why:** The paste plugin's relative path depends on how deep the markdown file is. Basename lookup is immune to that.

### Pattern 4: Directory data drives type, not front matter repetition

**What:** `projects.11tydata.js` sets `layout`, internal tag, permalink (`/projects/{{ page.fileSlug }}/`). Authors never write `layout:` in a project.

### Pattern 5: Native-element lightbox

**What:** Wrap each content image in `<a href="/img/full-hash.jpg">` pointing at the largest generated derivative (not the multi-MB original). Optionally enhance with `<dialog>` (the zero-JS option is `:target`-based CSS or simply a link to the image). Recommendation: start with plain link-to-large-derivative (zero JS, fully accessible), add `<dialog>` + about 15 lines of JS later only if wanted.

## Image Pipeline

| Question | Recommendation | Confidence |
|----------|----------------|------------|
| Originals location | Plain git in `assets/`, with a paste-time habit/limit (e.g. cap at ~3000 px long edge, PNG screenshots OK) | MEDIUM |
| Git LFS | Avoid for v1. GitHub's free LFS bandwidth quota (about 1 GB/month at last check; VERIFY) is consumed by every CI checkout that pulls LFS objects, so a few image-heavy builds can exhaust it | MEDIUM |
| External storage (R2/B2/S3) | Escape hatch if repo passes a few GB. Would add a fetch step before build, and break "clone and build" simplicity | MEDIUM |
| Output formats | AVIF + WebP + JPEG fallback for photos; PNG/lossless webp for UI screenshots if quality matters. Widths roughly 400/800/1200/1800/2400 | MEDIUM |
| Output location | `_site/img/` with hashed filenames (`urlPath: "/img/"`) so they can be cached long-term | HIGH |
| Cache | eleventy-img keeps a disk cache keyed by source file content/options. Persist `.cache/` and the output img dir between CI runs with `actions/cache` keyed on a hash of `assets/**` plus `lib/images.js` (restore-keys fallback to latest). Without it every build re-encodes AVIF, which is the slowest step | MEDIUM |
| Size budget | Published site must stay under 1 GB. Estimate: images x ~5 widths x 3 formats. Limit the width set and the AVIF + WebP pair (drop JPEG fallback) if size becomes an issue. Add a CI step that prints `du -sh _site` | MEDIUM |
| Unused assets | Only referenced images are processed (transform is demand-driven), so a big `assets/` folder with unused files costs no build time | MEDIUM |
| PDFs/video files | Passthrough copy only the referenced ones, or copy `assets/*.pdf` wholesale (small). Self-hosted video should be short and compressed; prefer YouTube/Vimeo for anything large (100 MB per file Pages limit) | HIGH |

Git history caveat: images committed once stay in history forever. Advise compressing before the first commit, since rewriting history later is painful.

## CSS Architecture

No preprocessor needed. Plain CSS files concatenated or linked, ordered with `@layer reset, tokens, base, layout, blocks, utilities;`.

- **Tokens:** `:root { --gap: 1rem; --measure: 70ch; --page-pad: clamp(1rem, 4vw, 3rem); }`
- **Page grid with full-bleed built in** (the standard "breakout" grid; no JS, no negative margins):

```css
.content {
  display: grid;
  grid-template-columns:
    [full-start] minmax(var(--page-pad), 1fr)
    [content-start] minmax(0, var(--measure))
    [content-end] minmax(var(--page-pad), 1fr)
    [full-end];
}
.content > * { grid-column: content; }
.content > .block--full { grid-column: full; }
.content > .block--wide { grid-column: content-start / span 1; } /* or a 'wide' track */
```

  Because each markdown block becomes a direct child of the content grid, a block opts out of the text column just by switching `grid-column`. This avoids the `100vw` + negative margin technique, which causes horizontal scrollbars from the vertical scrollbar width. Prefer the named-lines technique.
- **Gallery grids:** `.block--grid { display: grid; grid-template-columns: repeat(var(--cols, 3), 1fr); gap: var(--gap); }`. The block renderer sets `style="--cols:3"` or a `data-cols` attribute. Collapse using **container queries**, not viewport media queries, so a grid behaves the same inside any column width: `.block { container-type: inline-size; }` then `@container (max-width: 40rem) { .block--grid { grid-template-columns: repeat(min(var(--cols), 2), 1fr);} }`. Alternatively, `repeat(auto-fit, minmax(min(100%, 16rem), 1fr))` gives breakpoint-free responsiveness; use that for the default "gallery" and explicit column counts for "grid N". Container queries have broad browser support as of 2023+ (HIGH).
- **Aspect ratio and layout shift:** `img { max-inline-size: 100%; block-size: auto; }` with the `width`/`height` attributes from the pipeline gives the browser the intrinsic ratio before load.
- **Brutalist / a11y:** system or one webfont; visible focus outlines (don't remove), `prefers-reduced-motion` needs nothing as there is no motion, high contrast tokens, underlined links.
- **Embeds:** `.embed { aspect-ratio: 16/9; inline-size: 100%; } .embed iframe { inline-size:100%; block-size:100%; border:0 }`. itch.io embeds have fixed sizes; wrap in a container with `max-inline-size` and the author-provided dimensions.

## Collections

| Collection | Definition | Used by |
|------------|------------|---------|
| `projects` | All items in `content/projects/`, `draft !== true` in prod, `feed !== false`, sorted by `date` desc | Feed page, prev/next |
| `featured` | `projects` filtered `featured === true` (do NOT apply `feed:false` here? decide), sorted by `order` asc, then date desc | Homepage |
| `tagList` | Unique tags from `projects`, minus internal tags, sorted alphabetically | Tag nav, tag page generation |
| `byTag` | Not a separate collection; use Eleventy pagination over `tagList` with `size: 1` to generate `/tags/<tag>/` pages, each filtering `projects` | Tag pages |

Tag slugs: use a `slugify` filter, and fail on collisions. Tag pages and the feed share the `card` partial.

## Data Flow

### Build Flow

```
content/*.md ──▶ front matter + dir data merge ──▶ validate (tags, cover alt, order)
      │
      ▼
markdown-it + block plugin ──▶ HTML fragments with plain <img> and block wrappers
      │
      ▼
layout render (base ▸ project/page/home/feed/tag)  ◀── collections (projects, featured, tagList)
      │
      ▼
HTML transform: asset resolver ▸ eleventy-img (cache) ▸ <picture>/<img> + lightbox <a>
      │
      ▼
_site/ (html, css, img/, pdfs)  ──▶ upload-pages-artifact ──▶ deploy-pages
```

### Key Data Flows

1. **Authoring flow:** paste image into `.md` → plugin writes `assets/<prefix>-name.png` and inserts `![](../assets/...)` → author wraps in `::: grid 3` → push → CI.
2. **Image flow:** reference → basename lookup → original in `assets/` → resized derivatives in `_site/img/` (+ cache) → `<picture>` markup. The original never ships.
3. **Homepage flow:** front matter `featured`/`order` → `featured` collection → home layout → cards linking to project pages (cover resolved through the same image pipeline).
4. **Feed/tag flow:** `projects` collection → paginate `tagList` → one page per tag + one global feed; all use the same card partial.

## Deploy Pipeline

```yaml
# .github/workflows/deploy.yml (sketch)
on: { push: { branches: [main] }, workflow_dispatch: {} }
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - uses: actions/cache@v4
        with:
          path: |
            .cache
            _site/img
          key: img-${{ hashFiles('assets/**', 'lib/images.js') }}
          restore-keys: img-
      - run: npm run build
      - run: du -sh _site
      - uses: actions/upload-pages-artifact@v3
        with: { path: _site }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages }
    steps:
      - uses: actions/deploy-pages@v4
```

(Action major versions drift quickly; VERIFY current versions when writing the file.) Notes:
- Set Pages source to "GitHub Actions" in repo settings; no `gh-pages` branch needed.
- If hosted at `user.github.io/repo`, the site needs a path prefix; use a custom domain or a `<user>.github.io` repo to avoid it. Eleventy has `pathPrefix` and the HTML-base plugin; confirm which early because it affects every URL the image pipeline writes.
- Restoring `_site/img` along with `.cache` matters: the cache stores metadata, and the output files must also exist for the artifact. (VERIFY whether the eleventy-img disk cache alone repopulates outputs without re-encoding.)
- Optional: a PR build job (build only, no deploy) as a link/validation check.

## Anti-Patterns

### Anti-Pattern 1: Per-project image folders / copying the whole `assets/` to `_site`
**What people do:** Passthrough-copy the originals.
**Why it's wrong:** Ships multi-MB originals, blows the 1 GB cap, defeats the pipeline.
**Do this instead:** Publish only derivatives; link the lightbox to the largest derivative.

### Anti-Pattern 2: Shortcodes or raw HTML for layouts
**What people do:** `{% gallery %}` or `<div class="grid">` in markdown.
**Why it's wrong:** Slower to type, breaks previews, hard to restyle later.
**Do this instead:** Fence syntax, with raw HTML allowed as fallback (`html: true`).

### Anti-Pattern 3: `100vw` full-bleed hack
**What people do:** `width:100vw; margin-left:calc(50% - 50vw)`.
**Why it's wrong:** Horizontal scroll with classic scrollbars, fragile inside nested containers.
**Do this instead:** Named-line content grid (above).

### Anti-Pattern 4: Reprocessing every image on every CI run
**What people do:** No cache between builds.
**Why it's wrong:** AVIF encoding of hundreds of images takes many minutes; slow feedback hurts the core value (write, push, live).
**Do this instead:** Cache keyed on `assets/**` hash with restore-keys; also keep local dev on a fast mode (fewer formats/widths, e.g. env var).

### Anti-Pattern 5: Putting LFS in the CI path
**What people do:** Track `assets/**` with LFS for repo size.
**Why it's wrong:** Free LFS bandwidth gets consumed by CI checkouts; builds start failing mid-month.
**Do this instead:** Plain git until size demands otherwise, then external storage.

### Anti-Pattern 6: Silent failures on bad references
**What people do:** Missing image renders as a broken `<img>`.
**Do this instead:** Resolver throws with file and line context; build fails in CI.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| ~20 projects, ~300 images | Everything above is comfortable. Cold build a few minutes, warm build seconds |
| ~100 projects, ~2000 images | Repo size (originals) and `_site` size (<1 GB) are the limits. Trim widths/formats, cap original sizes |
| Beyond | Move originals to external storage, build images in a separate cached step, or switch host to Cloudflare Pages/Netlify (no change to the source structure) |

First bottleneck: cold CI image encoding (fix: cache). Second: published-size cap (fix: fewer variants, compress originals before committing).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| YouTube/Vimeo | `::: video <url>` renders iframe (`youtube-nocookie.com`, `loading="lazy"`, `title` attr) | Consider click-to-load facade only if page weight matters; that needs JS, so defer |
| itch.io | `::: itch <embed-url> | WxH` renders iframe | Needs the numeric embed id/URL from itch's widget page; set `title` for a11y; keyboard focus into iframes is a known a11y rough edge |
| GitHub Pages | Actions artifact deploy | 1 GB site, 100 MB per file, soft bandwidth limits |
| Paste-image plugin | Convention only (writes to `assets/`) | Build must not assume anything beyond the prefixed basename being unique |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Markdown plugin ↔ image pipeline | Via emitted HTML only (`<img>` + optional `sizes`) | Keep decoupled so each can be tested alone |
| Content ↔ templates | Front matter schema + collections | Schema validated at build time |
| Templates ↔ CSS | Class names and CSS custom properties (`--cols`) | Document block class names in one place |
| Build ↔ CI | `npm run build` produces `_site/`; cache dirs | CI knows nothing else |

## Suggested Build Order (dependencies)

1. **Skeleton and deploy.** SSG config, base layout, one page, GitHub Actions deploying to Pages (including path-prefix/domain decision). *Depends on:* nothing. Proves the push-to-live loop first, and de-risks hosting.
2. **Content model.** `content/projects|pages`, directory data, front matter schema and build-time validation, project and page layouts. *Depends on:* 1.
3. **Asset resolver + image pipeline (no blocks yet).** Basename resolution from `assets/`, `<picture>` transform on plain markdown images, local fast mode, CI cache. *Depends on:* 2. This is the riskiest, slowest piece; do it before layout blocks so blocks can emit plain `<img>`.
4. **Block syntax parser and block renderers.** `grid N`, `full`, text/columns; then `video` and `itch` embeds; raw HTML fallback verified. *Depends on:* 3 (images inside blocks), and shares CSS with 5.
5. **CSS system.** Tokens, content grid with full-bleed, block styles, container queries, type, a11y pass. *Depends on:* block class contract from 4. Develop incrementally alongside 4, finalize here.
6. **Collections and listing pages.** `projects` feed, `tagList` + tag pages, `featured` ordered homepage, card partial. *Depends on:* 2 (schema), 3 (cover images).
7. **Lightbox.** Link-to-large-derivative, then optional `<dialog>` enhancement. *Depends on:* 3, 4.
8. **Standalone pages and student work.** About/CV, student page with PDFs passthrough. *Depends on:* 2, 4 (can start after 2; low risk).
9. **Hardening.** Image-size/`du` budget check in CI, link check, accessibility audit (alt coverage, focus, contrast), PR build check, docs for the block syntax. *Depends on:* all.

Phases 6 and 8 are independent of 4/5/7 and can be reordered. The only strict chain is 1 → 2 → 3 → 4.

## Sources

- Training knowledge of Eleventy 2/3, `@11ty/eleventy-img`, markdown-it, markdown-it-container, and GitHub Pages Actions deployment (no live verification this session; MEDIUM)
- Full-bleed named-grid-lines pattern (Josh Comeau / Ryan Mulligan "breakout" grids, widely documented; MEDIUM)
- Container queries baseline support since 2023 (HIGH, general knowledge)
- Items to VERIFY at implementation: eleventy-img transform path resolution and cache behavior (https://www.11ty.dev/docs/plugins/image/), GitHub LFS free bandwidth quota, current `actions/*` major versions, Pages limits (https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

---
*Architecture research for: markdown-authored image-heavy static portfolio*
*Researched: 2026-10-28*
