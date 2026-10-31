# Phase 1: Push-to-Live with Images - Pattern Map

**Mapped:** 2026-10-28
**Files analyzed:** 22 new files, 0 modified
**Analogs found:** 0 / 22 in-repo (greenfield). All files use the spike-verified snippets in `01-RESEARCH.md` as the reference pattern. Where one new file can copy from another new file in this phase, that is noted.

Codebase check: the repo contains only `.planning/` and `CLAUDE.md`, so there is no source to mine. The "analog" for each file is a RESEARCH.md section. Each file listed below is a build config or scripting file, so the conventions set here (ESM, `lib/` modules, `content/` input) become the analogs for Phases 2-4.

## File Classification

| New File | Role | Data Flow | Reference Pattern | Match |
|----------|------|-----------|-------------------|-------|
| `package.json` | config | n/a | RESEARCH Installation, Pattern 9 | research |
| `eleventy.config.js` | config | transform | RESEARCH Patterns 2, 7, 8 | research |
| `lib/markdown.js` | utility (markdown-it rule) | transform | RESEARCH Pattern 1 | research (spike-tested) |
| `lib/assets.js` | utility | file-I/O | RESEARCH Pattern 1 (index) and Pattern 3 (alpha set) | research |
| `lib/validate.js` | service | batch validation | RESEARCH Pattern 4 and Code Examples | research (spike-tested) |
| `lib/frontmatter.js` | utility | transform | RESEARCH Pattern 5 | research (spike-tested) |
| `src/_data/tags.js` | config/data | n/a | D-04, D-05; export tag list and reserved slugs | none |
| `content/projects/projects.11tydata.js` | config (directory data) | request-response | RESEARCH Pattern 6 | research |
| `content/pages/pages.11tydata.js` | config (directory data) | request-response | copy `projects.11tydata.js` | in-phase |
| `content/index.md`, `content/404.md` | page | request-response | RESEARCH Pattern 6 (404 permalink) | research |
| `content/projects/tidepool-game.md` (fixture or sample) | content | request-response | D-06, D-07, D-08 | none |
| `content/style.css` | asset | static | D-22 | none |
| `src/_includes/base.njk` | template | request-response | RESEARCH Code Examples (Minimal layout) and Pitfall 1 | research |
| `scripts/shrink.js` | utility (CLI) | file-I/O, batch | RESEARCH Pattern 9 | research (spike-tested) |
| `scripts/check-assets.js` | utility (CLI) | file-I/O, batch | RESEARCH Pattern 9 (last bullet) | research |
| `.githooks/pre-commit` | config (git hook) | event-driven | RESEARCH Pattern 9 | research |
| `.vscode/settings.json` | config | n/a | RESEARCH Pattern 10 | research |
| `.github/workflows/deploy.yml` | config (CI) | event-driven | RESEARCH Pattern 11 | research |
| `.gitignore` | config | n/a | ignore `_site/`, `node_modules/`, `.cache/` | none |
| `assets/.gitkeep` | placeholder | n/a | none | none |
| `README.md` (optional) | doc | n/a | document paste, shrink, PATH_PREFIX | none |
| fixtures for D-23 failure tests (optional) | test | batch | RESEARCH Acceptance checks (3) | none |

## Pattern Assignments

### `eleventy.config.js` (config, transform)

**Reference:** RESEARCH Patterns 2, 7, 8. It must be ESM (`"type":"module"` in `package.json`).

**Imports and base path** (Pattern 2 and Pattern 7):
```js
import { HtmlBasePlugin } from "@11ty/eleventy";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
const PATH_PREFIX = process.env.PATH_PREFIX ?? "/portfolio-test/";   // THE one value; "/" for root/custom domain
```

**Plugin wiring:**
```js
eleventyConfig.addPlugin(HtmlBasePlugin);                       // uses pathPrefix from returned config
eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
  formats: ["webp", "jpeg"],            // add "avif" first here for the one-line switch
  widths: [480, 960, 1600, 2400],
  urlPath: "/img/", outputDir: "_site/img/",   // MUST set both
  failOnError: true,
  htmlOptions: { imgAttributes: { loading: "lazy", decoding: "async",
    sizes: "(min-width: 60em) 60em, 100vw" } },
});
```

**Return value:**
```js
return { dir: { input: "content", includes: "../src/_includes", output: "_site" }, pathPrefix: PATH_PREFIX };
```

Additional wiring:
- `eleventyConfig.amendLibrary("md", md => installAssetResolver(md))`
- `eleventyConfig.addPassthroughCopy({"content/style.css":"style.css"})`. Never passthrough `assets/`.
- `setFrontMatterParsingOptions` from Pattern 5.
- `eleventy.before` event to rebuild the asset index and the alpha Set (Pitfall 7).
- Validation collection from `lib/validate.js`.

**Do NOT** use the `url` filter anywhere (Pitfall 1: double prefix).

---

### `lib/markdown.js` (utility, transform)

**Reference:** RESEARCH Pattern 1. Copy the snippet near verbatim.

```js
import path from "node:path"; import fs from "node:fs";
export function installAssetResolver(md, assetsDir = "assets") {
  const index = new Map(); // lowercased basename -> absolute path
  for (const f of fs.readdirSync(assetsDir)) {
    const k = f.toLowerCase();
    if (index.has(k)) throw new Error(`assets/: case-only duplicate filenames: ${index.get(k)} and ${f}`);
    index.set(k, path.resolve(assetsDir, f));
  }
  md.core.ruler.push("asset_resolver", state => {
    const page = state.env.page; let first = false;
    for (const block of state.tokens) for (const t of block.children ?? []) if (t.type === "image") {
      const src = t.attrGet("src");
      if (/^([a-z]+:)?\/\//i.test(src)) continue;
      const base = decodeURIComponent(path.basename(src)).toLowerCase();
      const abs = index.get(base);
      if (!abs) throw new Error(`${page.inputPath}: image not found in assets/: ${src}`);
      t.attrSet("src", path.relative(path.dirname(page.inputPath), abs));
      if (!first) { t.attrSet("loading", "eager"); t.attrSet("fetchpriority", "high"); first = true; }
      if (base.endsWith(".svg")) t.attrSet("eleventy:formats", "svg");
      else if (alphaSet.has(base)) t.attrSet("eleventy:formats", "webp,png");
    }
  });
}
```

Required changes to the snippet:
- Move index building into a rebuildable function (called on `eleventy.before`).
- Re-scan `assets/` once on a miss before throwing (Pitfall 7).
- Take `alphaSet` as a parameter.
- Rewrite `src` to a page-relative path, never an absolute one (Anti-pattern).

---

### `lib/assets.js` (utility, file-I/O)

**Reference:** RESEARCH Pattern 3. Export:
- `buildIndex()`, the Map from Pattern 1.
- `async detectAlpha(dir)`, which runs `sharp(file).metadata().hasAlpha` per file and returns a `Set` of lowercased basenames.

---

### `lib/validate.js` (service, batch)

**Reference:** RESEARCH Code Examples "Validation collection skeleton". Collect all errors, then throw once.

```js
eleventyConfig.addCollection("_validated", api => {
  const items = api.getAll().filter(i => /^\.\/content\/(projects|pages)\//.test(i.inputPath));
  const errs = [], seen = new Map();
  for (const it of items) {
    const d = it.data, f = it.inputPath, slug = d.slug || it.fileSlug;
    for (const k of ["title","date","cover","cover_alt"]) if (!d[k]) errs.push(`${f}: missing front matter field "${k}"`);
    ...
    if (RESERVED.has(slug)) errs.push(`${f}: slug "${slug}" is reserved`);
    if (seen.has(slug)) errs.push(`${f}: slug "${slug}" already used by ${seen.get(slug)}`); else seen.set(slug, f);
  }
  if (errs.length) throw new Error("Content validation failed:\n" + errs.join("\n"));
  return items;
});
```

Additions from Pattern 4:
- Slug regex `^[a-z0-9-]+$`.
- Reserved set: `tags`, `404`, `assets`, `img`, `css`, `projects`, and the stylesheet name.
- Unknown front-matter keys fail. Allow the D-08 fields and Eleventy keys `layout`, `permalink`, `eleventyExcludeFromCollections`, `draft`.
- Date regex `^\d{4}(-\d{2}(-\d{2})?)?$`.
- `cover` must resolve in the assets index.
- Open question: require `cover`, `cover_alt`, `date` and `tags` for projects only; pages need `title` only.
- `inputPath` has a `./` prefix in Eleventy 3.

---

### `lib/frontmatter.js` (utility, transform)

**Reference:** RESEARCH Pattern 5.
```js
import yaml from "js-yaml";
eleventyConfig.setFrontMatterParsingOptions({ engines: { yaml: { parse: str =>
  yaml.load(str.replace(/^(date:[ \t]*)(\d{4}(?:-\d{2}){0,2})[ \t]*$/m, '$1"$2"')) } } });
```
Display `date` as the raw string. Never run it through a date filter.

---

### `content/projects/projects.11tydata.js` and `content/pages/pages.11tydata.js` (directory data)

**Reference:** RESEARCH Pattern 6. Write the projects file first, then copy it for pages.
```js
export default { layout: "base.njk", eleventyComputed: { permalink: d => `/${d.slug || d.page.fileSlug}/index.html` } };
```

---

### `content/404.md`

Front matter `permalink: /404.html`. Plain wording, with a link home as a root-relative `/` (HtmlBasePlugin prefixes it). Verify manually on the live project site (Pitfall 10).

---

### `src/_includes/base.njk` (template)

**Reference:** RESEARCH Code Examples. Rules:
- `<link rel="stylesheet" href="/style.css">`, with no `url` filter.
- `{{ content | safe }}`.
- Render `role`, `client`, `tools`, `year` and `link` as a `<dl>` only when present.
- Show `date` as the raw string.

---

### `scripts/shrink.js` (utility CLI, file-I/O batch)

**Reference:** RESEARCH Pattern 9. Rules (D-14..D-18):
```js
sharp(f,{failOn:"none"}).rotate().resize({width:3000,height:3000,fit:"inside",withoutEnlargement:true})
// then .webp({lossless:true}) for PNG and WebP sources; .webp({quality:82}) for JPEG
```
- Do not call `withMetadata`, so metadata is stripped.
- Staged list: `git diff --cached --name-only --diff-filter=AM -z -- assets`.
- Modes: `--staged` (hook) and no flag (`npm run shrink`).
- Skip and pass through `.gif` and `.svg`. Warn on GIF over 5 MB.
- HEIC: `sips -s format png in.heic --out tmp.png`, then the PNG path. Fail clearly if `sips` is missing.

Bugs to avoid (Pattern 9):
- (a) Use `path.parse` and lowercase the extension before taking the stem.
- (b) Rewrite links in raw, `encodeURI` and `encodeURIComponent` forms.
- (c) Only `git add` `.md` files that were already staged. Scan all tracked and staged `.md` files for references.
- (d) Write a temp file, then rename.
- (e) Fail on post-slugify name collisions.

---

### `scripts/check-assets.js` (utility CLI)

**Reference:** RESEARCH Pattern 9 last bullet. Fail with a message pointing to `npm run shrink` on:
- any `.png`, `.jpg`, `.jpeg` or `.heic` in `assets/`;
- any file over 10 MB;
- any raster with its longest edge over 3000;
- case-only duplicate names.

---

### `.githooks/pre-commit` and `package.json` scripts

```sh
#!/bin/sh
node scripts/shrink.js --staged
```
Commit as mode 100755 (verify with `git ls-files -s .githooks/pre-commit`).

package.json scripts (Pattern 9):
```json
"prepare": "git config core.hooksPath .githooks || true",
"shrink": "node scripts/shrink.js",
"check:assets": "node scripts/check-assets.js",
"build": "eleventy", "start": "eleventy --serve"
```
It also needs `"type":"module"` and `"engines": {"node": ">=22"}`.

Dependencies: `npm i -D @11ty/eleventy@^3.1.7 @11ty/eleventy-img@^7.1.1 sharp@^0.35.5 js-yaml@^4`.

---

### `.vscode/settings.json`

Copy RESEARCH Pattern 10 verbatim:
```json
{
  "markdown.copyFiles.destination": {
    "content/**/*.md": "${documentWorkspaceFolder}/assets/${documentBaseName}-${fileName}"
  },
  "markdown.copyFiles.overwriteBehavior": "nameIncrementally",
  "markdown.editor.filePaste.copyIntoWorkspace": "mediaFiles",
  "markdown.editor.drop.copyIntoWorkspace": "mediaFiles"
}
```
Plan a manual real-paste check. The `copyIntoWorkspace` values are assumed (A2).

---

### `.github/workflows/deploy.yml`

Copy the RESEARCH Pattern 11 YAML. Order: checkout, setup-node 22 with npm cache, `npm ci`, `check:assets`, cache `_site/img`, `npx eleventy`, prune unreferenced `_site/img` files, `du -sh _site`, upload-pages-artifact. Then the `deploy` job with deploy-pages.

Action majors: checkout@v7, setup-node@v7, cache@v6, upload-pages-artifact@v5, deploy-pages@v5. The `@v4` in CLAUDE.md is outdated.

Add a human-action checkpoint: the owner sets Settings > Pages > Source to GitHub Actions. Optionally add a second build with `PATH_PREFIX=/ --output=_site-root` plus a grep for unprefixed URLs.

## Shared Patterns

### File-named strict errors (PUB-04, D-23)
**Apply to:** `lib/markdown.js`, `lib/validate.js`, `lib/assets.js`.
- Every thrown error starts with the `.md` inputPath, then names the field or link (`${f}: unknown tag "x"`).
- Aggregate collection errors and throw once. Throwing inside a markdown-it rule or a collection fails the build with exit 1.

### Single base-path value
**Apply to:** `eleventy.config.js`, `base.njk`, `404.md`, and all templates.
- Only `PATH_PREFIX` plus `HtmlBasePlugin`. Templates use plain root-relative URLs and no `url` filter.

### Originals never published
**Apply to:** `eleventy.config.js`.
- No passthrough of `assets/`. Output goes only to `_site/img/` (IMG-03).

### Executable/Node conventions
**Apply to:** all `lib/` and `scripts/` files.
- Plain ESM with named exports, so they are testable outside Eleventy. Node 22.

## No Analog Found

Planner uses RESEARCH.md for all of these (greenfield):

| File | Reason |
|------|--------|
| Every file above | No source code exists in the repo. |
| `src/_data/tags.js`, `content/style.css`, sample project `.md`, `.gitignore` | Not covered by RESEARCH code; derive from D-04, D-05, D-06 and D-22. |

## Metadata

**Analog search scope:** whole repo (`.planning/`, `CLAUDE.md` only)
**Files scanned:** 2 (CONTEXT.md, RESEARCH.md) plus repo listing
**Pattern extraction date:** 2026-10-28
