---
phase: 01-push-to-live-with-images
reviewed: 2026-10-28T00:00:00Z
depth: standard
files_reviewed: 30
files_reviewed_list:
  - .githooks/pre-commit
  - .github/workflows/deploy.yml
  - .gitignore
  - .vscode/settings.json
  - content/404.md
  - content/index.md
  - content/pages/pages.11tydata.js
  - content/projects/projects.11tydata.js
  - content/projects/tidepool-game.md
  - content/style.css
  - eleventy.config.js
  - lib/assets.js
  - lib/frontmatter.js
  - lib/images.js
  - lib/markdown.js
  - lib/validate.js
  - package.json
  - scripts/check-assets.js
  - scripts/prune-img.js
  - scripts/shrink.js
  - src/_data/tags.js
  - src/_includes/base.njk
  - test/build.test.js
  - test/check-assets.test.js
  - test/content-errors.test.js
  - test/helpers/site.js
  - test/images.test.js
  - test/prune-img.test.js
  - test/shrink.test.js
  - test/workflow.test.js
findings:
  critical: 0
  warning: 6
  info: 4
  total: 10
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-10-28
**Depth:** standard
**Files Reviewed:** 30
**Status:** issues_found

## Summary

The pipeline is well structured. It uses execFileSync with argument arrays, so there is no shell injection. Slugs are validated before they reach permalinks, and the deploy workflow has least-privilege permissions. No security blockers were found. The warnings are mostly robustness gaps: the commit-time shrink step can silently lose data or let bad assets through, the CI guard and the shrink tool disagree about what they enforce, and the alpha heuristic risks bloating the published site.

I read `test/build.test.js`, `test/check-assets.test.js`, `test/content-errors.test.js`, `test/images.test.js`, `test/shrink.test.js` and `content/style.css` only by size and header, not line by line.

## Warnings

### WR-01: Oversize animated WebP is flattened to a single frame (data loss)

**File:** `scripts/shrink.js:110, 232-234`
**Issue:** An oversize `.webp` is re-encoded with `sharp(inputPath, { failOn: "none" })`, which has no `animated: true`. Only the first frame is read, so an animated WebP over 3000px silently becomes a still image. The original is overwritten, because the same-name `renameSync` replaces it. Metadata is read the same way (`metaOf`), so the width and height are also measured on a single frame.
**Fix:** Pass `animated: true` to `sharp()` in `encode` and `metaOf`, and use `pageHeight` for the height check. Alternatively, skip and warn for animated WebP instead of re-encoding.

### WR-02: shrink never handles GIF/AVIF size or edge limits, but CI fails on them with advice that does nothing

**File:** `scripts/check-assets.js:9-11, 28, 31-42, 56` and `scripts/shrink.js:26-32, 130-134`
**Issue:** `check-assets` rejects any asset over 10 MB or over 3000px on its longest edge. This includes GIF and AVIF. Its error message says "Run `npm run shrink`". `shrink` only warns about GIFs over 5 MB, never resizes or recompresses them, and ignores AVIF entirely. A large GIF therefore passes the pre-commit hook and then fails CI with a remedy that cannot work, which blocks deploys.
**Fix:** Either enforce the same limits in shrink (a hard error at commit time for GIF/AVIF over 10 MB or 3000px, with a clear manual instruction), or make the CI message say these formats must be fixed by hand.

### WR-03: Hook skips renamed assets (`--diff-filter=AM`)

**File:** `scripts/shrink.js:202`
**Issue:** `git diff --cached --diff-filter=AM` omits renames (R) and copies (C). Rename detection is on by default. Moving or renaming an existing asset in the index, or adding a PNG that matches an existing blob, is reported as R or C and not processed. An unconverted or badly named PNG then passes the hook. CI catches it later, but the hook's promise is broken.
**Fix:** Use `--no-renames --diff-filter=AM`, or `--diff-filter=ACMR`.

### WR-04: Alpha heuristic forces PNG fallbacks for opaque screenshots

**File:** `lib/assets.js:39`, `lib/markdown.js:22`, `scripts/shrink.js:114`
**Issue:** `meta.hasAlpha` is true whenever an alpha channel exists, even if every pixel is opaque. macOS screenshots and many PNGs carry an unused alpha channel, and `encode()` keeps it through the lossless WebP conversion. Each such image gets `eleventy:formats="webp,png"`, so four widths (up to 2400px) are written as PNG. That bloats `_site` and works against the GitHub Pages size cap. It also slows builds.
**Fix:** In `refreshAssets`, use `const s = await sharp(file).stats(); alpha = meta.hasAlpha && !s.isOpaque`. Optionally flatten opaque alpha in `encode` with `.removeAlpha()` when `isOpaque`.

### WR-05: `prune-img` can crash the deploy on a malformed percent sequence

**File:** `scripts/prune-img.js:22`
**Issue:** `decodeURIComponent(m[1])` throws `URIError` on input such as `/img/50%off`. This can happen in prose, code samples or any text in a built page that contains `/img/`. The uncaught exception fails the build step and blocks the deploy.
**Fix:** Wrap it in `try { referenced.add(decodeURIComponent(x)); } catch { referenced.add(x); }`. Adding the raw name as well is the safe choice, because keeping a file is harmless and deleting one is not.

### WR-06: `cancel-in-progress: true` on the Pages concurrency group

**File:** `.github/workflows/deploy.yml:13-15`
**Issue:** A second push can cancel an in-flight deploy job. GitHub's Pages guidance sets `cancel-in-progress: false` for this group. Cancelling mid-deploy can leave the deployment in a failed state. The failure is also hard to see, because the image cache has already been saved.
**Fix:** Set `cancel-in-progress: false`. Queued runs then supersede each other, and the deploy in progress finishes. Update `test/workflow.test.js` to assert it.

## Info

### IN-01: Alt text is not validated

**File:** `lib/markdown.js:11-28`, `content/projects/tidepool-game.md:14-15`
**Issue:** The project requires alt text on images. An image written as `![](x.webp)` or `![alt text](...)` builds without complaint, and the sample content ships the placeholder "alt text" twice. `cover_alt` is checked, but body images are not.
**Fix:** In the asset resolver, warn or throw on an empty `alt` (`t.content`), and replace the placeholder text in the sample content.

### IN-02: `date` sorting and non-string dates

**File:** `eleventy.config.js:33-37`, `lib/frontmatter.js:6`
**Issue:** Sorting by `String(date).localeCompare` places `2024` before `2024-05-01`, so a year-only entry sorts as older than any dated entry in the same year. Also, the quoting regex requires `date:` to be the only content on its line. `date: 2024 # note` is parsed by YAML as the number 2024. That passes validation but is not a string, and Eleventy's date handling for a numeric value is unverified.
**Fix:** Allow an optional trailing comment in the regex, and normalise the sort key by padding to `YYYY-MM-DD`.

### IN-03: HEIC temp directory is never cleaned up

**File:** `scripts/shrink.js:118-124`
**Issue:** `mkdtempSync` creates a directory under `os.tmpdir()` for each HEIC file, and it is never removed. On macOS this leaves a leaked PNG per conversion.
**Fix:** Remove the temp directory in a `finally` block in `convertOne`.

### IN-04: Minor robustness and accessibility notes

**File:** `eleventy.config.js:10`, `src/_includes/base.njk:10-21`
**Issue:** `PATH_PREFIX=""` is honoured by `??` and produces an empty pathPrefix instead of the "/" the comment documents. `link` is rendered as an unvalidated `href`, so a `javascript:` value in front matter would be emitted as written. This is self-authored, so the risk is low. The layout also has no skip link, and the only navigation is a bare "Portfolio" link.
**Fix:** Use `process.env.PATH_PREFIX || "/portfolio-test/"` and validate that `link` is http(s). A skip link can wait for the layout phase.

---

_Reviewed: 2026-10-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
