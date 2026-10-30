# Phase 2: Layout Blocks, Embeds and Design System - Research

**Researched:** 2026-10-29
**Domain:** Eleventy 3 + markdown-it block syntax (`:::` containers), image transform integration, embeds (YouTube/Vimeo/itch.io/self-hosted video), hand-written accessible CSS
**Confidence:** HIGH on integration mechanics (prototyped end to end against the real repo code in a scratch copy); MEDIUM on itch.io embed URL shape and iOS Safari video behaviour (community sources only)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Grids use one fence name per layout: `::: grid-2`, `::: grid-3`, `::: grid-4`, closed by `:::`. The content is plain pasted `![alt](path)` lines. Reversibility: costly.
- **D-02:** Captions use the standard markdown image title: `![alt](path "Caption text")`. An image with a title renders as `<figure><img alt="..."><figcaption>Caption text</figcaption></figure>`. Works the same inside grids, inside `::: full` and for lone images. Alt and caption stay separate. Reversibility: costly.
- **D-03:** Full-width is `::: full` ... `:::`, and it means a true edge-to-edge bleed to the viewport edges. Several images in one `::: full` block stack vertically. There is no separate `wide` variant.
- **D-04:** Grids hold images only. The build fails, naming the file, when: a grid or full block contains text or other non-image content; a fence is unclosed; a block name is unknown (e.g. `::: grid-5`, `::: ful`). Matches Phase 1 strictness (D-23, PUB-04). Raw HTML outside blocks is still allowed (AUTH-04).
- **D-05:** Blocks are flat and do not nest. Images outside any block render in the text column; with a title they render as a `<figure>`.
- **D-06:** YouTube and Vimeo use one fence with the pasted URL plus a required quoted title: `::: video https://youtu.be/abc123 "Tidepool trailer"` / `:::`. Renderer recognises youtube.com, youtu.be and vimeo.com URLs. Missing title fails the build (title becomes the iframe's accessible `title`). Output is lazy-loaded (`loading="lazy"`), uses privacy-friendly domains (`youtube-nocookie.com`; Vimeo with `dnt=1`) and has a fixed aspect ratio (16:9 default).
- **D-07:** Self-hosted video uses the same `::: video` fence with a path to a file in the shared root `assets/` folder: `::: video ../../assets/tidepool-game-loop.mp4 "Crab walk loop"` and `::: video ../../assets/tidepool-game-loop.mp4 "Crab walk loop" poster=../../assets/tidepool-game-crab.webp`. Path is resolved by basename through the existing asset resolver, like images. Only referenced video files are copied to the output; `assets/` is still never passthrough-copied wholesale (IMG-03). Renders as `<video controls preload="metadata">` with no autoplay; `poster=` optional. Build fails if the video file is missing or over a size cap.
- **D-08:** itch.io is a playable iframe sized per game: `::: itch <embed-url> <W>x<H> "Title" <itch-page-url>` / `:::`. Responsive iframe locked to the given aspect ratio; titled, lazy-loaded, allows fullscreen. Below it a visible "Play on itch.io" link to the page URL. No click-to-load, no store-card widget mode. Missing args fail the build, naming the file.
- **D-09:** Embeds sit in the text column by default. Adding the keyword `full` to the fence line (e.g. `::: video full https://... "Title"`, `::: itch full ...`) makes the embed bleed edge to edge like `::: full`.
- **D-10:** Typeface is **Chivo** (Google Fonts), loaded with a Google Fonts `<link>` (with `preconnect`, `display=swap`), variable upright and italic (`ital,wght@0,100..900;1,100..900`). System sans fallback in the stack.
- **D-11:** Black text on white plus one accent colour for links and focus outlines. Accent hex undecided: ship as a single CSS custom property with a placeholder that passes WCAG AA (>= 4.5:1 on white).
- **D-12:** One wide column with generous side margins. Grids and embeds use the full column width; `::: full` breaks out to the viewport edges. Text measure can be capped but stays left-aligned within the column. No narrow centred text column, no centred headings.
- **D-13:** Grid gap about 1rem; vertical space between blocks from one spacing token about 2x the grid gap. Both CSS custom properties.
- **D-14:** Grid rows top-aligned. Images keep own aspect ratios, no cropping (BLOCK-05). No masonry, no CSS columns; DOM reading order across-then-down.
- **D-15:** CSS is plain, hand-written, token-driven. Favour legibility and few rules. No animations or transitions, no smooth scroll, reduced-motion guard (A11Y-01).

### Claude's Discretion

- Alt-text lint (A11Y-04): warns rather than fails; flags empty alt not marked decorative, VS Code placeholder `alt text`, filename-like alt; decorative marker up to planner (prefer markdown-it-attrs `{decorative}`), emits `alt=""`; warnings name file and image path.
- Grid collapse breakpoints (BLOCK-06), pure CSS.
- Per-block `sizes` for the image transform.
- Self-hosted video size cap; update `scripts/check-assets.js` and the shrink hook so `.mp4`/`.webm` are allowed but not "converted".
- Posters: no ffmpeg dependency; researcher checks iOS Safari first-frame behaviour (`#t=0.001`).
- Type scale, heading weights, link underline style, header look, meta `<dl>` styling; skip link and focus outline style; exact markdown-it-container wiring and module layout.

### Deferred Ideas (OUT OF SCOPE)

None. Side-by-side text + image (BLOCK-07) and click-to-load facades (POL-03) were already v2. Not in scope: lightbox, feed, tag pages, homepage curation, About/CV (Phase 3); next/prev, OG/sitemap, drafts, README, 320px/200% zoom verification (Phase 4).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BLOCK-01 | `::: grid-3` ... `:::` multi-column image grid (2/3/4) | Single catch-all `markdown-it-container` + core rule (Pattern 1); prototype output verified |
| BLOCK-02 | Full-width (full-bleed) image block | `::: full` + named-line CSS grid (Pattern 4); screenshot verified at 1280px |
| BLOCK-03 | Freely mix grids, full images, text | Blocks are flat siblings in `<main>`; fence may interrupt a paragraph (container alt rules) |
| BLOCK-04 | Captions as `<figure>`/`<figcaption>` | Image-token `title` -> figure via `hidden` paragraph + custom `image` render rule (Pattern 2) |
| BLOCK-05 | Grid images keep own aspect ratio | CSS only: `align-items:start`, `height:auto`; width/height attrs come from eleventy-img |
| BLOCK-06 | Grids collapse, no JS | Two `@media (max-width)` rules in `em`; verified 600px screenshot collapses to 1 col |
| AUTH-04 | Raw HTML fallback | markdown-it `html: true` is Eleventy's default; raw `<img>` also goes through the image transform (verified) |
| MEDIA-01 | Self-hosted video | `::: video <asset>` renderer + copy-on-reference in `eleventy.after` (Pattern 5) |
| MEDIA-02 | YouTube/Vimeo embed | Allow-listed URL parser builds the iframe `src` itself (Pattern 6) |
| MEDIA-03 | itch.io embed + fallback link | `::: itch` renderer (Pattern 7) |
| A11Y-01 | Semantic HTML, brutalist CSS, no animation | CSS contract in UI-SPEC; reduced-motion guard |
| A11Y-03 | Skip link, focus, AA contrast | base.njk + CSS; contrast-check test (Validation Architecture) |
| A11Y-04 | Build warns on empty/filename-like alt | Core-rule lint reading `token.content` (Pattern 3) |
</phase_requirements>

## Summary

Phase 2 fits cleanly onto the Phase 1 pipeline. I built a working prototype in a scratch copy of the repo (not in the project tree) and verified the risky seams: `markdown-it-container` + a core rule can turn pasted `![alt](path "Caption")` lines into `<figure>/<figcaption>`, tag every image with a per-block `sizes`, and enforce all D-04 failure modes with `file:line` messages. The eleventy-img HTML transform processes images inside `<figure>`/`<div class="layout">` and honours a `sizes` attribute already present on the `<img>` (it overrides the global `htmlOptions.imgAttributes.sizes`), so per-block `sizes` needs no custom transform. Raw `<img>` in raw HTML also goes through the transform.

Four surprises the planner must plan around: (1) Eleventy renders markdown through Nunjucks first (`markdownTemplateEngine: "njk"`), so markdown-it-attrs `{#id}` crashes the build; use `{.class}` and `{decorative}` only. (2) markdown-it-container silently auto-closes an unclosed fence and ignores unknown names, so D-04's errors must be implemented in our own core rule (using `token.map` against `state.src`); line numbers are body-relative (front matter is stripped) and need an offset. (3) Eleventy's built-in `html-relative` passthrough mode does NOT work for videos from root `assets/` (the `#t=0.001` fragment defeats its glob and aliasing failed), so copy referenced videos yourself in an `eleventy.after` handler and emit absolute `/video/<name>` URLs (HtmlBasePlugin prefixes them correctly, fragment preserved). (4) CLAUDE.md says markdown-it 15 is bundled; the installed Eleventy 3.1.7 depends on `markdown-it ^14.2.0` (14.3.3 installed). Both plugins work on 14.

**Primary recommendation:** Add `markdown-it-container@^4.0.0` and `markdown-it-attrs@^5.0.1`; register ONE container named `block` with `validate: p => p.trim().length > 0`; implement validation, figure conversion, `sizes` and alt lint in one new core rule module (`lib/blocks/`), render embeds as raw HTML strings from the container open token, and copy referenced video/poster files to `_site/video/` in `eleventy.after`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Block syntax parsing and validation | Build (markdown-it core rules) | — | Fail-fast build errors naming file:line |
| Figure/caption markup, per-block `sizes` | Build (markdown-it render + core rule) | Build (eleventy-img HTML transform) | Token stage knows the enclosing block; transform makes the srcset |
| Responsive image generation | Build (eleventy-img transform) | CDN/Static (hashed files in `_site/img`) | Phase 1, unchanged |
| Grid layout, collapse, full-bleed | Browser (CSS only) | — | BLOCK-06: no layout JS |
| Video/poster publishing | Build (`eleventy.after` copy) | CDN/Static | Only referenced files published (IMG-03 spirit) |
| YouTube/Vimeo/itch playback | Third party iframe in Browser | — | Privacy hosts built by us, never from raw owner URL |
| Alt-text lint | Build (console warning) | — | A11Y-04 |
| Skip link, focus, contrast | Browser (HTML+CSS) | Build (contrast test) | A11Y-03 |
| Typeface | Third party CDN (Google Fonts) | Browser fallback stack | D-10 locked |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @11ty/eleventy | 3.1.7 (installed) | SSG | Phase 1 |
| @11ty/eleventy-img | 7.1.1 (installed) | Image transform | Phase 1 |
| markdown-it | 14.3.3 (installed, bundled by Eleventy; NOT 15) | Markdown | `[VERIFIED: node_modules/@11ty/eleventy/package.json:148 "markdown-it": "^14.2.0"]`; `npm view markdown-it version` = 15.0.3 but Eleventy does not use it |
| markdown-it-container | ^4.0.0 | `::: name` fences | `[VERIFIED: npm registry]` 4.0.0, peerDependencies none, no postinstall, 734k weekly downloads, `markdown-it/markdown-it-container` repo; ran under markdown-it 14.3.3 in prototype |
| markdown-it-attrs | ^5.0.1 | `{decorative}` / `{.class}` on images | `[VERIFIED: npm registry]` 5.0.1, peer `markdown-it >= 9.0.0`, 343k weekly downloads, modified 2026-07-27 |

### Supporting
No other runtime dependency. No ffmpeg, no lightbox, no client JS. (`ffmpeg` exists locally at /opt/homebrew/bin/ffmpeg but is not a project dependency; I used it only to make a fixture mp4 in the scratch dir.)

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| One catch-all container | One container per name (CLAUDE.md loop) | Per-name containers ignore unknown names (`::: grid-5` becomes paragraph text) so D-04 needs a text scan anyway; catch-all gives the name, line and clean errors |
| Custom `eleventy.after` video copy | Eleventy `addPassthroughCopy(..., {mode:"html-relative"})` | Tried: did not copy with `#t=0.001` fragment; with no fragment and `paths:["assets/"]` it threw "Missing input file" (alias lookup failed). Not reliable for root-level `assets/` |

**Installation:**
```bash
npm install --save-dev markdown-it-container@^4.0.0 markdown-it-attrs@^5.0.1
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| markdown-it-container | npm | published 2023-12 (v4.0.0; long-lived) | ~734k/wk | github.com/markdown-it/markdown-it-container | OK | Approved |
| markdown-it-attrs | npm | latest 2026-07-27 | ~343k/wk | github.com/arve0/markdown-it-attrs | OK | Approved |

`[VERIFIED: gsd-tools package-legitimacy check --ecosystem npm]` returned OK for both; `npm view <pkg> scripts.postinstall` empty for both. Both are named in the project CLAUDE.md stack.
**Packages removed (SLOP):** none. **Packages flagged (SUS):** none.

## Architecture Patterns

### System Architecture Diagram

```
content/projects/*.md
   |  (1) Nunjucks pass over the markdown source  <-- {#...} / {{ }} / {% %} are live here
   v
markdown-it parse (block rules)
   |  container "block" matches any `::: <params>` fence (may interrupt a paragraph)
   v
token stream (flat): container_block_open/close, paragraph_open/inline/paragraph_close, html_block ...
   |
   +--> core rule "blocks"  (lib/blocks/, runs after markdown-it-attrs)
   |       - per fence: parse name, check known, check closed (src line at token.map[1]), no nesting
   |       - grid/full: only image-only paragraphs, >=1 image, else throw file:line
   |       - image-only paragraphs: paragraph tokens hidden=true, images meta.figure=true
   |       - each image: set sizes (by block), alt lint warn, strip `decorative`
   |       - video/itch: parse args, validate, build embed HTML into open token meta
   v
renderer
   |  container open -> `<div class="layout grid-3">` | embed HTML ; close -> `</div>`
   |  image rule -> `<figure><img ...><figcaption>` when meta.figure
   v
Nunjucks layout base.njk  (skip link, fonts, <main id="main">)
   v
HTML transforms: eleventy-img (img -> picture/srcset, honours img[sizes]) -> HtmlBasePlugin (prefix absolute URLs)
   v
_site/<slug>/index.html  +  _site/img/*  +  (eleventy.after) _site/video/<referenced files>
```

### Recommended Project Structure
```
lib/
├── blocks.js        # installBlocks(md): container + core rule + image render rule (or lib/blocks/index.js)
├── blocks/          # optional split: parse-args.js, embeds.js (URL parsing), alt-lint.js, sizes.js
├── markdown.js      # existing asset resolver; keep, or fold first-image/eager logic into blocks core rule
├── media.js         # VIDEO_MAX_BYTES, mediaToCopy Map, copyMedia(outputDir)
content/style.css    # replaced by design system
src/_includes/base.njk
test/blocks.test.js, test/embeds.test.js, test/alt-lint.test.js, test/contrast.test.js
```
Order requirement: `amendLibrary("md", md => { installBlocks(md) /* uses md.use(attrs) first */; installAssetResolver(md); })`. markdown-it-attrs must be registered before the `blocks` core rule is pushed (verified order works).

### Pattern 1: One catch-all container + validation in our own core rule
**What:** markdown-it-container's `validate` receives the text after the colons. Returning true for any non-empty params makes it match every `::: x` fence; a bare `:::` closer only matches inside an open container.
**Facts verified in prototype:**
- A fence directly under a paragraph line (no blank line) still opens the block (container registers `alt: ['paragraph','reference','blockquote','list']`).
- Unclosed fence is silently auto-closed at end of parent. Detect it: `lines[token.map[1]]` must match `/^\s*:{3,}\s*$/` where `lines = state.src.split("\n")` `[VERIFIED: prototype; container source index.mjs: token_o.map = [startLine, nextLine]]`.
- A stray `:::` outside any block becomes paragraph text; detect `inline.content` starting with `:::` while not in a block.
- Nested fences are parsed as nested containers; throw "blocks cannot be nested" (D-05).
- Line numbers: Eleventy passes markdown-it the body only (front matter stripped). Offset = `rawFileLines - state.src.split("\n").length`, reading `state.env.page.inputPath` with `fs.readFileSync` and normalising CRLF. Verified: reports file line 11 for a fence on file line 11.
```js
// Source: prototype run against repo (scratch), container API from node_modules/markdown-it-container/index.mjs
md.use(attrs, { allowedAttributes: ["class", "decorative"] }); // verified: onclick=... is dropped
md.use(container, "block", {
  validate: (params) => params.trim().length > 0,
  render(tokens, idx) {
    const t = tokens[idx];
    if (t.nesting !== 1) return t.meta?.embed ? "" : "</div>\n";
    return t.meta?.html ?? "";          // html built by the core rule
  },
});
```
All ten D-04 negative cases (unknown `grid-5`/`ful`, unclosed, text, text after image, list, empty, stray `:::`, nested, raw HTML inside grid) produced `./content/projects/e.md:<line>: ...` errors that appear in the Eleventy output. Use the exact messages from UI-SPEC Copywriting Contract.

### Pattern 2: Figures and captions
**What:** For an image-only paragraph (children are only `image` and `softbreak`) that is inside any block, or outside a block with at least one titled image: set `paragraph_open.hidden = true` and `paragraph_close.hidden = true` (renderToken skips hidden block tokens), drop the softbreaks, mark each image `meta = {figure:true}`. Override `md.renderer.rules.image`: remove the `title` attr (else it also shows as a tooltip), remove `decorative`, call the default renderer, and wrap: `<figure>${img}<figcaption>${md.utils.escapeHtml(title)}</figcaption></figure>`. Untitled -> `<figure>` with no figcaption inside blocks; lone untitled image outside a block stays `<p><img></p>`.
**Verified output:** `<figure><picture>...<img alt="Alpha" ...></picture><figcaption>Caption &lt;one&gt; &amp; two</figcaption></figure>`.
**Alt source:** the image token's `attrs` has `alt=""`; the real alt text is `token.content` (the renderer fills `alt` at render time). Lint must read `token.content`.
**Caption policy (recommend):** plain escaped text in v1. `md.renderInline(title)` would allow links/emphasis; not required by D-02.

### Pattern 3: Alt lint (A11Y-04)
Run in the same core rule over every image token (markdown images only; raw-HTML `<img>` is not linted, acceptable and worth stating in the plan). Warn with `console.warn("WARN ...")` using UI-SPEC copy, dedupe on `file|src|kind` with a Set (pages rendered once per build in my run; Set protects `--serve` rebuilds/double renders).
```js
// Tested on 9 sample strings in prototype
const IMG_EXT = /\.(webp|png|jpe?g|gif|avif|svg|heic|heif)$/i;
function altIssue(alt, src) {
  const a = alt.trim();
  if (a === "") return "empty";
  if (a.toLowerCase() === "alt text") return "placeholder";            // VS Code paste placeholder
  const base = src.split("/").pop().replace(/\?.*$/, "");
  const stem = base.replace(/\.[^.]+$/, "");
  if (IMG_EXT.test(a) || [base, stem].some((s) => a.toLowerCase() === s.toLowerCase()) ||
      /^(img|dsc|pxl)[ _-]?\d{3,}/i.test(a) || /^screen ?shot[ _-]?\d{4}/i.test(a)) return "filename";
  return null;
}
```
Results: `""`->empty, `alt text`->placeholder, `IMG_1234`, `Screenshot 2026-10-01 at 10.00.00`, `tidepool-game-image`, `photo.png`->filename; real sentences and "Image 3 of the set" -> clean.
**Decorative marker:** `![](../../assets/rule.webp){decorative}` verified: attrs yields token attr `decorative=""` and `content ""`; the lint skips it, the image render rule strips the attribute so output is `alt=""` with no stray `decorative` attribute. Non-figure images (plain `<p><img>`) also need the `decorative` attr stripped: do it in the core rule (remove the attr from `token.attrs`) rather than only in the figure renderer. `{decorative}` was verified working; `{.class}` also works.
**Trap:** do NOT document or use `{#id}`. `markdown-it-attrs` examples use it, but Eleventy runs Nunjucks over the markdown first and `{#` starts a Nunjucks comment: build error `expected end of comment, got end of file` `[VERIFIED: prototype]`.

### Pattern 4: Per-block `sizes`
Set `img.sizes` as an attribute on the image token in the core rule (value table from UI-SPEC "Image sizes per block"). Verified: output `<source ... sizes="(min-width: 90em) 632px, (min-width: 40em) 45vw, 90vw">` and the same on `<img>`; the global `htmlOptions.imgAttributes.sizes` is overridden, not duplicated. Change `lib/images.js` global `sizes` to the lone-image value `(min-width: 90em) 1280px, 90vw` so raw-HTML images get a sane default. Existing Phase 1 behaviour (first image `loading=eager`, `fetchpriority=high`, `eleventy:formats` for gif/alpha/svg) keeps working for images inside blocks because markdown-it token streams are flat (`installAssetResolver` already walks them). Note the first-image flag counts only markdown images, not raw HTML ones (existing behaviour).

### Pattern 5: Self-hosted video
- Dispatch: first arg starting `http://`/`https://` -> YouTube/Vimeo; otherwise an asset path resolved with `resolveAsset` (basename). Accept only `.mp4`/`.webm`; fail on `.mov` etc. with a clear message.
- Parse the fence tail with a tiny quote-aware splitter (`/"([^"]*)"|(\S+)/g`); optional leading `full`; `poster=<path>` option; the quoted string is the required title.
- Size cap check with `fs.statSync` at render time (error text from UI-SPEC). Share one constant (`VIDEO_MAX_BYTES`) between the renderer and `scripts/check-assets.js`.
- Output (hand-built HTML, so no `<p>` wrapper): `<div class="embed"><video controls preload="metadata" poster="/video/<poster>" src="/video/<file>#t=0.001" aria-label="<title>"><p>Your browser cannot play this video. <a href="/video/<file>">Download "<title>"</a></p></video></div>`. Use `encodeURIComponent(basename)` for the file name and HTML-escape attribute values.
- URLs: emit ABSOLUTE `/video/...`. `[VERIFIED: prototype]` HtmlBasePlugin rewrote `src`, `poster` and the fallback `<a href>` to `/portfolio-test/video/...` and preserved `#t=0.001`. Relative URLs are NOT rewritten (left as written), so they would break under the path prefix on some page depths.
- Copy: record each referenced file in a module-level `Map(basename -> absPath)` and copy it in `eleventyConfig.on("eleventy.after", ({dir}) => ...)` to `${dir.output}/video/`. Verified: only the referenced mp4 and the poster were present in `_site/video/`. Keep the Map additive (do not clear it per build) so incremental `--serve` rebuilds that skip unchanged pages still keep earlier files. Posters are copied as-is (not run through eleventy-img): they are bound by the existing 3000px/10 MB asset guard; recommend documenting "use a poster under ~200 KB webp".
- Reserve the slug `video` in `RESERVED_SLUGS` in `lib/validate.js` (output folder collision).
- `scripts/check-assets.js` currently errors on any file over 10 MB `[VERIFIED: scripts/check-assets.js:8,34-37]`: `const MAX_BYTES = 10 * 1024 * 1024;` and `if (fs.statSync(full).size > MAX_BYTES)`. Make the cap per extension (`.mp4`/`.webm` -> `VIDEO_MAX_BYTES`). It does not decode or "convert" mp4/webm already (`UNCONVERTED` and `RASTER` sets exclude them, lines 10-11). `scripts/shrink.js` `actionFor` returns `none` or `rename` for unknown extensions `[VERIFIED: scripts/shrink.js actionFor]` so videos are never converted; only a test needs adding to lock that in. Recommend cap 50 MB: GitHub warns at 50 MB and blocks at 100 MB per file `[ASSUMED]` (stated in project CLAUDE.md as the 100 MB limit; the 50 MB warning threshold is training knowledge).
- iOS Safari: with `preload="metadata"` and no poster, iOS Safari does not paint a first frame; the `#t=0.001` fragment is the widely used workaround, an explicit `poster` is the dependable fix `[CITED: muffinman.io/blog/hack-for-ios-safari-to-display-html-video-thumbnail, bugs.webkit.org/show_bug.cgi?id=197608 (reported still open)]`. Not testable here; keep `#t=0.001` as default and add a manual UAT item on a real iPhone. Optional `playsinline` is harmless; not required for user-initiated playback.

### Pattern 6: YouTube/Vimeo (MEDIA-02)
Parse with `new URL()` and an exact-hostname allow-list; build the iframe `src` from the extracted ID, never reuse the owner's URL. Verified on 12 inputs including hostile ones (`youtube.com.evil.com`, `javascript:`).
```js
// Source: prototype lib/embeds.js (tested)
const YT_HOSTS = new Set(["youtube.com","www.youtube.com","m.youtube.com","music.youtube.com","youtu.be","www.youtu.be","youtube-nocookie.com","www.youtube-nocookie.com"]);
const VIMEO_HOSTS = new Set(["vimeo.com","www.vimeo.com","player.vimeo.com"]);
const YT_ID = /^[A-Za-z0-9_-]{11}$/;
// YouTube: youtu.be/ID, /watch?v=ID, /embed|shorts|live|v/ID  -> https://www.youtube-nocookie.com/embed/ID
// Vimeo: first all-digits path segment = id; optional unlisted hash from next segment or ?h= (hex only)
//        -> https://player.vimeo.com/video/ID?h=HASH&dnt=1
```
Iframe attributes (UI-SPEC): `title`, `loading="lazy"`, `allow="fullscreen; picture-in-picture"`, `allowfullscreen`, `referrerpolicy="strict-origin-when-cross-origin"`. Keep the `referrerpolicy`: YouTube players fail with "Error 153" when the embedder sends no referrer `[CITED: teamdynamix.umich.edu KB 14491; community reports, not an official YouTube doc]`. Corollary: never add `<meta name="referrer" content="no-referrer">` to base.njk. Start-time (`?t=`) support is not in the decisions; do not add.

### Pattern 7: itch.io (MEDIA-03)
Args: `<embed-url> <W>x<H> "Title" <page-url>` (UI-SPEC order). Regex `^(\d{2,5})x(\d{2,5})$` for dims. Validate both URLs: `https:` and hostname `itch.io`/`*.itch.io`/`*.itch.zone` (embed) and `itch.io`/`*.itch.io` (page). Render `<div class="embed itch" style="--w:640;--h:380"><iframe src title loading="lazy" allow="fullscreen" allowfullscreen></iframe></div>` then `<p class="embed-link"><a href="{page}">Play on itch.io<span class="visually-hidden">: {title}</span></a></p>`; CSS: `.embed.itch { max-width: calc(var(--w) * 1px) } .embed.itch iframe { aspect-ratio: var(--w) / var(--h) }`, `.embed.itch.full { max-width: none }`. With the `full` keyword the link paragraph is a normal column child. The `embed-upload` URL form (`https://itch.io/embed-upload/<id>?color=...` with `frameborder`, `allowfullscreen`, `width`, `height`) comes from community posts, not itch.io docs; itch.io says only that the Distribute tab -> "Embed game" generates a regular HTML iframe, and that embeds link back to the game page `[CITED: itch.io/updates/introducing-game-embeds]`. The host allow-list is therefore `[ASSUMED]` (see A3); the build error should name the rejected host so the owner can widen the list in one place.

### Pattern 8: Layout CSS (verified with headless Chrome screenshots)
The UI-SPEC CSS works as written. Prototype additions that made it correct:
- `main > * { grid-column: content; margin: 0; min-width: 0; }`, margin-top via `main > * + *` and block selectors.
- `picture { display:block }` and `img { display:block; width:100%; height:auto }` (eleventy-img emits `<picture>`; without `display:block` the inline box adds a baseline gap under images).
- `.layout > figure { margin:0; min-width:0 }`, `.layout.full { grid-template-columns: minmax(0,1fr) }` so a `full` block stacks vertically.
- `.layout` inside `main` for `.full` needs `main > .full { grid-column: full }` (the `.layout.full` div carries the `full` class; `.embed.full` too).
- Screenshots: 1280px shows 3-up top-aligned grid with mixed aspect ratios, caption directly under each image, full-bleed edge to edge with caption inset to the column edge; 600px collapses to one column with 16px margins. (Headless Chrome enforces a ~500px minimum window width, so true 390px/320px checks must wait for Phase 4 / a real device.)
- Lone image styling: either `:has()` or have the core rule add a class to image-only paragraphs. Recommend the core rule adds `class="lone-image"` to kept image-only `<p>` tokens via `t.attrJoin("class", "lone-image")`, avoiding a `:has()` dependency (planner's choice).
- Contrast: `#0000ee` on `#fff` computes to 9.40:1 (UI-SPEC says 8.6:1, which is the figure for `#0000ff`; both pass AA). Contrast test must use the formula `(L1+0.05)/(L2+0.05)` with sRGB linearisation.

### Anti-Patterns to Avoid
- **Per-name containers + text scan for unknown names:** more code, worse errors than the catch-all.
- **`markdown-it-attrs` `{#id}`:** crashes Nunjucks pass. Also avoid `{{`, `{%` in captions/titles.
- **`html-relative` passthrough for videos:** unreliable with root `assets/` and fragments.
- **Relative URLs in generated `<video>`/`<iframe>`:** HtmlBasePlugin leaves relative URLs untouched; emit absolute `/video/...`.
- **Reusing the owner's pasted YouTube/Vimeo URL as `src`:** always rebuild from the parsed ID.
- **Putting the title into `title=` on `<img>`:** causes a duplicate tooltip; strip it.
- **`object-fit: cover` / fixed heights in grids:** violates BLOCK-05.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| `:::` block parsing | Custom block rule | markdown-it-container (single catch-all) | Handles fences interrupting paragraphs, closers, indentation |
| `{decorative}` attribute syntax | Regex over image source | markdown-it-attrs with `allowedAttributes` | Verified; restricts attributes |
| Responsive image generation | sharp scripts | eleventy-img transform (Phase 1) | Already wired; honours img `sizes` |
| Base path prefixing | String concat with PATH_PREFIX | HtmlBasePlugin on absolute URLs | Verified for video src/poster/a href |
| Contrast math | Visual eyeballing | WCAG formula test | Owner will change the accent hex |
| Lightbox/video players | Any JS library | Native `<video controls>` / provider iframes | Project constraint |

**Key insight:** the only genuinely custom code is the validation/figure core rule and the small embed renderer; everything else is existing plugins plus CSS.

## Common Pitfalls

### Pitfall 1: Nunjucks eats markdown braces
**What goes wrong:** `{#id}`, `{{`, `{%` in markdown are processed by Nunjucks before markdown-it. **Why:** `markdownTemplateEngine: "njk"` in `eleventy.config.js`. **Avoid:** use `{.class}`/`{decorative}`; document it in the plan's authoring notes. **Warning sign:** `expected end of comment, got end of file`.

### Pitfall 2: Unclosed fence swallows the rest of the page
**What goes wrong:** container silently auto-closes at end of document. **Avoid:** closer-line check via `token.map[1]` against `state.src` lines (Pattern 1).

### Pitfall 3: Line numbers off by the front matter
**What goes wrong:** `token.map` is body-relative. **Avoid:** compute the offset from the raw file (verified).

### Pitfall 4: Multi-image paragraphs outside blocks
Existing `content/projects/tidepool-game.md` has two consecutive images in one `<p>`. Decision to record in the plan: outside blocks, an image-only paragraph with at least one titled image has every image converted to its own `<figure>`; otherwise untouched (kept as `<p>` with inline images).

### Pitfall 5: Video not published or wrong URL under path prefix
`html-relative` copy fails (Pattern 5); relative URLs not prefixed. Test: build with default `PATH_PREFIX=/portfolio-test/` and assert `src="/portfolio-test/video/x.mp4#t=0.001"` and the file exists in `_site/video/`.

### Pitfall 6: Warnings duplicated or lost
Console warnings in a core rule print once per render; dedupe via a Set; make tests assert on build output for `WARN`.

### Pitfall 7: Existing tests/fixtures
`test/helpers/site.js` copies `lib/`, `src/`, `package.json` and symlinks `node_modules`, so new lib files and deps are picked up automatically; its asset fixture builder takes a raw `Buffer`, so a fake `.mp4` (a few bytes) works for tests that do not decode it. `content/projects/tidepool-game.md` currently has two `alt text` placeholders: they will now warn; update that page to real alt text and make it the live demo of grid/caption/full. `test/workflow.test.js` pins CI step order; only touch the workflow if a step is added.

### Pitfall 8: `max-width` vs `min-width` media queries and `em`
Use `em` literals (custom properties cannot be used in `@media`). Breakpoints per UI-SPEC: 40em / 60em.

### Pitfall 9: Google Fonts is a third-party request
D-10 is locked. Note for the plan: render-blocking stylesheet from `fonts.googleapis.com` (preconnect helps); keep the system-font fallback so the page is usable if it fails; privacy trade-off was the owner's choice.

## Code Examples

### base.njk head and skip link (UI-SPEC contract)
```html
<!-- Source: UI-SPEC Design System / Interaction contract; existing base.njk uses href="/style.css" which HtmlBasePlugin prefixes -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chivo:ital,wght@0,100..900;1,100..900&display=swap">
<link rel="stylesheet" href="/style.css">
...
<body>
  <a class="skip-link" href="#main">Skip to main content</a>
  <header>...</header>
  <main id="main" tabindex="-1">
```
`[VERIFIED: curl]` that the css2 URL returns variable `font-weight: 100 900` faces for both `font-style: italic` and normal (latin, latin-ext, vietnamese subsets).

### Contrast test sketch
```js
const lum = (hex) => { const c = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255)
  .map(v => v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4); return .2126*c[0]+.7152*c[1]+.0722*c[2]; };
const ratio = (a,b) => { const [x,y] = [lum(a),lum(b)].sort((p,q)=>q-p); return (x+.05)/(y+.05); };
// read --paper and --accent from content/style.css with a regex; assert ratio >= 4.5
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `100vw` + negative margin breakout | Named-line CSS grid on `<main>` | No horizontal scrollbar (verified) |
| Lightweight "facade" for embeds | Plain `loading="lazy"` iframes (POL-03 is v2) | Simple |
| YouTube embed without referrer constraints | Needs `referrerpolicy="strict-origin-when-cross-origin"` | Avoids Error 153 |

**Deprecated/outdated:** CLAUDE.md's "markdown-it ^15.0.3 bundled with Eleventy" is wrong for Eleventy 3.1.7 (uses 14.x); do not add a markdown-it dependency.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | GitHub warns at 50 MB and blocks at 100 MB per pushed file (basis for the 50 MB video cap) | Pattern 5 | Cap may be too high/low; owner can tune one constant |
| A2 | GitHub Pages serves byte-range requests so Safari/Chrome can play and seek mp4 | Pattern 5 | Video playback problems on Safari; fallback is hosting on YouTube/Vimeo |
| A3 | itch.io embed hosts are `itch.io` and `*.itch.zone`; page host `itch.io`/`*.itch.io` | Pattern 7 | Valid embed rejected at build; error names the host, one-line allow-list fix |
| A4 | `#t=0.001` makes iOS Safari paint a first frame (not testable here) | Pattern 5 | No first frame on iPhone without a `poster=`; manual UAT on a device |
| A5 | Recommended caption policy: plain escaped text (no inline markdown) | Pattern 2 | Owner may want links in captions; swap to `md.renderInline` |
| A6 | Outside blocks, image-only paragraphs with any titled image become one figure per image | Pitfall 4 | Different expectation for multi-image lines; planner can confirm |
| A7 | Raw-HTML `<img>` is not alt-linted | Pattern 3 | Missing alt in raw HTML goes unwarned; optional HTML transform could cover it |

## Open Questions

1. **Video cap value**
   - Known: CI guard caps everything at 10 MB today; UI-SPEC suggests 50 MB.
   - Unclear: owner's typical video size. Recommendation: 50 MB, one exported constant.
2. **Poster handling**
   - Poster copied as-is to `_site/video/` (no resizing). Alternative: process through eleventy-img (async, more code). Recommend as-is for v1.
3. **Lone-image paragraph hook for CSS** (`:has()` vs class from the core rule). Recommend the class.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build/tests | yes | v24.14.1 locally (engines >=22; CI uses 22) | — |
| npm registry | installing 2 packages | yes | — | — |
| ffmpeg | none (optional, to make fixtures) | yes (local only) | — | Tests use fake Buffer files |
| Chrome (headless) | optional visual check | yes locally | — | Manual browser check |
| Real iPhone Safari | A4 (first frame) | no | — | Manual UAT item at end of phase |

## Validation Architecture

`workflow.nyquist_validation` is `false` in `.planning/config.json`, so the formal validation section is skipped. Practical note for the planner: tests run with `npm test` (`node --test 'test/*.test.js'`), baseline 58 tests passing (run this session). Follow the existing pattern: build a fixture site with `makeSite({files, assets})`, `site.build()`, assert on `r.output` (errors/warnings) and `site.read("_site/...")`. Suggested new tests: block happy path (figure/figcaption, per-block `sizes`, decorative alt), the ten D-04 failure cases with `file:line`, video/YouTube/Vimeo/itch output and error messages, video copied only when referenced and prefixed under `PATH_PREFIX`, alt-lint warnings, check-assets video cap, contrast ratio from `content/style.css`, reserved slug `video`. Manual UAT: iPhone first frame, keyboard tab-through (skip link, focus ring, iframes), a real itch.io game.

## Security Domain

`security_enforcement` is enabled (ASVS level 1).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2/V3 Auth, Session | no | static site |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Owner-authored fence args are validated at build: URL host allow-lists via `new URL()`, ID regexes, dimension regex, `.mp4`/`.webm` extension check; all attribute values HTML-escaped; `markdown-it-attrs` `allowedAttributes` limited to `class`, `decorative` |
| V6 Cryptography | no | — |
| V14 Config / third-party content | yes | iframes only to allow-listed hosts over https; `referrerpolicy` set; no `sandbox` (itch games need scripts; origin is third party) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Attribute injection via title/URL in fence line | Tampering | Escape `& " < >` in every emitted attribute; build `src` from parsed ID |
| Host-confusion (`youtube.com.evil.com`, `javascript:`) | Spoofing | Exact-hostname Set + protocol check (verified null for hostile inputs) |
| Inline event handlers via `{onclick=...}` | Tampering | `allowedAttributes` (verified dropped) |
| Oversized media published | DoS (Pages limits) | Per-extension cap in render + CI guard |
| Raw HTML is trusted by design (AUTH-04) | — | Owner-authored; no mitigation beyond repo access control |

## Sources

### Primary (HIGH)
- Repo code read this session: `eleventy.config.js`, `lib/{images,markdown,assets,validate}.js`, `src/_includes/base.njk`, `content/style.css`, `scripts/{check-assets,shrink,prune-img}.js`, `test/helpers/site.js`, `.github/workflows/deploy.yml`, `package.json`
- `node_modules/markdown-it-container/index.mjs` (container algorithm), `node_modules/@11ty/eleventy-img/src/transform-plugin.js`, `node_modules/@11ty/posthtml-urls/lib/defaultOptions.js` (video poster/src, iframe src handled)
- Prototype builds in a scratch copy of the repo (outputs quoted above); headless Chrome screenshots at 1280/600px
- https://www.11ty.dev/docs/copy/ (html-relative mode description)
- npm registry via `npm view` and `gsd-tools package-legitimacy check`

### Secondary (MEDIUM)
- https://itch.io/updates/introducing-game-embeds (Embed game generates a regular iframe; link back and fullscreen button)
- https://teamdynamix.umich.edu/TDClient/30/Portal/KB/Article/14491 (YouTube Error 153 and referrerpolicy)
- https://muffinman.io/blog/hack-for-ios-safari-to-display-html-video-thumbnail/ and https://bugs.webkit.org/show_bug.cgi?id=197608 (iOS first frame)

### Tertiary (LOW)
- Community itch.io `embed-upload` examples (gist.github.com/belen-albeza/ffdfa699268f32919c20f0d067089121, itch.io forum post 2297154): snippet shape only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (verified registry and prototype)
- Architecture: HIGH (prototyped, including all failure modes and per-block `sizes`)
- Embeds: MEDIUM (itch.io host shape and iOS behaviour are community-sourced)
- Pitfalls: HIGH (Nunjucks `{#`, html-relative failure, line offset all reproduced)

**Research date:** 2026-10-29
**Valid until:** 2026-11-28 (stable stack; re-check itch.io snippet if the owner's real embed is rejected)
