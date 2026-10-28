# Phase 1: Push-to-Live with Images - Context

**Gathered:** 2026-10-28
**Status:** Ready for planning

<domain>
## Phase Boundary

A minimal, deployed Eleventy 3 site. The owner writes a project `.md` (front matter plus an image pasted in VS Code into the shared root `assets/` folder), commits, pushes, and the page is live on GitHub Pages with responsive images.

In scope:
- Local dev with live reload.
- A single base-path config value.
- A pre-commit hook that shrinks and converts images.
- A CI image cache.
- Strict build errors that name the file.
- A plain 404 page.

Not in scope:
- Layout blocks, embeds and design CSS (Phase 2).
- Listings, tag pages, homepage curation and the lightbox (Phase 3).
- Drafts, OG tags and sitemap (Phase 4).

Requirements: PUB-01, PUB-02, PUB-03, PUB-04, PUB-06, AUTH-01, AUTH-02, AUTH-03, IMG-01, IMG-02, IMG-03, IMG-04.

</domain>

<decisions>
## Implementation Decisions

### Content folders and URLs
- **D-01:** Projects live in `content/projects/*.md` and standalone pages in `content/pages/*.md`. `assets/` stays at the repo root, beside `content/`.
- **D-02:** Project URLs are root-level `/slug/` (for example `/tidepool-game/`), not `/projects/slug/`. This overrides the research suggestion. Because projects and pages share the root, the build MUST fail on any slug collision (project vs page vs reserved paths such as `tags`, `404`, `assets` and `img`).
- **D-03:** The slug comes from the filename (`tidepool-game.md` becomes `/tidepool-game/`). An optional `slug:` front matter field overrides it.
- **D-04:** Tags come from a fixed list in a data file (for example `graphic`, `ux`, `art`, `games`). An unknown tag fails the build, naming the file and the tag.
- **D-05:** Tag pages will live at `/tags/<tag>/`. The pages are built in Phase 3, but the URL is reserved now so it can't collide with project slugs.
- **D-06:** Required front matter (missing or invalid fails the build, naming the file and field): `title`, `date`, `tags` (at least one, from the fixed list), `cover`, `cover_alt`.
- **D-07:** `date` accepts `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. It sorts correctly and displays exactly as written (for example "2019"). Partial dates must not render as an invented day.
- **D-08:** Optional fixed metadata fields are `role`, `client`, `tools`, `year` and `link`. They render as a `<dl>` when present. There is no free-form meta map.

### Paste and link format
- **D-09:** Images are pasted with VS Code's built-in markdown paste/drop (no extension), configured by `markdown.copyFiles.destination` in a committed `.vscode/settings.json`.
- **D-10:** Filenames follow `${documentBaseName}-${fileName}` in `assets/`, so a clipboard screenshot pasted into `tidepool-game.md` becomes `assets/tidepool-game-image.png`. Repeat pastes rely on VS Code's built-in incremental naming (`-1`, `-2`…) rather than timestamps. The owner mostly pastes clipboard screenshots.
- **D-11:** Links stay exactly as VS Code writes them: relative to the `.md` file (for example `../../assets/tidepool-game-image.png`), so VS Code preview works. The build resolves images by basename against root `assets/` and ignores the directory part.
- **D-12:** No rename tooling. A missing or renamed image is a hard build error naming the `.md` file and the broken link. The owner fixes it with find-and-replace.

### Commit-time image shrinking (AUTH-03)
- **D-13:** Runs as a local git pre-commit hook, installed automatically by `npm install` (prepare script). It processes staged images in `assets/`, rewrites the matching `.md` links, and re-stages both. The same logic is exposed as `npm run shrink` for manual use. Full-size files must never reach git history.
- **D-14:** The original is deleted after conversion. Only the shrunk file stays in `assets/` and git. True masters live outside the repo.
- **D-15:** Conversion rules:
  - PNG becomes lossless WebP, which keeps transparency and crisp screenshot text.
  - JPEG becomes lossy WebP at about q82.
  - Images are scaled so the longest edge is at most 3000px, and are never upscaled.
- **D-16:** Images are auto-rotated from EXIF orientation, then all metadata is stripped (GPS, camera).
- **D-17:** GIFs and SVGs pass through untouched, so animation survives. Warn if a GIF is over about 5 MB. HEIC is converted to WebP locally (macOS `sips` or equivalent) inside the hook.
- **D-18:** Filenames are slugified: lowercase, with spaces and punctuation turned into hyphens (`Screenshot 2026-10-28 at 10.15.32.png` becomes `screenshot-2026-10-28-at-10-15-32.webp`). Links are rewritten to match, which covers files dragged in rather than pasted.
- **D-19:** CI safety net: CI fails if `assets/` contains any PNG/JPEG/HEIC, any file over the size cap, or any image over 3000px. This catches `--no-verify` and commits from other machines. The message tells the owner to run `npm run shrink`.

### Hosting and build output
- **D-20:** The first deploy target is a GitHub Pages project site at `username.github.io/<repo>/`, so the base-path handling is exercised live from day one. The base path stays one config value (PUB-02), and a custom domain later means flipping that value.
- **D-21:** Build-time formats are WebP plus a fallback. AVIF is off but should be a one-line switch to enable later.
- **D-22:** The Phase 1 look is bare semantic HTML with browser defaults plus a few lines of CSS (max-width, `img { max-width:100%; height:auto }`). The stylesheet must still load through the base-path URL helper to prove the CSS path. No design work yet.
- **D-23:** Strictness: every content error fails the build with the file and field or link named. This covers missing images, missing or invalid front matter, unknown tags, slug collisions and case-only duplicate filenames in `assets/`. This applies locally and in CI. Alt-text quality linting is Phase 2 (A11Y-04).

### Claude's Discretion
- Fallback format for transparent images: JPEG can't hold alpha, so transparent sources should fall back to PNG (or WebP only) rather than JPEG. The planner or researcher decides the exact eleventy-img config.
- Responsive widths, the global `sizes` value, and eager/`fetchpriority="high"` on the first image.
- The dev fast mode for images (for example fewer widths or on-request processing locally).
- How the hook is installed (simple-git-hooks, husky, or a plain `core.hooksPath`). Prefer the lightest option.
- The 404 page content and wording (plain).
- Reserved-slug list contents.
- The exact size cap for the CI guard (research suggested about 10 MB per file).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and requirements
- `.planning/PROJECT.md`: core value, constraints and Key Decisions table (Eleventy 3, commit-time shrink, base path as one value)
- `.planning/REQUIREMENTS.md`: Phase 1 requirement text (PUB-01..04, PUB-06, AUTH-01..03, IMG-01..04)
- `.planning/ROADMAP.md` § Phase 1: goal and six success criteria
- `CLAUDE.md`: stack versions, image pipeline details, path-resolution caveat, "What NOT to use"

### Research
- `.planning/research/SUMMARY.md`: Phase 1 delivery list and research flags (spikes needed)
- `.planning/research/STACK.md`: versions, eleventy-img transform config, CI cache
- `.planning/research/ARCHITECTURE.md`: asset resolver (`lib/assets.js`), image pipeline (`lib/images.js`), directory data
- `.planning/research/PITFALLS.md`: pitfalls 1-5 and 8 (repo bloat, LFS, uncached CI, path breakage, shared-folder collisions, huge or unsupported inputs)

### To verify during research (spike)
- How VS Code's built-in `markdown.copyFiles.destination` and incremental naming behave (the `markdown.copyFiles.overwriteBehavior` setting), and whether any date/time variable exists
- Whether the eleventy-img transform resolves basenames against root `assets/` when input is `content/`
- Whether the eleventy-img disk cache restores output files in CI
- How `pathPrefix` interacts with the image transform

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None. This is a greenfield repo (only `.planning/` and `CLAUDE.md` exist).

### Established Patterns
- None yet. This phase sets them: ESM Eleventy config, `lib/` modules for assets, images and validation, and `content/` as the input directory.

### Integration Points
- The GitHub Actions Pages deploy (`actions/upload-pages-artifact` plus `actions/deploy-pages`) with `actions/cache` for `.cache/` and the image output dir.
- The git pre-commit hook, installed through the npm `prepare` script.

</code_context>

<specifics>
## Specific Ideas

- The owner's real habit is to take a screenshot or screen grab and paste it straight into the `.md`. The whole flow must work with zero renaming or manual resizing.
- An example slug used throughout the discussion is `tidepool-game`.

</specifics>

<deferred>
## Deferred Ideas

None. The discussion stayed within the phase scope.

</deferred>

---

*Phase: 01-push-to-live-with-images*
*Context gathered: 2026-10-28*
