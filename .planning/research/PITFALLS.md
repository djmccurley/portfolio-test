# Pitfalls Research

**Domain:** Markdown-authored, image-heavy static portfolio on GitHub Pages (VS Code paste-image plugin, shared `assets/` folder, custom layout-block shorthand, itch.io embeds, brutalist/accessible design)
**Researched:** 2026-10-28
**Confidence:** MEDIUM. Limits and platform behaviour come from well-known GitHub documentation and the author's prior knowledge, not re-fetched this session. Re-verify the numeric limits (marked "verify") before they drive a decision. The SSG is still undecided, so tool-specific advice is kept generic.

## Critical Pitfalls

### Pitfall 1: Full-res originals bloat the git repo permanently

**What goes wrong:**
Hundreds of pasted PNGs or PSD exports (5-40 MB each) are committed to `assets/`. The repo reaches several GB. Clones and CI checkouts slow down. GitHub warns above 50 MB per file and hard-blocks pushes above 100 MB per file. GitHub recommends keeping repos under about 1 GB (verify). Deleting files later does not shrink history.

**Why it happens:**
"Full-res originals stay as source" is a stated requirement, and the paste plugin writes straight into the repo. Nothing stops a 60 MB retina screenshot or a 120 MB video.

**How to avoid:**
- Decide the original-storage policy in phase 1. Options are (a) originals in git with a pre-commit or CI size guard, or (b) originals outside git (cloud or local drive) with only a pre-shrunk "source" (for example 3000px max edge) committed. Recommended: commit a capped source (about 3000px, 1-3 MB), keep true masters elsewhere.
- Add a pre-commit hook or CI check that fails on any file over about 10 MB in `assets/`. Add `.gitattributes` and `.gitignore` entries for `.psd`, `.ai`, `.mov` and similar.
- Never commit game builds or large videos. Use itch.io for games and YouTube/Vimeo for long video. Self-hosted video must be small, compressed MP4/WebM.
- Do not use Git LFS to hold images that the site publishes (see Pitfall 2).

**Warning signs:**
`du -sh .git` over about 300 MB. Pushes take over 30 seconds. `git count-objects -vH` grows quickly. Clone time is noticeable.

**Phase to address:**
Phase 1 (repo and asset conventions, written down before any content exists).

---

### Pitfall 2: Git LFS adopted as the fix, then breaks Pages and runs into bandwidth quotas

**What goes wrong:**
With LFS, the Pages deploy can publish tiny pointer files instead of images, so images 404 or render broken, unless the build checks out with `lfs: true`. GitHub's LFS free tier is small (about 1 GB storage and 1 GB/month bandwidth, verify). Every CI checkout that pulls LFS files counts against bandwidth. Hundreds of images run out of quota within days, and pushes or CI then fail.

**Why it happens:**
LFS looks like the standard answer to "big files in git". But the build pipeline already shrinks images, so the site never needs LFS to serve them.

**How to avoid:**
Avoid LFS for v1. Keep sources modest (Pitfall 1). If LFS is ever used, set `actions/checkout` with `lfs: true`, and confirm the built `_site` contains real image bytes, not 130-byte pointers. Keep only masters in LFS, never published files.

**Warning signs:**
Deployed images are tiny or broken. The build log shows "Smudge error" or "LFS budget exceeded". Sharp or the image plugin errors with "Input file contains unsupported image format" on files about 130 bytes.

**Phase to address:**
Phase 1 (decision), CI phase (verification).

---

### Pitfall 3: Reprocessing every image on every push (slow CI)

**What goes wrong:**
Each push resizes hundreds of images into several widths and formats (AVIF, WebP, JPEG). Builds climb from seconds to 10+ minutes. AVIF encoding is especially slow. Local dev rebuilds crawl too. Pages deployment also has a time limit of about 10 minutes (verify), and GitHub Actions minutes are finite on private repos.

**Why it happens:**
CI starts from a clean checkout with no cache, so the image plugin has nothing to reuse. Cache keys based on commit SHA never hit.

**How to avoid:**
- Pick a pipeline with a persistent on-disk cache keyed by content hash and options (for example the Eleventy image plugin's `.cache`, Astro's image cache in `node_modules/.astro`, Hugo's `resources/_gen`). Persist it in CI with `actions/cache`, using a key like `images-${{ hashFiles('assets/**') }}` plus a `restore-keys` prefix so the cache is partially restored and only new files are processed.
- Limit variants: for example 3 widths (480, 960, 1600) and 2 formats (WebP plus JPEG, with AVIF only if build time allows). Do not generate widths larger than the source.
- Only process images that are actually referenced, not everything in `assets/`.
- Process lazily in dev (on-request or quick mode) and fully only in production builds.
- Set a CI time budget and watch it.

**Warning signs:**
Build time grows linearly with image count. The cache step reports "cache miss" every run. A one-word text edit takes minutes.

**Phase to address:**
Image pipeline phase (cache design), CI/deploy phase (`actions/cache` wiring). Test with 200+ images before calling it done.

---

### Pitfall 4: Image paths work in the VS Code preview but break in the built site (or the reverse)

**What goes wrong:**
The paste plugin inserts relative paths such as `../assets/proj-123.png`. These render in VS Code's markdown preview. The site then 404s because:
- the page's output URL depth differs from its source depth (permalinks like `/projects/foo/` versus the source `projects/foo.md`),
- the SSG treats a root-absolute `/assets/x.png` as the site root, which differs from the VS Code workspace root, or
- on a GitHub Pages project site (`user.github.io/repo/`), root-absolute URLs resolve to `user.github.io/assets/...` and miss the repo prefix.

**Why it happens:**
There are three path contexts (editor preview, SSG input, deployed URL) and a hidden base path (the Pages project-site `pathPrefix`, `baseURL` or `base`). Most developers only test at `localhost:8080/`.

**How to avoid:**
- Decide one authoring convention and make the build resolve it. Recommended: authors write whatever the plugin emits (relative to the `.md` file), and a markdown-it or remark/rehype transform resolves the path against the source file, finds the file in `assets/`, runs it through the image pipeline, and emits URLs that already include the base path. Never pass raw author paths through to HTML.
- Fail the build, not the page, on a missing image (throw in the transform). A broken image reference must be a build error.
- Test with the real base path. Either deploy to a custom domain or user site (`username.github.io`, no prefix), or run local and CI builds with the project-site prefix and run a link checker against the output.
- Use the SSG's URL filter (Eleventy `| url` with `pathPrefix`, Hugo `relURL`, Astro `import.meta.env.BASE_URL`) for every internal link in templates, CSS `url()` and the nav, not just images.
- Add an `.nojekyll`-style check if the site is not Jekyll: files and folders starting with an underscore are dropped by Pages' Jekyll step unless `.nojekyll` exists. If deploying with the Actions artifact flow, this is not an issue, but verify.

**Warning signs:**
Images fine on `localhost` but 404 on Pages. CSS loads but images do not (or vice versa). Preview shows images but the build log has no errors. Links break only on the deployed site.

**Phase to address:**
Phase 1 (path convention and base path decision), deploy phase (run the link checker against the real deployed prefix).

---

### Pitfall 5: Shared `assets/` folder collisions and rot

**What goes wrong:**
One flat folder holds every project's images. Two things can happen: (1) same-named files overwrite each other or output filenames collide after processing (`image.png` from two sources both emit `/img/image-960.webp`), and (2) orphaned, renamed or deleted images accumulate, so nobody knows which are in use and the repo only grows.

**Why it happens:**
The plugin prefix may be a timestamp, a note name, or a short hash, and the author may rename or move the note later, which leaves prefixes stale. Output naming that uses only the basename collides across folders.

**How to avoid:**
- Name outputs by content hash (the default in most image plugins) rather than by basename, so collisions are impossible.
- Check the plugin's prefix settings: prefer a timestamp or random suffix over just the page name, so renaming a page does not matter.
- Add a build-time warning that lists unreferenced files in `assets/` and a hard error on case-insensitive duplicates (macOS is case-insensitive, Linux CI is not, so `Foo.png` versus `foo.png` works locally and breaks in CI).
- Never rename files by hand once referenced. If a rename is needed, search and replace across `.md` files in the same commit.
- Spaces and unicode in filenames: confirm the plugin produces URL-safe names, or slugify in the transform and URL-encode.

**Warning signs:**
Wrong image shown on a page. Works on Mac, 404 on CI (case). `assets/` file count much greater than the referenced count.

**Phase to address:**
Phase 1 (naming rule, plugin settings), image pipeline phase (orphan and duplicate checks).

---

### Pitfall 6: Custom block syntax that breaks in VS Code preview or is fragile to type

**What goes wrong:**
Layout shorthand (grids, full-width) that the SSG parses may:
- show as garbage in the VS Code preview (acceptable only if it degrades legibly, since the preview cannot run custom plugins),
- break when indented (4+ spaces becomes a code block; list-nested blocks lose structure),
- fail when nested (a grid inside a grid, or a block inside a list or blockquote),
- not parse markdown inside HTML wrappers: in CommonMark, markdown inside a `<div>` is only processed if separated by blank lines, and `markdown="1"` is a Kramdown/Jekyll-only feature, so the same source behaves differently across SSGs,
- fail on a single stray space or missing closing fence, silently swallowing the rest of the page.

**Why it happens:**
Custom syntax is invented before the parsing rules are written down. Paired shortcodes (Nunjucks, Liquid, Hugo) feel easy but depend on the template engine and do not preview at all.

**How to avoid:**
- Build on an established container syntax: `:::name` fenced containers (markdown-it-container, remark-directive, or Hugo shortcodes) with an explicit closing fence, rather than an ad-hoc regex.
- Keep blocks flat: one level only. Document "no nesting" and make the parser throw a clear build error with the file and line when a fence is unclosed or nested.
- Make the source degrade readably in plain preview: for example a grid is a fenced container wrapping ordinary image lines, so the preview still shows the images stacked vertically.
- Do not require HTML-in-markdown for core features. Allow raw HTML as a fallback only, and always leave blank lines around it.
- Keep a fixture page that exercises every block, nested edge case and an empty block, and snapshot test it.
- Prefer a different marker than backticks if code blocks must also work inside blocks (`:::` and `~~~` do not clash with triple backtick code).

**Warning signs:**
A page that ends abruptly after one block. Literal `:::` showing up in the output. Preview and build disagree about whether text is a heading.

**Phase to address:**
Layout block phase (syntax spec and error messages before building more layouts). Add fixture tests in the same phase.

---

### Pitfall 7: Missing width/height on images causes layout shift; lazy-loading the wrong images

**What goes wrong:**
- Without intrinsic `width` and `height` attributes (or CSS `aspect-ratio`), the browser cannot reserve space. Grids jump as images load, and the Cumulative Layout Shift (CLS) score suffers.
- `loading="lazy"` applied to every image delays the above-the-fold hero and the Largest Contentful Paint (LCP). Lazy-loaded images in a gallery with no dimensions collapse to 0 height, so everything loads at once.

**Why it happens:**
Authors write plain `![alt](path)`, which has no dimensions, and the template adds `loading="lazy"` globally.

**How to avoid:**
- The image transform reads the real dimensions from the processed file and writes `width`/`height` on every `<img>`. CSS: `img { max-width: 100%; height: auto; }` so the attributes act as an aspect-ratio hint.
- Use `sizes` that match the actual layout of each block (a 3-column grid needs a different `sizes` than a full-bleed image). A wrong `sizes` makes the browser download the largest candidate, which wastes bandwidth.
- The first image on a page, and any full-width hero, get `fetchpriority="high"` and no `loading="lazy"`. All others get `loading="lazy"` and `decoding="async"`. Make this a rule in the transform (first image, or an explicit `eager` flag).
- Do not inline LQIP or blur-up JavaScript. It conflicts with the no-JS constraint.

**Warning signs:**
Lighthouse CLS above 0.1. Images popping in and pushing text. The hero being the last thing to load. DevTools shows downloaded image widths far greater than displayed.

**Phase to address:**
Image pipeline phase. Verify with Lighthouse on a long gallery page.

---

### Pitfall 8: Huge or unsupported inputs from the paste plugin (HEIC, giant PNG, animated GIF)

**What goes wrong:**
- Pasted macOS screenshots are large PNGs (Retina, 5-15 MB). Photos from a phone may be HEIC, which `sharp` handles only if libvips was built with HEIF support (prebuilt `sharp` binaries often lack HEVC-based HEIC decoding, for patent reasons; verify). The build then crashes on one file.
- A giant source (for example 12000px) makes the process run out of memory in CI.
- Animated GIFs get flattened to one frame by the resize step. GIF output as source is also very large.
- EXIF orientation is ignored, so phone photos appear rotated. The resize step may also leak GPS data from EXIF into published files.

**Why it happens:**
The pipeline is designed for the happy path of JPEG and PNG, but the paste tool saves whatever the clipboard contains.

**How to avoid:**
- Pin the allowed input formats and fail with a clear message on others. Convert HEIC to JPEG once, locally, at authoring time (macOS `sips`, or a small script) rather than in CI.
- Set a pixel-limit guard (`limitInputPixels`) and the size guard from Pitfall 1.
- Always auto-orient (`rotate()` with no arguments in sharp) and strip metadata on output.
- Handle GIF and animated WebP explicitly: either copy them unprocessed (with a size cap) or convert to short MP4/WebM with `<video muted loop playsinline>`.
- Check the paste plugin's settings: some can save as JPEG, or resize on paste.
- SVG: pass through unprocessed, but give it dimensions and `alt` text.

**Warning signs:**
CI crashes on a single file. Rotated photos. 20 MB assets in a PR. Animated GIFs that do not move.

**Phase to address:**
Phase 1 (plugin settings and allowed formats), image pipeline phase (guards and fallbacks).

---

### Pitfall 9: Lightbox accessibility failures (the `<dialog>` trap)

**What goes wrong:**
- Opening a modal `<dialog>` by `showModal()` gives native focus handling, Escape to close and an inert background. A non-modal `show()`, or a custom `div` overlay, does not. Common failures are focus not returning to the trigger on close, no visible close button, and Escape not working.
- Each lightbox image trigger is an `<img>` with a click handler. That is not keyboard reachable. It must be an `<a href="full.jpg">` (which also provides a no-JS fallback) or a `<button>`.
- Reusing the thumbnail's `alt` in a duplicated full-size `<img>` makes screen readers read it twice. Empty `alt=""` on informative images hides content.
- Clicking the backdrop to close is not keyboard accessible, so it must not be the only way to close.
- Next/previous arrows add focus and key-handling complexity; each addition costs accessibility and JS.
- `<dialog>` `showModal()` requires JS. Without JS, the link must still open the full image.

**Why it happens:**
Lightboxes are written as an enhancement of the visual experience, with keyboard behaviour tested last or never.

**How to avoid:**
- Progressive enhancement: base layer is `<a href="/img/full.jpg"><img ...></a>`, which works with no JS and for keyboard users. A small script (about 30 lines) upgrades it to `dialog.showModal()` and wires up close.
- Verify: Tab reaches the trigger, Enter opens, focus moves into the dialog, Escape closes, focus returns to the trigger, there is a labelled close `<button>`, and the dialog has `aria-label` or a heading.
- Use `::backdrop` styling only. Do not trap focus manually, because the native modal already does it.
- Consider skipping the lightbox entirely for v1 and linking to the full image. This is accessible by default and matches the project's "plain link to file" option.
- Provide the full-size image in a widely sized variant (not the 40 MB original) to avoid mobile data blow-ups.

**Warning signs:**
Cannot operate the gallery with the keyboard alone. Focus lands on the page body after close. A screen reader announces nothing on open.

**Phase to address:**
Lightbox phase. Include a manual keyboard and screen-reader pass (VoiceOver on macOS) in the acceptance criteria.

---

### Pitfall 10: Alt text neglected or generated badly in image-heavy pages

**What goes wrong:**
Pasted images arrive with empty alt (`![](path)`) or the filename as alt (`![proj-20261028-1](...)`). A screen reader then reads out filenames or nothing. In a 30-image gallery, repeating identical alt text is noise. Decorative images without `alt=""` are announced as "image" plus the filename.

**Why it happens:**
The paste plugin inserts empty alt text, and writing alt text breaks the typing flow.

**How to avoid:**
- Make the build warn (and in CI, fail on a flag or threshold) for images with empty alt that were not explicitly marked decorative. Give decorative a deliberate syntax, for example `![](x.png)` versus `![-](x.png)` documented in the spec, or an explicit `decorative` flag.
- Reject alt text that looks like a filename or matches the asset name pattern.
- Support captions (`<figure>/<figcaption>`) and treat the caption as the visible description, with alt describing the content, not duplicating the caption.
- Give guidance in the README: describe what the image shows and why it matters to the project, aim for under about 125 characters, and skip "image of".

**Warning signs:**
The build output contains `alt=""` on a content image, or `alt` matching `/\.(png|jpe?g|webp)$/`.

**Phase to address:**
Layout blocks and image pipeline phases (lint at build), final accessibility audit phase.

---

### Pitfall 11: itch.io (and YouTube/Vimeo) iframe gotchas

**What goes wrong:**
- itch.io's embed is an `<iframe>` pointing at `itch.io/embed-upload/ID?color=...` (for HTML5 games) or the widget (`https://itch.io/embed/ID`) for a store card. Fixed `width`/`height` attributes overflow on mobile, and an unconstrained responsive wrapper gives the wrong aspect ratio. Games need their own size and often a fullscreen button.
- Missing `title` on the iframe means screen readers announce an unnamed frame (a WCAG failure).
- A game that autoplays, captures keyboard focus or traps arrow keys/space makes page scrolling and keyboard navigation unusable (a keyboard trap). Also, the game audio can start without user control.
- Games need `allow="fullscreen; autoplay; gamepad"` style permissions set deliberately, and some require `allowfullscreen`. Check the itch.io embed docs for the current snippet.
- Many iframes on one page load many heavy third parties at once, and third-party iframes include trackers (YouTube sets cookies unless `youtube-nocookie.com` is used).
- Loading eagerly pulls hundreds of KB per embed and ruins LCP.
- An embed may be blocked by a Content Security Policy if you add one. GitHub Pages cannot set headers, so use a `<meta>` CSP carefully or not at all.
- Some itch.io games only embed if the developer enables "embed in page" and sets a viewport size. This is a game-page setting, not a site setting.

**Why it happens:**
Authors paste the vendor snippet verbatim, designed for a generic page.

**How to avoid:**
- Wrap every embed in a transform or shortcode (for example `:::game <url>`) that outputs a titled, lazy-loaded, aspect-ratio-controlled iframe: `loading="lazy"`, a `title` from the block's text, `aspect-ratio` in CSS, and `max-width:100%`.
- Click-to-load facade without JS: use a static poster image plus a plain link "Play on itch.io" as the baseline. The iframe loads only on demand, or just link out for v1. The link must always be present as a fallback.
- Put a visible "Skip embed" or a link to the itch.io page before the frame, and place text after it so keyboard users do not get stuck at the end of the page.
- Use `youtube-nocookie.com` for YouTube.
- Test with the real game embed on a phone and with the keyboard.

**Warning signs:**
Horizontal scroll on mobile. Axe reports "frame-title". Pressing Tab inside the game cannot get out. Pages with an embed score badly on Lighthouse.

**Phase to address:**
Embeds phase. Treat the accessible wrapper as a requirement of that phase, not a polish item.

---

### Pitfall 12: Autoplay video and ignoring reduced motion

**What goes wrong:**
Self-hosted `<video autoplay loop>` as looping background loops violates WCAG 2.2.2 (pause, stop, hide for motion over 5 seconds) without controls. Large MP4s hit the 100 MB per-file limit or the 1 GB site cap. GIFs as video. Autoplay is silently blocked unless the video is `muted` and `playsinline`, which then produces a "broken" poster on iOS.

**Why it happens:**
Portfolios for visual work love looping clips, and the brutalist "no animation" rule is easy to forget for media.

**How to avoid:**
- Default to `<video controls preload="metadata" poster=...>` with no autoplay. Looping silent clips (GIF replacement) are allowed only with a pause control, or under `@media (prefers-reduced-motion: no-preference)` set via a `<picture>`/JS-free approach (use a poster image under reduced motion).
- Cap clip length and file size (for example 10 MB, enforced by the size guard). Prefer YouTube/Vimeo for anything longer than about 30 seconds. Offer captions (`<track>`) when there is speech.
- CSS: add a global `@media (prefers-reduced-motion: reduce)` reset anyway (no `scroll-behavior: smooth`, no transitions). The project forbids these in any case, so keep the rule as a regression guard.

**Warning signs:**
Video starts on page load. Per-file size warnings. Video files over 25 MB in `assets/`.

**Phase to address:**
Video phase.

---

### Pitfall 13: Brutalist design that fails readability and usability

**What goes wrong:**
- Raw default styling treated as "done": body text at full container width (150+ characters per line), tiny type, and cramped tap targets.
- Low-contrast "aesthetic" greys, or high-saturation pairings that vibrate. Contrast below 4.5:1 for text and 3:1 for UI components and focus rings fails WCAG AA.
- Removed focus outlines (`outline: none`) for the sake of the look. Links only distinguishable by colour. Unlabelled link-only navigation.
- Gallery grids using fixed `px` columns that overflow below 400px, or `100vw` full-bleed images that cause a horizontal scrollbar (`100vw` includes the scrollbar width on desktop).
- A weak heading hierarchy (headings chosen for size, not structure) and a missing `<main>`, skip link and `lang` attribute.
- Zoom problems: text in `px` with fixed-height containers clips at 200% zoom (WCAG 1.4.4, reflow 1.4.10 at 320 CSS px).

**Why it happens:**
"Brutalist" gets read as "no CSS effort". It actually needs deliberate typographic discipline, because there is nothing else to carry the design.

**How to avoid:**
- Set a small design baseline early: `max-width: 65-75ch` for text, `font-size` of at least 1rem, `line-height` of 1.4-1.6, relative units, a contrast-checked palette (document the pairs and their ratios), and visible `:focus-visible` outlines at 3px or more.
- Full-bleed images: use the grid or `width:100%` of the container approach, or `100dvw` with `overflow-x: clip` carefully, and test with a visible scrollbar.
- Use CSS grid with `repeat(auto-fit, minmax(min(100%, 16rem), 1fr))` so gallery columns collapse without media queries and without overflow.
- Run axe or Lighthouse accessibility and a 320px and 200% zoom pass as part of the done criteria.
- Underline links. Do not rely on colour alone.

**Warning signs:**
Horizontal scrollbar at 320px. Lighthouse contrast warnings. Tab shows no visible focus. Text lines too long on a wide monitor.

**Phase to address:**
Design/CSS phase (baseline tokens), final accessibility audit phase.

---

### Pitfall 14: Site size and bandwidth creeping toward GitHub Pages limits

**What goes wrong:**
The published site (all processed variants) approaches the 1 GB limit (verify), and the soft bandwidth of about 100 GB/month and 10 builds per hour can throttle. Multiple formats times multiple widths times hundreds of images multiplies fast: 300 images times 3 widths times 2 formats is 1,800 files. Also, the lightbox "full-size" link can publish the original, defeating resizing.

**Why it happens:**
No one measures the output directory, and the "original" is copied to the site for the lightbox link.

**How to avoid:**
- Add a CI step that prints `du -sh _site` and fails above a budget (for example 500 MB). Publish a capped "large" variant (for example 2400px) and not the untouched master.
- Only publish formats in use. Avoid duplicating the same image at similar widths.
- Set cache headers? Not possible on Pages (fixed 10 minute cache). Hash filenames anyway, so the CDN and browser never serve stale variants.
- If growth continues, move to Cloudflare Pages or Netlify (the project allows "or similar"), which have higher limits. Keep the build host-agnostic (a configurable base path) so migration is cheap.

**Warning signs:**
`_site` over 300 MB. Deploy time over 5 minutes. Pages deployment errors ("artifact too large").

**Phase to address:**
Deploy/CI phase (budget check), image pipeline phase (variant policy).

---

### Pitfall 15: Tag feed and curated homepage drift

**What goes wrong:**
Tags are free-typed, so `UX`, `ux` and `ux-design` become three tag pages. The tag page URLs change when a tag is renamed, and old links 404. The student work page leaks into the feed because it lacks a feed exclusion flag. Featured-project order lives in a place that is easy to forget to update, and a deleted project stays referenced on the homepage and silently renders nothing.

**How to avoid:**
Slugify and lowercase tags in one place. Optionally keep an allow-list of tags and warn on unknown tags. Store homepage order in one explicit data file and fail the build if an entry does not resolve. Use an explicit `feed: false` front-matter field for student work and standalone pages, not a path convention. Fail the build on duplicate slugs.

**Warning signs:**
Tag index lists near-duplicates. A featured project is missing without error.

**Phase to address:**
Content model and feed phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Commit full-res masters to git | No second storage system | Permanent repo bloat; clones slow; cannot undo without a history rewrite | Only with a hard per-file cap (about 10 MB) and a compact total |
| Git LFS for site images | Avoids bloat warnings | Pointer files on Pages; quota exhaustion; extra CI config | Never for published images |
| No image cache in CI | Simple workflow | Builds scale with image count | Only for the first handful of pages |
| Hand-rolled regex for block syntax | Quick to write | Breaks on nesting, indentation, code fences | Never; use an established container or directive plugin |
| Global `loading="lazy"` | One-line change | Slow LCP on the hero | Never; exempt the first image |
| Pasting vendor iframe snippets | Fast | No title, no lazy loading, overflow on mobile | Never; wrap in a shortcode or transform |
| Root-absolute paths hardcoded in templates | Works on localhost | Breaks under a project-site prefix | Only if the site is on a root domain and that is guaranteed |
| Skipping alt text lint | Faster writing | Inaccessible content; hard to audit 100s of images later | Never; make it a warning at minimum |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub Pages (Actions deploy) | Setting Pages source to "branch" while also deploying with Actions; or forgetting `.nojekyll` when publishing from a branch | Use the Actions artifact flow (`upload-pages-artifact`, `deploy-pages`) and set Source to "GitHub Actions" |
| GitHub Pages project site | Root-absolute URLs ignore `/repo/` prefix | Configure the SSG's base/pathPrefix and pass all URLs through its URL helper; or use a custom domain |
| Custom domain | `CNAME` file wiped on each deploy | Keep `CNAME` in the static passthrough folder or set the domain in repo settings (Actions flow) |
| actions/checkout | Shallow fetch loses dates used for "last modified" or sort | Use `fetch-depth: 0` only if the site needs git dates; otherwise use front-matter dates |
| VS Code paste-image plugin | Default save path or prefix does not match the build's assumptions | Set the plugin's folder, filename pattern and the link-path format explicitly in `.vscode/settings.json` and commit it |
| itch.io | Pasting the embed with a fixed size and no title | Wrapper with `title`, aspect-ratio, lazy load and a fallback link |
| YouTube/Vimeo | Default embed domain sets tracking cookies and pulls heavy scripts | `youtube-nocookie.com`, `loading="lazy"`, text link fallback |
| sharp/libvips in CI | Local Mac build works, Linux CI lacks a codec (HEIC, AVIF settings) | Use the same Node and sharp version locally and in CI, pin versions, and convert unusual inputs at authoring time |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Uncached image processing | CI time grows with image count | Persistent hash-keyed cache restored via `actions/cache` | Around 100-200 images, or with AVIF around 50 |
| Too many output variants | Huge `_site`; long deploys | 3 widths, 2 formats, only referenced images | Around 500+ images |
| Wrong `sizes` attribute | Phone downloads desktop-sized images | Per-layout `sizes` generated by the block type | Any gallery |
| All images eager or all lazy | Slow LCP, or layout collapse | First image eager and high priority; the rest lazy with dimensions | Any page |
| Large autoplaying video or GIF | Slow page, battery drain | Controls, poster, size cap, or link to YouTube | Any page with more than 1 clip |
| Many iframes per page | Slow load and tracking | Lazy-load, link-out facade, limit one embed per section | More than 2 embeds per page |
| Full-size lightbox targets the original | Mobile downloads 10+ MB | Link to a capped 2400px variant | Any large source |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Leaving EXIF/GPS metadata in published photos | Location and device privacy leak | Strip metadata on output (sharp does this by default unless `withMetadata` is used; verify) |
| Raw HTML allowed in markdown from the author only | Low risk (single trusted author); risk appears if contributions are ever accepted | Fine for v1; document it |
| Third-party iframes without `sandbox` or `referrerpolicy` | Tracking and unexpected capabilities | Use `referrerpolicy="no-referrer"` where the embed works with it; do not sandbox itch.io games blindly, test first (games often need `allow-scripts allow-same-origin`) |
| Committing private files (student PDFs with personal data, drafts) | Public exposure, since the repo and site are public | Review the PDFs for student names and grades before commit; keep drafts in an ignored folder |
| Secrets or tokens in the repo | Credential leak | None expected; no backend. Do not add analytics keys casually |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Gallery with 40 images and no structure | Endless scroll, no sense of the project | Group with headings and text between blocks; cap a grid at a reasonable count |
| Lightbox is the only way to see detail, and it needs JS | Fails without JS | The link to the full image works without JS |
| Tag page with no explanation or count | Dead ends | Show title, count and a link back to the all-projects view |
| No visible "current page" in navigation | Lost users | `aria-current="page"` and a visible style |
| Student PDFs with generic file names and no size or type shown | Surprise downloads | Link text with title, "(PDF, 2.1 MB)" |
| Embed with no text alternative | Users who cannot play the game get nothing | Give a description, screenshots and an itch.io link beside the embed |
| Missing page `<title>`, description and social image | Poor shares and search results | Per-page front-matter with defaults |
| 404 page absent | Broken links go to the Pages default | Add `404.html` |

## "Looks Done But Isn't" Checklist

- [ ] **Image pipeline:** Often missing `width`/`height`, correct `sizes` and orientation fix. Verify via Lighthouse CLS and a rotated phone photo.
- [ ] **Deployed paths:** Works on localhost but not under the Pages prefix. Verify by running a link checker against the live URL.
- [ ] **Case sensitivity:** Passes on macOS, fails on Linux CI. Verify the CI build is the gate.
- [ ] **Layout blocks:** Works on the happy path only. Verify with unclosed, nested, empty and indented fixtures.
- [ ] **Lightbox:** Works with the mouse. Verify keyboard open, Escape, focus return and no-JS behaviour.
- [ ] **Alt text:** Present but is a filename. Verify the lint.
- [ ] **Embeds:** Show on desktop. Verify iframe `title`, mobile width, keyboard escape and the fallback link.
- [ ] **Video:** Plays. Verify no autoplay, controls present, poster, size cap.
- [ ] **Reduced motion:** Verify with the OS setting enabled and with no CSS transitions at all.
- [ ] **CI cache:** Build is fast on a second run. Verify "cache hit" and wall-clock time after a no-op push.
- [ ] **Size budget:** Verify `du -sh _site` and the biggest file in `_site`.
- [ ] **Homepage and feed:** Verify the student page is excluded, tags are normalised, and featured entries resolve.
- [ ] **404 and CNAME:** Verify `404.html` is published and the custom domain survives a redeploy.
- [ ] **Contrast and zoom:** Verify at 320px width and 200% zoom, with visible focus.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Big files already in git history | HIGH | Use `git filter-repo` to strip them, force-push, and re-clone everywhere; GitHub may need a support request to purge cached views. Prevent instead |
| LFS pointer files deployed | MEDIUM | Enable `lfs: true` in checkout or migrate back out of LFS (`git lfs migrate export`) |
| Wrong base path | LOW | Set the prefix in config, rebuild, run the link checker |
| Block syntax needs redesign after many pages exist | HIGH | Write a codemod early; keep the number of syntax variants small; snapshot tests make migration safe |
| Missing alt on hundreds of images | MEDIUM-HIGH | Add the lint now and fix page by page; cannot be done automatically with quality |
| Site approaches 1 GB | MEDIUM | Drop variants, lower the max width, remove AVIF, or move host |
| CI cache poisoned or stale | LOW | Bump the cache key version prefix |

## Pitfall-to-Phase Mapping

Phase names are suggestions; map them onto the actual roadmap.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Repo bloat from originals | Foundation (repo and asset policy) | Size guard in pre-commit/CI; `.git` size tracked |
| 2. LFS misuse | Foundation | No `.gitattributes` LFS rules for published images; built images are real bytes |
| 3. Slow CI image processing | Image pipeline + CI | Second build with a warm cache finishes fast; test with 200+ images |
| 4. Path breakage (preview vs build vs base path) | Foundation + Deploy | Link checker passes against the real deployed prefix; missing image fails the build |
| 5. Shared assets collisions | Foundation + Image pipeline | Duplicate and case checks; orphan report |
| 6. Fragile block syntax | Layout blocks | Fixture page with edge cases passes snapshot tests; clear errors with file and line |
| 7. CLS and lazy-loading | Image pipeline | Lighthouse CLS under 0.1; first image eager |
| 8. HEIC/huge/animated inputs | Foundation (plugin settings) + Image pipeline | Fixture images of each type processed or rejected with a clear message |
| 9. Lightbox accessibility | Lightbox | Keyboard and VoiceOver checklist; works with JS disabled |
| 10. Alt text | Layout blocks + Image pipeline | Lint warns on empty or filename alt |
| 11. itch.io/iframe issues | Embeds | Axe frame-title passes; mobile 320px has no overflow; keyboard can leave the frame |
| 12. Autoplay and reduced motion | Video + Design/CSS | No autoplay in output; OS reduced-motion tested |
| 13. Brutalist readability | Design/CSS + Final audit | Contrast table; 320px and 200% zoom; visible focus |
| 14. Site size and bandwidth | Deploy/CI | `_site` size budget step in CI |
| 15. Tag and homepage drift | Content model/feed | Build fails on unresolved featured entries; tags normalised |

## Sources

- GitHub Docs, "About large files on GitHub" and "Repository limits" (50 MB warning, 100 MB block, repo size recommendations): https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github (not re-fetched this session; numbers marked verify) - MEDIUM
- GitHub Docs, "GitHub Pages limits" (1 GB published site, 100 GB/month soft bandwidth, 10 builds/hour soft, 10 minute deploy timeout): https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits - MEDIUM
- GitHub Docs, "About Git LFS" and billing (free quota; Pages does not serve LFS objects without checkout config): https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage - MEDIUM
- Eleventy image plugin docs (disk cache, `urlPath`, `widths`, `sizes`) and Eleventy `pathPrefix` docs: https://www.11ty.dev/docs/plugins/image/ - MEDIUM, from prior knowledge
- web.dev guidance on CLS, `fetchpriority`, lazy-loading above-the-fold images: https://web.dev/articles/cls , https://web.dev/articles/optimize-lcp - HIGH (stable, well known)
- WCAG 2.2: 1.1.1 Non-text Content, 1.4.3 Contrast, 1.4.10 Reflow, 2.1.2 No Keyboard Trap, 2.2.2 Pause/Stop/Hide, 2.4.7 Focus Visible, 4.1.2 (iframe title): https://www.w3.org/TR/WCAG22/ - HIGH
- MDN `<dialog>`, `HTMLDialogElement.showModal()`, `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog - HIGH
- CommonMark spec on HTML blocks and indented code: https://spec.commonmark.org/ - HIGH
- itch.io creator docs, "Embedding HTML5 games" (iframe snippet, fullscreen settings): https://itch.io/docs/creators/html5 - LOW-MEDIUM (check the current snippet during the embeds phase)
- sharp docs on HEIF support, `rotate()`, `limitInputPixels`, metadata: https://sharp.pixelplumbing.com/ - MEDIUM; HEIC decoding support in prebuilt binaries needs verifying in the chosen environment

---
*Pitfalls research for: markdown-authored image-heavy static portfolio on GitHub Pages*
*Researched: 2026-10-28*
