# Phase 3: Browsing, Lightbox and Standalone Pages - Research

**Researched:** 2026-10-30
**Domain:** Eleventy 3.1.7 static site (collections, pagination, PostHTML transforms, markdown-it rules), native `<dialog>` progressive enhancement
**Confidence:** HIGH (every mechanism below was prototyped in a scratch copy of this repo and built; browser-support facts are cited from MDN)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Lightbox (IMG-05)**
- **D-01:** Every content image links to a large version, except images inside `::: full` blocks. This covers images in grid-2/3/4 and lone images in the text column, with or without a caption.
  - Full-bleed images are not wrapped in a link.
  - Card covers link to their project page, not to the lightbox.
  - Video posters are not wrapped.
- **D-02:** The link target is the largest variant the pipeline already makes: the 2400px width, or the image's own size if it's smaller. No extra size is generated, and originals in `assets/` are never published (IMG-03).
- **D-03:** Without JS, the link opens the large file directly. With JS, one shared `<dialog>` shows:
  - the large image, with the same alt text;
  - the caption (from the markdown `"title"`), when there is one;
  - a labelled Close button.
- **D-04:** The dialog closes on Escape, the Close button, or a click on the backdrop. Focus returns to the link that opened it. There is no animation (A11Y-01). This is the only JS on the site. Keep it small and progressive, so the page works the same if the script fails.

**Feed and tags (SITE-01, SITE-02)**
- **D-05:** The full feed lives at `/work/`, with every project newest first using the existing `projects` collection sort. Add `work` to `RESERVED_SLUGS`. — **Reversibility:** costly — a published URL, linked from the nav and possibly shared.
- **D-06:** Cards form a grid of cover images, about 3 across and collapsing on narrow screens, the same way grids do in Phase 2.
  - Each card shows the cover (`cover` + `cover_alt`), the title and the date exactly as written (Phase 1 D-07).
  - The whole card is one link to the project.
  - Tags don't appear on cards.
- **D-07:** One card partial is used by `/work/`, the tag pages and the homepage. Featured cards look the same as feed cards.
- **D-08:** A row of tag filter links sits at the top of `/work/` and of every tag page: All · <tag> · <tag> … The current one is marked with `aria-current="page"`. Tag pages live at `/tags/<tag>/` (Phase 1 D-05) and list that tag's projects newest first, using the same cards.
- **D-09:** A tag in the fixed list with no projects gets no page and no filter link.
- **D-10:** `src/_data/tags.js` changes from plain strings to slug + display label, e.g. `{ slug: "ux", label: "UX" }` or `graphic` → "Graphic design". URLs use the slug and the page shows the label. Tag validation (Phase 1 D-04) keeps working against the slugs.
- **D-11:** Project pages show a "Tags" row in the existing `<dl>` meta block. Each tag links to its tag page and uses its label.

**Homepage curation (SITE-03)**
- **D-12:** Featured projects are an ordered list of project slugs in one data file, `src/_data/featured.js` or `.json`. Order in the file is order on the page.
  - The build fails, naming the data file and the slug, when a slug doesn't match a project (success criterion 2).
  - A duplicate slug also fails the build.
- **D-13:** The homepage (`content/index.md`) shows:
  - a short intro the owner writes as the markdown body of `index.md`;
  - the featured card grid;
  - a link to all work (`/work/`).

**Nav and standalone pages (SITE-04, SITE-05)**
- **D-14:** The site header holds the owner's name, which links home, then **Work** (`/work/`), **CV** (`/cv/`) and **Teaching** (`/teaching/`). There is no About page. The current section is marked with `aria-current`.
- **D-15:** The CV is its own markdown page, `content/pages/cv.md` → `/cv/`. It's written freely in markdown and can link a PDF version using the PDF rule below.
- **D-16:** The Teaching / student-work page is `content/pages/teaching.md` → `/teaching/`. It's plain hand-written markdown: headings per course or term, plus lists of links and PDFs. Blocks still work. It lives in `pages/`, so it's never in the projects collection, the feed or the tag pages (SITE-05).
- **D-17:** PDFs live in the shared `assets/` folder and are linked with plain markdown, e.g. `[Syllabus](../../assets/syllabus.pdf)`. Any page can use this.
  - They resolve by basename through the existing asset resolver (Phase 1 D-11).
  - Only linked PDFs are published, never `assets/` wholesale.
  - A missing PDF fails the build, naming the `.md` file and the link (Phase 1 D-23).
  - The build adds the file type and size to the link text, e.g. "Syllabus (PDF, 1.2 MB)".

### Claude's Discretion
- How the owner's name in the header is stored. Prefer one value in a site data file. The header currently reads "Portfolio".
- A PDF size cap, and updating `scripts/check-assets.js` and `scripts/shrink.js` so PDFs are allowed in `assets/` and passed through unconverted. A PDF cap should sit well under GitHub Pages' 100 MB per file, like the 50 MB video cap in `lib/limits.js`.
- Animated GIFs in the lightbox. They should probably link to the GIF output itself so the animation survives.
- Whether the lightbox script is inline in `base.njk` or a small passthrough file loaded through the base-path helper. Use `showModal()` or invoker commands after checking browser support (research flag below).
- The dialog's sizing (fit to the viewport, no cropping) and its backdrop styling, within the Phase 2 tokens.
- The card grid's column count and breakpoints, the `sizes` value for card covers, and the card title and date typography.
- Eager vs lazy loading for the first row of cards.
- The homepage `<h1>` and the page titles for `/work/` and the tag pages.

### Deferred Ideas (OUT OF SCOPE)
- About page. The owner skipped it for v1, and the CV page covers SITE-04. It's easy to add later as `content/pages/about.md` plus a nav link.
- Prev/next inside the lightbox gallery. This was already "later" in research (FEATURES.md).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IMG-05 | Visitor can open any content image full-size: plain link to a large version that works without JS, enhanced to native `<dialog>` | PostHTML zoom plugin that reads the published `<picture>` after eleventy-img (Pattern 1); `lightbox.js` contract (Pattern 6); `dialog`/`showModal()` is Baseline widely available (MDN) |
| SITE-01 | Browse all projects in one feed, newest first | `content/work.njk` over existing `collections.projects` (sorted newest first); shared `cards.njk`/`card.njk` partials with `this.page`-relative cover paths (Pattern 3) |
| SITE-02 | Browse projects by tag on tag pages | `tagPages` collection + `content/tags.njk` paginated via `tags.11tydata.js`; **data-cascade trap on the `tags` key (Pitfall 1)** |
| SITE-03 | Owner picks and orders homepage projects; build fails on unknown slug | `src/_data/featured.js` + pure `resolveFeatured()` in `lib/validate.js` called by a `featured` collection (Pattern 5) |
| SITE-04 | Standalone pages (About/CV) as markdown | `content/pages/cv.md` rides existing `pages.11tydata.js` permalink rule; header nav in `base.njk` |
| SITE-05 | Student-work page with links + PDF downloads, never in feed/tags | `content/pages/teaching.md` (folder = type); PDF link rule in `lib/markdown.js` + `copyMedia` extension (Pattern 4) |
</phase_requirements>

## Summary

Phase 3 is almost entirely additive on top of the Phase 1/2 machinery, and every mechanism the plan needs was prototyped in a scratch copy of the repo and built successfully with Eleventy 3.1.7. The two non-obvious design findings are (1) the lightbox `href` cannot be known when markdown is rendered (the image file names contain a content hash generated later by `eleventy-img`), so the zoom link must be finished by a small PostHTML plugin that runs after the image transform and before the base-path rewrite; and (2) Eleventy's data cascade **merges** the global `tags` data array into every project's own `tags` front matter. That is already happening today with strings, and it would put objects into every project's tags when `src/_data/tags.js` becomes `{slug,label}`. Both have verified fixes below.

Everything else is standard Eleventy: a paginated template over a computed collection for tag pages, a collection for the featured list, a Nunjucks partial for cards (cover paths made page-relative with a filter that reads `this.page.inputPath`), a markdown-it link rule for PDFs that reuses `resolveAsset`, and an `eleventy.after` copy step modelled on `copyMedia`. The lightbox is one first-party classic script using native `showModal()`; invoker commands do not work on `<a>`, and `closedby` is "Limited availability", so neither is used.

The existing test suite (174 tests, 7 s, all green at start of research) is affected in a few known places: tests that assert "no `<script`", the CSS test that forbids `object-fit`/`aspect-ratio` on `img`, the "originals not published" test (PDFs), and the shared `makeSite` helper (it copies only a fixed list of `content/` files, and would copy the real `src/_data/featured.js` into every fixture site and break every build). See "Existing Tests Affected".

**Primary recommendation:** Emit `<a class="zoom">` + hidden suffix from the markdown renderer for zoomable images only; finish `href`/`data-width`/`data-height` in a `lib/zoom.js` PostHTML plugin at priority `-1.5`; set `eleventyConfig.setDataDeepMerge(false)` and compute `projectTags` in `projects.11tydata.js`; build `/work/`, `/tags/<slug>/` and the homepage from one `card.njk` partial; keep the dialog script to one dependency-free file.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Feed, tag pages, homepage grid, nav, tag row, standalone pages | Build time (Eleventy templates, `content/`, `src/_includes/`) | — | Static output; no runtime logic [VERIFIED: spike build] |
| Zoom link href and large-image choice | Build time (PostHTML plugin after eleventy-img) | — | Hashed output names only exist after the image transform runs [VERIFIED: spike, `img/J1QymkOpjn-308.webp`] |
| PDF link rewrite, size suffix, publishing | Build time (markdown-it core rule + `eleventy.after` copy) | CI guard `scripts/check-assets.js` | Same pattern as videos (`lib/media.js`) |
| Featured / tag / slug validation | Build time (`lib/validate.js`, collections throw) | — | PUB-04: fail the build with file-named messages |
| Lightbox dialog behaviour | Browser (one `defer` script, native `<dialog>`) | CDN/static (plain link works with no JS) | Only JS on the site (D-04); baseline is the plain `<a href>` |
| Base-path correctness (`/portfolio-test/` vs `/`) | Build time (`HtmlBasePlugin`, priority -2) | — | Rewrites `a[href]`, `script[src]`, `img[src]` after all other transforms [VERIFIED: spike output] |
| Hosting limits (100 MB/file, ~1 GB) | CI guard + shared caps in `lib/limits.js` | — | PDF cap added beside the video cap |

## Standard Stack

### Core
No new packages. Everything uses what is already in `package.json`.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @11ty/eleventy | 3.1.7 (installed) | Collections, pagination, `htmlTransformer.addPosthtmlPlugin` | Already the stack [VERIFIED: node_modules/@11ty/eleventy/package.json `"version": "3.1.7"`] |
| @11ty/eleventy-img | 7.1.1 (installed) | Cover + content image variants | Already the pipeline [VERIFIED: node_modules package.json] |
| markdown-it (bundled) | via Eleventy | PDF link rule, zoom wrapper | `installAssetResolver` / `installBlocks` already extend it |
| PostHTML (bundled with Eleventy) | via Eleventy | Zoom plugin | Same mechanism eleventy-img itself uses [VERIFIED: transform-plugin.js `addPosthtmlPlugin(options.extensions, posthtmlPlugin, { priority: -1 })`] |

### Supporting
| Item | Purpose | When to Use |
|------|---------|-------------|
| `node:test` + `test/helpers/site.js` | Build-level tests | All build-output assertions (existing pattern) |
| `node:vm` with a hand-rolled stub document | Unit-test `lightbox.js` without a browser | Dialog behaviour tests; no dependency needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Stub-DOM test of `lightbox.js` | `jsdom` 30.1.3 or `linkedom` 0.18.14 (both exist on npm) | Real DOM, but a new devDependency; Phase 1 packages required owner approval. Not recommended. Neither is installed (`ls node_modules` shows only dom-serializer/domhandler/domutils). Both are `[ASSUMED]` unvetted names here; if chosen, run `gsd-tools query package-legitimacy check` and add a `checkpoint:human-verify` task. |
| PostHTML zoom plugin | Calling `Image.statsSync()` from the markdown rule to predict URLs | Must replicate exact option set (widths, formats, `eleventy:formats` overrides for gif/png/svg) or URLs drift. The PostHTML approach reads the final published markup and cannot drift. |
| `setDataDeepMerge(false)` | Rename the data file (e.g. `tagDefs.js`) | Renaming removes the trap entirely but contradicts the wording in D-10 and the UI-SPEC ("editing `src/_data/tags.js` only"). Fallback if the owner prefers it. |

**Installation:** none.

## Package Legitimacy Audit

No external packages are installed in this phase. `package-legitimacy check` was not needed.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
content/projects/*.md ─┐                      src/_data/tags.js  (slug,label)      src/_data/featured.js (slugs)
content/pages/*.md  ───┤                              │                                    │
content/index.md  ─────┤                              ▼                                    ▼
                       │            lib/validate.js: validateTags / validateContent / resolveFeatured  ──► throws "file: message" (build fails)
                       ▼
        markdown-it core rules (lib/blocks.js, lib/markdown.js)
          • image tokens: figure / lone-image  ──► emit <a class="zoom"> + hidden " (full size)"   (not in ::: full, not decorative, not inline-in-text)
          • link tokens ending .pdf ──► resolveAsset ─► href=/pdf/<name>, text += " (PDF, 1.2 MB)", register in pdfs Map
                       │
                       ▼
        Eleventy collections:  projects (existing, newest first) ─► tagPages (tags with >=1 project) ─► featured (ordered, validated)
                       │
                       ▼
        Nunjucks templates + layout base.njk (header nav, Tags row, conditional <script>)
          /            home.njk ─► intro + h2 + cards.njk + "All work"
          /work/       work.njk ─► filters.njk + cards.njk(all projects)
          /tags/<s>/   tags.njk (paginate tagPages) ─► filters.njk + cards.njk(withTag)
          /cv/ /teaching/  pages/*.md (free markdown)
                       │
                       ▼   HTML transforms, descending priority
          eleventy-img (-1): <img> ─► <picture> with hashed /img/<hash>-<w>.webp|jpeg|gif
          lib/zoom.js (-1.5): a.zoom ─► href = largest published variant, data-width/height  (unwrap if no image)
          HtmlBasePlugin (-2): prefix every href/src with PATH_PREFIX
                       │
                       ▼
        _site/…  +  eleventy.after: copyMedia() copies videos, posters AND linked PDFs (_site/pdf/)
                       │
          browser:  plain <a href=large.webp>  ──(script runs)──►  one shared <dialog class="lightbox"> via showModal()
```

### Recommended Project Structure
```
content/
├── index.md                  # intro markdown; layout home.njk
├── index.11tydata.js         # eleventyComputed.title = site.name (JS, avoids double escaping)
├── work.njk                  # /work/
├── tags.njk                  # /tags/<slug>/  (paginated)
├── tags.11tydata.js          # pagination, alias "tag", title fn, permalink fn
├── lightbox.js               # passthrough → /lightbox.js
├── pages/{cv.md,teaching.md} # new, free markdown
└── projects/projects.11tydata.js   # + section:"work", + projectTags
lib/
├── zoom.js                   # PostHTML plugin
├── markdown.js               # + PDF link rule
├── blocks.js                 # + zoom wrapper on zoomable images
├── media.js                  # + pdfs Map, copied by copyMedia
├── limits.js                 # + PDF_EXTS, PDF_MAX_MB, PDF_MAX_BYTES
└── validate.js               # + work reserved, validateTags, resolveFeatured
src/_data/{tags.js,featured.js,site.js}
src/_includes/{base.njk,home.njk,card.njk,cards.njk,filters.njk}
```

### Pattern 1: Zoom link finished after the image transform (IMG-05, D-01, D-02)
**What:** The markdown side only decides *whether* an image is zoomable and writes `<a class="zoom">…<span class="visually-hidden"> (full size)</span></a>` around the image. The PostHTML plugin then sets `href`, `data-width`, `data-height` from the final `<picture>`.
**Why:** hashed file names are generated by eleventy-img during the HTML transform. [VERIFIED: spike build output `srcset="/portfolio-test/img/tdd_Dk7CQV-480.webp 480w, …-960.webp 960w, …-1600.webp 1600w"`]
**Ordering:** priority is descending. eleventy-img is `-1`, `HtmlBasePlugin` url transform is `-2`. Use `-1.5`. [VERIFIED: `node_modules/@11ty/eleventy-img/src/transform-plugin.js` (`priority: -1`) and `node_modules/@11ty/eleventy/src/Plugins/HtmlBasePlugin.js:140` (`priority: -2, // priority is descending`)]. Result in the spike: `href="/portfolio-test/img/J1QymkOpjn-308.webp"` (prefix added after my plugin ran).

Target selection, all verified in the spike build:
- Last candidate of the `<source type="image/webp">` srcset (eleventy-img lists widths ascending) for raster images.
- GIF: `img src` ends `.gif`, so take the last candidate of the `img srcset` if present, else `src`. Spike produced `href=".../XA9PMoxAvf-256.gif"`.
- SVG (`eleventy:formats="svg"`): no `<source>`, fall back to `img src`.
- `data-width`/`data-height` = the `<img>` `width`/`height` attributes (eleventy-img sets these to the largest variant: `width="1600" height="900"` for the 1600 variant).
- If no `<img>` is found (e.g. a failed or optional image), **unwrap** the anchor and drop the hidden suffix so no `href`-less `<a>` is left. `return { tag: false, content: [...] }` works. [VERIFIED: spike, raw `<a class="zoom"><span>raw</span>…` rendered as `<span>raw</span>`]

```js
// lib/zoom.js  — [VERIFIED: spike build, Eleventy 3.1.7]
const find = (nodes, tag) => {
  for (const n of Array.isArray(nodes) ? nodes : [nodes]) {
    if (!n || typeof n !== "object") continue;
    if (n.tag === tag) return n;
    const hit = n.content && find(n.content, tag);
    if (hit) return hit;
  }
  return null;
};
const candidates = (srcset) => srcset.split(",").map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);

export function zoomHref(a) {
  const img = find(a.content, "img");
  if (!img?.attrs?.src) return null;
  const pic = find(a.content, "picture");
  const fallback = img.attrs.srcset ? candidates(img.attrs.srcset).at(-1) : img.attrs.src;
  if (/\.gif($|\?)/i.test(img.attrs.src)) return { href: fallback, img };   // keep the animation
  const webp = pic && find(pic.content, "source");
  return { href: webp?.attrs?.srcset ? candidates(webp.attrs.srcset).at(-1) : fallback, img };
}

export function zoomPlugin() {
  return (tree) => {
    tree.match({ tag: "a", attrs: { class: "zoom" } }, (a) => {
      const hit = zoomHref(a);
      if (!hit) return { tag: false, content: (a.content ?? []).filter((n) => !(n && n.attrs?.class === "visually-hidden")) };
      a.attrs.href = hit.href;
      a.attrs["data-width"] = hit.img.attrs.width;
      a.attrs["data-height"] = hit.img.attrs.height;
      return a;
    });
    return tree;
  };
}
// eleventy.config.js
// eleventyConfig.htmlTransformer.addPosthtmlPlugin("html", zoomPlugin, { priority: -1.5 });
```

**Which images get the wrapper (renderer side, `lib/blocks.js`):**
- In the `paragraph_open` case: images in `::: grid-2/3/4` (the `open` branch with `open !== "full"`), titled lone images (the `titled` figure branch), and untitled lone images (the `else` branch that adds `lone-image`). Set `img.meta.zoom = true` there; skip when `open === "full"`.
- Decorative is decided later (the `inline` case calls `makeDecorative`), so check `!token.meta.decorative` at **render time** in the `md.renderer.rules.image` override, not at tag time.
- Do not wrap images that are mixed with text in one paragraph, are inside a markdown link, a list, a quote or a heading (they never reach those branches because `isImageOnly` is false or `link_open` is present). This avoids nested `<a>`.
- The lone-untitled branch currently uses `defaultImage`; wrap there too (the override currently returns `defaultImage(...)` unchanged for non-figure tokens). Cards are not markdown, so they are untouched. Video posters are not `<img>`.
- Markdown-only unit tests (blocks.test.js) will now see `<a class="zoom">` **without** `href`, because the href is added in the HTML transform. That is expected.

### Pattern 2: `tags` data-cascade trap and the tag model (D-10, D-11)
**Finding:** Eleventy merges the global `tags` data with a template's own `tags`. Verified with the repo's own data: a project with `tags: [games]` rendered `tags = [{…4 objects…}, "games"]` once `src/_data/tags.js` was changed to objects. With plain strings (today) every project already silently carries all four tags. [VERIFIED: spike, `PROJECT tags=[…{"slug":"games","label":"Games"},"games"]`]
**Fix (verified):** `eleventyConfig.setDataDeepMerge(false)` → project `tags` is again only its own list (`PROJECT tags=["games"]`). Keep the taxonomy at `src/_data/tags.js` (honours D-10 and the UI-SPEC wording).
**Consequence:** pages without front matter `tags` now see the *global* object list as `tags`. Never test `{% if tags %}` in a layout to detect a project. Use a computed value from the project directory data file:

```js
// content/projects/projects.11tydata.js — [VERIFIED: spike build]
import tagDefs from "../../src/_data/tags.js";
export default {
  layout: "base.njk",
  section: "work",                       // for aria-current on the Work nav item
  eleventyComputed: {
    permalink: (data) => { /* unchanged */ },
    // NOTE: do NOT write [].concat(data.tags): data is a Proxy inside eleventyComputed and
    // concat throws "Cannot convert a Symbol value to a string" [VERIFIED: spike]
    projectTags: (data) =>
      (Array.isArray(data.tags) ? data.tags : [data.tags])
        .map((slug) => tagDefs.find((t) => t.slug === slug)).filter(Boolean),
  },
};
```
`base.njk` then uses `projectTags` for the Tags row and in the `<dl>` guard: `{% if role or client or tools or year or link or projectTags %}`. Pages have no `projectTags`, so they keep "no empty `<dl>`". Single-string `tags: art` (which validation allows) works with the `Array.isArray` form [VERIFIED: spike].

Tag row markup (verified output): `<dt>Tags</dt><dd><a href="/portfolio-test/tags/art/">Art</a>, <a href="/portfolio-test/tags/games/">Games</a></dd>`, in front-matter order.

### Pattern 3: Cards, work feed, tag pages (SITE-01, SITE-02, D-06..D-09)
All verified in the spike (`/work/` listing 2 projects newest first, `/tags/art/`, `/tags/games/` generated, `graphic` and `ux` produced no page).

```js
// eleventy.config.js additions
import path from "node:path";
import tagDefs from "./src/_data/tags.js";

eleventyConfig.setDataDeepMerge(false);

// cover is written relative to the PROJECT file; the image transform resolves relative to the CONSUMING page,
// so rebuild the path from the page that is rendering the card.
eleventyConfig.addFilter("assetSrc", function (cover) {
  const abs = resolveAsset(String(cover));                       // validated earlier; never null for a project that passed validation
  return path.relative(path.dirname(this.page.inputPath), abs);  // `this.page` works in Nunjucks filters [VERIFIED: spike]
});
eleventyConfig.addFilter("withTag", (items, slug) => items.filter((i) => [].concat(i.data.tags ?? []).includes(slug)));
eleventyConfig.addCollection("tagPages", (api) => {
  const projects = api.getFilteredByGlob("content/projects/*.md");
  return tagDefs.filter((t) => projects.some((p) => [].concat(p.data.tags ?? []).includes(t.slug))); // order = tags.js order (D-09, D-10)
});
```
(Outside `eleventyComputed`, plain `[].concat` is fine; it is only the computed-data Proxy that breaks it.)

```njk
{# src/_includes/card.njk — one <a>, no heading, no tags (D-06). `first` is set by cards.njk #}
<li><a class="card" href="{{ project.url }}"><img src="{{ project.data.cover | assetSrc }}" alt="{{ project.data.cover_alt }}" sizes="(min-width: 90em) 416px, (min-width: 60em) 30vw, (min-width: 40em) 45vw, 90vw"{% if first %} loading="eager" fetchpriority="high"{% endif %}><span class="card-title">{{ project.data.title }}</span><time class="card-date" datetime="{{ project.data.date }}">{{ project.data.date }}</time></a></li>
```
```njk
{# src/_includes/cards.njk — expects `items`; loop.first survives {% include %} [VERIFIED: spike, only first card had loading="eager"] #}
<ul class="cards">
{%- for project in items %}{% set first = loop.first %}{% include "card.njk" %}{% endfor %}
</ul>
```
- `loading="lazy"` is the pipeline default (`htmlOptions.imgAttributes`), so only the first card needs attributes.
- `src/_includes/filters.njk` (shared by work and tag pages): `All` + one link per `collections.tagPages`, `aria-current="page"` on `All` when `current` is empty, else on the matching slug. Omit the whole `<nav>` when `collections.tagPages | length == 0`.
- `/work/` with zero projects: render `<p>No projects yet. Check back soon.</p>` instead of the `<ul>`.

**Tag pages** (paginate a collection of `{slug,label}` objects, not of project items). Paginating collection items that carry `data.collections` risks circular-structure problems; the alias here holds only slug+label and the template filters projects itself. [ASSUMED risk for the circular case; the recommended form was verified]
```js
// content/tags.11tydata.js — [VERIFIED: spike]
export default {
  layout: "base.njk",
  section: "work",
  pagination: { data: "collections.tagPages", size: 1, alias: "tag" },
  eleventyComputed: {
    title: (data) => `Work: ${data.tag.label}`,
    permalink: (data) => `/tags/${data.tag.slug}/index.html`,
  },
};
```
`content/tags.njk` body: `{% set current = tag.slug %}{% include "filters.njk" %}{% set items = collections.projects | withTag(tag.slug) %}{% include "cards.njk" %}`.
- **Titles must be JS functions.** A YAML `eleventyComputed: title: "Work: {{ tag.label }}"` renders then gets escaped again by `{{ title }}` in `base.njk`: label `R&D <x>` produced `<title>Work: R&amp;amp;D &amp;lt;x&amp;gt;</title>`; the JS-function form produced `R&amp;D &lt;x&gt;` (correct). [VERIFIED: spike]
- Empty `tagPages` produces zero pages (no `generatePageOnEmptyData`). [VERIFIED: spike produced only `art`, `games` directories]

### Pattern 4: PDF links (SITE-05, D-17)
A `link_open` branch in the existing `asset_resolver` core rule, using the same `resolveAsset` and `loc.fail` (error text per UI-SPEC: `{file}: PDF not found in assets/: {link}`). It rewrites the href to `/pdf/<encoded basename>`, inserts a `text` token `" (PDF, 1.2 MB)"` before the matching `link_close`, and registers the file for publishing. [VERIFIED: spike output `<a href="/portfolio-test/pdf/syllabus.pdf">Syllabus (PDF, 1.2 MB)</a>`; nested emphasis `Bold <em>one</em> (PDF, 1.2 MB)` also correct.]

```js
// lib/markdown.js (inside the children loop, before the image branch) — [VERIFIED: spike]
if (t.type === "link_open") {
  const href = t.attrGet("href") ?? "";
  if (/\.pdf$/i.test(href.split(/[?#]/)[0]) && !REMOTE.test(href)) {
    const abs = resolveAsset(href);
    if (!abs) loc.fail(block, `PDF not found in assets/: ${href}`);
    const bytes = fs.statSync(abs).size;
    if (bytes > PDF_MAX_BYTES) loc.fail(block, `PDF ${path.basename(abs)} is ${(bytes / 1048576).toFixed(1)} MB; the limit is ${PDF_MAX_MB} MB.`);
    const size = bytes < 1048576 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
    registerPdf(abs);                                             // new export in lib/media.js
    t.attrSet("href", `/pdf/${encodeURIComponent(path.basename(abs))}`);  // HtmlBasePlugin adds the prefix
    // find matching link_close (depth-aware), splice a text token ` (PDF, ${size})` before it
  }
  continue;
}
```
- Unit conversion: UI-SPEC says KB under 1 MB, one decimal MB otherwise, 1024-based, same as `lib/limits.js`. The existing video error uses `(bytes / 1048576).toFixed(1)`; reuse that.
- Publishing: add `pdfs` Map and `registerPdf()` to `lib/media.js`; extend the early return in `copyMedia` (`if (!videos.size && !posters.size) return;` → also check `pdfs`); copy to `path.join(outputDir, "pdf")`. The Maps are additive across rebuilds so `npm start` keeps earlier files (same as videos).
- Remote `.pdf` URLs and raw HTML `<a href="…pdf">` are untouched (AUTH-04). A raw-HTML relative PDF link will simply 404; document that the markdown form is the supported one.
- Caps: add `PDF_EXTS = new Set([".pdf"])`, `PDF_MAX_MB = 25`, `PDF_MAX_BYTES` to `lib/limits.js` (no imports in that file, scripts load it).
- `scripts/check-assets.js`: today a `.pdf` is not in `UNCONVERTED`/`RASTER`, but falls to the generic `size > MAX_BYTES (10 MiB)` branch, so a 10-25 MB PDF is wrongly rejected. Add a `PDF_EXTS` branch beside the `VIDEO_EXTS` branch (size vs `PDF_MAX_BYTES`, then `continue`, never decode). [VERIFIED: scripts/check-assets.js read this session]
- `scripts/shrink.js`: `actionFor(".pdf")` returns `none`/`rename` already (no conversion). Add an early `fail()` for PDFs over the cap next to the "bigVideos" check so the commit hook explains it, and extend the final guidance line in `check-assets.js`.

### Pattern 5: Featured list (SITE-03, D-12)
`src/_data/featured.js` exports an array of slugs. A `featured` collection resolves them in file order and throws with the UI-SPEC messages. Put the logic in a pure function in `lib/validate.js` (mirrors `validateContent`, unit-testable without a build):

```js
export function resolveFeatured(slugs, projects /* [{slug, item}] */) {
  const errors = [], seen = new Set(), out = [];
  for (const s of slugs) {
    if (typeof s !== "string") { errors.push(`src/_data/featured.js: every entry must be a project slug string; got ${JSON.stringify(s)}.`); continue; }
    if (seen.has(s)) { errors.push(`src/_data/featured.js: "${s}" is listed more than once. List each featured project once.`); continue; }
    seen.add(s);
    const hit = projects.find((p) => p.slug === s);
    if (!hit) errors.push(`src/_data/featured.js: featured project "${s}" does not match any project in content/projects/. Fix the spelling or remove it from the list.`);
    else out.push(hit.item);
  }
  return { errors, items: out };
}
```
- The project slug is `data.slug || page.fileSlug` (this is what the permalink uses in `projects.11tydata.js`), not the file name alone. Build `{slug, item}` pairs from `api.getFilteredByGlob("content/projects/*.md")` with that rule.
- Throw `new Error(errors.join("\n"))` from `addCollection("featured", …)`, the same way `_validated` throws. A collection that throws fails the build with exit code non-zero and the message printed (existing `content-errors` tests rely on this).
- `addValidation` also validates `tags.js` shape once: every entry has non-empty `slug` matching `^[a-z0-9-]+$`, non-empty `label`, no duplicate slugs; message `src/_data/tags.js: every tag needs a slug and a label, e.g. { slug: "ux", label: "UX" }.` Pass `validateContent` the **slugs** (`tags.map(t => t.slug)`) so its existing message `allowed: graphic, ux, art, games` and all current unit tests stay unchanged.
- The slug check matters for safety: tag slugs become output paths in `tags.11tydata.js` (`/tags/${slug}/index.html`).

### Pattern 6: Lightbox script (IMG-05, D-03, D-04)
`content/lightbox.js`, one classic IIFE (no module, no globals, no timers, no `requestAnimationFrame`, no `innerHTML`). Behaviour table is in UI-SPEC "Lightbox Contract"; implementation notes from research:
- Feature gate: `if (typeof HTMLDialogElement !== "function") return;` and do nothing else (plain links keep working). `<dialog>`/`showModal()` is Baseline widely available since March 2022. [CITED: developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal]
- Do **not** use invoker commands (`command`/`commandfor` exist only on `<button>`) and do **not** rely on `closedby`: MDN labels `closedBy` "Limited availability. This feature is not Baseline". [CITED: developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/closedBy]
- One delegated `click` listener on `document`; ignore when `e.defaultPrevented`, `e.button !== 0`, or any of `metaKey/ctrlKey/shiftKey/altKey`; `const link = e.target.closest("a.zoom")`.
- Create the `<dialog>` lazily on first open and reuse it. Build it with `createElement` + `textContent` (never `innerHTML`): alt text and captions are author text.
- Fill: `img.alt = thumb.alt`; `img.src = link.href`; `img.width/height = Number(link.dataset.width/height)`; caption = the enclosing `figure`'s `figcaption.textContent`, else `figcaption.hidden = true`.
- MDN: `showModal()` focuses "the first nested focusable element"; recommends `autofocus` on the Close button. MDN does **not** document focus return on close, so keep the explicit `opener.focus()` in the `close` handler. [CITED: developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog]. Put the Close button first in the DOM and give it `autofocus`.
- Escape closes natively (`cancel` then `close`); modal dialogs are implicitly `aria-modal="true"` and make the rest of the page inert. [CITED: same MDN page]. No Escape code needed.
- Backdrop click: `dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); })`. Because the dialog is a full-viewport surface, this is "click on empty space".
- Image `error`: `dialog.close(); location.href = link.href;` (href is build-generated and same-origin).
- On `close`: `opener.focus(); img.removeAttribute("src")` (clearing avoids flashing the previous image).
- Load only where needed, via `base.njk`: `{% if '<a class="zoom"' in content %}<script src="/lightbox.js" defer></script>{% endif %}`. The Nunjucks string `in` operator works and the base path is applied automatically by `HtmlBasePlugin` (output: `<script src="/portfolio-test/lightbox.js" defer="">`; pages without zoom links got no `<script>` at all). [VERIFIED: spike] Add `"content/lightbox.js": "lightbox.js"` to the existing passthrough object.

### Pattern 7: Header, nav, aria-current (SITE-04, D-14)
```njk
<header><div class="header-row">
  <a class="site-name" href="/"{% if page.url == "/" %} aria-current="page"{% endif %}>{{ site.name }}</a>
  <nav aria-label="Main"><ul>
    <li><a href="/work/"{% if page.url == "/work/" %} aria-current="page"{% elif section == "work" %} aria-current="true"{% endif %}>Work</a></li>
    <li><a href="/cv/"{% if page.url == "/cv/" %} aria-current="page"{% endif %}>CV</a></li>
    <li><a href="/teaching/"{% if page.url == "/teaching/" %} aria-current="page"{% endif %}>Teaching</a></li>
  </ul></nav>
</div></header>
```
- `page.url` has no path prefix; `HtmlBasePlugin` adds it to the emitted hrefs, so comparisons are prefix-independent. [VERIFIED: spike hrefs show `/portfolio-test/work/` from source `/work/`]
- `section: "work"` is set in `projects.11tydata.js` and `tags.11tydata.js`; `work.njk` matches by URL. The 404 page and CV/Teaching set nothing.
- `src/_data/site.js`: `export default { name: "Dan McCurley" }`. The git user is "Dan McCurley" [VERIFIED: session git context]; owner confirms.
- Homepage `title` must come from a JS function: `content/index.11tydata.js` with `eleventyComputed: { title: (data) => data.site.name }` (the same double-escape trap as tag titles for names with `&` or `'`).
- Existing CSS `body > header > a { justify-self:start; font-weight:700 }` must become `.site-name`.

### Pattern 8: Homepage layout chain (D-13)
Make `src/_includes/home.njk` with front matter `layout: base.njk` that outputs `{{ content | safe }}`, then (when `collections.featured | length`) `<h2>Selected work</h2>` + `cards.njk`, then `<p><a href="/work/">All work</a></p>`. `content/index.md` becomes `layout: home.njk` and keeps only the owner's intro as body. This keeps the h2, `ul.cards` and the paragraph as direct children of `<main>`, which the CSS `main > …` rules assume, and avoids putting a Nunjucks include inside markdown (indentation can turn it into a code block).

### Anti-Patterns to Avoid
- **Predicting image URLs in the markdown rule.** Hashes and per-format overrides make this fragile. Read the finished `<picture>`.
- **`{% if tags %}` or `{{ tags }}` in layouts.** Global/own merge (see Pattern 2).
- **`eleventyComputed` title as a template string with a variable.** Double escaping.
- **`[].concat(data.x)` inside `eleventyComputed`.** Proxy Symbol error.
- **Paginating over project collection items.** Paginate `{slug,label}` and filter in the template.
- **Linking the original file.** Only `_site/img/*` variants; `assets/` never copied (IMG-03).
- **Adding `cv` / `teaching` to `RESERVED_SLUGS`.** The reserved check runs for pages too (`if (RESERVED_SLUGS.has(slug)) err(...)` inside the loop over projects and pages), so it would reject `cv.md` itself. A project named `cv` already fails with "already used by ./content/pages/cv.md" via the shared `slugs` map. Add only `work`. [VERIFIED: lib/validate.js lines 1-60 read this session]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap, inert background, Escape handling | Custom key handlers / tabindex juggling | `HTMLDialogElement.showModal()` | Native, Baseline widely available [CITED: MDN] |
| Responsive image variants for cards | `sharp` calls | Existing `eleventyImageTransformPlugin` via a plain `<img>` in `card.njk` | Cache, hashing, `width`/`height` all handled [VERIFIED: spike] |
| Base-path prefixing of nav, cards, tag links, PDFs, script | Manual `| url` everywhere | Emit root-absolute URLs (`/work/`, `/pdf/x.pdf`, `/lightbox.js`); `HtmlBasePlugin` rewrites `a[href]`, `img[src]`, `script[src]` [VERIFIED: spike] | Already how `/style.css` works |
| Pagination for tag pages | Loops that write files | Eleventy `pagination` over `collections.tagPages` | Zero pages when empty; slug in permalink [VERIFIED: spike] |
| Asset lookup for PDFs | New path logic | `resolveAsset` (basename lookup, `path.basename` strips `../`) | Phase 1 D-11 |
| Light-dismiss | `closedby="any"` | `click` on the dialog surface | `closedBy` is Limited availability [CITED: MDN] |

**Key insight:** every piece of this phase has an existing seam (collections, transform plugins, markdown rules, `copyMedia`, `limits.js`, `validate.js`). The risk is not missing libraries; it is Eleventy data-cascade and transform-ordering behaviour, which is why the prototype results above matter.

## Common Pitfalls

### Pitfall 1: Global `tags` data merges into every project's `tags`
**What goes wrong:** After changing `src/_data/tags.js` to objects, every project's `tags` becomes `[…objects, "games"]`; Eleventy also builds tag collections from them. A layout test like `{% if tags %}` is true on pages.
**Why:** Eleventy deep-merges data cascade keys by default; `tags` is a merged key. [VERIFIED: spike]
**How to avoid:** `setDataDeepMerge(false)`; use `projectTags` computed in `projects.11tydata.js`; add a test that a built project page has Tags links only for its own tags.
**Warning signs:** Tags row listing all four tags on every project (this is already latent with strings today).

### Pitfall 2: Zoom href computed in the wrong place
**What goes wrong:** Hash-less guesses 404; or the `href` lacks the path prefix.
**How to avoid:** plugin priority exactly between `-1` and `-2` (use `-1.5`). **Warning signs:** `href="/img/…"` without `/portfolio-test/`.

### Pitfall 3: Largest variant is not always 2400
**What goes wrong:** D-02 says "2400px, or the image's own size if it's smaller". eleventy-img only emits widths not larger than the source. A 2000px source publishes 480/960/1600 only; a 3000px source publishes up to 2400; a 308px source publishes a single 308px file. [VERIFIED: spike with generated 2000px and 3000px images]
**How to avoid:** treat the requirement as "the largest published variant" and test it that way (do not assert `-2400` for every image). No extra widths are added (D-02). `scripts/shrink.js` caps assets at 3000px, so the largest possible link target is 2400px wide.

### Pitfall 4: CSS prose cap catches the new lists
**What goes wrong:** `main > :is(p:not(.lone-image), h1, h2, h3, ul, ol, dl, blockquote, pre)` matches `ul.cards` (direct child). The **second** selector `main > :not(.layout, .embed, figure, .lone-image) :is(p, h1, h2, h3, ul, …)` also matches `nav ul.filters` (the `nav` is a `:not(...)` child and the `ul` is a descendant), so the UI-SPEC claim "the filter row is a `<nav>`, so it is not matched" is wrong for this selector. [VERIFIED: content/style.css read this session]
**How to avoid:** exclude both: `ul:not(.cards, .filters)` in both selectors, or add explicit `max-width: none` for `.cards, .filters`. Check with a built-page test or a browser.

### Pitfall 5: Vertical rhythm rules still lose on specificity
**What goes wrong:** UI-REVIEW fix 1 from Phase 2 is still open in `content/style.css`: `main > :is(.layout, .embed, figure, .lone-image) + *` is (0,1,1) and beats `main > * + :is(h2, h3)` (0,0,2) and `main > :is(h2, h3) + *` (0,0,2). Adding `.cards` to the block-rhythm list makes `ul.cards` get 32px under an `<h2>` instead of the specified 16px, and an `<h2>` after a lone image gets 32px instead of 48px. [VERIFIED: style.css read, specificity computed by hand]
**How to avoid:** raise the heading rules above (0,1,1), for example `main > :is(.layout, .embed, figure, .lone-image, .cards) + :is(h2, h3)` for the 48px rule and `main > :is(h2, h3) + :is(*, .cards)` for the 16px rule (`:is()` takes its most specific argument, so `:is(*, .cards)` counts (0,1,0)), ordered after the block rule. Verify in a real browser (computed margin-top) as part of the end-of-phase human check; a node test can assert the selectors exist but cannot compute the cascade.

### Pitfall 6: `makeSite` fixtures break when `featured.js` exists
**What goes wrong:** `test/helpers/site.js` copies all of `src/` into every fixture site. A real `src/_data/featured.js` listing `tidepool-game` makes every fixture build fail ("does not match any project"). It also copies only `*.11tydata.js`, `style.css`, `404.md`, `index.md` from `content/`, so `work.njk`, `tags.njk` and `lightbox.js` are missing from fixtures unless added. [VERIFIED: test/helpers/site.js read this session]
**How to avoid:** in `makeSite`, write `export default [];` to `src/_data/featured.js` unless `useRepoContent` (fixture `files` can override), and extend the `isBase` list with `work.njk`, `tags.njk`, `lightbox.js`.

### Pitfall 7: Script/CSS invariants asserted by existing tests
See "Existing Tests Affected". Do not "fix" them by deleting; narrow them.

### Pitfall 8: `::backdrop` and custom properties
`dialog.lightbox::backdrop { background: var(--ink) }` relies on `::backdrop` inheriting custom properties from its originating element. Older engines resolve `var()` there to nothing. The dialog itself is opaque and full viewport, so the backdrop is never visible; no fallback needed. [ASSUMED: engine versions not checked]

### Pitfall 9: Click on image inside dialog
The click handler must test `e.target === dialog`; the `figure` has `width: fit-content` so clicks on the image or caption never equal the dialog. Selecting caption text by dragging and releasing over the dialog surface can fire a click on the dialog; accept it (closing is harmless).

### Pitfall 10: Sort ties
`collections.projects` sorts by `String(date).localeCompare` descending. Equal date strings keep input (file path) order, and `"2024-05"` sorts above `"2024"`. Fine for newest-first; do not add a secondary key unless asked.

## Code Examples

### Base layout script gate and Tags row — [VERIFIED: spike build]
```njk
<link rel="stylesheet" href="/style.css">
{% if '<a class="zoom"' in content %}<script src="/lightbox.js" defer></script>{% endif %}
…
{% if projectTags %}<dt>Tags</dt><dd>{% for t in projectTags %}<a href="/tags/{{ t.slug }}/">{{ t.label }}</a>{% if not loop.last %}, {% endif %}{% endfor %}</dd>{% endif %}
```
(Tags `<dt>` goes after Year and before Link per UI-SPEC; the spike placed it before Year, adjust.)

### Collections to add to `eleventy.config.js`
See Pattern 3 (`tagPages`) and Pattern 5 (`featured`). `addCollection("featured", (api) => { const { errors, items } = resolveFeatured(featuredSlugs, projectsWithSlugs(api)); if (errors.length) throw new Error(errors.join("\n")); return items; })` where `featuredSlugs` is imported from `./src/_data/featured.js`.

### CSS additions (tokens only; no new colour/size/weight) — from UI-SPEC with the two fixes above
```css
.cards { list-style: none; margin: 0; padding: 0; display: grid;
         grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--block-gap) var(--grid-gap); align-items: start; }
.cards img { display: block; width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover; object-position: center; }
a.card { display: block; color: inherit; text-decoration: none; }
a[aria-current] { color: var(--ink); font-weight: 700; }   /* must come AFTER `a, a:visited` (same specificity 0,1,1) */
dialog.lightbox :focus-visible { outline-color: var(--paper); }
```
`a[aria-current]` must be placed after the global `a, a:visited` rule, because both are (0,1,1); otherwise a visited current link turns accent blue.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JS lightbox libraries | Native `<dialog>` + `showModal()` | Baseline widely available since March 2022 [CITED: MDN] | ~40 lines of first-party JS |
| `:target` CSS lightbox hack | Real link + dialog enhancement | Project decision (FEATURES.md) | Back button and focus behave correctly |
| Invoker commands (`command`/`commandfor`) | Not usable here | Only on `<button>` | Trigger must stay an `<a>` for the no-JS baseline |

**Deprecated/outdated:** none relevant.

## Runtime State Inventory

Not a rename/migration phase. The only "rename" is the shape change of `src/_data/tags.js`; there is no stored data, live service, OS registration, secret or build artifact keyed on it. Existing project front matter keeps slugs (`tags: [games]`), so no content migration is needed. None found in any category.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Paginating collection items that carry `data.collections` may hit circular-structure issues | Pattern 3 | Low: recommended form (paginate `{slug,label}`) avoids it and was verified |
| A2 | `::backdrop` custom-property inheritance gaps are invisible because the dialog is opaque and full-viewport | Pitfall 8 | Very low: at worst a transparent backdrop behind an opaque dialog |
| A3 | `eleventy --serve` (transformOnRequest) still emits `<picture>` markup with `width`/`height`, so the zoom plugin works under `npm start` | Pattern 1 | Low-medium: zoom links might degrade to unwrapped images during local serve; production build verified. Check once with `npm start`. |
| A4 | PDF output names are not content-hashed, so a replaced PDF can be cached briefly by browsers/CDN | Pattern 4 | Low; same as videos. Hash the name if it matters |
| A5 | 25 MB PDF cap (UI-SPEC "default") is acceptable to the owner | Pattern 4 | Low; one constant |

## Open Questions

1. **Card cover widths.**
   - What we know: UI-SPEC says pipeline unchanged (`[480, 960, 1600, 2400]`), so each cover also generates a 2400 variant that cards never use.
   - What's unclear: whether the owner cares about the extra bytes/build time.
   - Recommendation: keep unchanged (UI-SPEC, simplest); revisit in Phase 4 if `_site` size matters. `prune:img` only removes unreferenced files, and these are referenced.
2. **Starter content.** `cv.md`, `teaching.md`, and the homepage intro need minimal placeholder text so the nav does not 404 and tests have a fixture. Recommendation: the plan creates short placeholder pages and says the owner will rewrite them.
3. **Site name.** `site.name = "Dan McCurley"` is taken from the git user; owner to confirm in review.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build and tests | yes | v24.14.1 (project requires >=22) | — |
| Eleventy / eleventy-img | Build | yes | 3.1.7 / 7.1.1 | — |
| npm test baseline | Regression gate | yes | 174 tests passing in ~7 s (run this session) | — |
| Google Chrome.app, Safari.app | Manual keyboard/focus verification of the dialog | yes (found in /Applications) | — | Claude-in-Chrome skill |
| Playwright / puppeteer / jsdom | Automated browser tests | no | — | Stub-DOM unit test in `node:vm` plus end-of-phase human check (`workflow.human_verify_mode: end-of-phase`) |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** automated browser testing (use stub DOM + manual UAT).

## Existing Tests Affected

All verified by reading the files this session.

| Test | Why it changes | Action |
|------|----------------|--------|
| `test/design.test.js` "no page contains a script or a referrer meta tag" (walks all `_site` html, asserts no `<script`) | `lightbox.js` is now loaded on zoom pages | Assert: no inline script (`<script>` without `src`), only `src` ending `/lightbox.js` with `defer`, and none on pages without `a.zoom` |
| `test/design.test.js` "grid images are never cropped" (`!/object-fit/.test(CSS)`, `!/img[^{]*{[^}]*aspect-ratio/.test(CSS)`) | `.cards img` needs both | Parse rules; allow only when the selector starts with `.cards`; keep `overflow: hidden` forbidden everywhere |
| `test/embeds.test.js` lines 67 and 281 `doesNotMatch(html, /<script/)` | Only breaks if those fixtures contain zoomable images | Check fixtures; if they contain images, narrow to "no inline/third-party script" |
| `test/build.test.js` "originals not published" | `_site/pdf/*.pdf` are published as-is | Exempt `PDF_EXTS` files directly in `_site/pdf/`, like the `VIDEO_EXTS` exemption in `_site/video/` |
| `test/helpers/site.js` | Fixed copy list; real `featured.js` | See Pitfall 6 |
| `test/blocks.test.js` | Figure/lone-image HTML gains `<a class="zoom">` (no href in md-only render) | Update expectations; existing regexes on `<figure>[\s\S]*?</figure>` still match |
| `test/design.test.js` PAGES list / `index.html` | Home page now has featured grid; helper's `featured.js` is empty in fixtures | Keep; add cards/nav assertions in a new test file |
| Tests hard-coding `tags: [games]` | `games` is a **placeholder** tag (UI-SPEC: owner will edit the list) | Prefer a helper that reads the first slug from `src/_data/tags.js`; do not hard-code labels in new tests |
| `test/contrast.test.js` | Add ring-vs-surface check | `--paper` on `--ink` >= 3:1 for the focus ring, >= 4.5:1 for text, reusing `ratio()` and `token()` |
| `test/workflow.test.js` | CI file unchanged | No change expected |

New test files to plan (all under `test/`, `node --test`): `browse.test.js` (work feed order, tag pages exist only for used tags, filter row and `aria-current`, Teaching/CV never in feed or tag pages, empty-state), `featured.test.js` (order, unknown slug, duplicate slug, non-string, message text), `zoom.test.js` (wrap rules per context: grid yes, full no, decorative no, lone with/without caption yes, GIF links `.gif`, href has prefix, `data-width` present, unwrap case), `pdf.test.js` (link text size, `_site/pdf/` publish, missing PDF error naming file, cap error, prefix), `lightbox.test.js` (stub-DOM behaviour: open fills alt/caption, Escape path, Close, backdrop, focus returns, error fallback, modifier-click ignored, no timers/innerHTML in source). Run per commit: `node --test test/<file>.test.js`; full: `npm test` (~7 s today).

## Security Domain

`security_enforcement` is enabled (`.planning/config.json`: `"security_enforcement": true`, ASVS level 1, block on high).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | static site, no accounts |
| V3 Session Management | no | none |
| V4 Access Control | no | none |
| V5 Input Validation | yes | Build-time validation of front matter, `tags.js` shape/slug regex, `featured.js` entries, PDF links; Nunjucks autoescape for `title`, `cover_alt`, `label`; `textContent` (not `innerHTML`) in `lightbox.js` |
| V6 Cryptography | no | none |
| V12 Files and resources | yes | PDF cap (`PDF_MAX_MB`), only referenced PDFs published, `resolveAsset` uses `path.basename` so `../` cannot escape `assets/`, `encodeURIComponent` on published names, originals never linked |
| V14 Configuration | yes | No third-party script, no inline script, no CDN; first-party `lightbox.js` only |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stored XSS via alt/caption/title/tag label reaching the dialog or templates | Tampering | Nunjucks autoescape (verified: `R&D <x>` rendered `R&amp;D &lt;x&gt;`); script uses `textContent`/property assignment only |
| Path traversal via tag slug or PDF link | Tampering | Slug regex `^[a-z0-9-]+$` for tags (new check) and projects (existing); PDF resolution by basename only |
| Open redirect / `javascript:` via the image-error fallback | Spoofing | `href` is generated at build from `<picture>` srcset, never from user input; optional `new URL(href, location).origin === location.origin` guard |
| Oversized or malicious PDF | DoS / Info disclosure | Size cap in renderer, CI guard and hook; served as static file, never parsed by the build |
| `target=_blank` tabnabbing | Spoofing | PDFs open same-tab, no `target`, no `download` (UI-SPEC) |

## Project Constraints (from CLAUDE.md)

- Eleventy 3.x, Node 22 LTS (>=22); output plain HTML/CSS with zero or near-zero client JS; the lightbox script is the only JS.
- No lightbox libraries; no passthrough copy of `assets/`; originals never published; no committing generated images.
- Layout and authoring must stay plain markdown with `::: block` syntax; accessibility: semantic HTML, alt text, keyboard-accessible lightbox, reduced motion, good contrast.
- GitHub Pages limits (~1 GB, 100 MB/file); PDF cap must sit well under 100 MB.
- GSD workflow enforcement: file edits go through a GSD command (`/gsd:execute-phase` for this work).
- Commit-docs and test conventions from prior phases apply (`node --test`, file-named build errors).

## Sources

### Primary (HIGH confidence)
- Repo files read this session: `eleventy.config.js`, `lib/{markdown,blocks,images,assets,media,limits,validate,locate,frontmatter}.js`, `src/_includes/base.njk`, `src/_data/tags.js`, `content/{index.md,style.css,pages/pages.11tydata.js,projects/*}`, `test/helpers/site.js`, `test/{design,build,contrast}.test.js`, `scripts/{check-assets,shrink,prune-img}.js`, `.github/workflows/deploy.yml`
- `node_modules/@11ty/eleventy-img/src/transform-plugin.js` and `util.js` (transform priority `-1`, relative-src resolution)
- `node_modules/@11ty/eleventy/src/Plugins/HtmlBasePlugin.js` (priority `-2`, descending order)
- Scratch-copy prototype builds (Eleventy 3.1.7, eleventy-img 7.1.1), results quoted inline as `[VERIFIED: spike]`
- `npm test` baseline: 174 pass, 0 fail

### Secondary (MEDIUM confidence)
- MDN `HTMLDialogElement.showModal()` (Baseline widely available since March 2022): https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal
- MDN `<dialog>` element (initial focus, Escape/cancel, inert, aria-modal): https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
- MDN `closedBy` ("Limited availability"): https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/closedBy

### Tertiary (LOW confidence)
- Invoker-command `<button>`-only restriction is taken from `03-UI-SPEC.md` (which cites MDN/InfoQ); not re-fetched here, but irrelevant to the recommendation because the trigger must be an `<a>`.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (no new packages; installed versions read)
- Architecture: HIGH (zoom plugin, tag pagination, featured collection, PDF rule, nav, script gating all built and inspected)
- Pitfalls: HIGH for data-cascade, escaping, selector specificity, test impact (observed or read); MEDIUM for serve-mode behaviour (A3) and `::backdrop` (A2)

**Research date:** 2026-10-30
**Valid until:** 2026-11-29 (Eleventy 3.x is stable; re-check only if Eleventy or eleventy-img is upgraded)
