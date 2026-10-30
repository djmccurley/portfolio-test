---
phase: 02-layout-blocks-embeds-and-design-system
reviewed: 2026-10-29T00:00:00Z
depth: standard
files_reviewed: 26
files_reviewed_list:
  - content/projects/tidepool-game.md
  - content/style.css
  - eleventy.config.js
  - lib/alt-lint.js
  - lib/blocks.js
  - lib/embeds.js
  - lib/images.js
  - lib/limits.js
  - lib/locate.js
  - lib/markdown.js
  - lib/media.js
  - lib/validate.js
  - package.json
  - scripts/check-assets.js
  - scripts/shrink.js
  - src/_includes/base.njk
  - test/alt-lint.test.js
  - test/block-errors.test.js
  - test/blocks.test.js
  - test/build.test.js
  - test/check-assets.test.js
  - test/contrast.test.js
  - test/design.test.js
  - test/embeds.test.js
  - test/shrink.test.js
  - test/video.test.js
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-10-29
**Depth:** standard
**Files Reviewed:** 26
**Status:** issues_found

## Summary

The full suite passes (166 of 166) and the build output for the Tidepool page is correct. I probed the block parser, embed renderers, URL allow-lists and attribute escaping with hostile input. I found no injection or path-traversal holes. Titles are escaped, iframe `src` values are rebuilt from parsed IDs, hosts are allow-listed with dot-anchored suffixes, and asset lookups use basename only.

The problems are correctness and robustness defects in diagnostics and CSS. I confirmed each by running it or by checking CSS specificity.

## Warnings

### WR-01: `main:focus { outline: none }` loses to the global focus-visible rule, so the skip link target gets a page-wide ring

**File:** `content/style.css:48-55`
**Issue:** `:is(a, video, iframe, summary, button, [tabindex]):focus-visible` has specificity (0,2,0), because `:is()` takes its most specific argument, `[tabindex]`. `main:focus` has specificity (0,1,1). `<main id="main" tabindex="-1">` therefore matches the ring rule, and the ring wins. After the user activates the skip link from the keyboard, Chromium matches `:focus-visible` on `main`. A 3px accent outline then wraps the whole content area.

The comment says "the programmatic skip target only; every other element keeps its ring". `test/design.test.js:113` only checks that the text `main:focus { outline: none` exists. It does not check that the rule wins the cascade, so the bug is invisible to the tests.

**Fix:**
```css
/* (0,2,1) beats the (0,2,0) ring rule */
main[tabindex="-1"]:focus,
main[tabindex="-1"]:focus-visible {
  outline: none;
}
```
Alternatively, drop `[tabindex]` from the ring selector and use `[tabindex]:not(main)`. Update the design test to assert the winning rule, not just the text.

### WR-02: A trailing hard break after an image inside a layout block gives a wrong and misleading error

**File:** `lib/blocks.js:20-31` and `lib/blocks.js:36-48` (used at `:156-157`)
**Issue:** `isImageOnly` accepts only `softbreak` between images. `firstNonImage` skips every break, including `hardbreak`. Two trailing spaces or a trailing backslash after an image line is easy to pick up from a paste. The paragraph then fails `isImageOnly`, and `firstNonImage` returns -1 because nothing is actually non-image. `childLine(inline, -1)` then slices `children.slice(0, -1)`, which gives a bogus line.

I reproduced it with `::: grid-2\n![a](x.webp)  \n![b](y.webp)\n:::`. It throws `...:3: block "::: grid-2" may only contain images. Move the text outside...`. The offending line is 2, there is no text anywhere, and line 3 is the second image.

The same mismatch affects linked images `[![a](x)](url)`. They get the same "text" message, which misleads the owner.

**Fix:** Treat `hardbreak` like `softbreak` in `isImageOnly`, using the shared `isBreak` helper. Guard the failure path:
```js
else if (isBreak(c)) continue;
...
const bad = firstNonImage(inline);
loc.failAtLine(bad < 0 ? inline.map[0] : childLine(inline, bad), ...);
```
Add a specific message for `link_open` ("images cannot be wrapped in links inside a block").

### WR-03: An out-of-range date passes validation and crashes Eleventy without naming the field's error format

**File:** `eleventy.config.js:15-21` and `lib/validate.js:11,49-51`
**Issue:** `lenientFrontMatter` exists so Eleventy never sees a bad date and `validate.js` can report it with the file named (D-23). Both the lenient filter and `DATE_RE` check only the shape `\d{4}-\d{2}-\d{2}`. `date: 2024-13-45` passes both, and Eleventy then aborts with a raw "Data cascade value for `date` (2024-13-45) is invalid ... Template.getMappedDate" stack trace. I reproduced this. The friendly "must be YYYY, YYYY-MM or YYYY-MM-DD" message is never shown for month 13 or day 45, which are likely typos.

**Fix:** Validate calendar ranges in one shared helper and use it in both places:
```js
export function validDate(s) {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(s);
  if (!m) return false;
  const [, y, mo = "01", d = "01"] = m;
  const dt = new Date(Date.UTC(+y, +mo - 1, +d));
  return dt.getUTCFullYear() === +y && dt.getUTCMonth() === +mo - 1 && dt.getUTCDate() === +d;
}
```

### WR-04: CI error tells the owner to run `shrink` for an oversize WebP that `shrink` never touches

**File:** `scripts/check-assets.js:42-43,68` and `scripts/shrink.js:258-267`
**Issue:** `check-assets` rejects any file over 10 MB. For `.webp` the hint is generic, and the footer says "Run `npm run shrink` locally for PNG/JPEG/HEIC/WebP". `shrink` re-encodes an existing WebP only when its longest edge is over 3000px (`shrink.js:264`). A WebP under 3000px but over 10 MB, such as a lossless or animated one, is a no-op in `shrink`. The owner is stuck in a loop where CI fails and the suggested fix does nothing. Lossless PNG to WebP conversion can also produce a result over 10 MB, and `shrink` never rechecks the output size.

**Fix:** Either make `shrink` re-encode WebPs over `MAX_BYTES` lossy (`webp-lossy`), or add `.webp` to the manual hint when the failure is size-only. Have `convertOne` verify the output size and warn.

## Info

### IN-01: "a title cannot break out of its attribute" test is partly vacuous

**File:** `test/embeds.test.js:218-226`
**Issue:** The first assertion renders a clean title `"x"` and checks that `onload` is absent. That is true by construction. The case that matters, a title containing a quote, cannot be written in this fence syntax. The second half only re-tests the extra-token error already covered at `:249`. The name promises coverage the test does not deliver. The real escaping coverage is at `:210-216`.
**Fix:** Rename the test, or drop the vacuous assertion. Add a direct `escapeAttr('x" onload="y')` assertion for the quote case.

### IN-02: Fonts come from Google's CDN while the embeds are built to be privacy-preserving

**File:** `src/_includes/base.njk:7-9`
**Issue:** Every page load sends the visitor's IP to `fonts.googleapis.com` and `fonts.gstatic.com`. The same phase rewrites YouTube to `youtube-nocookie` and Vimeo to `dnt=1` for privacy. `test/design.test.js:69` locks the third-party link in. The remote stylesheet is also render-blocking, and the page falls back to system-ui if the CDN is blocked.
**Fix:** Self-host Chivo as WOFF2 with `@font-face` and `font-display: swap`, served from `_site`. This removes both preconnects and the third-party request.

### IN-03: Unused or inconsistent code

**File:** `lib/blocks.js:136`, `scripts/check-assets.js:67-69`, `lib/locate.js:5-15`
**Issue:**
- `ctx.file` and `ctx.line` are built for every embed handler, but `renderVideo`, `renderItch` and `renderFileVideo` use only `ctx.fail`.
- The `console.error` string in `check-assets.js` is mis-indented relative to its block.
- `frontMatterOffset` assumes the markdown-it source equals the raw file body. Eleventy runs Nunjucks first (`markdownTemplateEngine: "njk"`), so a multi-line `{# #}` comment or `{% set %}` in the body shifts the reported line numbers. I did not test this.

**Fix:** Drop the unused `ctx` fields, or document them as part of the handler contract. Re-indent the string. Note the line-number caveat in `locate.js`, or use `{% raw %}` guidance in the authoring docs.

### IN-04: No aggregate cap on self-hosted video against the Pages size limit

**File:** `lib/limits.js:3-5`, `lib/media.js:59-75`, `scripts/check-assets.js:36-40`
**Issue:** Each video is capped at 50 MB. `copyMedia` publishes every video a block names, and nothing bounds the total. About twenty videos plus the processed images would approach the ~1 GB GitHub Pages limit named in CLAUDE.md. The deploy would fail late, and the only signal would be the Actions run.
**Fix:** In `copyMedia` or `check-assets`, sum the published video bytes and warn above a budget, for example 500 MB. Keep the budget constant in `lib/limits.js`.

---

_Reviewed: 2026-10-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
