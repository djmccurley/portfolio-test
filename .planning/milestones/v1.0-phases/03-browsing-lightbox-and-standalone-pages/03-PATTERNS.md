# Phase 3: Browsing, Lightbox and Standalone Pages - Pattern Map

**Mapped:** 2026-10-30
**Files analyzed:** 27 (new and modified)
**Analogs found:** 24 / 27 (all analog paths verified git-tracked)

03-RESEARCH.md already holds spike-verified code for most new files (zoom.js, tags.11tydata.js, card/cards partials, PDF rule, resolveFeatured, lightbox contract, nav). This map points to the real in-repo analog for each file and the exact excerpts to extend. Where RESEARCH.md has a verified snippet, copy that and the analog's conventions below.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `lib/zoom.js` (new) | transform (PostHTML plugin) | transform | `lib/markdown.js` `installAssetResolver` (token walker); RESEARCH Pattern 1 | role-match |
| `lib/blocks.js` (mod: zoom flag + wrapper) | markdown rule | transform | itself, lines 152-211 | exact |
| `lib/markdown.js` (mod: PDF link rule) | markdown rule | transform | itself, lines 8-37 | exact |
| `lib/media.js` (mod: `pdfs` Map, `registerPdf`, copy) | service | file-I/O | itself (`videos` Map, `copyMedia`) | exact |
| `lib/limits.js` (mod: PDF caps) | config | n/a | itself lines 3-5 | exact |
| `lib/validate.js` (mod: `work` reserved, tag-shape check, `resolveFeatured`) | utility | request-response (validate) | itself (`validateContent`, `addValidation`) | exact |
| `eleventy.config.js` (mod: deep-merge off, filters, collections, transform, passthrough) | config | batch | itself | exact |
| `src/_data/tags.js` (mod: `{slug,label}`) | config/data | n/a | itself | exact |
| `src/_data/featured.js` (new) | config/data | n/a | `src/_data/tags.js` | exact |
| `src/_data/site.js` (new) | config/data | n/a | `src/_data/tags.js` | exact |
| `src/_includes/base.njk` (mod: header nav, Tags row, script gate) | layout | request-response | itself | exact |
| `src/_includes/home.njk` (new) | layout | request-response | `src/_includes/base.njk` (chained layout) | role-match |
| `src/_includes/card.njk`, `cards.njk`, `filters.njk` (new) | partial | request-response | `content/index.md` loop (lines 7-11) + `base.njk` | role-match |
| `content/work.njk` (new) | page template | request-response | `content/index.md` | role-match |
| `content/tags.njk` + `content/tags.11tydata.js` (new) | page + dir data (paginated) | batch | `content/projects/projects.11tydata.js` | role-match |
| `content/index.md` + `content/index.11tydata.js` (mod/new) | page | request-response | `content/index.md` itself, `pages.11tydata.js` | exact |
| `content/projects/projects.11tydata.js` (mod: `section`, `projectTags`) | dir data | transform | itself | exact |
| `content/pages/cv.md`, `teaching.md` (new) | page | request-response | `content/404.md`, `pages.11tydata.js` rule | role-match |
| `content/lightbox.js` (new) | client script | event-driven | none | no analog |
| `content/style.css` (mod) | stylesheet | n/a | itself (tokens, grid rules) | exact |
| `scripts/check-assets.js`, `scripts/shrink.js` (mod: PDF branch) | script | file-I/O | their `VIDEO_EXTS` branches | exact |
| `test/helpers/site.js` (mod) | test helper | file-I/O | itself | exact |
| `test/{browse,featured,zoom,pdf,lightbox}.test.js` (new) | test | request-response | `test/video.test.js` | exact |
| `test/{design,build,blocks,embeds,contrast}.test.js` (mod) | test | n/a | themselves | exact |

## Pattern Assignments

### `lib/limits.js` (config, mod)

**Analog:** itself, lines 1-5. No imports (scripts load it). Append beside the video cap:
```js
export const VIDEO_EXTS = new Set([".mp4", ".webm"]);
export const VIDEO_MAX_MB = 50;
export const VIDEO_MAX_BYTES = VIDEO_MAX_MB * 1024 * 1024;
// add:
export const PDF_EXTS = new Set([".pdf"]);
export const PDF_MAX_MB = 25;
export const PDF_MAX_BYTES = PDF_MAX_MB * 1024 * 1024;
```

### `lib/media.js` (service, file-I/O, mod)

**Analog:** itself. Imports at lines 3-8; additive Maps lines 16-18; `copyMedia` lines 62-78.
```js
const videos = new Map(); // output name -> absolute source path
const posters = new Map();
export async function copyMedia(outputDir) {
  if (!videos.size && !posters.size) return;      // extend: && !pdfs.size
  const dir = path.join(outputDir, "video");
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, source] of videos) fs.copyFileSync(source, path.join(dir, name));
```
Add `const pdfs = new Map(); export function registerPdf(abs){ pdfs.set(path.basename(abs), abs); }` and a second loop copying to `path.join(outputDir, "pdf")` with its own `mkdirSync`. Do not move the early return below the video `dir` creation (keeps `_site/video` absent when unused). Published names use `encodeURIComponent(basename)` in the href (media.js line 49 convention). Size error wording copies line 31: `` `... is ${(bytes / 1048576).toFixed(1)} MB; the limit is ${MAX} MB.` ``

### `lib/markdown.js` (markdown rule, mod: PDF links)

**Analog:** itself. The loop is lines 14-35; the `REMOTE` regex is line 6; failure helper is `loc.fail(blockOrToken, msg)` (line 23). Insert the `link_open` branch RESEARCH Pattern 4 gives immediately after the `html_inline` lint line 17 and before `if (t.type !== "image") continue;` (line 18). Keep `continue` after the branch. Import `fs`, `registerPdf`, and the PDF limits. Error text: `PDF not found in assets/: ${href}` (mirrors line 23 `image not found in assets/: ${src}`).

### `lib/blocks.js` (markdown rule, mod: zoom wrapper)

**Analog:** itself. The three zoomable branches are in `paragraph_open` (lines 152-185):
```js
if (open || titled) {                       // grid/full block or captioned lone image -> figure
  ...
  for (const img of inline.children) {
    img.meta = { ...img.meta, figure: true, block: open };
    if (open) img.attrSet("sizes", LAYOUT_SIZES[open]);   // add: img.meta.zoom = open !== "full"
  }
} else {
  token.attrJoin("class", "lone-image");     // add: mark image meta.zoom = true here
}
```
Renderer override to extend (lines 202-212):
```js
const defaultImage = md.renderer.rules.image;
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  if (!token.meta?.figure) return defaultImage(...);   // lone untitled: wrap here too when meta.zoom
  ...
  return `<figure>${img}${caption}</figure>\n`;         // wrap <img> in <a class="zoom"> inside figure, before figcaption
};
```
Decorative is decided in the later `inline` case (`makeDecorative`), so test `!token.meta.decorative` inside the renderer, not at tag time. Linked/inline-in-text images never reach these branches (so no nested `<a>`). Hidden suffix: `<span class="visually-hidden"> (full size)</span>`; check that class exists in `content/style.css`, else add it.

### `lib/zoom.js` (PostHTML plugin, new)

**Analog:** no in-repo PostHTML code. Copy the verified code from RESEARCH.md Pattern 1 (lines 209-243) verbatim. Style conventions from `lib/media.js`: ESM named exports, header comment stating purpose and IMG-03. Register in `eleventy.config.js`:
```js
eleventyConfig.htmlTransformer.addPosthtmlPlugin("html", zoomPlugin, { priority: -1.5 });
```
(between eleventy-img `-1` and HtmlBasePlugin `-2`.)

### `lib/validate.js` (utility, mod)

**Analog:** itself. Excerpts:
```js
export const RESERVED_SLUGS = new Set(["tags", "404", "assets", "img", "css", "js", "projects", "pages", "video"]);  // add "work" ONLY (not cv/teaching)
...
const err = (msg) => errors.push(`${p}: ${msg}`);                 // file-named errors (line 20)
if (!allowedTags.includes(t)) err(`unknown tag "${t}" (allowed: ${allowedTags.join(", ")})`);   // pass slugs
...
export function addValidation(eleventyConfig) {
  eleventyConfig.addCollection("_validated", (api) => {
    ...
    const errors = validateContent(items, { tags, resolveAsset, readFrontMatter });  // tags -> tags.map(t => t.slug)
    if (errors.length) throw new Error("Content validation failed:\n" + errors.join("\n"));
```
Line 1 imports `tags` from `src/_data/tags.js`; with the new shape pass `tags.map((t) => t.slug)` so the message `allowed: graphic, ux, art, games` and existing unit tests stay valid. Add `resolveFeatured` (RESEARCH Pattern 5, pure and exported like `validateContent`) and a tags-shape check that returns messages in the same `file: message` form. Throw pattern for the `featured` collection: `throw new Error(errors.join("\n"))`.

### `eleventy.config.js` (config, mod)

**Analog:** itself. Existing lines to extend:
```js
eleventyConfig.addPlugin(HtmlBasePlugin);                                   // line 26
eleventyConfig.addPlugin(eleventyImageTransformPlugin, imageOptions);       // line 27
eleventyConfig.addPassthroughCopy({ "content/style.css": "style.css" });    // line 44 -> add "content/lightbox.js": "lightbox.js"
eleventyConfig.addCollection("projects", (api) =>
  api.getFilteredByGlob("content/projects/*.md")
     .sort((a, b) => String(b.data.date).localeCompare(String(a.data.date))));   // lines 46-50 (reuse for work/tags/featured)
```
Add after: `setDataDeepMerge(false)`, filters `assetSrc` (must use `function`, not arrow, for `this.page`) and `withTag`, collections `tagPages` and `featured`, the zoom transform. Copy RESEARCH Pattern 3 and 5 code. The `featured` slug rule is `data.slug || page.fileSlug` (same as `projects.11tydata.js` permalink).

### `src/_data/tags.js`, `featured.js`, `site.js` (data)

**Analog:** `src/_data/tags.js` (one line, default export, no logic). New shapes:
```js
export default [{ slug: "graphic", label: "Graphic design" }, { slug: "ux", label: "UX" }, { slug: "art", label: "Art" }, { slug: "games", label: "Games" }];
// featured.js: export default ["tidepool-game"];
// site.js:     export default { name: "Dan McCurley" };
```
Labels are placeholders for the owner (UI-SPEC).

### `src/_includes/base.njk` (layout, mod)

**Analog:** itself. Edit points: line 10 (add script gate after stylesheet), line 14 (header), line 19 (dl guard), after line 24 (Tags row after Year, before Link).
```njk
<link rel="stylesheet" href="/style.css">                       {# line 10: root-absolute, HtmlBasePlugin prefixes #}
<header><a href="/">Portfolio</a></header>                      {# line 14 -> Pattern 7 header+nav #}
{% if role or client or tools or year or link %}                {# line 19 -> append: or projectTags #}
{% if year %}<dt>Year</dt><dd>{{ year }}</dd>{% endif %}        {# line 24: put Tags row after this #}
```
Use RESEARCH Pattern 7 (nav) and Code Examples (script gate, Tags row). Never test `{% if tags %}`. All URLs stay root-absolute (`/work/`, `/lightbox.js`).

### `src/_includes/home.njk` (layout, new)

**Analog:** `base.njk` (front matter `layout: base.njk`, outputs `{{ content | safe }}`). Body per RESEARCH Pattern 8.

### `src/_includes/card.njk`, `cards.njk`, `filters.njk` (partials, new)

**Analog:** `content/index.md` lines 7-11 for the Nunjucks loop style:
```njk
<ul>
{%- for item in collections.projects %}
  <li><a href="{{ item.url }}">{{ item.data.title }}</a></li>
{%- endfor %}
</ul>
```
Use the RESEARCH Pattern 3 card/cards markup (cover via `| assetSrc`, `loop.first` eager). `filters.njk` receives `current` (slug or empty); omit `<nav>` when `collections.tagPages | length == 0`.

### `content/work.njk`, `content/tags.njk`, `content/tags.11tydata.js`

**Analog:** `content/projects/projects.11tydata.js` (whole file):
```js
export default {
  layout: "base.njk",
  eleventyComputed: {
    permalink: (data) => {
      const s = data.slug || data.page.fileSlug;
      return /^[a-z0-9-]+$/.test(s) ? `/${s}/index.html` : false;
    },
  },
};
```
`tags.11tydata.js` copies this shape (ESM default export, `layout`, JS-function `eleventyComputed` for `permalink` and `title`) and adds `pagination`. Use RESEARCH Pattern 3 code. `work.njk` front matter: `title: Work`, `layout: base.njk`, `permalink: /work/index.html`, `section: work`. NOTE: `content/tags.11tydata.js` applies by name to `tags.njk` only; confirm `work.njk` is not captured by any directory data file. These templates sit in `content/` root, so they are never in `collections.projects` (glob `content/projects/*.md`).

### `content/projects/projects.11tydata.js` (mod)

**Analog:** itself. Add `section: "work"` and `projectTags` in `eleventyComputed` (RESEARCH Pattern 2; no `[].concat(data.x)` inside computed, `data` is a Proxy).

### `content/index.md`, `content/index.11tydata.js`

**Analog:** current `content/index.md` front matter:
```yaml
---
title: Portfolio
layout: base.njk
permalink: /index.html
---
```
Change to `layout: home.njk`, drop the `title` literal (title comes from `index.11tydata.js` `eleventyComputed.title: (data) => data.site.name`), body becomes intro text. Make `index.11tydata.js` match the file-style of `pages.11tydata.js`.

### `content/pages/cv.md`, `teaching.md`

**Analog:** `content/404.md` (read it for front matter shape) plus `pages.11tydata.js` (layout and `/${slug}/index.html` permalink automatically). Front matter allowed keys: `PAGE_KEYS` (`title`, `summary`, `slug`, `layout`, `permalink`, `eleventyExcludeFromCollections`). Body: plain markdown with a PDF link example `[Syllabus](../../assets/<name>.pdf)`. Placeholder content only; a test PDF is needed in a fixture (not committed to `assets/` unless desired).

### `content/style.css` (mod)

**Analog:** itself (token-driven). Add `.cards`, `a.card`, `.site-name`, nav, `.filters`, `dialog.lightbox`, `.visually-hidden` (if absent). Use RESEARCH "CSS additions" and Pitfalls 4 and 5 (exclude `.cards`/`.filters` from the prose-width selectors; raise heading rhythm specificity; place `a[aria-current]` after the global `a, a:visited` rule). Rename `body > header > a` to `.site-name`. Read the file before editing to place rules.

### `scripts/check-assets.js`, `scripts/shrink.js` (mod)

**Analog:** the video branch.
```js
// check-assets.js:36-38 (before the generic size check)
if (VIDEO_EXTS.has(ext)) {
  if (size > VIDEO_MAX_BYTES) {
    errors.push(`assets/${f}: over ${VIDEO_MAX_MB} MB (video limit; compress it or host it on YouTube/Vimeo)`);
```
Add a `PDF_EXTS` twin (`continue` after, never decode). In `shrink.js` mirror lines 235-240 (`bigVideos` filter + `fail()` message) for `bigPdfs`. Update import lines (check-assets.js line 7, shrink.js line 9).

### `test/helpers/site.js` (test helper, mod)

**Analog:** itself. Edit line 65 (`fs.cpSync(.../src)`) then overwrite `src/_data/featured.js` with `export default [];` unless `useRepoContent` or `files` overrides. Extend `isBase` (lines 72-73):
```js
const isBase = base.endsWith(".11tydata.js") || base === "style.css" || base === "404.md" || base === "index.md";
// add: || base === "work.njk" || base === "tags.njk" || base === "lightbox.js"
```

### New tests

**Analog:** `test/video.test.js` (imports `makeSite`, `defaultPrefix`, `after(() => sites.forEach((s) => s.cleanup()))`, front-matter const, `node:test` + `assert/strict`; a markdown-only unit style using `MarkdownIt` + `installBlocks` + `refreshAssets`). Use the build style for browse/zoom/pdf tests, the unit style (`resolveFeatured`) for featured tests, and a `node:vm` stub DOM for `lightbox.test.js` (RESEARCH "Existing Tests Affected" lists the exact assertions). Existing tests needing narrowing are listed there (design, build, embeds, blocks, contrast).

## Shared Patterns

### Root-absolute URLs, base path by plugin
**Source:** `src/_includes/base.njk` line 10 and `lib/media.js` lines 48-49.
**Apply to:** nav, cards, tag links, PDF href, `lightbox.js`, zoom href.
Emit `/x/` URLs only; `HtmlBasePlugin` adds `PATH_PREFIX`. Relative URLs are not rewritten.

### File-named, strict build errors
**Source:** `lib/validate.js` line 20 (`${p}: ${msg}`), `lib/markdown.js` line 23 (`loc.fail`), `lib/validate.js` line 69 (`throw new Error(... errors.join("\n"))`).
**Apply to:** featured, tag-shape, PDF-missing, PDF-too-large errors. Messages are specified in 03-UI-SPEC.md.

### Additive Maps + `eleventy.after` publish, never copy `assets/`
**Source:** `lib/media.js` lines 16-18, 39-41, 62-78.
**Apply to:** PDF publishing.

### Shared caps with no imports
**Source:** `lib/limits.js`. **Apply to:** renderer, `check-assets.js`, `shrink.js`.

### Image path resolution
**Source:** `lib/markdown.js` line 24: `path.relative(path.dirname(page.inputPath), abs)`. **Apply to:** `assetSrc` filter (relative to the consuming page, not the project file).

### Escaping
Nunjucks autoescape for templates; JS functions (not template strings) for computed titles; `textContent` in `lightbox.js`; `esc()` in `lib/media.js` lines 11-12 for any hand-built HTML.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `content/lightbox.js` | client script | event-driven | No client JS exists. Use RESEARCH Pattern 6 and the UI-SPEC Lightbox Contract; classic IIFE, no `innerHTML`, no timers. |
| `lib/zoom.js` | PostHTML plugin | transform | No PostHTML code in repo; use the RESEARCH Pattern 1 code. |
| PostHTML priority registration in `eleventy.config.js` | config | transform | New mechanism; RESEARCH verified. |

## Metadata

**Analog search scope:** `lib/`, `scripts/`, `src/`, `content/`, `test/`, `eleventy.config.js` (full tracked tree listed; all analogs tracked via `git ls-files`)
**Files scanned:** ~25
**Pattern extraction date:** 2026-10-30
