---
phase: 04-hardening-and-launch-readiness
reviewed: 2026-10-30T00:00:00Z
depth: standard
files_reviewed: 23
files_reviewed_list:
  - content/projects/projects.11tydata.js
  - content/robots.njk
  - content/sitemap.njk
  - content/style.css
  - eleventy.config.js
  - lib/drafts.js
  - lib/validate.js
  - package.json
  - scripts/check-reflow.mjs
  - src/_data/site.js
  - src/_includes/base.njk
  - src/_includes/card.njk
  - test/content-errors.test.js
  - test/drafts.test.js
  - test/featured.test.js
  - test/helpers/site.js
  - test/pager.test.js
  - test/readme.test.js
  - test/reflow.test.js
  - test/seo.test.js
  - test/sitemap.test.js
  - test/workflow.test.js
  - README.md
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-10-30
**Depth:** standard
**Files Reviewed:** 23
**Status:** issues_found

## Summary

I reviewed the changes since `bf50b11` with the focus you set: draft filtering, OG/canonical URLs and escaping, sitemap and robots, the pager, the reflow CSS and the reflow script. I also ran builds, using the repo itself and throwaway fixture sites built with `makeSite`, to check behaviour instead of trusting the code.

No blockers. What I verified:

- **Draft filtering is sound for the CI build.**
  - Eleventy's `getTemplates` runs the preprocessor with the fully merged data, so the `draft === true` check also covers directory data.
  - A skipped template joins no collection, so cards, tag pages, the pager, featured and the sitemap all lose it.
  - A draft's images, videos and PDFs are never registered or processed.
  - `prune:img` strips any stale cached images, because it removes everything the HTML does not reference.
- **OG and canonical tags are correct and escaped once.** With a title, description and `cover_alt` containing `"`, `&` and `<`, the output is correctly escaped. Canonical and `og:url` are absolute and carry the path prefix once. `og:image` is the 1200px derivative and `prune:img` keeps it.
- **Sitemap and robots are correct.**
  - The sitemap lists each public URL once and in sorted order.
  - It leaves out drafts, draft-only tag pages and pages marked `eleventyExcludeFromCollections`.
  - `robots.txt` points at the absolute sitemap URL.
- **The pager direction is right.** "Previous" goes to the newer project and "Next" to the older one, and titles are escaped.
- **The reflow CSS holds up.** `pre` is `pre-wrap`, so `overflow-wrap: anywhere` does take effect.
- **The reflow script's static server does not allow path traversal.**

The remaining issues are robustness and maintainability.

## Warnings

### WR-01: `ogImage` hardcodes the output directory and URL path instead of reusing `imageOptions`

**File:** `eleventy.config.js:94`
**Issue:** `ogImage` repeats `urlPath: "/img/"` and `outputDir: "_site/img/"` as literals, although `lib/images.js` already defines both for the transform plugin. If someone changes either one, for example by moving the output directory or running `eleventy --output=...`, the body images and the link-preview image go to different places. The `og:image` URL would then 404 on the live site while every other check still passes. The CI cache path and `prune:img` also assume `_site/img` in several places. There is no test tying the two together.
**Fix:**
```js
const meta = await Image(abs, {
  widths: [1200],
  formats: [fmt],
  urlPath: imageOptions.urlPath,
  outputDir: imageOptions.outputDir,
  failOnError: true,
});
```

### WR-02: A local production build can publish a stale draft from an earlier `npm start`

**File:** `eleventy.config.js:47-49` (and `lib/drafts.js`)
**Issue:** Eleventy does not empty `_site/`. I confirmed it with a fixture. After a serve-mode build wrote `_site/sec/index.html` for a draft, a following `eleventy` build left that file in place. The sitemap was correct, but the draft page and its media stayed in the output directory. The README (line 202) tells the owner to delete `_site/` by hand. The CI deploy builds from a clean checkout, so the live site is safe. Any local `_site/` publish or inspection, or any future deploy that does not start clean, can still leak a draft. This is the one remaining way for draft content to reach production.
**Fix:** In the `eleventy.before` handler, when `!showDrafts()`, delete the output for each drafted page. This does not defeat the CI `_site/img` cache, because it touches only the draft's own directory.
```js
if (!showDrafts()) {
  for (const d of findDrafts()) {
    if (/^[a-z0-9-]+$/.test(d.slug)) fs.rmSync(path.join("_site", d.slug), { recursive: true, force: true });
  }
}
```
Alternatively, make `npm run build` run `rm -rf _site` first and keep the cache restore ordering in CI in mind.

## Info

### IN-01: The 404 page gets a canonical URL and `og:url` pointing at `404.html`

**File:** `src/_includes/base.njk:11,15`
**Issue:** `404.html` is built with the shared head, so the generated output has `<link rel="canonical" href=".../404.html">` and an `og:url` of the same address. The sitemap correctly leaves the page out. Emitting a canonical for an error page is harmless on GitHub Pages, which serves a real 404 status, but it is semantically wrong and would be indexable on a host that returns 200 for it.
**Fix:** Skip the canonical and `og:url` when `page.url == "/404.html"`, or add `<meta name="robots" content="noindex">` for that page.

### IN-02: `robots.txt` is ineffective while the site is served under `/portfolio-test/`

**File:** `content/robots.njk`
**Issue:** Crawlers only read `/robots.txt` at the host root. On the project-site URL it is published at `/portfolio-test/robots.txt`, so crawlers never see it. It starts working only after the move to a root domain. The sitemap is also reachable only through Search Console until then. The README says robots hides nothing, but it does not say the file is currently ignored.
**Fix:** Add one line to the README Drafts or Publishing section noting that robots.txt takes effect only at a domain root. Optionally submit the sitemap URL manually.

### IN-03: The reflow check measures with the fallback font, and the Chrome lookup is macOS and Linux only

**File:** `scripts/check-reflow.mjs:38-45, 25`
**Issue:**
- The pages load Chivo from Google Fonts. Headless Chrome offline, or with the font blocked, measures a different font than production, so a narrow-fallback pass can hide an overflow that appears with Chivo. This risk is real, but I did not reproduce it.
- `findChrome` has no Windows path, so the script exits with code 2 unless `CHROME_BIN` is set.
- `server.close()` is awaited before `closeAllConnections()`, so the call is dead code if a socket lingers. Node 22 already closes idle sockets, so this is harmless in practice.
**Fix:** Note in the header comment that results depend on the font loading. Add the Windows candidates under `%ProgramFiles%\Google\Chrome\Application\chrome.exe`. Call `closeAllConnections()` before awaiting `close`.

### IN-04: The nav page list is duplicated between `lib/drafts.js` and `base.njk`

**File:** `lib/drafts.js:13-16`, `src/_includes/base.njk:35-36`
**Issue:** `NAV_PAGES` and the hardcoded CV and Teaching `<li>` entries must stay in sync, as the comment admits. Adding a nav page to the template and forgetting the map means a drafted page still shows its link and gets no warning. No test locks the two together. The draft-page slug is also derived with `??` in `findDrafts` but with `||` in the permalink code, so `slug: ""` would give the two different answers. Content validation flags an empty slug, so this is an inconsistency only.
**Fix:** Add a small test that every `href="/…/"` nav link in `base.njk` (other than `/work/`) is a key of `NAV_PAGES`. Use `||` in `findDrafts` for consistency with the permalink computation.

---

_Reviewed: 2026-10-30_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
