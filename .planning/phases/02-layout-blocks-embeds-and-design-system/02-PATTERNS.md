# Phase 2: Layout Blocks, Embeds and Design System - Pattern Map

**Mapped:** 2026-10-29
**Files analyzed:** 16
**Analogs found:** 14 / 16 (all analogs are git-tracked)

The codebase is small (Phase 1 only). Plain ESM, no semicolon-free style, double quotes, 2-space indent, `node:` import prefixes, `.js` extensions on relative imports. Errors are thrown as `Error` with the file path first (`${page.inputPath}: message`).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `lib/blocks.js` (or `lib/blocks/index.js`) new | markdown plugin (container + core rule + image render rule) | transform (token stream) | `lib/markdown.js` | exact |
| `lib/blocks/embeds.js` new (URL parsing, video/itch HTML) | utility | transform | `lib/assets.js` / `lib/validate.js` (pure helpers, throw on bad input) | role-match |
| `lib/blocks/alt-lint.js` new | utility | transform | `lib/markdown.js` (token walk) | role-match |
| `lib/media.js` new (VIDEO_MAX_BYTES, mediaToCopy Map, copyMedia) | service | file-I/O | `lib/assets.js` (resolveAsset, refreshAssets) | role-match |
| `lib/markdown.js` modified | markdown plugin | transform | self | exact |
| `lib/images.js` modified (global `sizes`) | config | n/a | self | exact |
| `lib/validate.js` modified (reserve `video`) | config | n/a | self, line 5 | exact |
| `eleventy.config.js` modified | config | event-driven | self (lines 26-28 `amendLibrary`, `on("eleventy.before")`) | exact |
| `src/_includes/base.njk` modified | template | request-response | self | exact |
| `content/style.css` replaced | config (CSS) | n/a | self (2 lines, no real pattern) | none |
| `content/projects/tidepool-game.md` modified | content | n/a | self | exact |
| `scripts/check-assets.js` modified (per-extension cap) | utility/CLI | batch file-I/O | self lines 8-37 | exact |
| `test/blocks.test.js`, `test/embeds.test.js`, `test/alt-lint.test.js` new | test | build-and-assert | `test/images.test.js` | exact |
| `test/contrast.test.js` new | test | unit | `test/shrink.test.js` / `test/check-assets.test.js` | role-match |
| `test/check-assets.test.js` modified (video cap) | test | batch | self | exact |
| `test/shrink.test.js` modified (videos never converted) | test | unit | self | exact |

## Pattern Assignments

### `lib/blocks.js` (markdown plugin, token transform)

**Analog:** `lib/markdown.js`

**Imports and export shape** (lines 1-6):
```js
import path from "node:path";
import { resolveAsset, hasAlpha } from "./assets.js";

const REMOTE = /^([a-z][a-z0-9+.-]*:)?\/\//i;

export function installAssetResolver(md) {
  md.core.ruler.push("asset_resolver", (state) => {
    const page = state.env?.page;
    if (!page?.inputPath) return;
```

**Token walk and error style** (lines 11-22): flat `state.tokens`, images are in `block.children`.
```js
for (const block of state.tokens) {
  for (const t of block.children ?? []) {
    if (t.type !== "image") continue;
    const src = t.attrGet("src");
    if (REMOTE.test(src) || /^data:/i.test(src)) continue;
    const abs = resolveAsset(src);
    if (!abs) throw new Error(`${page.inputPath}: image not found in assets/: ${src}`);
    t.attrSet("src", path.relative(path.dirname(page.inputPath), abs));
```
Block errors should follow `./content/projects/e.md:<line>: message` (research Pattern 1; use UI-SPEC copy). Line numbers need the front-matter offset (read raw file from `page.inputPath`).

**Existing per-image behaviour to preserve** (lines 19-27): `eleventy:formats` for svg/gif/alpha and the first image getting `loading=eager` + `fetchpriority=high`. Set per-block `sizes` via `t.attrSet("sizes", ...)` in the same style. Ordering: `installBlocks(md)` (with `md.use(attrs, {allowedAttributes:["class","decorative"]})` then `md.use(container, "block", {validate})`, then push the blocks core rule) must run before `installAssetResolver(md)`.

**Container wiring** (research Pattern 1):
```js
md.use(container, "block", {
  validate: (params) => params.trim().length > 0,
  render(tokens, idx) {
    const t = tokens[idx];
    if (t.nesting !== 1) return t.meta?.embed ? "" : "</div>\n";
    return t.meta?.html ?? "";
  },
});
```
Do not use `{#id}` (Nunjucks pass breaks it).

### `lib/media.js` (service, file-I/O)

**Analog:** `lib/assets.js` (resolveAsset/refreshAssets, imported in `lib/markdown.js` line 2 and `eleventy.config.js` line 5). Use `resolveAsset(src)` for basename lookup of videos and posters. Module-level additive `Map(basename -> absPath)`; `copyMedia(outputDir)` runs in `eleventyConfig.on("eleventy.after", ({dir}) => ...)`, mirroring `eleventyConfig.on("eleventy.before", () => refreshAssets())` (config line 28). Export `VIDEO_MAX_BYTES = 50 * 1024 * 1024` and share with `scripts/check-assets.js`.

### `eleventy.config.js` (config)

**Wiring points** (lines 26-31):
```js
eleventyConfig.amendLibrary("md", (md) => installAssetResolver(md));
await refreshAssets();
eleventyConfig.on("eleventy.before", () => refreshAssets());
// assets/ is never copied (IMG-03); only the stylesheet is passed through.
eleventyConfig.addPassthroughCopy({ "content/style.css": "style.css" });
```
Change the amend call to `md => { installBlocks(md); installAssetResolver(md); }`, add the `eleventy.after` handler next to line 28. Keep `assets/` out of passthrough.

### `lib/images.js` (config)
Line 17: change `sizes: "(min-width: 60em) 60em, 100vw"` to `"(min-width: 90em) 1280px, 90vw"`. Per-block sizes come from the `sizes` attr on each img token (values in UI-SPEC "Image sizes per block").

### `lib/validate.js` (config)
Line 5: add `"video"` to `RESERVED_SLUGS`:
```js
export const RESERVED_SLUGS = new Set(["tags", "404", "assets", "img", "css", "js", "projects", "pages"]);
```

### `scripts/check-assets.js` (CLI, batch)
Lines 8-37 pattern: `const MAX_BYTES = 10 * 1024 * 1024;` and
```js
if (fs.statSync(full).size > MAX_BYTES) {
  errors.push(`assets/${f}: over 10 MB${manualHint(ext)}`);
  continue;
}
```
Make the cap per extension: `.mp4`/`.webm` use `VIDEO_MAX_BYTES` and the message states the actual cap. `UNCONVERTED` and `RASTER` sets (lines 10-11) already exclude videos, so no decode or convert; keep `continue` so sharp never sees them.

### `src/_includes/base.njk` (template)
Existing structure (lines 6-12): `<title>`, `<link rel="stylesheet" href="/style.css">` (HtmlBasePlugin prefixes absolute hrefs), `<header>`, `<main>` containing h1, time, summary, `<dl>`, `{{ content | safe }}`. Add Google Fonts preconnect/link before the stylesheet, skip link first in `<body>`, `<main id="main" tabindex="-1">`. Do not add a `no-referrer` meta (breaks YouTube). Nunjucks conditionals in the `<dl>` (lines 15-23) stay.

### `test/blocks.test.js`, `test/embeds.test.js`, `test/alt-lint.test.js` (tests)

**Analog:** `test/images.test.js` (lines 1-37)
```js
import test from "node:test";
import assert from "node:assert/strict";
import { makeSite } from "./helpers/site.js";

const site = await makeSite({
  assets: { "opaque.webp": { width: 1200, height: 800, format: "webp" } },
  files: { "content/projects/specials.md": md },
});
const r = site.build();
assert.equal(r.code, 0, r.output);
const html = site.read("_site/specials/index.html");
```
For failure cases assert `r.code !== 0` and match `r.output` against `file:line` text. For videos, pass a small fake Buffer as the asset (helper takes raw Buffer). Warnings: assert on `r.output` containing `WARN`. Front matter fixture needs `title`, `date`, `tags`, `cover`, `cover_alt` (see md at lines 5-12).

### `test/contrast.test.js`
**Analog:** `test/check-assets.test.js` (plain node:test unit style). Read `--paper` and `--accent` from `content/style.css` with a regex and assert ratio >= 4.5 using the formula in research "Contrast test sketch".

### `content/projects/tidepool-game.md`
Replace the two `alt text` placeholders with real alt; convert to a live demo of `::: grid-N`, a captioned image and `::: full`.

## Shared Patterns

### Error style
**Source:** `lib/markdown.js` line 17 and `lib/validate.js` (`err(...)`, line 59). Throw `Error` with the file path first; build fails loudly (Phase 1 D-23). Use exact UI-SPEC Copywriting Contract messages.
**Apply to:** all block, embed, video, itch validation.

### Asset resolution by basename
**Source:** `resolveAsset` from `lib/assets.js`, used at `lib/markdown.js` line 16. **Apply to:** images, video files, posters.

### Absolute output URLs
HtmlBasePlugin (config line 23) prefixes absolute `/...` URLs only. Emit `/video/<name>` for video src, poster, fallback links. **Apply to:** `lib/blocks`, `lib/media.js`.

### Escaping
Escape `& " < >` (`md.utils.escapeHtml`) in every emitted attribute and caption. **Apply to:** all hand-built HTML.

## No Analog Found

| File | Role | Reason |
|---|---|---|
| `content/style.css` | CSS design system | Existing file is two rules; use UI-SPEC and research Pattern 8 |
| `lib/blocks/embeds.js` URL allow-list logic | utility | No URL parsing in codebase; use research Patterns 6 and 7 code |

## Metadata

**Analog search scope:** `lib/`, `scripts/`, `src/`, `test/`, `eleventy.config.js`, `content/` (all via `git ls-files`)
**Files scanned:** ~35 tracked files; 7 read in detail
**Pattern extraction date:** 2026-10-29
