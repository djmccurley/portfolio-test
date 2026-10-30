# Phase 4: Hardening and Launch Readiness - Pattern Map

**Mapped:** 2026-10-30
**Files analyzed:** 22 new/modified
**Analogs found:** 20 / 22
(All analog paths verified as git-tracked source.)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `eleventy.config.js` (preprocessor, ogImage filter, sitemap collection, before-hook scan) | config | transform / event-driven | itself (`assetSrc` filter, `tagPages` collection, `eleventy.before` hook) | exact |
| `lib/drafts.js` (new) | utility | transform | `lib/alt-lint.js` + `lib/frontmatter.js` | role-match |
| `lib/seo.js` (new, optional) | utility | transform / file-I/O | `lib/images.js`, `lib/assets.js` | role-match |
| `lib/validate.js` (`draft`, `description`, site settings, featured draft skip) | validator | transform | itself (`resolveFeatured`, `PROJECT_KEYS`) | exact |
| `src/_data/site.js` | config | static data | itself | exact |
| `src/_includes/base.njk` (head meta, Draft label, pager, nav hiding) | template | request-response | itself | exact |
| `src/_includes/card.njk` (Draft label) | template | transform | itself | exact |
| `content/projects/projects.11tydata.js` (`isProject`) | config | transform | itself | exact |
| `content/sitemap.njk`, `content/robots.njk` (new) | template | transform | `content/404.md` (permalink + `eleventyExcludeFromCollections`) | role-match |
| `content/style.css` (pager, draft label, reflow fixes) | style | n/a | itself | exact |
| `assets/site-share.webp` (new) | asset | n/a | `assets/tidepool-game-image.webp` | n/a |
| `README.md` (new) | doc | n/a | none | none |
| `test/helpers/site.js` (default asset, allow-list, `buildServe`) | test helper | file-I/O | itself | exact |
| `test/drafts.test.js`, `seo.test.js`, `pager.test.js` (new) | test | fixture build | `test/featured.test.js` | exact |
| `test/readme.test.js` (new) | test | transform | `test/design.test.js` (reads real files) | role-match |
| `test/reflow.test.js` or additions to `test/design.test.js` | test | CSS assertion | `test/design.test.js` (`rule()` helper) | exact |
| `test/featured.test.js`, `test/content-errors.test.js` (modify) | test | fixture build | themselves | exact |
| `test/workflow.test.js` (extend) | test | transform | itself | exact |
| `scripts/check-reflow.mjs` (optional, new) | script | request-response | `scripts/check-assets.js` | role-match |

## Pattern Assignments

### `eleventy.config.js` (config)

**Analog:** itself. Add new hooks in the same style, before `addValidation(eleventyConfig);` (line ~96).

**Filter bound to `this.page` and resolving assets** (copy for `ogImage`):
```js
eleventyConfig.addFilter("assetSrc", function (cover) {
  const abs = resolveAsset(String(cover));
  if (!abs) throw new Error(`${this.page.inputPath}: cover not found in assets/: ${cover}`);
  return path.relative(path.dirname(this.page.inputPath), abs);
});
```
`ogImage` follows this shape but is `async`, calls `Image()` with its own options (do NOT spread `imageOptions`), see RESEARCH Pattern 4. Add `import Image from "@11ty/eleventy-img"` next to the existing `eleventyImageTransformPlugin` import.

**Collection pattern** (copy for `sitemap`; mirror `tagPages` so unused tags are excluded):
```js
eleventyConfig.addCollection("tagPages", (api) => {
  if (!Array.isArray(tagDefs)) return [];
  const used = new Set();
  for (const item of api.getFilteredByGlob("content/projects/*.md")) {
    const t = item.data.tags;
    for (const s of Array.isArray(t) ? t : [t]) used.add(s);
  }
  return tagDefs.filter((t) => t?.slug && used.has(t.slug));
});
```
Drafts vanish automatically because the preprocessor drops them before collections are built.

**Event hook pattern** (copy for the draft-nav-page warning scan):
```js
eleventyConfig.on("eleventy.before", () => {
  resetAltWarnings();
  return refreshAssets();
});
```

**Preprocessor (new)**, no codebase analog; use RESEARCH Pattern 1: `eleventyConfig.addPreprocessor("drafts", "*", (data) => { if (data.draft === true && !showDrafts()) return false; });`

**Do not change** the line `const PATH_PREFIX = process.env.PATH_PREFIX ?? "/portfolio-test/";` format: `test/helpers/site.js` `defaultPrefix()` regex-parses it. Put `url` in `src/_data/site.js`.

---

### `lib/drafts.js` (utility, transform)

**Analog:** `lib/alt-lint.js` (warning copy) and `lib/frontmatter.js` (`readFrontMatter`).

**Warning format** (`lib/alt-lint.js` lines 41-48): `` `WARN ${file}: image ${src} ...` `` printed with `console.warn`; warnings never fail the build. New warnings use `WARN content/pages/cv.md: ...` and `WARN src/_data/featured.js: ...`.

Exports: `showDrafts = () => ["serve","watch"].includes(process.env.ELEVENTY_RUN_MODE)` (fail-closed), `findDrafts()` using `readFrontMatter` over `content/projects/*.md` and `content/pages/*.md`. Imports follow the repo style: ESM, relative `./x.js` with extension, `node:` prefixes.

---

### `lib/validate.js` (validator)

**Analog:** itself.

**Key lists** (lines 6-7) get `"description"` and `"draft"` added:
```js
export const PROJECT_KEYS = ["title","date","tags","cover","cover_alt","summary","slug","role","client","tools","year","link","layout","permalink","eleventyExcludeFromCollections"];
export const PAGE_KEYS = ["title","summary","slug","layout","permalink","eleventyExcludeFromCollections"];
```

**Error prefix convention** (`resolveFeatured`, lines 86-112): errors are strings prefixed `src/_data/featured.js:` and collected into `{ errors, items }`. The test asserts `deepEqual(resolveFeatured([], pairs), { errors: [], items: [] })` (test/featured.test.js), so do NOT add a `warnings` key. Add a third optional arg, e.g. `{ draftSlugs, warn }`, and when `entry` is in `draftSlugs` call `warn(...)` and `continue` before the "does not match any project" error:
```js
const match = projects.find((p) => p.slug === entry);
if (!match) {
  errors.push(`${f} featured project "${entry}" does not match any project in content/projects/. Fix the spelling or remove it from the list.`);
  continue;
}
```
Draft boolean check inside `validateContent` (use the same `err(...)` helper that file already uses): `if ("draft" in raw && typeof raw.draft !== "boolean") err(\`"draft" must be true or false (got ${JSON.stringify(raw.draft)})\`)`. Site-settings validation (`url` matches `/^https?:\/\/[^/]+$/`, default image exists via `resolveAsset`) uses the `src/_data/site.js:` prefix, read like `featured` from the data cascade (`api.getAll()[0].data.site`) inside `addValidation`'s `_validated` collection (lines ~114-138).

---

### `src/_data/site.js` (config)

**Analog:** itself (currently `export default { name: "Dan McCurley" };` with a one-line comment). Extend to `{ name, url, description, defaultImage, defaultImageAlt }`, keeping the explanatory-comment style.

---

### `src/_includes/base.njk` (template)

**Analog:** itself.

- Insert the meta/OG block immediately after `<title>{{ title }}</title>` and keep `<link rel="stylesheet" href="/style.css">` after the Google Fonts link (tests assert both). Use RESEARCH Pattern 4 head block verbatim. No `| safe` on user text.
- Draft label goes right after `<h1>{{ title }}</h1>`: `{% if draft %}<p class="draft-label">Draft</p>{% endif %}`.
- Nav hiding (optional, D-18): existing nav items are `<li><a href="/cv/"{% if page.url == "/cv/" %} aria-current="page"{% endif %}>CV</a></li>`; wrap CV/Teaching `<li>` in a conditional on a global `draftNav` list so nav-order assertions in `test/browse.test.js` still pass when nothing is drafted.
- Pager goes after `{{ content | safe }}` and before `</main>`, as a direct child of `<main>`; markup in RESEARCH Pattern 3, gated by `{% if isProject %}`.
- Existing conditional/escaping idiom to match: `{% if date %}<p class="meta"><time datetime="{{ date }}">{{ date }}</time></p>{% endif %}`.

### `src/_includes/card.njk` (template)

**Analog:** itself. Add `{% if project.data.draft %}<span class="draft-label">Draft</span>{% endif %}` inside the `<a class="card">`, after `<span class="card-title">`.

### `content/projects/projects.11tydata.js`

**Analog:** itself. Add `isProject: true` as a sibling of `section: "work"` (top-level key, not in `eleventyComputed`). `section == "work"` is also set on tag pages, so it cannot identify projects.

### `content/sitemap.njk`, `content/robots.njk` (template)

**Analog:** `content/404.md` front matter:
```yaml
---
title: Page not found
layout: base.njk
permalink: /404.html
eleventyExcludeFromCollections: true
---
```
Use `permalink: /sitemap.xml` and `/robots.txt` with `eleventyExcludeFromCollections: true`, and NO `layout`. Bodies in RESEARCH Pattern 5. Add both to the `makeSite` copy allow-list.

### `content/style.css`

**Analog:** itself. Pager mirrors `.filters` (flex-wrap list, no list style). Existing `overflow-wrap: break-word;` rule at line ~193 lists h1,h2,h3,p,li,dd,figcaption,a: add `blockquote`, `pre`, `td`, `th`, `dt`, `summary` there. Change the `dl` two-column grid at the `@media (min-width: 40em)` block (line 268) to `auto minmax(0, 1fr)`. Constraints from `test/design.test.js`: no `overflow: hidden`, only font sizes 1.125/0.875/1.5/2.5rem, weights 400/700.

---

### `test/helpers/site.js` (test helper) - DO FIRST

**Analog:** itself. Read in full before editing (copy allow-list `["style.css","404.md","index.md","work.njk","tags.njk","lightbox.js"]` plus `*.11tydata.js`; `makeAsset(spec)` generates fixtures). Changes: write a default asset named by `site.defaultImage` unless supplied; add `sitemap.njk`, `robots.njk`; add `buildServe()` (RESEARCH Code Examples); delete `ELEVENTY_RUN_MODE` from child env in both builders. The returned object already has `build()` returning `{ code, stdout, stderr, output }`, so `buildServe()` matches that shape.

### `test/drafts.test.js`, `test/seo.test.js`, `test/pager.test.js` (tests)

**Analog:** `test/featured.test.js` lines 1-35:
```js
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { makeSite, defaultPrefix } from "./helpers/site.js";

const sites = [];
after(() => sites.forEach((s) => s.cleanup()));

const proj = ({ title, date, slug }) =>
  `---\ntitle: ${title}\ndate: "${date}"\ntags: [games]\ncover: ../../assets/a.webp\ncover_alt: Cover of ${title}\n${slug ? `slug: ${slug}\n` : ""}---\n\nBody.\n`;
const ASSETS = { "a.webp": { width: 1200, height: 800, format: "webp" } };
async function build(files, opts = {}) {
  const site = await makeSite({ files, assets: ASSETS, ...opts });
  sites.push(site);
  const r = site.build();
  return { site, r };
}
const cardsOf = (html) => (html.match(/<ul class="cards">[\s\S]*?<\/ul>/) ?? [""])[0];
```
Extend `proj` with a `draft` parameter. Test matrices are in RESEARCH Code Examples.

### `test/readme.test.js` (test)

**Analog:** RESEARCH Pattern 6 snippet; reads real lists via `import { LAYOUT_SIZES, EMBEDS } from "../lib/blocks.js"` and `{ PROJECT_KEYS, PAGE_KEYS } from "../lib/validate.js"`. Require `::: name` and backticked `` `key` ``. Confirm `LAYOUT_SIZES`/`EMBEDS` are exported from `lib/blocks.js` (grep before use).

### Reflow CSS guard test

**Analog:** `test/design.test.js` helpers `rule(css, selector)` (line 27) and `allRules`, used as `const root = rule(CSS, ":root");`. Assert the real fixes (Pitfall 6). Local script `scripts/check-reflow.mjs` copies the style of `scripts/check-assets.js` (plain node script with exit code), not included in `npm test`.

### Modified existing tests
- `test/content-errors.test.js` lines ~64-65: remove or replace the "draft not yet supported" case (`unknown front matter key "draft"`).
- `test/workflow.test.js`: add assertions that `package.json` `build` is exactly `eleventy` and the deploy workflow never uses `--serve`/`--watch`; do not reorder CI steps.

## Shared Patterns

### Content errors fail, warnings print
**Source:** `lib/validate.js` (`throw new Error("Content validation failed:\n" + errors.join("\n"))`) and `lib/alt-lint.js` (`WARN <file>: ...`).
**Apply to:** site-settings validation (fail, name `src/_data/site.js`), `draft` non-boolean (fail, name file), featured-draft and drafted-nav-page (warn, never fail).

### Root-relative URLs for HtmlBasePlugin, absolute only via `htmlBaseUrl`
**Source:** `card.njk` (`href="{{ project.url }}"`), base.njk (`href="/work/"`).
**Apply to:** pager links (relative, prefixed automatically); canonical, `og:url`, `og:image`, sitemap, robots use `| htmlBaseUrl(site.url)`.

### No new client JS, no new dependencies
Only `content/lightbox.js` exists. `design.test.js` forbids other `<script>` and a `name="referrer"` meta.

### Fixture-based tests
Always via `makeSite` into a fresh temp dir with `after(() => sites.forEach((s) => s.cleanup()))`.

## No Analog Found

| File | Role | Reason |
|---|---|---|
| `README.md` | doc | No README exists; build from RESEARCH Pattern 6 and the real grammar in `lib/blocks.js`, `lib/embeds.js`, `lib/limits.js`, `scripts/check-assets.js` |
| `assets/site-share.webp` | asset | Placeholder; generate once with sharp (1200x630, under the 10 MB / 3000px caps) |
| draft preprocessor (`addPreprocessor`) | config | No preprocessors exist yet; use RESEARCH Pattern 1 |

## Metadata

**Analog search scope:** `eleventy.config.js`, `lib/`, `src/`, `content/`, `test/`, `scripts/` (tracked files via `git ls-files`)
**Files scanned:** ~55
**Pattern extraction date:** 2026-10-30
