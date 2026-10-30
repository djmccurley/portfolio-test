---
phase: 02-layout-blocks-embeds-and-design-system
reviewed: 2026-10-30T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - content/style.css
  - eleventy.config.js
  - lib/blocks.js
  - lib/frontmatter.js
  - lib/validate.js
  - scripts/shrink.js
  - test/block-errors.test.js
  - test/content-errors.test.js
  - test/design.test.js
  - test/shrink.test.js
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 02: Code Review Report (incremental re-review, e4729ef..HEAD)

**Reviewed:** 2026-10-30
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Re-review of the four fixes for WR-01..WR-04 from the previous review. All four fixes address their original defects. Two of them introduced small regressions or incomplete behavior, listed below. No security issues were found.

Verification of each fix:

- **WR-01 (skip-link focus ring, `content/style.css`)**: correct. The ring rule `:is(a, video, iframe, summary, button, [tabindex]):focus-visible` has specificity (0,2,0). `main[tabindex="-1"]:focus-visible` is (0,2,1) and wins. `src/_includes/base.njk:15` does emit `<main id="main" tabindex="-1">`, so the selector matches. Other tabindex elements keep their ring. The test regex matches the new rule.
- **WR-02 (hard breaks and linked images, `lib/blocks.js`)**: hard breaks are now tolerated by `isImageOnly`, and linked images get their own error on the correct line (verified by running it). The new message misfires for text links, see WR-02 below.
- **WR-03 (out-of-range dates, `lib/frontmatter.js`, `lib/validate.js`, `eleventy.config.js`)**: correct. `validDate` rejects 2024-13-45, 2024-02-30, 2024-00-10 and 1900-02-29, and accepts 2000-02-29. `validate.js` and the lenient front-matter loader in `eleventy.config.js` now share one validator, so the two can no longer disagree.
- **WR-04 (oversize WebP, `scripts/shrink.js`)**: the byte-cap re-encode works, but the new post-convert size warning is wrong for videos, see WR-01 below.

## Warnings

### WR-01: false "still over 10 MB" warning for renamed videos (regression from the WR-04 fix)

**File:** `scripts/shrink.js:153-155`
**Issue:** The new size check runs for every item in `convertOne`, including `rename` and `none` actions. Videos (`.mp4`, `.webm`) are never re-encoded and are allowed up to `VIDEO_MAX_MB` (50 MB) by `lib/limits.js`. `scripts/check-assets.js:36-41` exempts them from the 10 MB cap with `continue`. A video such as `My Clip.mp4` (20 MB) is renamed to `my-clip.mp4`. It then prints `shrink: warning: my-clip.mp4 is still over 10 MB after conversion; reduce it by hand`. That is wrong, since CI accepts the file, and it tells the author to do needless work. The same warning also repeats for GIFs and AVIFs, which are already rejected earlier in `main` if over 10 MB, so it is harmless there.
**Fix:**
```js
if (!VIDEO_EXTS.has(path.extname(toPath).toLowerCase()) && fs.statSync(toPath).size > MAX_BYTES) {
  console.warn(`shrink: warning: ${item.to} is still over 10 MB after conversion; reduce it by hand`);
}
```
Add a test: a rename-only 11 MB `.mp4` in `assets/` must not print the warning.

### WR-02: text-only links in a layout block get the "linked images" error

**File:** `lib/blocks.js:157-162`
**Issue:** The new branch treats any first-offending `link_open` as a linked image. A plain text link such as `[read more](https://e.com)` inside `::: grid-2` now reports `cannot hold linked images. Remove the link or move the image outside the block.` There is no image involved, and the advice is misleading. The ONLY_IMAGES message ("may only contain images. Move the text outside the block...") is the right one there. Confirmed by running `::: grid-2\n[a text link](https://e.com)\n:::`. The same applies to `![a](x.webp) [link](u)`.
**Fix:** Only pick the linked-image message when the link actually wraps an image.
```js
function linkWrapsImage(inline, openIdx) {
  for (let j = openIdx + 1; j < inline.children.length; j++) {
    const c = inline.children[j];
    if (c.type === "link_close") return false;
    if (c.type === "image") return true;
  }
  return false;
}
const linked = bad >= 0 && inline.children[bad].type === "link_open" && linkWrapsImage(inline, bad);
```
Add a test for a text link in a block expecting the ONLY_IMAGES message.

## Info

### IN-01: shrink's lossy re-encode of an over-cap WebP can still end over 10 MB, or grow the file

**File:** `scripts/shrink.js:268-272`
**Issue:** An over-cap WebP that was already lossy (for example quality 75) is re-encoded at quality 82. The output can be larger than the input and still exceed 10 MB. The new warning in `convertOne` catches this, but by then the original has been overwritten (the temp file is renamed over `toPath` and `fromPath` is unlinked). In staged mode the unshrunk original is gone from the working tree, although git history still holds it. This is a rare edge case.
**Fix:** After encoding, if the output is larger than the input, keep the input (or retry at a lower quality). Alternatively, make the lossy quality a constant and step down when over the cap.

### IN-02: `validDate` rejects years 0000 to 0099

**File:** `lib/frontmatter.js:13`
**Issue:** `Date.UTC` maps years 0 to 99 to 1900 to 1999, so the round-trip year check fails for `0024`. This rejects those years, which is harmless in practice. It is accidental rather than deliberate, and the comment says nothing about it.
**Fix:** Either note it in the comment, or use `dt.setUTCFullYear(+y)` after construction to make it exact.

---

_Reviewed: 2026-10-30_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
