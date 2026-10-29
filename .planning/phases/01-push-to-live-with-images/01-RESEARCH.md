# Phase 1: Push-to-Live with Images - Research

**Researched:** 2026-10-28
**Domain:** Eleventy 3 static site, eleventy-img HTML transform, git pre-commit image shrinking, GitHub Pages Actions deploy
**Confidence:** HIGH (every spike below was run against the real packages in a scratch project, not just read from docs)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Projects live in `content/projects/*.md` and standalone pages in `content/pages/*.md`. `assets/` stays at the repo root, beside `content/`.
- **D-02:** Project URLs are root-level `/slug/` (for example `/tidepool-game/`), not `/projects/slug/`. This overrides the research suggestion. Because projects and pages share the root, the build MUST fail on any slug collision (project vs page vs reserved paths such as `tags`, `404`, `assets` and `img`).
- **D-03:** The slug comes from the filename (`tidepool-game.md` becomes `/tidepool-game/`). An optional `slug:` front matter field overrides it.
- **D-04:** Tags come from a fixed list in a data file (for example `graphic`, `ux`, `art`, `games`). An unknown tag fails the build, naming the file and the tag.
- **D-05:** Tag pages will live at `/tags/<tag>/`. The pages are built in Phase 3, but the URL is reserved now so it can't collide with project slugs.
- **D-06:** Required front matter (missing or invalid fails the build, naming the file and field): `title`, `date`, `tags` (at least one, from the fixed list), `cover`, `cover_alt`.
- **D-07:** `date` accepts `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. It sorts correctly and displays exactly as written (for example "2019"). Partial dates must not render as an invented day.
- **D-08:** Optional fixed metadata fields are `role`, `client`, `tools`, `year` and `link`. They render as a `<dl>` when present. There is no free-form meta map.
- **D-09:** Images are pasted with VS Code's built-in markdown paste/drop (no extension), configured by `markdown.copyFiles.destination` in a committed `.vscode/settings.json`.
- **D-10:** Filenames follow `${documentBaseName}-${fileName}` in `assets/`, so a clipboard screenshot pasted into `tidepool-game.md` becomes `assets/tidepool-game-image.png`. Repeat pastes rely on VS Code's built-in incremental naming (`-1`, `-2`...) rather than timestamps. The owner mostly pastes clipboard screenshots.
- **D-11:** Links stay exactly as VS Code writes them: relative to the `.md` file (for example `../../assets/tidepool-game-image.png`), so VS Code preview works. The build resolves images by basename against root `assets/` and ignores the directory part.
- **D-12:** No rename tooling. A missing or renamed image is a hard build error naming the `.md` file and the broken link. The owner fixes it with find-and-replace.
- **D-13:** Commit-time shrinking runs as a local git pre-commit hook, installed automatically by `npm install` (prepare script). It processes staged images in `assets/`, rewrites the matching `.md` links, and re-stages both. The same logic is exposed as `npm run shrink` for manual use. Full-size files must never reach git history.
- **D-14:** The original is deleted after conversion. Only the shrunk file stays in `assets/` and git. True masters live outside the repo.
- **D-15:** PNG becomes lossless WebP. JPEG becomes lossy WebP at about q82. Images are scaled so the longest edge is at most 3000px, and are never upscaled.
- **D-16:** Images are auto-rotated from EXIF orientation, then all metadata is stripped (GPS, camera).
- **D-17:** GIFs and SVGs pass through untouched, so animation survives. Warn if a GIF is over about 5 MB. HEIC is converted to WebP locally (macOS `sips` or equivalent) inside the hook.
- **D-18:** Filenames are slugified: lowercase, with spaces and punctuation turned into hyphens (`Screenshot 2026-10-28 at 10.15.32.png` becomes `screenshot-2026-10-28-at-10-15-32.webp`). Links are rewritten to match, which covers files dragged in rather than pasted.
- **D-19:** CI safety net: CI fails if `assets/` contains any PNG/JPEG/HEIC, any file over the size cap, or any image over 3000px. This catches `--no-verify` and commits from other machines. The message tells the owner to run `npm run shrink`.
- **D-20:** The first deploy target is a GitHub Pages project site at `username.github.io/<repo>/`, so the base-path handling is exercised live from day one. The base path stays one config value (PUB-02), and a custom domain later means flipping that value.
- **D-21:** Build-time formats are WebP plus a fallback. AVIF is off but should be a one-line switch to enable later.
- **D-22:** The Phase 1 look is bare semantic HTML with browser defaults plus a few lines of CSS (max-width, `img { max-width:100%; height:auto }`). The stylesheet must still load through the base-path URL helper to prove the CSS path. No design work yet.
- **D-23:** Strictness: every content error fails the build with the file and field or link named. This covers missing images, missing or invalid front matter, unknown tags, slug collisions and case-only duplicate filenames in `assets/`. This applies locally and in CI. Alt-text quality linting is Phase 2 (A11Y-04).

### Claude's Discretion
- Fallback format for transparent images (JPEG can't hold alpha; use PNG or WebP only). Exact eleventy-img config is the researcher/planner's call.
- Responsive widths, the global `sizes` value, and eager/`fetchpriority="high"` on the first image.
- The dev fast mode for images (fewer widths or on-request processing locally).
- How the hook is installed (simple-git-hooks, husky, or plain `core.hooksPath`). Prefer the lightest option.
- The 404 page content and wording (plain).
- Reserved-slug list contents.
- The exact size cap for the CI guard (research suggested about 10 MB per file).

### Deferred Ideas (OUT OF SCOPE)
None. (Layout blocks/embeds/design CSS = Phase 2; listings, tag pages, homepage curation, lightbox = Phase 3; drafts, OG tags, sitemap = Phase 4.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PUB-01 | Push rebuilds and deploys via Actions to Pages | Workflow in Code Examples; current action majors verified |
| PUB-02 | One config value switches root vs subpath | `PATH_PREFIX` constant + `HtmlBasePlugin`; spike confirmed images, srcset, links get the prefix; do NOT also use `\| url` (double prefix) |
| PUB-03 | Local dev with live reload | `eleventy --serve`; spike confirmed it serves under the prefix and uses on-request image transform (fast mode for free) |
| PUB-04 | File-level build failure messages | Spike confirmed: collection-level validation throw, markdown-it core rule throw, malformed YAML all name the `.md` and exit 1 |
| PUB-06 | Plain 404 | `permalink: /404.html` template; GitHub Pages serves root `404.html` |
| AUTH-01 | One `.md` with front matter makes a project | Directory data + `eleventyComputed.permalink`, custom YAML parser for `date`, validation collection |
| AUTH-02 | Pasted image renders | `.vscode/settings.json` destination + markdown-it asset-resolver rule |
| AUTH-03 | Commit-time scale/convert/rewrite | `scripts/shrink.js` + `.githooks/pre-commit` via `core.hooksPath`; end-to-end tested in a scratch repo |
| IMG-01 | Responsive images, modern formats | `eleventyImageTransformPlugin`, widths + webp/jpeg (png for alpha) |
| IMG-02 | width/height; first eager, rest lazy | Plugin adds width/height; markdown-it rule sets `loading=eager fetchpriority=high` on first image; verified in output HTML |
| IMG-03 | Originals not published | Never passthrough `assets/`; only `_site/img/` derivatives exist (verified) |
| IMG-04 | CI reuses processed images | Cache `_site/img` with actions/cache; spike proved Eleventy does not wipe it and eleventy-img skips existing outputs |
</phase_requirements>

## Summary

All the Phase 1 unknowns resolved with working code. The central mechanism is a tiny markdown-it core rule that finds each `image` token, looks up its basename in a `Map` built from root `assets/`, throws a file-named error on a miss, and rewrites `src` to the path relative to the current `.md` (`path.relative(dirname(page.inputPath), absAssetPath)`). eleventy-img then resolves it as an ordinary relative path (it joins `dirname(inputPath)` with `src`), so no Eleventy input-dir tricks are needed and the Eleventy input stays `content/`. The same rule is the right place to mark the first image eager and to add `eleventy:formats` for transparent or SVG sources.

The eleventy-img cache question has a simple answer: for local files there is no separate metadata cache (`.cache/` was never created). Output files in `_site/img/` are the cache. Eleventy 3 does not empty `_site` on build, and eleventy-img skips any derivative whose hashed filename already exists (reported as "N cached", mtimes unchanged). So CI restores `_site/img` before building and saves it after. Key it on the hash of `assets/**` plus config, with a restore-key fallback.

Two traps were found that the planner must encode. (1) `HtmlBasePlugin` already prefixes every root-relative `href`/`src`/`srcset`, so using the `url` filter in layouts as well double-prefixes (`/repo/repo/style.css`). Pick the plugin and write plain `/style.css`. (2) VS Code percent-encodes spaces in pasted links (`Screenshot%202026...png`), so the shrink script's link rewriter must replace the raw, `encodeURI` and `encodeURIComponent` forms of the old name.

**Primary recommendation:** Eleventy input = `content/`; one `eleventy.config.js` wiring `HtmlBasePlugin` + `eleventyImageTransformPlugin` (urlPath `/img/`) + a markdown-it asset-resolver rule + a validation collection; `core.hooksPath=.githooks` installed by `prepare`; one workflow that checks assets, builds (with an optional second build under a prefix), caches `_site/img`, and deploys.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Image shrink/convert/link rewrite | Developer machine (git hook) | CI (guard only) | Keeps full-size files out of history; CI only verifies |
| Asset resolution + validation | Build (Node, Eleventy config) | — | Pure build-time; fails build with file names |
| Responsive image generation | Build (eleventy-img) | CDN/Static (cached output) | Derivatives written to `_site/img` |
| Base-path handling | Build (HtmlBasePlugin) | — | Rewrites URLs at output; no client logic |
| 404 / static serving | CDN/Static (GitHub Pages) | — | Pages serves root `404.html` |
| Deploy | CI (GitHub Actions) | — | Official Pages artifact flow |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @11ty/eleventy | 3.1.7 (npm latest, modified 2026-10-15) | SSG | Locked by CLAUDE.md; `HtmlBasePlugin` ships inside it [VERIFIED: npm registry + spike] |
| @11ty/eleventy-img | 7.1.1 (Node >=22, ESM) | Image transform | Locked; spike-tested [VERIFIED: npm registry + spike] |
| sharp | ^0.35.5 | Shrink script (direct import) | eleventy-img already pulls it; script imports it directly so declare it explicitly with the same range (npm dedupes). Slight departure from the CLAUDE.md "don't install separately" because relying on a transitive import is fragile [VERIFIED: npm registry] |
| js-yaml | ^4 (4.3.2 is what Eleventy bundles; npm latest is 5.5.0, avoid) | Custom front-matter parser so `date: 2019` stays valid | Matches Eleventy's own copy so only one is installed [VERIFIED: npm ls in spike] |

### Supporting
None needed. markdown-it is bundled with Eleventy and configured via `amendLibrary`. markdown-it-container/attrs are Phase 2.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `core.hooksPath` hook | simple-git-hooks 2.14.0 | Adds a dependency with a postinstall script for no benefit; `git config core.hooksPath .githooks` in `prepare` is zero-dependency and the hook file is versioned |
| Input at repo root | Input `content/` + basename rewrite | Root input would need ignores for `node_modules`, `assets`, `.planning`; the rewrite rule is 15 lines and also gives the D-12 error |

**Installation:**
```bash
# Node 22+ (local machine runs 24; CI use 22)
npm i -D @11ty/eleventy@^3.1.7 @11ty/eleventy-img@^7.1.1 sharp@^0.35.5 js-yaml@^4
```

**Version verification:** run 2026-10-28 via `npm view`: eleventy 3.1.7, eleventy-img 7.1.1 (engines `>=22`), sharp 0.35.5, js-yaml 5.5.0 latest (use 4.x). No package has `install`/`postinstall` scripts [VERIFIED: npm view scripts.install/postinstall all empty].

## Package Legitimacy Audit

slopcheck could not be installed in this session (the `pip install` was blocked), so per protocol every package is `[ASSUMED]` at the slopcheck level. All four are named in the project's own CLAUDE.md stack and are long-established, and registry facts were confirmed with `npm view`.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| @11ty/eleventy | npm | years (3.1.7 current) | very high | github.com/11ty/eleventy | unavailable | Approved by project stack; planner may add one `checkpoint:human-verify` before first install |
| @11ty/eleventy-img | npm | years | high | github.com/11ty/eleventy-img | unavailable | same |
| sharp | npm | years | very high | github.com/lovell/sharp | unavailable | same |
| js-yaml | npm | years | very high | github.com/nodeca/js-yaml | unavailable | same |

**Packages removed due to slopcheck [SLOP] verdict:** none (not run)
**Packages flagged [SUS]:** none known; no install scripts on any.

## Architecture Patterns

### System Architecture Diagram

```
 git commit ──> .githooks/pre-commit ──> scripts/shrink.js --staged
   (assets/*.png|jpg|heic staged)          scale<=3000, to WebP, slugify, delete original,
                                           rewrite links in *.md, git add both
        │
 git push main
        ▼
 GitHub Actions
   checkout -> setup-node(22, cache npm) -> npm ci
   -> scripts/check-assets.js (D-19 guard; fails CI)
   -> restore cache  _site/img  (key: hash assets/** + config)
   -> eleventy build ───────────────────────────────┐
        │                                            │
        │   content/**/*.md ──front matter──> custom YAML (date stays string)
        │        │                                   │
        │        ├─ validation collection (fields, tags, slug, reserved, dup assets) throws
        │        ├─ markdown-it: image token ──> asset resolver (basename -> assets/ Map)
        │        │        miss => throw "file: image not found"; hit => relative src,
        │        │        first image eager+fetchpriority, alpha/svg => eleventy:formats
        │        ▼
        │   Liquid/Nunjucks layout ──> HTML
        │        ▼
        │   posthtml transforms: eleventy-img (priority -1) <img>-><picture> into _site/img/
        │        ▼ then HtmlBasePlugin prefixes pathPrefix on href/src/srcset
        ▼
   _site/ (html, style.css, img/ derivatives only; assets/ never copied)
   -> save cache _site/img -> upload-pages-artifact -> deploy-pages
```

### Recommended Project Structure
```
.
├── assets/                    # pasted images (WebP after hook), never published
├── content/                   # Eleventy input
│   ├── projects/{projects.11tydata.js, *.md}
│   ├── pages/{pages.11tydata.js, *.md}
│   ├── 404.md                 # permalink /404.html
│   ├── index.md               # minimal home (list optional; real home is Phase 3)
│   └── style.css              # passthrough-copied via addPassthroughCopy({"content/style.css":"style.css"})
├── src/_includes/base.njk     # (includes dir set to ../src/_includes)
├── src/_data/{tags.js}        # fixed tag list (also: reserved slugs)
├── lib/{assets.js, markdown.js, validate.js, frontmatter.js}
├── scripts/{shrink.js, check-assets.js}
├── .githooks/pre-commit       # chmod +x, committed
├── .vscode/settings.json
├── .github/workflows/deploy.yml
├── eleventy.config.js         # ESM
└── package.json               # "type":"module", scripts: build, start, shrink, check:assets, prepare
```
`_data` can also live under `content/_data` if the planner prefers; `dir.data` is configurable. Keep `lib/` modules plain ESM so they can be unit-tested outside Eleventy.

### Pattern 1: Asset resolver as a markdown-it core rule (VERIFIED by spike)
**What:** Resolve any image reference by basename, rewrite `src` relative to the page, error with file name on a miss. Eleventy passes the page data as markdown-it `env`, so `state.env.page.inputPath` is available.
**When to use:** Always; this IS the mechanism for D-11/D-12/D-23.
```js
// lib/markdown.js (spike-tested; extend with dup-basename check)
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
      if (/^([a-z]+:)?\/\//i.test(src)) continue;                    // remote URL: leave
      const base = decodeURIComponent(path.basename(src)).toLowerCase();
      const abs = index.get(base);
      if (!abs) throw new Error(`${page.inputPath}: image not found in assets/: ${src}`);
      t.attrSet("src", path.relative(path.dirname(page.inputPath), abs));
      if (!first) { t.attrSet("loading", "eager"); t.attrSet("fetchpriority", "high"); first = true; }
      if (base.endsWith(".svg")) t.attrSet("eleventy:formats", "svg");
      else if (alphaSet.has(base)) t.attrSet("eleventy:formats", "webp,png");   // see Pattern 3
    }
  });
}
```
Register with `eleventyConfig.amendLibrary("md", md => installAssetResolver(md))`. Note the index must be built once per build; in `--serve` new pasted files appear mid-session, so rebuild the Map on the `eleventy.before` event (or lazily on a miss: re-scan `assets/` once before throwing).

### Pattern 2: eleventy-img transform config (VERIFIED)
```js
import { HtmlBasePlugin } from "@11ty/eleventy";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
eleventyConfig.addPlugin(HtmlBasePlugin);                       // uses pathPrefix from returned config
eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
  formats: ["webp", "jpeg"],            // D-21; add "avif" first here for the one-line switch
  widths: [480, 960, 1600, 2400],       // never upscales: a 1600px source only yields <=1600
  urlPath: "/img/", outputDir: "_site/img/",   // MUST set both, else outputs are colocated with pages (verified)
  failOnError: true,
  htmlOptions: { imgAttributes: { loading: "lazy", decoding: "async",
    sizes: "(min-width: 60em) 60em, 100vw" } },
});
```
- Output HTML verified: `<picture><source type="image/webp" srcset=... sizes=...><img loading="eager" fetchpriority="high" ... width="1600" height="900" srcset=jpeg...>`. A user-set `loading` on the token overrides the lazy default.
- Plugin runs at posthtml priority -1, before `HtmlBasePlugin`, so `/img/...` URLs get `pathPrefix` added afterwards. Verified with `PREFIX=/repo/`: `srcset="/repo/img/...webp 480w, ..."`.
- `eleventy:*` attributes are stripped from the final HTML.
- Return from config: `{ dir: { input: "content", includes: "../src/_includes", output: "_site" }, pathPrefix: PATH_PREFIX }`.

### Pattern 3: Transparent images and fallback format (Claude's discretion, resolved)
eleventy-img's built-in `formatFiltering: ["transparent"]` only drops JPEG when the `formats` list already contains png/gif/svg (verified in source: MINIMUM_TRANSPARENCY_TYPES). With `["webp","jpeg"]` an alpha image still got a JPEG fallback (alpha lost). Recommended: keep global `["webp","jpeg"]` and add `eleventy:formats="webp,png"` per image whose source has alpha. Detect alpha in an `eleventy.before` event (async `sharp(file).metadata().hasAlpha` for each file in `assets/`, store basenames in a `Set`; metadata reads are cheap). Verified output for an alpha source: webp sources + png `<img>` fallback. Because the owner mostly pastes screenshots (lossless WebP), a screenshot with no alpha still gets JPEG fallback; acceptable and tiny relative to the saving.
Optional simplification the planner may choose: ship WebP-only (`formats: ["webp"]`), valid for all current browsers, halving output; but D-21 says "WebP plus a fallback", so keep JPEG/PNG.

### Pattern 4: Front-matter validation with file-named errors (VERIFIED)
- A collection callback that throws aborts the build with exit 1 and prints `./content/projects/x.md: unknown tag "bogus"`. Use `collectionApi.getAll()` filtered by `inputPath` prefix so it sees pages and projects together, collect all errors, throw once.
- Checks: required fields (D-06), tags in list (D-04), date regex `^\d{4}(-\d{2}(-\d{2})?)?$` (D-07), `cover` resolves in assets index, slug uniqueness across projects+pages (D-02), slug not in reserved list (`tags`, `404`, `assets`, `img`, `projects`?, `css`, plus the CSS filename if at root), slug format `^[a-z0-9-]+$`, optional-field names only from the D-08 set (unknown front matter keys: warn or fail; recommend fail for typos like `tag:`).
- Malformed YAML already produces `Having trouble reading front matter from template ./content/projects/bad.md ... unexpected end of the stream` with exit 1 (verified), no extra work.
- Duplicate permalinks are already rejected by Eleventy itself ("output conflict"), but the explicit check gives a better message and covers reserved paths.
- Exit codes verified: build errors give exit 1.

### Pattern 5: Dates (D-07) (VERIFIED)
Unquoted `date: 2019` makes Eleventy throw "Data cascade value for `date` (2019) is invalid" (YAML integer). Quoted `"2019"`, `2019-03`, `2019-03-05` work. Fix so the owner can type naturally:
```js
import yaml from "js-yaml";
eleventyConfig.setFrontMatterParsingOptions({ engines: { yaml: { parse: str =>
  yaml.load(str.replace(/^(date:[ \t]*)(\d{4}(?:-\d{2}){0,2})[ \t]*$/m, '$1"$2"')) } } });
```
This keeps `date` a string (also stops YAML turning `2019-03-05` into a Date). Display the raw string; sort by `page.date` (Eleventy parses "2019" as Jan 1, "2019-03" as Mar 1) or by the string itself (ISO strings sort lexically). Never format partial dates with a date filter.

### Pattern 6: Permalinks (D-02/D-03)
`content/projects/projects.11tydata.js`:
```js
export default { layout: "base.njk", eleventyComputed: { permalink: d => `/${d.slug || d.page.fileSlug}/index.html` } };
```
(Verified: produced `_site/tidepool-game/index.html`.) Same for `pages`. 404: `content/404.md` with `permalink: /404.html`. GitHub Pages serves a root `404.html` for unknown URLs [CITED: docs.github.com/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site]; links inside it are prefixed by HtmlBasePlugin. For project sites the file is served from the repo's root path; verify manually after first deploy (unknown URL under `/<repo>/`).

### Pattern 7: Base path as one value (PUB-02)
```js
// eleventy.config.js, top
const PATH_PREFIX = process.env.PATH_PREFIX ?? "/portfolio-test/";   // THE one value; "/" for root/custom domain
```
Return `pathPrefix: PATH_PREFIX`. Env override exists so CI can run an extra build with `PATH_PREFIX=/ ` (or another prefix) as a check without touching the file; the default constant is the single edit point. Templates use root-relative URLs (`/style.css`, `/img/...`, `/tags/x/`) and NO `url` filter. For `eleventy --serve` the dev server mounts at the prefix (verified: `http://localhost:8099/repo/`). Provide a tiny CI step or script that greps built HTML under the prefix build for `href="/` or `src="/` not starting with the prefix.

### Pattern 8: Dev fast mode (resolved, free)
Under `--serve`, eleventy-img auto-enables `transformOnRequest` (ELEVENTY_RUN_MODE=serve): `_site/img` stays empty and images are produced when the browser requests `/<prefix>/.11ty/image/?src=...` (verified in served HTML and log "1 image optimized (1 deferred)"). No extra config.

### Pattern 9: Pre-commit hook (lightest option, VERIFIED end to end)
- `package.json`: `"prepare": "git config core.hooksPath .githooks || true"`, `"shrink": "node scripts/shrink.js"`.
- `.githooks/pre-commit`: `#!/bin/sh` + `node scripts/shrink.js --staged` (commit the file with the executable bit: `chmod +x` then `git add`; check `git ls-files -s .githooks/pre-commit` shows `100755`).
- Tested: staged `Another One.PNG` + `.md` containing `Another%20One.PNG` became `another-one-png.webp`, link rewritten, original removed from index, all in the same commit.
- Script rules to implement (D-14..D-18): `sharp(f,{failOn:"none"}).rotate().resize({width:3000,height:3000,fit:"inside",withoutEnlargement:true})`, then `.webp({lossless:true})` for PNG and WebP sources, `.webp({quality:82})` for JPEG. sharp drops all metadata by default (do not call `withMetadata`). Skip `.gif/.svg/.pdf/...`; warn on GIF > 5 MB. Use `git diff --cached --name-only --diff-filter=AM -z -- assets` for the staged list.
- **Bugs found in the spike script to avoid:** (a) use `path.parse(f)` and lowercase the extension before taking the stem, otherwise `Another One.PNG` slugs to `another-one-png.webp`; (b) rewrite links by replacing the raw name, `encodeURI(name)` and `encodeURIComponent(name)` forms (VS Code writes `%20`); (c) when rewriting `.md` files, only `git add` ones that were already staged, otherwise unrelated unstaged hunks get swept into the commit; scan all tracked plus staged `.md` files, not only changed ones, since an old doc can reference the file; (d) write to a temp file then rename, so a crash does not lose the only copy; (e) handle name collisions after slugify (two inputs mapping to one output) by failing with a message.
- HEIC: sharp's prebuilt binaries do not decode HEIC [ASSUMED: from sharp docs/training, not re-verified]. macOS `sips` exists at `/usr/bin/sips` here: `sips -s format png in.heic --out tmp.png`, then run the normal PNG path. Fail with a clear message when `sips` is absent.
- `--no-verify` bypass is caught by `scripts/check-assets.js` in CI (D-19): fail on any `.png/.jpg/.jpeg/.heic` in `assets/`, any file > 10 MB (recommended cap), any raster with longest edge > 3000, and case-only duplicate names.

### Pattern 10: VS Code paste settings (VERIFIED from VS Code source package.nls.json)
`.vscode/settings.json`:
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
- Available variables: `documentDirName`, `documentRelativeDirName`, `documentFileName`, `documentBaseName`, `documentExtName`, `documentFilePath`, `documentRelativeFilePath`, `documentWorkspaceFolder`, `fileName`, `fileExtName`, `unixTime`, `isoTime` (ms epoch / ISO; ISO contains colons, avoid in filenames). A date/time variable DOES exist (`${unixTime}`) if D-10's incremental naming proves annoying, but D-10 locks incremental naming. `overwriteBehavior` values: `nameIncrementally` (default; `image.png` becomes `image-1.png`) and `overwrite` [CITED: github.com/microsoft/vscode extensions/markdown-language-features/package.nls.json + package.json].
- `copyIntoWorkspace` applies to files from OUTSIDE the workspace; its enum values are not re-verified here [ASSUMED]; clipboard image data (screenshots) is always saved by the destination setting regardless. Tell the planner to verify by hand with a real paste (manual check item).
- Glob key semantics (matches against the Markdown document path, workspace-relative) from the setting description; `content/**/*.md` is the intended form. Resulting link is expected to be relative to the document (`../../assets/...`) per D-11; the build does not depend on that since only the basename is used. Pasting works with the final path `assets/tidepool-game-image.png`. Whether the first paste is `image.png` vs a timestamp name is a VS Code behavior; confirm in the manual check.
- Caution: after paste the file is `.png` (full size) until commit; the hook then converts it to `.webp` and rewrites the link. VS Code preview shows the png until commit; fine.

### Pattern 11: GitHub Actions (versions verified 2026-10-28 from GitHub releases API)
Latest majors: checkout v7.0.1, setup-node v7.1.0, cache v6.1.0, upload-pages-artifact v5.0.0, deploy-pages v5.0.1, configure-pages v6.0.0. These are newer than the `@v4` in CLAUDE.md; use the current majors (CLAUDE.md itself says "confirm at implementation time"). Pin by major tag.
```yaml
name: Deploy
on: { push: { branches: [main] }, workflow_dispatch: {} }
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run check:assets
      - uses: actions/cache@v6
        with:
          path: _site/img
          key: img-${{ hashFiles('assets/**', 'eleventy.config.js', 'lib/**') }}
          restore-keys: img-
      - run: npx eleventy
      - run: du -sh _site
      - uses: actions/upload-pages-artifact@v5
        with: { path: _site }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.d.outputs.page_url }}" }
    steps:
      - id: d
        uses: actions/deploy-pages@v5
```
- Owner must set Settings > Pages > Source = GitHub Actions once (manual step; flag for human).
- Cache behavior: `actions/cache` only saves when the exact key misses and the job succeeds; `restore-keys` fallback restores the most recent `img-*`. Because filenames are content-hashed, stale derivatives of deleted/changed sources accumulate in the restored dir and WOULD be published. Mitigation (recommended, small): after build, a prune step deletes files in `_site/img` not referenced in any built `.html` (grep of `/img/` names), or accept the growth and prune by bumping a `v2-` key prefix occasionally. Include the `du -sh _site` budget line.
- Optional: add a second build step `PATH_PREFIX=/ npx eleventy --output=_site-root` as a PR check to prove both modes (SC2).
- Verify the cached restore produced "N cached" in the build log on a second run (acceptance check for IMG-04).

### Anti-Patterns to Avoid
- **Using both `HtmlBasePlugin` and the `url` filter:** double prefix (`/repo/repo/style.css`) was reproduced. Use plain root-relative paths.
- **Setting eleventy-img `urlPath` without `outputDir` (or neither):** derivatives get colocated under the page URL, e.g. `/projects/x/hash-480.webp`, and are not shared between pages.
- **Passthrough-copying `assets/`:** would publish originals (IMG-03).
- **Absolute filesystem paths as `src`:** eleventy-img treats any absolute `src` as relative to the input dir (`path.join(input, src)`), which breaks. Always rewrite to a path relative to the page (Pattern 1).
- **Committing `_site` or generated images** (CLAUDE.md).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive `<picture>`, hashing, width/height | custom sharp pipeline for the site build | eleventy-img transform | hashes, srcset, dimensions, on-request dev mode |
| Base-path URL rewriting | regex over output HTML | `HtmlBasePlugin` | handles href/src/srcset/etc. |
| Image resize/encode in the hook | ImageMagick shelling | sharp (already installed) | EXIF rotate, lossless WebP, metadata strip in one call |
| Duplicate-permalink detection | custom | Eleventy built-in output conflict error (plus our reserved-slug check for nicer messages) | |
| YAML parsing | regex | js-yaml with the date pre-quote shim only | |

## Common Pitfalls

### Pitfall 1: Double base-path prefix
**What goes wrong:** `/repo/repo/style.css`. **Why:** `url` filter plus HtmlBasePlugin. **Avoid:** no `url` filter anywhere. **Warning sign:** 404 on CSS only under subpath build.

### Pitfall 2: Unquoted year in front matter
**What goes wrong:** Eleventy "Data cascade value for `date` (2019) is invalid". **Avoid:** custom YAML parse shim (Pattern 5).

### Pitfall 3: Percent-encoded links from VS Code
**What goes wrong:** the shrink script renames the file but the `.md` still says `Name%20With%20Spaces.png`, so the build fails with image-not-found. **Avoid:** rewrite all three name forms; resolver also `decodeURIComponent`s the basename (done in Pattern 1).

### Pitfall 4: Alpha screenshot gets a JPEG fallback
**What goes wrong:** transparency flattened to black in the fallback. **Avoid:** Pattern 3 per-image `eleventy:formats`.

### Pitfall 5: Stale cache bloats published site
**What goes wrong:** `restore-keys` restores derivatives for images since deleted or replaced; they get uploaded. **Avoid:** prune unreferenced `_site/img` files after build; keep the `du -sh` budget line; document key bump to reset.

### Pitfall 6: Hook sweeps unrelated changes into the commit
**What goes wrong:** `git add file.md` in the hook stages the owner's other unstaged edits to that file. **Avoid:** re-add only files that were in the staged set; otherwise modify the working tree silently (and print a notice).

### Pitfall 7: New image pasted during `--serve` not found
**What goes wrong:** the asset index was built at startup. **Avoid:** rebuild the Map on `eleventy.before` and re-scan once on a miss before throwing.

### Pitfall 8: Executable bit lost on the hook
**What goes wrong:** git ignores a non-executable hook silently. **Avoid:** commit it as 100755; `prepare` could also `chmod +x .githooks/*`.

### Pitfall 9: GIF/SVG handling
SVG verified: `eleventy:formats="svg"` yields a single optimized `.svg` with width/height. Animated GIF was NOT verified in this spike (test GIF was static): eleventy-img filters formats to WebP for animated sources, but animation is only preserved if sharp is told `animated: true` (`sharpOptions: { animated: true }`); the plan should include a manual check with a real animated GIF, and if it misbehaves, mark GIFs `eleventy:ignore` and copy them via a dedicated passthrough of only referenced GIFs [ASSUMED, LOW confidence on GIF path].

### Pitfall 10: GitHub Pages 404 on project sites
The root `404.html` is served for missing paths; confirm on the live URL after deploy (manual check) since behavior for project sites is the least-tested part [CITED docs; not exercised here].

## Code Examples

Validation collection skeleton (spike-tested pattern):
```js
eleventyConfig.addCollection("_validated", api => {
  const items = api.getAll().filter(i => /^\.\/content\/(projects|pages)\//.test(i.inputPath));
  const errs = [], seen = new Map();
  for (const it of items) {
    const d = it.data, f = it.inputPath, slug = d.slug || it.fileSlug;
    for (const k of ["title","date","cover","cover_alt"]) if (!d[k]) errs.push(`${f}: missing front matter field "${k}"`);
    if (it.inputPath.includes("/projects/")) {
      if (!Array.isArray(d.tags) || !d.tags.length) errs.push(`${f}: "tags" must list at least one tag`);
      for (const t of d.tags ?? []) if (!TAGS.includes(t)) errs.push(`${f}: unknown tag "${t}" (allowed: ${TAGS.join(", ")})`);
    }
    if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(String(d.date))) errs.push(`${f}: date "${d.date}" must be YYYY, YYYY-MM or YYYY-MM-DD`);
    if (RESERVED.has(slug)) errs.push(`${f}: slug "${slug}" is reserved`);
    if (seen.has(slug)) errs.push(`${f}: slug "${slug}" already used by ${seen.get(slug)}`); else seen.set(slug, f);
  }
  if (errs.length) throw new Error("Content validation failed:\n" + errs.join("\n"));
  return items;
});
```
Note: whether `pages` need `cover`/`cover_alt` is not stated in D-06 (written for projects); recommend requiring them for projects only and `title` for pages. Flag for planner (see Open Questions). `collectionApi.getAll()` inputPath uses a `./` prefix in Eleventy 3 (the spike output shows `./content/...`).

Minimal layout (`src/_includes/base.njk`): `<link rel="stylesheet" href="/style.css">` with `{{ content | safe }}` (Nunjucks) or `{{ content }}` (Liquid auto-unescaped). Render D-08 fields as `<dl>` conditionally.

## State of the Art

| Old | Current | Impact |
|-----|---------|--------|
| `{% image %}` shortcodes | `eleventyImageTransformPlugin` on plain `<img>` | Authors keep `![alt](path)` |
| Colocated image output | shared `/img/` via `urlPath` + `outputDir` | One derivative per source |
| actions v4 majors (CLAUDE.md) | checkout v7, setup-node v7, cache v6, upload-pages-artifact v5, deploy-pages v5 | use current majors |
| eleventy-img "disk cache" for local files | none; output dir existence is the cache | cache `_site/img` |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | sharp prebuilt binaries cannot decode HEIC, so `sips` is needed | Pattern 9 | If wrong, simpler hook; low |
| A2 | `markdown.editor.filePaste/drop.copyIntoWorkspace` accepts `"mediaFiles"` | Pattern 10 | Setting ignored; clipboard images unaffected; verify in manual check |
| A3 | Animated GIFs need `sharpOptions.animated` / may need ignore+copy | Pitfall 9 | Animation lost on site; verify manually |
| A4 | GitHub Pages serves root 404.html for project-site subpaths | Pattern 6 | Falls back to GitHub's default 404; verify after deploy |
| A5 | slopcheck verdicts (tool could not run) | Audit | Planner gate: optional human-verify before first install |

## Open Questions

1. **Do standalone pages require `cover`/`cover_alt`?**
   - D-06 reads as project fields; `About` pages rarely have covers.
   - Recommendation: require `title` for pages; `date/tags/cover/cover_alt` for projects only. Confirm with owner or treat as discretion.
2. **GitHub repo name for the default `PATH_PREFIX`.**
   - Unknown until the remote exists (`git remote` is empty in this repo). Recommendation: placeholder constant plus a plan task to set it when the repo is created; CI's configure-pages `base_path` output could confirm it.
3. **Unknown front-matter keys: fail or ignore?** Recommendation: fail with the allowed list (catches `tag:` typos) but allow Eleventy-reserved keys (`layout`, `permalink`, `eleventyExcludeFromCollections`, `draft` for Phase 4).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build, hook | yes | 24.14.1 local (CI pins 22) | none needed |
| npm | install | yes | 11.11.0 | |
| git | hook | yes | 2.39.3 | |
| macOS sips | HEIC conversion | yes | /usr/bin/sips | fail with message |
| gh CLI | release lookup | yes | (used) | |
| GitHub remote/Pages | deploy | not yet configured | no `origin` remote | owner creates repo, sets Pages source to Actions (human step) |

**Missing with no fallback:** GitHub repo + Pages enablement (human action, plan as a `checkpoint:human-action`).

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Strict front-matter validation; slug regex `^[a-z0-9-]+$` (prevents path traversal via `slug:` into permalink); resolver only reads files that exist in the `assets/` index (basename lookup defeats `../` tricks) |
| V2/V3/V4 Auth/Session/Access | no | static site, no accounts |
| V6 Cryptography | no | none |
| V14 Config/supply chain | yes | `npm ci` with lockfile; workflow `permissions` minimal (contents: read, pages: write, id-token: write); actions pinned to major tags (consider SHA pins); no secrets used |

| Threat | STRIDE | Mitigation |
|--------|--------|------------|
| Metadata leak (GPS in photos) | Information disclosure | sharp strips metadata; D-16 hook; CI guard blocks raw JPEG/PNG so unstripped files cannot land |
| Slug path traversal / overwrite of reserved paths | Tampering | slug regex + reserved list |
| Malicious dependency | Tampering | lockfile, no postinstall packages (verified), few deps |
| Raw HTML in markdown XSS | n/a (owner-authored) | site content is trusted; `html: true` is Phase 2 (AUTH-04) |

## Validation Architecture
Skipped: `workflow.nyquist_validation` is `false` in `.planning/config.json`. (Practical acceptance checks per success criterion are listed in Sampling guidance below for the verifier.)

Acceptance checks the verifier can run: (1) `npm run build` twice, second log says all images cached; (2) `PATH_PREFIX=/ npx eleventy` and default build, then grep built HTML for unprefixed root URLs; (3) feed a fixture with missing image, bad tag, bad date, duplicate slug: expect exit 1 and file name in output; (4) `ls _site` shows no `assets/` and `find _site -name '*.png' -path '*assets*'` empty; (5) stage a 4000px PNG named with spaces and commit: result is <=3000px `.webp`, link rewritten, one commit; (6) `curl` an unknown URL on the live site gets the 404 page.

## Sources

### Primary (HIGH)
- Spike project run 2026-10-28 (Eleventy 3.1.7, eleventy-img 7.1.1): output HTML, serve mode, cache behavior, validation errors, exit codes, date parsing
- `@11ty/eleventy-img` 7.1.1 source: `transform-plugin.js`, `util.js` (normalizeImageSource), `image.js` (format filtering), `image-attrs-to-posthtml-node.js` (`eleventy:formats|widths|sizes|ignore|optional`), `on-request-during-serve-plugin.js`
- microsoft/vscode `extensions/markdown-language-features/package.nls.json` and `package.json` (variables, overwriteBehavior)
- GitHub releases API for actions/* (2026-10-28)
- npm registry via `npm view`

### Secondary (MEDIUM)
- https://code.visualstudio.com/docs/languages/markdown (destination glob/variable example)
- docs.github.com Pages custom 404 page (not re-fetched here)

### Tertiary (LOW)
- HEIC decoding support in sharp, GIF animation handling (not tested)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (versions from registry; behavior from spike)
- Architecture/mechanisms: HIGH (executed)
- Pitfalls: HIGH for items found in spike; MEDIUM for GIF, HEIC, Pages 404 on project sites

**Research date:** 2026-10-28
**Valid until:** 2026-11-28 (eleventy-img and actions majors move; recheck versions at install time)

## Project Constraints (from CLAUDE.md)
- Node 22 LTS (eleventy-img 7 needs >=22, ESM-only); Eleventy ^3.1.7, avoid 4.0 alpha; markdown-it via `amendLibrary`.
- Zero or near-zero client JS; no lightbox libs; no passthrough copy of `assets/`; no committed generated images; no Git LFS.
- Single shared `assets/` folder; plain `![alt](path)` stays the authoring syntax (transform plugin, not shortcodes).
- Cache `.cache/` and the image output dir in CI keyed on `assets/**` hash (this research: `.cache/` is unused for local images; the image output dir is what matters).
- Use GSD workflow entry points for repo edits; actions majors in CLAUDE.md (`@v4`) are outdated, confirmed newer majors above.
