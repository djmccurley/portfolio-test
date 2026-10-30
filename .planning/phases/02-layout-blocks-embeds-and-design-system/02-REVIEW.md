---
phase: 02-layout-blocks-embeds-and-design-system
reviewed: 2026-10-30T00:00:00Z
depth: standard
scope: incremental, gap-closure plan 02-06 (G-02-4) since 068bff2
files_reviewed: 3
files_reviewed_list:
  - lib/media.js
  - test/build.test.js
  - test/video.test.js
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 2: Code Review Report (incremental, plan 02-06 since 068bff2)

**Note:** This report covers only plan 02-06 (G-02-4, video poster fix), the diff from `068bff28` to `HEAD` in `lib/media.js`, `test/build.test.js` and `test/video.test.js`. It replaces the earlier full-phase 02-REVIEW.md, which is in git history.

**Reviewed:** 2026-10-30
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

The behavior change is small and correct. When a poster is given, the `<video src>` is the plain `/video/<name>` URL. When no poster is given, the `#t=0.001` fragment is kept. The download fallback link never carried the fragment, so it is unchanged. The `poster` value reaching `renderFileVideo` is always a non-empty string (`lib/embeds.js:102` requires `length > 7`), so the truthiness check is safe. Title escaping and the `full` class are unaffected.

I ran `node --test test/video.test.js test/build.test.js` and all 25 tests pass. The new tests pin both forms (poster, poster + full + escaped title, no-poster, no-poster full) and the full-build assertion now checks the exact attribute order. The build-test exemption in "originals not published" is correctly scoped: `site.walk` returns absolute paths, `videoDir` is built from the same `site.dir`, and the check uses `path.dirname(f) === videoDir`, so only files directly inside `_site/video/` are exempt. Nothing deeper is exempt. Posters pass through the check and still fail on a name match, because they are always hashed derivatives.

No blockers. One robustness gap in the loosened test, and two minor cleanups.

## Warnings

### WR-01: "originals not published" exemption is weaker than it needs to be

**File:** `test/build.test.js:86-91`
**Issue:** The new rule skips every `.mp4`/`.webm` directly in `_site/video/` without checking that the file is something a `::: video` block actually names. Before this change a stray original in `_site/video/` would fail the test. Now an accidental bulk copy of video originals into `_site/video/` (for example a future `copyMedia` regression that publishes every video in `assets/`, not just the referenced ones) passes silently. That regression would break the "only files a block names are published" rule in the header of `lib/media.js` and the GitHub Pages size cap that the CLAUDE.md constraints call out. The test also doesn't run any positive assertion about the video directory. If the repo content has no video block, the exemption is dead and the test says nothing about video publishing.
**Fix:** Tighten the exemption to the set of videos referenced by built pages:
```js
const html = site.walk("_site").filter((f) => f.endsWith(".html")).map((f) => fs.readFileSync(f, "utf8")).join("\n");
for (const f of site.walk("_site")) {
  const base = path.basename(f);
  const isPublishedVideo =
    path.dirname(f) === videoDir &&
    VIDEO_EXTS.has(path.extname(f).toLowerCase()) &&
    html.includes(`/video/${encodeURIComponent(base)}`);
  if (isPublishedVideo) continue;
  assert.ok(!originals.has(base), `${f} is an original`);
}
```
## Info

### IN-01: Poster decision is keyed on `poster` while the attribute is keyed on `posterAttr`

**File:** `lib/media.js:52`
**Issue:** `src` is chosen with `poster ?` but the `poster=` attribute is emitted from `posterAttr`. They are equal today (`posterAttr` is set only inside `if (poster)` and `ctx.fail` throws). If a later change makes `ctx.fail` non-throwing, or adds an early-out path, the two can diverge. That would yield a poster with a fragment, or a fragment-less src with no poster.
**Fix:** `const src = posterAttr ? url : \`${url}#t=0.001\`;`. This ties the src to what is actually emitted.

### IN-02: Over-long comment line

**File:** `lib/media.js:51`
**Issue:** The G-02-4 comment is a single ~140-character line, longer than the other comments in the file (about 100 characters). It is cosmetic only.
**Fix:** Wrap it across two lines.

---

_Reviewed: 2026-10-30_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
