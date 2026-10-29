# Walking Skeleton — Portfolio Site

**Phase:** 1
**Generated:** 2026-10-28

## Capability Proven End-to-End

The owner writes `content/projects/tidepool-game.md` with an image pasted from VS Code into the shared root `assets/` folder, commits (the hook shrinks the image to WebP and rewrites the link), pushes to `main`, and the page is live at `https://<user>.github.io/<repo>/tidepool-game/` with a responsive `<picture>`, its CSS loading through the base path.

For this static site, the skeleton's "data read/write" is **content markdown in, built HTML out** (`content/**/*.md` + `assets/` → `_site/**/index.html` + `_site/img/`). The "real UI interaction" is **a visitor loading the deployed page** (and an unknown URL that returns the plain 404).

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Eleventy 3.1.x (`@11ty/eleventy@^3.1.7`), ESM `eleventy.config.js`, `package.json` `"type":"module"` | Locked in CLAUDE.md; `HtmlBasePlugin` is built in and plain markdown-it is easy to extend |
| Runtime | Node 22 LTS (`engines.node >=22`; CI pins 22) | eleventy-img 7 needs Node 22 or later and is ESM-only |
| Content store ("data layer") | Markdown files with YAML front matter. Projects go in `content/projects/*.md` and pages in `content/pages/*.md`. Images live in the root `assets/` folder, which is never published | D-01. Git is the database. Originals are kept off the site (IMG-03) |
| Front matter parsing | js-yaml 4 with a shim that quotes a bare `date:` value, so `date: 2019` stays the string `"2019"` | D-07: partial dates show exactly as written |
| URLs | Root-level `/<slug>/` for both projects and pages. The slug is the filename, or the `slug:` field if set. `/tags/<tag>/` is reserved | D-02, D-03, D-05 |
| Image resolution | A markdown-it core rule (`lib/markdown.js`) looks up each image basename in an index of `assets/` (`lib/assets.js`) and rewrites `src` relative to the page. If the image is missing, the build fails and the error names the file | D-11, D-12, D-23 |
| Image pipeline (build) | `eleventyImageTransformPlugin` with the options in `lib/images.js`. Formats are WebP plus JPEG; alpha images get a PNG fallback, GIFs a GIF fallback, SVGs stay SVG. Widths are 480/960/1600/2400. Output goes to `urlPath:/img/` and `outputDir:_site/img/` | IMG-01/02. AVIF can be turned on by editing one line (D-21) |
| Image pipeline (commit) | `.githooks/pre-commit` runs `node scripts/shrink.js --staged` and is installed by `prepare` setting `core.hooksPath=.githooks`. It uses sharp to scale images to at most 3000px and convert them to WebP (lossless for PNG, q82 for JPEG), strip EXIF and slugify the name. It also rewrites the links in both the index and the working tree | D-13..D-18. No hook framework dependency is needed |
| Base path | One constant, `PATH_PREFIX` in `eleventy.config.js`, which `process.env.PATH_PREFIX` can override. `HtmlBasePlugin` handles it. Templates write plain root-relative URLs and never use the `url` filter | PUB-02, D-20. Using the `url` filter as well as the plugin would add the prefix twice |
| Strictness | `lib/validate.js` checks every project and page in a collection callback, gathers all the errors and throws once. Each error starts with the `.md` path | PUB-04, D-23 |
| Templates | One Nunjucks layout, `src/_includes/base.njk`. Data lives in `src/_data/` (`tags.js` holds the fixed tag list) | Phase 2 adds the design system to this layout |
| Tests | Node's built-in `node --test` with `test/*.test.js`. `test/helpers/site.js` builds throwaway sites in temp dirs. No test framework dependency | Zero extra deps. Every success criterion can be checked by a script |
| Deployment target | GitHub Pages project site (`<user>.github.io/<repo>/`). It is built by `.github/workflows/deploy.yml` (checkout@v7, setup-node@v7, cache@v6, upload-pages-artifact@v5, deploy-pages@v5) | D-20. Serving under a subpath tests the base path from day one |
| CI image cache | `actions/cache` on `_site/img`, with key `img-v1-<hash(assets/**, eleventy.config.js, lib/**)>` and restore-key `img-v1-`. `scripts/prune-img.js` deletes derivatives that no page references before upload | IMG-04. The derivative files are the cache. Pruning keeps stale files off the site (Pitfall 5) |
| CI guard | `scripts/check-assets.js` (`npm run check:assets`) fails on any PNG/JPEG/HEIC, any file over 10 MB, any image over 3000px, or case-only duplicate names | D-19 |
| Directory layout | `content/` (Eleventy input), `assets/`, `src/_includes`, `src/_data`, `lib/` (plain ESM modules that can be tested), `scripts/` (CLIs), `test/`, `.githooks/`, `.vscode/`, `.github/workflows/` | Later phases add `lib/` modules and `content/` pages without moving any of these |

## Stack Touched in Phase 1

- [ ] Project scaffold: `package.json` (ESM, Node >=22, scripts `build`/`start`/`test`/`shrink`/`check:assets`/`prepare`), `eleventy.config.js`, `node --test` runner
- [ ] Routing: real routes `/<prefix>/tidepool-game/`, `/<prefix>/` (home) and `/<prefix>/404.html`
- [ ] Content read: `content/projects/*.md` front matter and body, plus `assets/` images, are read and validated
- [ ] Content write: `_site/**/index.html` and `_site/img/*` derivatives are written. Commit time also writes the shrunk WebP and the rewritten `.md` links
- [ ] UI: a visitor loads the deployed project page (a responsive `<picture>` with CSS loaded under the prefix) and an unknown URL returns the plain 404
- [ ] Deployment: GitHub Actions deploys to GitHub Pages on push to `main`. Locally, `npm start` runs live reload under the prefix

## Out of Scope (Deferred to Later Slices)

- Layout blocks (`::: grid-N`, full-width), captions, raw-HTML fallback, video/YouTube/itch.io embeds, brutalist design CSS, skip link and focus styles, alt-text lint (Phase 2)
- Project feed, tag pages at `/tags/<tag>/` (the URL is only reserved now), curated homepage, About/CV content, student-work page, lightbox (Phase 3)
- Next/prev, Open Graph, sitemap, `draft: true`, authoring README, 320px/200% zoom verification (Phase 4)
- AVIF output (kept to a one-line switch), Git LFS, committed `_site`, passthrough copy of `assets/`

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without changing its architectural decisions:

- Phase 2: the owner composes rich pages with `:::` blocks and embeds (`markdown-it-container`/`markdown-it-attrs` registered in `eleventy.config.js`, plus CSS in `content/style.css`)
- Phase 3: visitors browse a feed, tag pages and a curated homepage, and open images full-size (new collections and templates under `content/`, plus about 10 lines of `<dialog>` JS)
- Phase 4: hardening (drafts, OG, sitemap, README, next/prev), still through `PATH_PREFIX` and `HtmlBasePlugin`
