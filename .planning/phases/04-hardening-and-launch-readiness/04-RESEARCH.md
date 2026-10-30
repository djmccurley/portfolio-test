# Phase 4: Hardening and Launch Readiness - Research

**Researched:** 2026-10-30
**Domain:** Eleventy 3.1.7 static-site hardening (drafts, link previews, sitemap, prev/next, README, narrow-viewport reflow)
**Confidence:** HIGH (mechanisms below were spiked against the installed Eleventy 3.1.7 and a real headless Chrome; only third-party crawler behaviour is MEDIUM)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Next/previous links (SITE-06)**
- **D-01:** The order matches `/work/`: the existing `projects` collection, newest first. **Next = older** (the card after this one in the feed). **Previous = newer.**
- **D-02:** The links stop at the ends. They do not wrap. The newest project has only a "Next" link and the oldest has only a "Previous" link. With a single project, neither link renders and no empty nav is output.
- **D-03:** Each link is a text label plus the neighbour's title, e.g. `← Previous: Tidepool` and `Next: Poster series →`. There are no thumbnails.
- **D-04:** The links sit at the bottom of project pages only, after the content, inside `<nav aria-label="Projects">` (or a similarly distinct label, separate from the "Main" nav). They never appear on standalone pages.
- **D-05:** Drafts are skipped in the live build's next/prev chain. A published project never links to a draft. Locally, when drafts are shown, they may take part in the chain.

**Share previews, sitemap and robots (SITE-07)**
- **D-06:** Add an optional `description:` front matter field for projects and pages. The meta/OG description uses the first of these that exists: `description`, then `summary` (the existing on-page intro field), then a site-wide default sentence in `src/_data/site.js`. Add `description` to `PROJECT_KEYS` and `PAGE_KEYS` in `lib/validate.js`. A missing description never fails the build.
- **D-07:** A project's preview image is its `cover`, and `cover_alt` supplies `og:image:alt`. Pages with no cover use one site-wide default image named in `src/_data/site.js`. These pages are the homepage, `/work/`, tag pages, CV, Teaching and 404. The default image is an asset in `assets/`, resolved like other assets. The build fails, naming `site.js`, if that image is missing.
- **D-08:** `og:image` must be an absolute URL to a processed variant (a sensible social size, e.g. about 1200px wide). It must never point to the original in `assets/` (IMG-03). It should come through the existing eleventy-img pipeline, not a new copy step.
- **D-09:** Add one site `url` value next to `PATH_PREFIX`, set to `https://djmccurley.github.io` for now. Absolute URLs are built as `url + PATH_PREFIX + page path`. These are used for `og:url`, `og:image`, the canonical link and the sitemap. Moving to a custom domain means changing `url` and `PATH_PREFIX` together, and the README documents this. — **Reversibility:** reversible — it's two config values, though already-shared links keep pointing at the old host.
- **D-10:** Use `twitter:card` = `summary_large_image`. The tag set is `og:title`, `og:description`, `og:image`, `og:image:alt`, `og:url`, `og:type` and `og:site_name` (the owner's name from `site.js`), plus `<meta name="description">`.
- **D-11:** `sitemap.xml` lists every public page except 404: the homepage, `/work/`, tag pages, projects, CV and Teaching. Drafts are never listed. URLs are absolute and include the prefix.
- **D-12:** Publish a `robots.txt` that allows everything and has a `Sitemap:` line with the absolute sitemap URL. Note: on a github.io *project* site, crawlers only read robots.txt at the domain root. That makes this file inert until the site moves to a custom domain or user site, but it costs nothing to ship now.

**Drafts (PUB-05)**
- **D-13:** `npm start` (`eleventy --serve`) shows drafts. `npm run build`, run locally or in CI, leaves them out. No extra flag needs to be remembered. The planner picks the mechanism, e.g. Eleventy's run mode or an env var set by the serve script, and it must be impossible for CI to publish a draft.
- **D-14:** Any page can be a draft, project or standalone page. A draft is removed from everything in the live build: its own output, `/work/`, tag pages, featured, next/prev, the sitemap, and tag-page generation. A tag used only by drafts gets no live tag page and no filter link (consistent with Phase 3 D-09).
- **D-15:** When drafts show locally, a plain visible "Draft" text label appears on the draft's page and on its card. It never renders in the live build.
- **D-16:** If `featured.js` names a draft, the live build skips that slug and prints a warning naming it, and the build does not fail. The existing unknown-slug and duplicate-slug failures still apply (Phase 3 D-12).
- **D-17:** Nothing referenced only by a draft is published: images, videos, posters or PDFs. Only media reached from published pages is output, which keeps unreleased work from being found by guessing URLs.
- **D-18:** Drafting a page linked from the fixed header nav (CV, Teaching) would leave a dead nav link live. The build warns about this, naming the page. The planner decides whether to also hide the nav item.
- **D-19:** `draft` must be a boolean. A non-boolean value such as `draft: "yes"` fails the build, naming the file (Phase 1 D-23 strictness). Add `draft` to `PROJECT_KEYS`/`PAGE_KEYS`.

**README (AUTH-05)**
- **D-20:** There is one `README.md` at the repo root. Quick-reference tables come first, then longer sections.
- **D-21:** The README must contain:
  - **A block reference.** Every `:::` block (`grid-2`, `grid-3`, `grid-4`, `full`, `video` for YouTube, Vimeo and file sources, `itch`, and the `full` keyword on embeds) with a copy-pasteable example, plus captions via the image title, the decorative-alt marker, and PDF links.
  - **A front matter reference.** Every project and page field (required or optional, format, and an example), including the new `description` and `draft`.
  - **The day-to-day workflow.** Create the `.md`, paste images, write blocks, `npm start`, then commit and push. It also covers what the pre-commit shrink hook does and `npm run shrink`.
  - **Site settings.** Where to change the owner's name, the accent colour token, `featured.js`, `tags.js`, the default share image and default description, and `url` + `PATH_PREFIX` for a custom domain.
  - **An error guide.** The common build errors (missing image, unknown tag, unknown or unclosed block, bad front matter, slug collision, size caps) and how to fix each.
  - **No from-scratch machine setup section.** The owner didn't ask for one. A short "requires Node 22, `npm install`" line is fine.
- **D-22:** A test keeps the README in sync. It fails if a block name the renderer accepts, or a key in `PROJECT_KEYS`/`PAGE_KEYS`, is missing from the README. Internal keys (`layout`, `permalink`, `eleventyExcludeFromCollections`) may be excluded. The test reads the real lists from the code, not a copy.

### Claude's Discretion
- **320px / 200% zoom verification (A11Y-02):** An automated check plus a manual check on the live github.io URL under `/portfolio-test/`. The automated check could be a test asserting CSS guards (e.g. `overflow-wrap` for long words/URLs, `min-width: 0` on grid children, embeds and `<dl>` that shrink). It could also be a headless check if the planner thinks the dependency is worth it. Fix any overflow found. Long unbroken strings like the `link` URL in the meta `<dl>` and PDF link text are likely suspects.
- The exact markup and CSS for the next/prev nav, within Phase 2 tokens. Keep it left-aligned, brutalist and plain.
- How the processed OG image variant is produced and referenced, within D-08.
- The wording of the default description sentence and which asset becomes the default share image. Use a placeholder the owner can swap, and the README says where.
- The sitemap and robots implementation (template vs plugin). Prefer a template, with no new dependency.
- Whether drafted nav pages also hide their nav link (D-18).
- Whether `og:type` is `article` for projects and `website` elsewhere.

### Deferred Ideas (OUT OF SCOPE)
None. The discussion stayed within the phase scope. (RSS, dark mode, an About page and a blog are out of scope for this phase.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SITE-06 | Visitor can move to next/previous project from a project page | Built-in Eleventy filters `getPreviousCollectionItem` / `getNextCollectionItem` over the existing `projects` collection give end-stopped neighbours with no code (Pattern 3) |
| SITE-07 | Shared links show OG title/description/image; site publishes sitemap.xml | `htmlBaseUrl(site.url)` builds correct absolute URLs under any prefix; async `ogImage` filter via eleventy-img; custom `sitemap` collection because `collections.all` omits paginated tag pages 2..n (Pattern 4, Pitfall 3) |
| PUB-05 | Owner can mark a page `draft: true`; excluded from live site | Eleventy `addPreprocessor` returning `false` when `ELEVENTY_RUN_MODE` is not serve/watch removes the template from every collection, render and media registration at once (Pattern 1) |
| AUTH-05 | Short authoring README listing every block and front matter field | No README exists today. Sync test imports `LAYOUT_SIZES`, `EMBEDS`, `PROJECT_KEYS`, `PAGE_KEYS` (Pattern 6) |
| A11Y-02 | Usable at 320px and 200% zoom, no horizontal scroll, verified under deployed prefix | Zero-dependency headless Chrome harness (iframe-width trick) measured the current site clean and reproduced four real overflow bugs in a stress page (Pattern 7, Pitfall 6) |
</phase_requirements>

## Summary

Phase 4 needs no new dependencies. Every capability is available from Eleventy 3.1.7 itself (preprocessors, run mode, built-in collection-neighbour filters, the `HtmlBasePlugin` `htmlBaseUrl` filter) plus the eleventy-img already installed. The only runtime-sensitive choice is the draft mechanism: an Eleventy preprocessor that returns `false` for `draft === true` unless the run mode is `serve` or `watch`. A skipped template never reaches collections, rendering, the image transform or the media registries in `lib/media.js`, so D-14 and D-17 are satisfied by construction, not by filtering in each place. Eleventy overwrites `process.env.ELEVENTY_RUN_MODE` itself at startup, so CI cannot be tricked into publishing a draft by an inherited env var; the check should be fail-closed (show drafts only when the mode is exactly `serve` or `watch`).

Three non-obvious traps will bite a naive implementation. (1) `collections.all` contains only the **first** page of a paginated template, so a sitemap built from it lists `/tags/graphic/` but silently drops every other tag page; build the sitemap from `collections.all` minus paginated entries plus `collections.tagPages`. (2) Every fixture-based test (`makeSite`) copies `src/` from the repo, so once `site.js` names a default share image and the build fails when it is missing, **every existing test breaks** unless the test helper also writes that asset and copies the new `sitemap`/`robots` templates. (3) eleventy-img's repo-wide `formatFiltering: ["transparent"]` drops the JPEG when the source has alpha, so reusing `imageOptions` for the OG image can return an empty result; give the OG call its own explicit options.

For A11Y-02 the current site already measures clean at 320 and 640 CSS px (640 = a 1280px desktop at 200% zoom) on the real prefix. A stress page reproduced overflow from: a long unbroken word in `blockquote` (not in the `overflow-wrap` list), `<pre>`, raw-HTML `<table>`, and the meta `<dl>` at 640px (`grid-template-columns: auto 1fr` lets a long link blow the track out; measured link width 764px in a 640px viewport). All four have one-line CSS fixes that respect the existing design tests (no `overflow: hidden`, four font sizes only).

**Primary recommendation:** Use `addPreprocessor("drafts", "*", ...)` gated on run mode; build absolute URLs with `{{ page.url | htmlBaseUrl(site.url) }}`; produce the OG image with a small async `ogImage` filter calling eleventy-img directly (1200px JPEG, own options); build the sitemap from a JS collection; fix the helper (`makeSite`) first because every test depends on it.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Draft exclusion | Build (Eleventy config/preprocessor) | CI (clean checkout, prune step) | Decided at build time; output is static. Hosting only ever sees published files |
| Next/previous links | Build (Nunjucks layout + built-in filters) | Browser (plain `<a>`) | Order is fixed at build time from the `projects` collection; no JS |
| OG/Twitter tags, canonical | Build (layout `<head>`) | Third-party crawlers | Tags are static HTML; crawlers fetch them |
| OG image variant | Build (eleventy-img, `_site/img`) | CDN/Static (GitHub Pages) | Processed derivative, never the original (IMG-03) |
| sitemap.xml, robots.txt | Build (njk templates) | CDN/Static | Static files; robots is only honoured at domain root |
| README sync | Test (`node --test`) | Docs | Test imports the real lists from `lib/` |
| 320px / 200% reflow | Browser (CSS) | Build-time CSS guard test; local headless script; manual check on live URL | Layout is pure CSS; verified in a real engine |

## Standard Stack

### Core (all already installed; no new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @11ty/eleventy | 3.1.7 [VERIFIED: `npm ls` this session] | `addPreprocessor`, `ELEVENTY_RUN_MODE`, `getPreviousCollectionItem`/`getNextCollectionItem`, `htmlBaseUrl` | Built-ins cover drafts, neighbours and absolute URLs |
| @11ty/eleventy-img | 7.1.1 [VERIFIED: `npm ls`] | Programmatic `Image()` for the 1200px OG derivative | Same pipeline/cache/outputDir as the rest of the site (D-08) |
| js-yaml | 4.3.2 [VERIFIED: `npm ls`] | Already used by `lib/frontmatter.js` for the draft pre-scan | Reuse `readFrontMatter` |
| node:test | Node >=22 | Tests | Existing convention (`npm test`) |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Google Chrome (system) | present at `/Applications/Google Chrome.app` [VERIFIED: `ls` this session] | Optional local reflow script (`--headless=new --dump-dom`) | Local A11Y-02 verification only; do not add to `npm test` or CI |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Preprocessor for drafts | `eleventyConfig.ignores.add(...)` from a pre-scan | Ignores are computed at config load, so serve-mode edits to `draft:` would not re-evaluate. Preprocessor re-runs every build |
| Hand-written sitemap template | `eleventy-plugin-sitemap` / `@quasibit/eleventy-plugin-sitemap` | New dependency, new supply-chain surface, and still needs the paginated-page workaround. CONTEXT says prefer template |
| Programmatic `Image()` for OG | Reading a URL out of the transform's rewritten `<img>` | Fragile; no `<img>` of that width exists on the page |
| Playwright/Puppeteer for reflow | Zero-dep Chrome `--dump-dom` + iframe-width harness | Playwright adds a ~100+ MB devDependency and a CI browser install for one requirement. The harness below needs only a Chrome binary |

**Installation:** none. `npm install` unchanged.

**Version verification:** versions read from `npm ls --depth=0` this session (eleventy 3.1.7, eleventy-img 7.1.1, sharp 0.35.5, js-yaml 4.3.2).

## Package Legitimacy Audit

No external packages are added in this phase. `slopcheck` / `package-legitimacy check` not required.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 content/projects/*.md, content/pages/*.md  (front matter: draft, description, cover ...)
            |
            v
   Eleventy reads each template + data cascade
            |
            +--> preprocessor "drafts": draft === true AND run mode not serve/watch ?
            |         yes -> return false -> template DROPPED (no render, no collection,
            |                               no image transform, no media registration)
            |         no  -> continue
            v
   collections: projects (newest first) --> featured, tagPages, sitemap
            |                                    |
            |  (validateContent: draft must be boolean; unknown keys; ...)
            v
   Render page via base.njk
     <head>: title, meta description, canonical, og:*, twitter:card
              og:image <- ogImage filter -> eleventy-img 1200px jpeg -> _site/img/<hash>-1200.jpeg
              absolute URL <- page.url | htmlBaseUrl(site.url)   (site.url + PATH_PREFIX + path)
     <main>: h1, [Draft label if draft], meta dl, content,
              project pages only: <nav aria-label="Projects"> prev(newer) / next(older)
            |
            v
   HtmlBasePlugin prefixes root-relative hrefs (absolute https URLs untouched)
            |
            v
   _site/  + sitemap.xml + robots.txt  --> prune:img --> upload-pages-artifact --> GitHub Pages
```

### Recommended Project Structure

```
README.md                      # NEW: authoring reference (AUTH-05)
assets/<share-default>.webp    # NEW: placeholder default share image (owner swaps)
content/sitemap.njk            # NEW: permalink /sitemap.xml
content/robots.njk             # NEW: permalink /robots.txt
lib/drafts.js                  # NEW: showDrafts(), findDrafts(), small and unit-testable
lib/seo.js                     # NEW (optional): ogImage(), site-settings validation
src/_data/site.js              # + url, description, defaultImage, defaultImageAlt
src/_includes/base.njk         # head meta block, Draft label, project pager, nav hiding
src/_includes/card.njk         # Draft label
content/style.css              # pager, draft label, reflow fixes
test/helpers/site.js           # default asset + new base files + serve-mode runner
test/drafts.test.js  test/seo.test.js  test/pager.test.js  test/readme.test.js  test/reflow.test.js
scripts/check-reflow.mjs       # optional local headless script (not in npm test)
```

### Pattern 1: Drafts via preprocessor, fail-closed on run mode (PUB-05, D-13/14/17)

**What:** One preprocessor drops draft templates unless Eleventy is in `serve`/`watch`. Eleventy sets the env var itself, so it cannot be inherited from CI.
**Evidence:** Docs example uses exactly `addPreprocessor("drafts", "*", ...)` with `process.env.ELEVENTY_RUN_MODE === "build"` and says "Returning `false` ignores the template" [CITED: https://www.11ty.dev/docs/config-preprocessors/]. Source: `process.env.ELEVENTY_RUN_MODE = env.runMode;` [VERIFIED: node_modules/@11ty/eleventy/src/Eleventy.js:636]; a `false` return gives `skippedVia` and `return [];` from `getTemplates` [VERIFIED: node_modules/@11ty/eleventy/src/Template.js:~779-790]. Spiked this session: with `draft: true`, build mode wrote only the published file; `new Eleventy("content","_site",{runMode:"serve"})` wrote both.

```js
// lib/drafts.js
import { readdirSync } from "node:fs";
import { readFrontMatter } from "./frontmatter.js";

// Fail closed: drafts show only when Eleventy itself says it is serving or watching.
export const showDrafts = () => ["serve", "watch"].includes(process.env.ELEVENTY_RUN_MODE);

// eleventy.config.js
eleventyConfig.addPreprocessor("drafts", "*", (data) => {
  if (data.draft === true && !showDrafts()) return false; // strict === true: "yes" is left for validateContent to reject
});
```

Because only `=== true` skips, a non-boolean such as `draft: "yes"` stays in the build and is rejected by `validateContent` (D-19) with the file named. Add inside `validateContent`:

```js
if ("draft" in raw && typeof raw.draft !== "boolean") err(`"draft" must be true or false (got ${JSON.stringify(raw.draft)})`);
```

Note js-yaml 4 follows YAML 1.2 core, so `draft: yes` parses as the string `"yes"` and is rejected, which is the desired strictness; the error should hint `use true or false`. [ASSUMED: js-yaml 4 treats yes/no as strings; the planner should include a one-line test that `draft: yes` fails.]

**Consequences that come for free:** `collections.projects`, `tagPages`, `featured`, `_validated`, the sitemap collection, prev/next and `/work/` all exclude drafts in live mode; the draft's markdown never renders, so `registerPdf`/`videos`/`posters` Maps in `lib/media.js` never see its media (D-17).

**Needs explicit code (because skipped drafts vanish):**
- D-16 featured: `resolveFeatured` will now report "does not match any project" for a drafted slug. Pass the draft slugs in and warn instead (see Pitfall 2 for the return-shape trap).
- D-18 nav: `findDrafts()` pre-scan reading front matter of `content/projects/*.md` and `content/pages/*.md` (reuse `readFrontMatter`), run in `eleventy.before`, print `WARN content/pages/cv.md: ...` via `console.warn` (same style as `lib/alt-lint.js`: `WARN ${file}: ...`).

### Pattern 2: Draft label (D-15)

`draft` is page data, so `{% if draft %}` in `base.njk` and `{% if project.data.draft %}` in `card.njk` can never render in live mode (the template does not exist). Plain text, no new font size or weight beyond the allowed set (`design.test.js` allows only 1.125/0.875/1.5/2.5rem and weights 400/700):

```njk
{% if draft %}<p class="draft-label">Draft</p>{% endif %}   {# right after <h1> #}
<span class="draft-label">Draft</span>                      {# inside a.card, after card-title #}
```
```css
.draft-label { font-size: 0.875rem; font-weight: 700; text-transform: uppercase; }
```
Keep it inside the card's `<a>` so the accessible name reads "Tidepool Draft". Do not set `display:none` or colour-only meaning.

### Pattern 3: Next/previous with built-in filters (SITE-06)

`getPreviousCollectionItem(collection, page)` returns `collection[index-1]` or `undefined`; `getNextCollectionItem` returns `index+1` [VERIFIED: node_modules/@11ty/eleventy/src/Filters/GetCollectionItem.js, whole file read]. It compares `inputPath` and `url`, so it works on the custom `projects` array order (newest first): `index-1` is newer (= "Previous"), `index+1` is older (= "Next"). Ends return `undefined` (no wrap, D-02). Without the i18n plugin the locale wrapper falls through to this function [VERIFIED: Filters/GetLocaleCollectionItem.js:12-17].

Add `isProject: true` to `content/projects/projects.11tydata.js` (do not infer from `section == "work"`, which tag pages also have):

```njk
{#- bottom of <main>, after {{ content | safe }} -#}
{% if isProject %}
{% set newer = collections.projects | getPreviousCollectionItem(page) %}
{% set older = collections.projects | getNextCollectionItem(page) %}
{% if newer or older %}
<nav class="pager" aria-label="Projects"><ul>
  {% if newer %}<li><a rel="prev" href="{{ newer.url }}"><span aria-hidden="true">← </span>Previous: {{ newer.data.title }}</a></li>{% endif %}
  {% if older %}<li><a rel="next" href="{{ older.url }}">Next: {{ older.data.title }}<span aria-hidden="true"> →</span></a></li>{% endif %}
</ul></nav>
{% endif %}
{% endif %}
```
`newer.url` is a root-relative `/slug/`, which `HtmlBasePlugin` prefixes exactly as `card.njk` already relies on. The arrows are decorative (`aria-hidden`) so screen readers read only the words. The nav must be a direct child of `<main>` and not inside the `{{ content }}`; CSS: `.pager ul { display:flex; flex-wrap:wrap; gap:.5rem 1.5rem; list-style:none; margin:0; padding:0 }`, mirroring `.filters`. Add `.pager` to the `main > ... ul:not(.cards, .filters)` exclusion only if the prose cap would wrongly constrain it (it only caps `main > ul`, and the `ul` here is inside `nav`, so no change needed).

### Pattern 4: Absolute URLs, OG tags, OG image (SITE-07)

**Absolute URL:** `{{ page.url | htmlBaseUrl(site.url) }}` is a built-in from `HtmlBasePlugin` (already installed). With an origin-only base it returns `base + pathPrefix + path`. Spiked this session in both prefixes:
- `PATH_PREFIX=/portfolio-test/`: `https://djmccurley.github.io/portfolio-test/a/b/`, image `https://djmccurley.github.io/portfolio-test/img/x-1200.jpeg`.
- `PATH_PREFIX=/`: `https://djmccurley.github.io/a/b/`.
Source: `htmlBaseUrl` filter and `transformUrl` [VERIFIED: node_modules/@11ty/eleventy/src/Plugins/HtmlBasePlugin.js:~70-95]. `site.url` MUST be origin-only (no path, no trailing path) because `new URL("/x/", base)` drops any path in the base; validate with `/^https?:\/\/[^/]+$/` and fail naming `src/_data/site.js`. The existing `root prefix` test asserts no HTML contains `/portfolio-test/` when `PATH_PREFIX=/`, which holds as long as `site.url` has no path. [VERIFIED: test/build.test.js "root prefix"]

**Head block** (D-06 fallback chain, D-07, D-10; all values go through Nunjucks autoescape, no `| safe`):

```njk
{%- set pageDescription = description or summary or site.description %}
{%- set shareSrc = cover or site.defaultImage %}
{%- set shareAlt = cover_alt if cover else site.defaultImageAlt %}
{%- set share = shareSrc | ogImage %}
<meta name="description" content="{{ pageDescription }}">
<link rel="canonical" href="{{ page.url | htmlBaseUrl(site.url) }}">
<meta property="og:title" content="{{ title }}">
<meta property="og:description" content="{{ pageDescription }}">
<meta property="og:type" content="{{ 'article' if isProject else 'website' }}">
<meta property="og:url" content="{{ page.url | htmlBaseUrl(site.url) }}">
<meta property="og:site_name" content="{{ site.name }}">
<meta property="og:image" content="{{ share.url | htmlBaseUrl(site.url) }}">
<meta property="og:image:alt" content="{{ shareAlt }}">
<meta name="twitter:card" content="summary_large_image">
```
Do not call `ogImage` inside a `{% for %}` (Nunjucks needs `asyncEach` for async filters in loops); in the layout head it is fine. Spiked: an `async` function registered with plain `addFilter` works in Nunjucks in 3.1.7 (output `x-async`).

**OG image filter** (D-08). Give it its own options; do NOT spread `imageOptions`:

```js
// eleventy.config.js (or lib/seo.js)
import Image from "@11ty/eleventy-img";
import { resolveAsset, hasAlpha } from "./lib/assets.js";

eleventyConfig.addFilter("ogImage", async function (src) {
  const abs = resolveAsset(String(src));
  if (!abs) throw new Error(`${this.page.inputPath}: share image not found in assets/: ${src}`);
  const fmt = hasAlpha(path.basename(abs).toLowerCase()) ? "png" : "jpeg"; // jpeg would flatten alpha to black
  const meta = await Image(abs, {
    widths: [1200], formats: [fmt], urlPath: "/img/", outputDir: "_site/img/", failOnError: true,
  });
  return meta[fmt][0]; // { url: "/img/<hash>-1200.jpeg", width, height, ... }
});
```
Why own options: `imageOptions` carries `formatFiltering: ["transparent"]` ([VERIFIED: lib/images.js, read this session]), which removes JPEG output for a source with alpha and would leave `meta.jpeg` undefined; it also carries `sharpOptions: { animated: true }`, wrong for a GIF cover. eleventy-img does not upscale: `resizeOptions.withoutEnlargement = true` [VERIFIED: node_modules/@11ty/eleventy-img/src/image.js:808], so a 900px cover yields a 900px JPEG; emit `og:image:width/height` from `meta` if wanted (extra to D-10, optional). The output lands in `_site/img/`, the directory `scripts/prune-img.js` and the CI cache already manage; the prune regex `/\/img\/([^"'\s,?#]+)/g` matches inside `content="https://.../img/x-1200.jpeg"`, so the file is kept [VERIFIED: scripts/prune-img.js read this session].

**Format choice:** use JPEG (PNG only for alpha). Facebook's image guide gives size (1200x630 recommended, 600x315 minimum, 8 MB max) but does not state a format list [CITED: developers.facebook.com/docs/sharing/webmasters/images/], so JPEG is the conservative choice and WebP is not relied on. X falls back from `twitter:title/description/image` to the `og:` equivalents but does not infer the card type, so `twitter:card` must be explicit [CITED: developer.x.com/cards/markup via WebSearch summary; the page itself returned HTTP 402 to WebFetch].

**Site settings** (`src/_data/site.js`), with the ones D-06/D-07/D-09 need:

```js
export default {
  name: "Dan McCurley",
  url: "https://djmccurley.github.io", // origin only; change with PATH_PREFIX for a custom domain
  description: "Graphic design, interactive and UX design, art and videogames.", // placeholder wording
  defaultImage: "site-share.webp",       // a file in assets/; build fails naming site.js if missing
  defaultImageAlt: "…",                  // needed for og:image:alt on pages with no cover
};
```
Validate these in `_validated` (read from the data cascade as `featured` does, `api.getAll()[0].data.site`) and prefix errors with `src/_data/site.js:` as `lib/validate.js` does for `tags.js`/`featured.js`. A default-image alt is not in D-07 but is required to emit `og:image:alt` on default-image pages; flag to the planner (Open Question 2).

### Pattern 5: sitemap and robots as templates (D-11/D-12)

`collections.all` holds only the first page of a paginated template [VERIFIED by spike: two-page pagination produced only `/tags/a/` in `collections.all`]. So build the sitemap list in a JS collection:

```js
eleventyConfig.addCollection("sitemap", (api) => {
  const urls = new Set(
    api.getAll()
      .filter((t) => typeof t.url === "string" && !t.data.draft && !t.data.pagination)
      .map((t) => t.url)
  );
  for (const t of tagDefs.filter((d) => /* used */ true)) urls.add(`/tags/${t.slug}/`); // use the tagPages collection
  return [...urls].sort();
});
```
(Use `api.getFilteredByGlob`/the existing `tagPages` logic so tag pages with no live project are not listed; simplest is to re-read the `projects` items exactly as the `tagPages` collection does.) 404 is already absent because `content/404.md` sets `eleventyExcludeFromCollections: true`; the sitemap and robots templates must set it too, or the sitemap lists itself.

```njk
---
permalink: /sitemap.xml
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{%- for u in collections.sitemap %}
  <url><loc>{{ u | htmlBaseUrl(site.url) }}</loc></url>
{%- endfor %}
</urlset>
```
```njk
---
permalink: /robots.txt
eleventyExcludeFromCollections: true
---
User-agent: *
Allow: /

Sitemap: {{ "/sitemap.xml" | htmlBaseUrl(site.url) }}
```
Sitemap protocol: absolute `<loc>`, UTF-8, `<urlset>` namespace, `lastmod` optional (a project `date` is a creation date, not a modified date, so omit it), 50,000 URL cap irrelevant, and a sitemap may only list URLs at or below its own path, which `/portfolio-test/sitemap.xml` satisfies [CITED: https://www.sitemaps.org/protocol.html]. `.xml`/`.txt` outputs are not touched by `HtmlBasePlugin` (extension `html`) or the eleventy-img transform. Slugs match `^[a-z0-9-]+$` ([VERIFIED: lib/validate.js `SLUG_RE`]) so nothing needs XML escaping, but keep autoescape on. `RESERVED_SLUGS` needs no change: a slug cannot contain a dot, so it can never collide with `sitemap.xml`/`robots.txt`.

### Pattern 6: README and its sync test (AUTH-05, D-20..22)

Quote of the real lists the test must import (read this session):

```
// lib/validate.js:5-7
export const RESERVED_SLUGS = new Set(["tags", "404", "assets", "img", "css", "js", "projects", "pages", "video", "work", "pdf"]);
export const PROJECT_KEYS = ["title","date","tags","cover","cover_alt","summary","slug","role","client","tools","year","link","layout","permalink","eleventyExcludeFromCollections"];
export const PAGE_KEYS = ["title","summary","slug","layout","permalink","eleventyExcludeFromCollections"];
// lib/blocks.js (LAYOUT_SIZES keys): "grid-2", "grid-3", "grid-4", full
// lib/blocks.js: EMBEDS.set("video", renderVideo); EMBEDS.set("itch", renderItch);
```
After this phase `PROJECT_KEYS`/`PAGE_KEYS` also contain `description` and `draft`. `RESERVED_SLUGS` is a good README error-guide input too.

```js
// test/readme.test.js
import { LAYOUT_SIZES, EMBEDS } from "../lib/blocks.js";
import { PROJECT_KEYS, PAGE_KEYS } from "../lib/validate.js";
const INTERNAL = new Set(["layout", "permalink", "eleventyExcludeFromCollections"]);
const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
for (const name of [...Object.keys(LAYOUT_SIZES), ...EMBEDS.keys()])
  test(`README documents block ${name}`, () => assert.ok(readme.includes(`::: ${name}`)));
for (const k of new Set([...PROJECT_KEYS, ...PAGE_KEYS])) {
  if (INTERNAL.has(k)) continue;
  test(`README documents front matter key ${k}`, () => assert.ok(readme.includes("`" + k + "`")));
}
```
Make the key check precise: require `` `key` `` (backticked) so ordinary words like "date" or "title" in prose cannot satisfy it, and document the convention in the README itself ("every key is written in backticks in the front matter tables"). Check project keys and page keys against their own tables if the README has two tables; one combined table is fine if the test only asserts presence. `README.md` does not exist today [VERIFIED: `ls README*` no match]. The block reference must match the actual grammar: video `::: video [full] <url-or-assets-file> "Title" [poster=<assets-image>]`, itch `::: itch [full] <embed-url> <W>x<H> "Title" <itch-page-url>` ([VERIFIED: lib/embeds.js read this session]); markdown-it-attrs allows only `class` and `decorative`; captions come from the image title; PDF links are plain markdown links to `assets/*.pdf` that become `/pdf/` links with a size suffix (lib/markdown.js); size caps are in `lib/limits.js` (video 50 MB, PDF 25 MB), `scripts/check-assets.js` (10 MB, 3000px edge).

### Pattern 7: 320px / 200% zoom verification (A11Y-02)

**Model:** 200% zoom of a 1280px desktop is a 640 CSS px layout viewport; 320 CSS px is both a phone and 400% of 1280. Test both widths, plus real widths in between if wanted.

**Zero-dependency headless measurement (spiked and working).** Headless Chrome will not shrink its window below roughly 500px (noted in Phase 2 research), so use an `<iframe>` of the target width inside a same-origin wrapper page and read `documentElement.scrollWidth`. A tiny node `http` server maps `/portfolio-test/` to `_site/` (so the real prefix, `HtmlBasePlugin` rewrites and `/style.css` resolution are exercised) and serves `/__measure?w=<px>&p=<path>`:

```js
// wrapper page body (served by the same origin so contentDocument is readable)
`<iframe id=f src="${p}" style="width:${w}px;height:800px;border:0"></iframe><pre id=out>pending</pre>
 <script>f.onload=()=>setTimeout(()=>{const d=f.contentDocument.documentElement;
   const bad=[...f.contentDocument.body.querySelectorAll('*')]
     .filter(e=>e.scrollWidth>e.clientWidth+1&&e.clientWidth>0).map(e=>e.tagName.toLowerCase());
   out.textContent='RESULT scrollWidth='+d.scrollWidth+' clientWidth='+d.clientWidth+' offenders='+bad.join(',');},500)</script>`
```
Run: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --virtual-time-budget=5000 --dump-dom "http://localhost:4173/__measure?w=320&p=/portfolio-test/tidepool-game/"` and grep `RESULT`. Pass criterion: `scrollWidth == clientWidth`. Results this session on the current build (`_site`, real prefix): `/`, `/work/`, `/cv/`, `/teaching/`, `/tidepool-game/` all `scrollWidth == clientWidth` at 320 and 640 [VERIFIED: ran]. Use per-element `scrollWidth > clientWidth` to name offenders, not `getBoundingClientRect().right`, because overflowing text does not change its box's rect (spike showed empty offenders with the rect approach while the page was 1003px wide).

Plan this as `scripts/check-reflow.mjs` (local, not in `npm test`, not in CI), taking `CHROME_BIN` or the macOS default path, and skipping with a message if absent. The deterministic CI-safe part is the CSS-guard test (Pitfall 6 selectors).

**Known overflows to fix (reproduced on a stress page against the real `style.css`):**

| Case | 320 | 640 | Cause | Fix |
|------|-----|-----|-------|-----|
| long word in `blockquote` | overflow | overflow | `blockquote` not in the `overflow-wrap` list (lines ~190-200 of style.css list h1,h2,h3,p,li,dd,figcaption,a) | add `blockquote`, `pre`, `td`, `th`, `dt`, `summary` or set `body { overflow-wrap: break-word; }` (inherited) |
| long link in meta `dl` | ok (285px) | link 764px in 640px viewport | at `min-width:40em` `dl` uses `grid-template-columns: auto 1fr`; `1fr` has an `auto` minimum, and `overflow-wrap: break-word` does not reduce min-content | `grid-template-columns: auto minmax(0, 1fr)`; also `dd { min-width: 0 }` |
| long token in `<pre>` | overflow | overflow | `pre` has `white-space: pre-wrap` but no `overflow-wrap` | `pre { overflow-wrap: anywhere; }` |
| raw-HTML `<table>` (AUTH-04) | overflow | overflow | tables size to content | document in README: wrap wide tables, or `table { display: block; max-width: 100%; overflow-x: auto; }` (allowed: `design.test.js` forbids only `overflow: hidden`) |

Long single-word `h1`, `h2`, `p`, `li`, `figcaption`, `code` in a paragraph, and the 2-up grid with a long caption did not overflow [VERIFIED: stress run]. Phase 2 flagged "very long h1 at 320px" and "wide raw-HTML tables" for exactly this phase [VERIFIED: 02-02-SUMMARY.md:210].

**Manual check on the live URL** (required by the roadmap criterion; automated tools cannot prove the deployed pages): after deploy, open `https://djmccurley.github.io/portfolio-test/` (live and returning HTTP 200 this session), in Chrome DevTools device toolbar set width 320 and also browser zoom 200% on a 1280px window and 400%; load `/`, `/work/`, a tag page, the project page with the most blocks (grid, video, itch, PDF), `/cv/`, `/teaching/`, `/404-test-url/`; confirm no horizontal scrollbar, no clipped controls, header wraps, lightbox Close reachable. Add the result to VERIFICATION.

### Anti-Patterns to Avoid

- **Filtering drafts in each template** (`work.njk`, `tags`, featured, sitemap). One preprocessor removes the template everywhere; per-template filters leave media registered and tags generated.
- **Reading `collections.all` for the sitemap without handling pagination.** Silently drops tag pages 2..n.
- **`process.env.DRAFTS` / a `--drafts` flag.** Violates D-13 ("no flag to remember") and makes CI leaks possible.
- **Spreading `imageOptions` into the OG `Image()` call.** Empty result for alpha sources, animated sharp options on GIFs.
- **`overflow: hidden` to "fix" overflow.** Forbidden by `test/design.test.js` and it clips content.
- **Setting `site.url` with a path** (`https://x.com/portfolio-test`): `new URL` drops it and prefix logic duplicates.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Prev/next neighbour lookup | index search over `collections.projects` | `getPreviousCollectionItem` / `getNextCollectionItem` (built in) | Already compares `inputPath`+`url`, returns `undefined` at ends |
| Absolute URL with prefix | string concatenation of `site.url`, `PATH_PREFIX`, `page.url` | `htmlBaseUrl(site.url)` from `HtmlBasePlugin` | Handles `/` vs `/prefix/`, trailing slashes; spiked in both prefixes |
| Draft skip | per-collection filters or file deletion | `addPreprocessor` returning `false` | One place; never renders; no media registered |
| Image resizing for OG | custom sharp script/copy step | eleventy-img `Image()` | Same hashing/cache/outputDir, prune script already understands `/img/` |
| Front matter parsing for the draft pre-scan | regex of `draft:` lines | `readFrontMatter` in `lib/frontmatter.js` | Same lenient date handling as the build |
| Sitemap/robots | an npm sitemap plugin | two 8-line njk templates | No dependency; behaviour is trivial once the pagination trap is known |
| Headless browser dependency for reflow | Playwright/Puppeteer | the iframe-width harness with system Chrome | Spiked working; zero install weight |

**Key insight:** every Phase 4 capability is "route through something Eleventy already does". Anything that needs a new package or a second code path for drafts is the wrong shape.

## Runtime State Inventory

Not a rename/refactor/migration phase. Omitted.

One adjacent note: Eleventy never empties `_site/`, so after `npm start` has written drafts, a later local `npm run build` leaves the old draft HTML in `_site/`. CI starts from a fresh checkout (`_site/` is git-ignored [VERIFIED: .gitignore]) and `_site/img` is restored only from cache then pruned, so CI cannot publish stale drafts. Tests must build into a fresh temp dir (they do: `makeSite` uses `mkdtemp`). The README should say to delete `_site/` before inspecting a local production build.

## Common Pitfalls

### Pitfall 1: Every existing fixture test breaks when `site.js` names a default image
**What goes wrong:** `makeSite` copies `src/` from the repo, so fixture builds read the repo's `site.js` and the new "default image must exist" check fails (D-07) for all ~20 test files. The new `content/sitemap.njk` and `content/robots.njk` are also not copied because the helper only copies a fixed allow-list (`["style.css","404.md","index.md","work.njk","tags.njk","lightbox.js"]` plus `*.11tydata.js`) [VERIFIED: test/helpers/site.js read this session].
**How to avoid:** In plan 1, update the helper to (a) write a small default asset named from `site.defaultImage` unless the test supplies one (b) add `sitemap.njk`/`robots.njk` to the allow-list (c) add a serve-mode build method. Do this before touching anything else; run the full suite green.
**Warning signs:** dozens of failures naming `src/_data/site.js`.

### Pitfall 2: `resolveFeatured` return shape is asserted exactly
**What goes wrong:** `test/featured.test.js` does `assert.deepEqual(resolveFeatured([], pairs), { errors: [], items: [] })` [VERIFIED: grep this session]. Adding a `warnings` array to the return value breaks it.
**How to avoid:** add a third optional argument (`{ draftSlugs, warn }`) and print through the callback, or update that test deliberately. Keep the unknown-slug and duplicate-slug errors untouched (D-16). Also remove/replace `content-errors.test.js` "draft not yet supported" (it asserts `unknown front matter key "draft"`) [VERIFIED: test/content-errors.test.js:64-65].

### Pitfall 3: The sitemap misses tag pages
See Pattern 5. Test: a fixture with two used tags must list both `/tags/<slug>/` URLs, exactly once each, and no tag used only by a draft.

### Pitfall 4: A skipped draft hides its own errors in the live build
A broken draft (bad tag, missing cover) passes the live build and fails locally. This is acceptable, even desirable, but say so in the README error guide. Non-boolean `draft` is the exception and still fails everywhere (kept in the build, rejected by `validateContent`).

### Pitfall 5: Async filter in a loop, and `set` of an async result
`ogImage` is fine in `{% set %}` in the layout head (spiked equivalent). Do not call it inside `{% for %}` in Nunjucks. Keep OG computation in the layout head only.

### Pitfall 6: Reflow CSS guard test must assert the real fixes
Add to `test/design.test.js`-style rules: `dl` columns use `minmax(0, 1fr)`; `blockquote`/`pre`/`td` (or `body`) set `overflow-wrap`; no fixed pixel widths on containers; keep `min-width: 0` on grid children. Assert with the existing `rule()`/`allRules()` helpers. This is cheap, deterministic and runs in CI; the headless script remains local.

### Pitfall 7: CI image-cache key does not cover the new OG code path
The CI cache key hashes `assets/**`, `eleventy.config.js` and `lib/**` ([VERIFIED: .github/workflows/deploy.yml]). If the `ogImage` filter lives in `lib/`, editing it invalidates the cache once, which is correct. If `site.js` changes only `defaultImage`, `assets/**` changes too. No workflow change is required; `test/workflow.test.js` pins the exact step list, so do not reorder CI steps.

### Pitfall 8: Existing `<title>` and head assertions
Tests assert e.g. `<title>Teaching</title>` exactly and that the stylesheet follows the Google Fonts link [VERIFIED: test/pdf.test.js:249, test/design.test.js]. Insert the new meta block after `<title>` without altering either, and keep `<link rel="stylesheet" href="/style.css">` after the fonts link. `design.test.js` also forbids a `name="referrer"` meta and any `<script>` other than deferred `lightbox.js`; the OG block adds none.

### Pitfall 9: README placeholders drift
The README example blocks are copy-pasted by the owner. Build the README examples from syntax actually accepted (`lib/blocks.js`, `lib/embeds.js`), and consider one test that extracts each fenced `:::` example from the README and builds it in a fixture to prove the docs are valid. This is optional but cheap with `makeSite`.

## Code Examples

### Serve-mode build in tests (spiked)
`eleventy --serve` blocks, but the programmatic API with `runMode: "serve"` writes once and exits and sets `ELEVENTY_RUN_MODE=serve` (verified: draft file written in serve, skipped in build). Add to `makeSite`'s returned object:

```js
buildServe() {
  fs.writeFileSync(path.join(dir, "run-serve.mjs"),
    'import Eleventy from "@11ty/eleventy";\nconst e = new Eleventy("content","_site",{runMode:"serve"});\nawait e.write();\n');
  const r = spawnSync(process.execPath, ["run-serve.mjs"], { cwd: dir, env: { ...process.env, PATH_PREFIX: prefix ?? process.env.PATH_PREFIX }, encoding: "utf8" });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr, output: `${r.stdout}\n${r.stderr}` };
},
```
Delete `ELEVENTY_RUN_MODE` from the child env in both builders so a stray value cannot leak in (Eleventy overwrites it anyway).

### Draft test matrix (drafts.test.js)
For each: build (live) and `buildServe()` (local) on one fixture with a published project, a draft project (tag only used by drafts, with image/video/PDF only it references), a draft page, and a `featured.js` naming the draft:
- live: draft HTML absent; `/work/` and homepage lack its card; its tag has no `/tags/<slug>/` page and no filter link; no draft slug in `sitemap.xml`; draft-only image variants, `_site/video/*`, `_site/pdf/*` absent; featured warning `WARN src/_data/featured.js: ...` printed and exit 0; published neighbour's pager does not link to it.
- serve: all of the above present, "Draft" label on page and card.
- `draft: "yes"` fails in live and serve naming the file; `draft: false` publishes.
- draft `cv.md`: warning names `content/pages/cv.md`; nav link hidden (recommended).
- Assert `package.json` `"build"` is exactly `"eleventy"` and `.github/workflows/deploy.yml` never runs `--serve`/`--watch` (extends `workflow.test.js`).

### Pager and SEO tests
Fixture with three projects (dates 2022, 2023, 2024): newest page has only `Next:` linking the middle; middle has both; oldest only `Previous:`; one project has no `<nav aria-label="Projects">`; a standalone page has none; the main nav still has `aria-label="Main"`. SEO: exact `og:*`/`twitter:card` set from D-10, `og:url`/canonical equal `https://djmccurley.github.io/<prefix>...`, `og:image` absolute, ends `-1200.jpeg` (or smaller width for a small cover), file exists in `_site/img/` and is not an original; with `PATH_PREFIX=/` no `/portfolio-test/` appears; description fallback chain `description` > `summary` > `site.description`; quotes in `description` are escaped; missing default image fails naming `src/_data/site.js`; `sitemap.xml` and `robots.txt` URLs absolute; 404 absent.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `eleventyExcludeFromCollections` + `permalink:false` computed per draft | `addPreprocessor` returning `false` | Eleventy 3.0 | Single hook; no data-cascade tricks [CITED: 11ty.dev/docs/config-preprocessors/] |
| `eleventy-plugin-rss` absoluteUrl filter for absolute URLs | `htmlBaseUrl(base)` from built-in `HtmlBasePlugin` | Eleventy 2.0 canary / 3.0 | No plugin needed |
| `100vw` full-bleed tricks | Named-line grid (already in `style.css`) | Phase 2 | Already reflow-safe |

**Deprecated/outdated:** Eleventy 4.0 alpha (not for this project, per CLAUDE.md).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | js-yaml 4 parses `draft: yes` as the string "yes" (YAML 1.2 core), so it is rejected by D-19 | Pattern 1 | If it parses as boolean `true`, `yes` would silently be a draft; add the one-line test to confirm |
| A2 | JPEG is accepted by all major share crawlers; WebP support unconfirmed for Facebook | Pattern 4 | Low; JPEG is the safest default |
| A3 | X reads `og:*` as fallback for `twitter:title/description/image` but needs explicit `twitter:card` | Pattern 4 | Low; D-10 already sets `twitter:card`. Source was a search summary because the official page returned HTTP 402 |
| A4 | `ubuntu-latest` runners ship Google Chrome, so a reflow script could later run in CI | Pattern 7 | None now; the recommendation keeps it out of CI |
| A5 | Hiding the CV/Teaching nav links when drafted (D-18 discretion) is wanted | Pattern 1 | Owner may prefer a visible warning only; either satisfies D-18 |

## Open Questions (RESOLVED)

All five questions were resolved during planning. Each plan adopts the recommendation, as cited below.

1. **Where does `url` live: `eleventy.config.js` next to `PATH_PREFIX`, or `src/_data/site.js`?**
   - D-09 says "next to `PATH_PREFIX`"; the CONTEXT code-context says to add `url` in `site.js`. Templates read `site.url`, so `site.js` is the practical home.
   - Recommendation: put `url` in `src/_data/site.js`, and have the README name both files as the pair to change together. Keep the `PATH_PREFIX ?? "..."` line format untouched, because `test/helpers/site.js` `defaultPrefix()` regex-parses it.
   - **RESOLVED:** `url: "https://djmccurley.github.io"` goes in `src/_data/site.js` (04-02 Task 1) and is validated as an https origin by `validateSite` (04-02 Task 3). The `PATH_PREFIX` line is not touched. The README's "Moving to a custom domain" paragraph names `url` and `PATH_PREFIX` as the pair to change together (04-04 Task 2).

2. **Default share image alt text.** D-07 names a default image but not its alt. Add `defaultImageAlt` to `site.js` so `og:image:alt` is never empty on default-image pages. Recommendation: add it, with a placeholder the README tells the owner to replace.
   - **RESOLVED:** `defaultImageAlt` is added to `src/_data/site.js` (04-02 Task 2). It must be non-empty or the build fails naming `site.js` (04-02 Task 3), and the README Site settings table lists it (04-04 Task 2).

3. **Which asset is the default share image?** Recommendation: add a new neutral 1200x630 `assets/site-share.webp` placeholder (generated once with sharp, under the 10 MB / 3000px asset caps) rather than reusing `tidepool-game-image.webp`, so the owner swaps one obvious file. The same file name feeds the `makeSite` fixture asset.
   - **RESOLVED:** a new 1200x630 `assets/site-share.webp` placeholder is named by `defaultImage: "site-share.webp"`, and the `makeSite` fixture asset uses the same name (04-02 Task 2).

4. **Hide the nav link for a drafted CV/Teaching page?** Recommendation: yes, via a global `draftNav` list consumed by `base.njk`, plus the warning. Hide only for known drafted pages (not for merely missing pages) so the nav-order assertions in `test/browse.test.js` keep passing.
   - **RESOLVED:** yes. The global is named `hiddenNav` (from `hiddenNavSlugs()` in `lib/drafts.js`) instead of `draftNav`. It hides only drafted CV/Teaching items in the live build, alongside the D-18 warning, and a page that is just missing keeps its nav item (04-01 Task 3).

5. **`og:type` article vs website.** Recommendation: `article` for projects (`isProject`), `website` elsewhere; costs nothing.
   - **RESOLVED:** `og:type` is `article` when `isProject` (set in `projects.11tydata.js`) and `website` everywhere else (04-02 Task 1).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | everything | yes | v24.14.1 local, CI pins 22 (`engines >=22`) | none needed |
| Eleventy / eleventy-img / sharp | build | yes | 3.1.7 / 7.1.1 / 0.35.5 | none needed |
| Google Chrome (headless) | optional `scripts/check-reflow.mjs` | yes (macOS app) | system | manual DevTools check; the CSS-guard test is the CI substitute |
| Live site `https://djmccurley.github.io/portfolio-test/` | manual 320/200% check | yes (HTTP 200 this session) | n/a | none |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** Chrome in CI is not required by the recommendation.

## Validation Architecture

Skipped: `workflow.nyquist_validation` is `false` in `.planning/config.json`. Test guidance is embedded in the Code Examples above; framework is `node --test 'test/*.test.js'` (`npm test`), fixtures via `test/helpers/site.js`.

## Security Domain

`security_enforcement` is enabled (ASVS level 1). The site is static; the relevant surface is build-time content handling and information disclosure.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | static site, no auth |
| V3 Session Management | no | none |
| V4 Access Control | partly | Unpublished work must not be reachable: drafts, their media, sitemap entries (D-14, D-17) |
| V5 Input Validation | yes | Front matter is validated (`draft` boolean, `description` string, `site.url` origin-only); output encoding via Nunjucks autoescape in `content="..."` attributes; never `| safe` on user text |
| V6 Cryptography | no | none; HTTPS is provided by GitHub Pages |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Draft content published by a misconfigured build (information disclosure) | Information disclosure | Fail-closed preprocessor on Eleventy-owned run mode; test that CI build script has no serve/watch; clean-checkout CI; draft media never registered |
| Draft media guessable by URL after a draft is removed from pages | Information disclosure | Only media reached from rendered pages is output; `prune:img` removes cached variants no page references |
| Attribute injection through `description`/`summary`/`title` quotes in meta tags | Tampering | Nunjucks autoescape (`"` becomes `&quot;`), add a test with `"` and `<` in `description` |
| Open redirect / wrong host in canonical and `og:url` | Spoofing | `site.url` validated as origin-only `https` and used only through `htmlBaseUrl` |
| XML injection in sitemap | Tampering | Slugs constrained to `^[a-z0-9-]+$`; autoescape stays on |
| robots.txt mistaken for access control | Information disclosure | Document in README that `draft:` (not robots.txt) hides content; robots is inert on github.io project sites (D-12) |
| Stale draft HTML left in local `_site/` | Information disclosure | `_site/` is git-ignored; deploy is from CI clean checkout only |

## Project Constraints (from CLAUDE.md)

- Eleventy 3.x firm; Node 22; no client JS beyond the lightbox (`content/lightbox.js`); no new JS frameworks. This phase adds no JS.
- Zero or near-zero client JS; plain HTML/CSS; semantic HTML, alt text, keyboard-accessible, reduced motion respected, good contrast.
- Never publish originals from `assets/` (IMG-03); OG image must be a processed variant.
- GitHub Pages limits (about 1 GB site, 100 MB/file); the extra 1200px JPEG per cover is small.
- Single shared `assets/` folder; do not passthrough-copy it.
- GSD workflow enforcement: file edits happen through a GSD command (`/gsd-execute-phase`), not directly.
- Prior-phase conventions to keep: every content error fails the build naming file and field; new warnings print as `WARN <file>: ...` and do not fail; CSS tokens only (four font sizes, two weights); tests are `node --test` over fixture builds.

## Sources

### Primary (HIGH confidence)
- Installed source, read this session: `node_modules/@11ty/eleventy/src/Eleventy.js` (run-mode env), `Template.js` (preprocessor skip), `Filters/GetCollectionItem.js`, `Filters/GetLocaleCollectionItem.js`, `Plugins/HtmlBasePlugin.js`, `defaultConfig.js` (filter registration); `node_modules/@11ty/eleventy-img/src/image.js:808` (no upscaling).
- Repo files read this session: `eleventy.config.js`, `lib/validate.js`, `lib/blocks.js`, `lib/embeds.js`, `lib/media.js`, `lib/markdown.js`, `lib/images.js`, `lib/assets.js`, `lib/limits.js`, `scripts/prune-img.js`, `scripts/check-assets.js`, `src/_includes/*.njk`, `src/_data/*.js`, `content/*`, `content/style.css`, `.github/workflows/deploy.yml`, `test/helpers/site.js`, `test/design.test.js`, `test/build.test.js`, `test/workflow.test.js`, `test/content-errors.test.js`, `test/featured.test.js`.
- Spikes run this session (scratchpad): preprocessor draft skip in build vs programmatic `runMode: "serve"`; async filter in Nunjucks; `htmlBaseUrl(site.url)` under `/portfolio-test/` and `/`; `collections.all` pagination behaviour; headless Chrome iframe-width reflow harness against the real site and a stress page.
- https://www.11ty.dev/docs/config-preprocessors/ (drafts recipe, `false` return)
- https://www.sitemaps.org/protocol.html
- https://developers.facebook.com/docs/sharing/webmasters/images/

### Secondary (MEDIUM confidence)
- WebSearch summary of X Cards markup (developer.x.com/cards/markup; page itself returned HTTP 402): twitter tags fall back to og tags, card type does not.

### Tertiary (LOW confidence)
- Claim that X downgrades `summary_large_image` below 300x157 px (a community post; not confirmed). Not relied on.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new packages; versions read from `npm ls`.
- Architecture: HIGH - draft, absolute-URL, pagination and reflow mechanisms each reproduced locally.
- Pitfalls: HIGH - taken from reading the actual tests/helpers and from failing spikes.
- Crawler behaviour (Facebook/X image formats, card fallback): MEDIUM - docs partly unreachable.

**Research date:** 2026-10-30
**Valid until:** 2026-11-29 (stable stack; re-check only if Eleventy is upgraded off 3.1.x)
