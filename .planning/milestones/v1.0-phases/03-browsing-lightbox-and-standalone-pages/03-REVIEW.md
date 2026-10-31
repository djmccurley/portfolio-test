---
phase: 03-browsing-lightbox-and-standalone-pages
reviewed: 2026-10-30T00:00:00Z
depth: standard
files_reviewed: 39
files_reviewed_list:
  - content/index.11tydata.js
  - content/index.md
  - content/lightbox.js
  - content/pages/cv.md
  - content/pages/teaching.md
  - content/projects/projects.11tydata.js
  - content/style.css
  - content/tags.11tydata.js
  - content/tags.njk
  - content/work.njk
  - eleventy.config.js
  - lib/blocks.js
  - lib/limits.js
  - lib/markdown.js
  - lib/media.js
  - lib/validate.js
  - lib/zoom.js
  - scripts/check-assets.js
  - scripts/shrink.js
  - src/_data/featured.js
  - src/_data/site.js
  - src/_data/tags.js
  - src/_includes/base.njk
  - src/_includes/card.njk
  - src/_includes/filters.njk
  - src/_includes/home.njk
  - test/blocks.test.js
  - test/browse.test.js
  - test/build.test.js
  - test/check-assets.test.js
  - test/content-errors.test.js
  - test/contrast.test.js
  - test/design.test.js
  - test/featured.test.js
  - test/helpers/site.js
  - test/lightbox.test.js
  - test/pdf.test.js
  - test/shrink.test.js
  - test/zoom.test.js
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-10-30
**Depth:** standard
**Files Reviewed:** 39
**Status:** issues_found

## Summary

I read all 39 files, ran `npm test` (278 pass, 0 fail), built the real site, and built two scratch copies in the session scratchpad to probe edge cases. The scratch builds covered a large animated GIF, an SVG, a PDF link with a `#page=2` fragment, and tag slugs that collide with the config collections `projects` and `featured`.

The core of the phase is sound. Browse pages, tag pages, validation, zoom finishing and the PDF pipeline all behave as intended. I found no security vulnerabilities and no crash-class bugs. Output is escaped once, path prefixes are applied once, and asset lookup is basename-only, so there is no path traversal. The collision probes (tag slug `projects` or `featured`) built correctly.

The defects are robustness and correctness gaps at the edges:
- A zoom link that is wider than its image.
- A latent lightbox failure if AVIF is re-enabled.
- A link rewriter in `shrink.js` that damages unrelated text.
- A dev-server crash path in `media.js`.

## Warnings

### WR-01: `a.zoom` is `display:block`, so the click target and focus ring span the whole column, not the image

**File:** `content/style.css:328-332` (affects `lib/blocks.js:186` lone images)
**Issue:** `a.zoom { display: block }` makes the link as wide as its container. For a lone image (`<p class="lone-image"><a class="zoom"><picture><img>`), the paragraph spans the content column (up to 80rem). The `img` is `max-width:100%` at its natural size, and `.layout img { width:100% }` does not apply outside a block. A 256 px or 400 px image is therefore wrapped in a link that is much wider than the image.
- The `zoom-in` cursor and the click-to-open area extend into empty space beside the picture.
- The 3 px keyboard focus ring (`:is(a, ...):focus-visible`) is drawn around the full-width box, not the picture. That misleads keyboard and low-vision users about what is focused (WCAG 2.4.7 / 1.4.11 intent).

I derived this from the CSS, not from a browser run.

**Fix:** Shrink-wrap the link only for lone images. Do not shrink-wrap grid cells, where `.layout img` deliberately fills the cell.
```css
.lone-image > a.zoom,
figure > a.zoom { width: fit-content; max-width: 100%; }
.layout figure > a.zoom { width: auto; }
```

### WR-02: `zoomHref` links the first `<source>`, which becomes a broken lightbox the moment AVIF is enabled

**File:** `lib/zoom.js:32-34` (toggle documented at `lib/images.js:1`)
**Issue:** The href is the largest candidate of the first `<source>` in the `<picture>`. `lib/images.js` tells the owner to "Prepend avif to enable AVIF" (D-21). After that change, the first source is `image/avif`, so every zoom link (and the no-JS fallback link) points at an `.avif`.
- A browser that cannot decode AVIF (Safari before 16, older Edge and Chrome) fires `error` on the dialog `<img>`.
- `lightbox.js` handles that by calling `location.assign()` on the AVIF. The visitor then lands on a download prompt or blank page, not a viewable image.

The current tests only cover the webp-first configuration, so this passes today.

**Fix:** Pick the source whose type is the widest-supported modern format, or the last `<source>` before the fallback `<img>` (webp), not the first. Add a test with `["avif","webp","jpeg"]`.
```js
const sources = pic ? findAll(pic.content, "source") : [];
const source = sources.at(-1); // last <source> = webp, never avif
```

### WR-03: `rewriteLinks` rewrites remote URLs and prose, and misses case-different links

**File:** `scripts/shrink.js:62-93`
**Issue:** A match is accepted whenever the preceding character is one of `( / " ' < whitespace` and the following one is one of `) " ' > ? # whitespace`. I confirmed this by running it:
```
rewriteLinks("![](https://cdn.example.com/photo.png)\n![](../../assets/Photo.png)\nText mentions photo.png here.", "photo.png", "photo.webp")
-> ![](https://cdn.example.com/photo.webp)      // remote URL silently corrupted
   ![](../../assets/Photo.png)                  // local link NOT rewritten
   Text mentions photo.webp here.               // prose rewritten
```
- `/` as a "before" boundary lets any `https://host/photo.png` with the same basename be rewritten. The pre-commit hook then stages that change.
- Matching is case-sensitive, but `resolveAsset` is case-insensitive. A link `Photo.png` that resolves today is left pointing at a deleted file, so the next build fails with "image not found".
- Code spans, fenced blocks and plain text are rewritten too.

**Fix:** Rewrite only the link and image destinations the renderer would resolve:
- Skip any match preceded by a scheme or host (`https?://...`, `//host/`).
- Match the basename case-insensitively.
- Ideally parse destinations with a small regex for `](...)` and `src=`, `href=` rather than scanning raw text.

### WR-04: `copyMedia` keeps deleted videos, posters and PDFs in its maps and crashes the dev rebuild

**File:** `lib/media.js:18-20, 74-95`
**Issue:** The `videos`, `posters` and `pdfs` maps are "additive across builds" and are never pruned. Under `npm start`, if the owner deletes or renames an asset in `assets/` (or removes a `::: video` block and then deletes the file), the next `eleventy.after` calls `fs.copyFileSync(source, ...)` on a path that no longer exists. That throws `ENOENT` from the event handler, and every subsequent rebuild fails the same way until the dev server is restarted. Posters have the same problem: `Image(source, ...)` on a missing file throws.

**Fix:** Skip entries whose source is gone, and drop them from the maps:
```js
for (const [name, source] of pdfs) {
  if (!fs.existsSync(source)) { pdfs.delete(name); continue; }
  fs.copyFileSync(source, path.join(pdfDir, name));
}
```
Apply the same guard to the `videos` and `posters` loops.

## Info

### IN-01: Placeholder copy ships to the live CV and Teaching pages

**File:** `content/pages/cv.md:7,11`, `content/pages/teaching.md:5-9`
**Issue:** "Add roles here, newest first.", "Add degrees and courses here." and a "Sample course" linking `teaching-sample-syllabus.pdf` are published as real page content. This is fine as scaffolding but is public if the site is pushed as-is.
**Fix:** Replace with real content before launch, or add a build warning for pages containing "Add ... here".

### IN-02: Global data named `tags` collides with Eleventy's reserved `tags` key

**File:** `src/_data/tags.js`, `eleventy.config.js:27-31`, `content/projects/projects.11tydata.js:9-13`
**Issue:** The tag definitions are exposed as the data key `tags`, which Eleventy interprets as each page's own tag list. The code works around this with `setDataDeepMerge(false)`, the `projectTags` computed value, a build-time array check, and a test that no `[object Object]` leaks. Every non-project page is still added to a bogus `collections["[object Object]"]`. This is fragile, and the workaround spans four files.
**Fix:** Rename the data file or key (for example `tagDefs`) and keep `tags` for per-project front matter only. Then drop the workaround.

### IN-03: Front matter `link` is rendered as an `href` with no scheme check, and duplicate tags are accepted

**File:** `src/_includes/base.njk:33`, `lib/validate.js:59-65`
**Issue:** `<a href="{{ link }}">` accepts any scheme, including `javascript:`. The content is owner-authored, so this is hardening rather than an exploit. `tags: [games, games]` passes validation and renders the tag twice in the project's `<dl>`.
**Fix:** In `validateContent`, require `link` to match `^https?://` and reject duplicate entries in `tags`.

### IN-04: Dead constant and duplicated limits in the asset scripts

**File:** `scripts/shrink.js:16` (`CONVERT_EXTS` is never used), `scripts/shrink.js:12,14` and `scripts/check-assets.js:9-10` (`MAX_EDGE`, `MAX_BYTES`)
**Issue:** `CONVERT_EXTS` is dead code. The 3000 px and 10 MB caps are duplicated in two files, with a comment saying they must "match" each other. `lib/limits.js` already exists for exactly this and is imported by both.
**Fix:** Delete `CONVERT_EXTS`. Move `MAX_EDGE` and `MAX_BYTES` into `lib/limits.js`. Also remove the `mkdtemp` directory that `heicToPng` (`scripts/shrink.js:125`) creates and never deletes.

### IN-05: The lightbox's focus and caption wiring is only tested against a hand-written fake DOM

**File:** `test/lightbox.test.js:14-70`
**Issue:** `FakeDialog.close()` always dispatches `close`, but a real `<dialog>.close()` is a no-op and fires nothing when the dialog is not open, and the real event is asynchronous. The tests cannot catch real-browser ordering problems, such as the `error` handler's `dialog.close()` followed immediately by `location.assign`. The dialog also has no `aria-describedby` linking it to its caption.
**Fix:** Add one real-browser smoke test (Playwright or similar) for open, Escape, focus return and error fallback, or model `open` state and async `close` in the fake. Optionally set `aria-describedby` on the dialog when a caption is present.

---

_Reviewed: 2026-10-30_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
