# Feature Landscape

**Domain:** Hand-built, brutalist/indie-web portfolio for a multidisciplinary creative (graphic, UX, art, games, teaching)
**Researched:** 2026-10-28
**Overall confidence:** MEDIUM. Feature landscape rests on knowledge of the genre (hand-built portfolios, Eleventy/Hugo/Astro portfolio conventions, web platform features). No live web verification was done in this pass. Browser-support claims for newer platform features (invoker commands, popover) are flagged and must be verified against MDN/caniuse before committing.

## Table Stakes

"v1" = POC where the system works (write md, push, live, layouts work). Items marked **v1** are required for that. Items marked **v1.x** are expected on a real portfolio but can follow once the pipeline works.

| Feature | Why Expected | Complexity | Phase | Notes |
|---------|--------------|------------|-------|-------|
| Project page from one `.md` file with front matter | Core value of the project | Low | v1 | Front matter: title, date/year, tags, cover, summary, role, client, tools, featured order |
| Project metadata block (year, role, client, tools) | Standard for design/UX portfolios; recruiters scan for it | Low | v1 | Render as semantic `<dl>`. All fields optional, omit when empty. Keep as front matter, not body |
| Shared `assets/` image resolution | Stated authoring constraint | Med | v1 | Pipeline must resolve `![](assets/prefix_name.png)` from any page location. Breaks easily with relative paths, so decide the resolution rule early |
| Build-time responsive images (srcset, AVIF/WebP, width/height) | Image-heavy work; hosting limits; layout shift | Med | v1 | Highest-risk v1 item. Originals stay as source, outputs are generated. Need a cache so builds stay fast |
| Alt text for every image | Accessibility requirement | Low | v1 | Markdown `![alt]` is the source. Build should warn on empty alt unless explicitly decorative |
| Gallery block: grid of 2 / 3 / 4 columns | Central to image-heavy work | Med | v1 | CSS grid, collapses to 1-2 cols on narrow screens without JS. Provide 2, 3 and 4 as named variants |
| Full-bleed / full-width image block | Central to the work | Low | v1 | Edge-to-edge using CSS only, within a constrained text column |
| Captions on images | Credit/context; accessible via `<figure>/<figcaption>` | Low | v1 | Taken from markdown title or text after image |
| Mixed aspect ratios without cropping | Art/graphic work cannot be cropped | Med | v1 | Use intrinsic width/height, `align-items: start`, no forced `object-fit: cover` by default. Optional "uniform crop" variant later |
| Tag taxonomy plus tag pages | Stated: one feed, browse by tag | Med | v1 | One generated page per tag with the feed filtered. Tag list on feed page. Plain links, no JS filter |
| Single project feed (index) | Stated | Low | v1 | Thumbnail, title, year, tags. Sorted by date descending |
| Curated, hand-ordered homepage | Stated | Low | v1 | Use an explicit `featured: N` order field, or a homepage data list of slugs. Do not rely on date |
| Standalone pages (About / CV) | Stated | Low | v1 | Same md pipeline, no tags. CV as text plus optional PDF link |
| Responsive layout, pure CSS | Stated | Low-Med | v1 | One breakpoint-light approach (fluid grid, `clamp`, container width) |
| Semantic HTML, skip link, visible focus, contrast, reduced-motion respect | Stated accessibility requirement | Low | v1 | Cheap now, expensive to retrofit |
| Self-hosted `<video>` | Motion/UX/game capture is common | Low | v1 | `controls`, `preload="metadata"`, `poster`, `playsinline`, captions `<track>` if speech. Watch the 100 MB/file and 1 GB site caps |
| YouTube/Vimeo embed | Stated | Low-Med | v1 | Lazy iframe minimum. See facade note under Differentiators |
| itch.io game embed | Stated | Low | v1 | Iframe from the itch.io "Embed" panel, `loading="lazy"`, `allowfullscreen`, fixed aspect ratio box. Alternatively the itch.io widget (card with link) as a fallback block. Include a visible "open on itch.io" link |
| Image lightbox with native elements | Stated; viewing full-size art is expected | Med | v1 | Fallback baseline: every image is a plain `<a href=original>` (works with no JS). Enhancement: `<dialog>` (see Notes) |
| Next / previous project navigation | Keeps visitors browsing; trivial with SSG collections | Low | v1.x | Order within the full feed (or within current tag, later). Plain links at page foot |
| Open Graph / Twitter card tags with per-page image | Links get shared in Discord, Bluesky, Slack, email | Low-Med | v1.x | Needs page title, description, and absolute image URL (1200x630 ideal). Cover image from front matter, generated via same image pipeline. Site base URL must be configured |
| `sitemap.xml` and `robots.txt` | Basic discoverability | Low | v1.x | Generated from collections. Exclude 404 |
| Custom `404.html` | GitHub Pages serves root `404.html` automatically | Low | v1 | Cheap, include in POC; link home and feed |
| Student-work / teaching page with PDF downloads | Stated | Low | v1 | Standalone page, hand-written links. PDFs pass through unchanged. Show file size and type in link text ("Syllabus, PDF, 1.2 MB") |
| Favicon, `<title>`, meta description, `lang` | Hygiene | Low | v1 | |
| Draft / unpublished flag | Lets owner push WIP safely | Low | v1.x | `draft: true` excluded from collections in production |

## Differentiators

Not required, but valued; most are cheap and fit the brutalist ethos.

| Feature | Value Proposition | Complexity | Phase | Notes |
|---------|-------------------|------------|-------|-------|
| Side-by-side text + image block | Editorial layouts, case-study feel | Med | v1.x | Two-column block, stacks on narrow. Image left/right variant. Needs shorthand syntax |
| Lite video facades (thumbnail + click-to-load) | Avoids YouTube/Vimeo JS weight and tracking until clicked | Med | v1.x | Options: (a) `youtube-nocookie.com` iframe with `loading="lazy"`, zero extra code (simplest); (b) a link-wrapped thumbnail that opens the video page (no JS); (c) a tiny facade script or `lite-youtube-embed`. Recommend (a) for v1, (b)/(c) later. Vimeo thumbnails require an API/oEmbed lookup, so author a poster image manually |
| Click-to-play itch.io facade | Avoids loading heavy game iframes on page load | Low-Med | v1.x | Poster image plus a `<details>` or button that injects the iframe. itch.io embeds can autoload audio/WebGL, so a facade is a real perf win |
| Lightbox gallery navigation (prev/next within a gallery) | Better browsing of large galleries | Med | later | Native approach gets costly. Keep v1 to single-image view |
| Per-gallery layout shorthand with consistent syntax | The project's core value | Med-High | v1 | Not a "feature" users see but the main design task: fenced containers (`::: grid-3`) or shortcodes. Research flag for STACK/ARCHITECTURE |
| Tag-scoped next/prev | Browse a discipline continuously | Low | later | |
| "Related projects" by shared tags | Cross-discipline discovery | Low-Med | later | |
| Plain-text accessible tag filter page ("all tags" index with counts) | Lets visitors see range of practice | Low | v1.x | Same data as tag pages |
| Per-project accent / color override via front matter | Individual projects feel distinct inside a brutalist frame | Low | later | Single CSS custom property |
| Print stylesheet for CV | Common ask for CV pages | Low | later | |
| RSS/Atom feed of projects | Indie-web convention | Low | later | Explicitly out of scope for v1 |
| Excludable "student" tag / richer student index | Stated as future | Med | later | |
| Blog / notes section | Replaces Neocities blog | Med | later | Out of scope v1, reuse same collection machinery |
| Dark mode via `prefers-color-scheme` | Low-cost CSS | Low | later | Out of scope v1 |
| Image LQIP / dominant-color placeholders | Polish | Med | later | Conflicts a little with minimalism; skip |
| Built-in link/asset checker at build | Catches broken `assets/` references early | Low-Med | v1.x | High value for this workflow, since the single shared folder plus prefixes is fragile |

## Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| CMS / admin UI | The bloat being escaped | Markdown in VS Code |
| JS lightbox libraries (PhotoSwipe, GLightbox, lightGallery, Fancybox) | Heavy JS, animation, contradicts brief | Plain link to original, enhanced by native `<dialog>` or popover |
| Smooth scroll, fade-ins, parallax, scroll-jacking, hover-zoom animations | Brief + accessibility (vestibular) | None; respect `prefers-reduced-motion` anyway |
| Client-side JS filtering/search of feed | JS dependency; tag pages already cover it | Static tag pages |
| Infinite scroll / "load more" | Accessibility, broken back-button, no footer access | Single long page, or simple pagination if the feed grows |
| Masonry via JS | Layout JS forbidden | CSS grid; CSS columns for simple masonry-like flow if wanted (note reading order issues) |
| Autoplay video / autoplay itch.io game with sound | Accessibility, bandwidth, annoyance | Poster plus click to play. Muted looping short clips only if deliberate, with `controls` or pause |
| Self-hosted game builds | Repo size and Pages limits | itch.io embeds |
| Cookie banners / analytics trackers / social share widgets | Bloat, privacy; third-party embeds are the only tracking vector | `youtube-nocookie`; consider cookieless analytics (Plausible/GoatCounter) only later if wanted |
| Contact form with backend | Needs a service | `mailto:` link or links to elsewhere on About page |
| Squarespace import tooling | Owner rebuilds by hand | Out of scope |
| Comments, likes, newsletter signup | Not the purpose | Link out |
| Per-image hand-written `srcset` HTML | Defeats fast authoring | Pipeline generates it from plain markdown images |
| Heavy hero carousels on homepage | Accessibility, hurts the "hand-ordered" intent | Static ordered list/grid |

## Feature Dependencies

```
Shared assets/ resolution -> Image pipeline (responsive/AVIF) -> Gallery blocks (2/3/4, full-bleed, mixed ratio, side-by-side)
Image pipeline -> Captions/alt handling -> Lightbox (needs original/large variant URL)
Image pipeline -> OG preview images (cover image needs 1200x630 variant)
Layout shorthand syntax (markdown plugin/shortcodes) -> all Gallery blocks, Video block, itch.io block
Front matter schema (tags, year, role, client, tools, featured, cover) -> Project metadata block
                                                                      -> Tag pages & feed
                                                                      -> Homepage curation
                                                                      -> Next/prev nav
                                                                      -> OG tags
Tag collection -> Tag pages -> (later) tag-scoped next/prev, related projects
Site base URL config -> OG absolute URLs -> sitemap
Front matter `draft` -> excluded from feed, tags, sitemap, nav
Student page -> independent (no tag/feed dependency); excluded from feed by living outside the projects collection
```

## Notes on Specific Implementation Questions

- **Lightbox (confidence MEDIUM; verify browser support)**: Three tiers.
  1. *No JS*: wrap each image in `<a href="original.jpg">` (opens full image in the tab). Always the fallback, always works, fully accessible.
  2. *No JS, in-page*: the Popover API (`popover` attribute plus `popovertarget` button) opens a top-layer element with Esc and light-dismiss without scripting. Works for a per-image popover containing a large `<img>`. Costs one hidden element per image, so keep large images lazy (`loading="lazy"` on hidden img, or point to the original) to avoid downloading everything.
  3. *Dialog*: `<dialog>` with `showModal()` needs a few lines of JS, or newer invoker commands (`<button command="show-modal" commandfor="id">`), which I believe are now broadly available but this needs checking on MDN/caniuse. A ~15-line progressive-enhancement script that intercepts clicks on image links and opens a shared single `<dialog>` is a reasonable, honest compromise ("JS only where a native element can't do the job"). Recommended for v1: tier 1 as baseline plus tier 3 with the shared single dialog, `<form method="dialog">` close button, Esc built-in, focus return built-in, backdrop click to close.
  Avoid the CSS `:target` lightbox hack (changes URL/history, focus management is poor).
- **Video**: self-hosted needs MP4 (H.264) and optionally WebM; keep under 100 MB per file and count against the 1 GB site budget. Recommend heavy video go on YouTube/Vimeo, small loops self-hosted.
- **itch.io**: the "Embed game" iframe (html5 games) and the widget (`itch.io/embed/ID`, a store card) are two different things. Support both as two block types or one with a `mode`. Embeds need `allow="fullscreen; autoplay"` considerations and a fixed width/height from the itch.io settings. Verify exact snippet against itch.io docs during the phase.
- **OG images**: social platforms require absolute URLs and cache aggressively; JPEG/PNG preferred over AVIF/WebP for crawler compatibility. Generate a dedicated 1200x630 JPEG per project cover.
- **GitHub Pages**: `404.html` at root is served for missing paths; sitemap must use the final deployed base URL (project-site subpath vs custom domain affects every absolute and root-relative link). Decide domain/base path early.

## MVP Recommendation (v1 "system works" POC)

Prioritize:
1. md to project page with front matter and metadata `<dl>`, feed, tag pages, curated homepage, About, 404, student page (all low complexity, prove the content model).
2. Shared `assets/` resolution plus build-time responsive image pipeline with alt/width/height.
3. Layout shorthand: grid-2/3/4, full-bleed, figure with caption (mixed ratios uncropped).
4. Lightbox tier 1 (plain link) plus tier 3 shared `<dialog>` enhancement.
5. Video block (self-hosted `<video>` and lazy YouTube/Vimeo iframe) and itch.io iframe block.
6. Accessibility baseline (skip link, focus styles, reduced-motion, contrast).

Defer to v1.x immediately after: next/prev, OG tags and 1200x630 images, sitemap/robots, side-by-side text+image, click-to-load facades, draft flag, broken-asset checker, tag index with counts.

Defer to later: gallery lightbox navigation, related projects, tag-scoped nav, RSS, dark mode, blog, student index, print CSS.

## Sources

- Project context: /Users/dmccurley/Developer/portfolio-test/.planning/PROJECT.md (HIGH)
- Genre and platform knowledge (hand-built portfolios, Eleventy image plugin conventions, native dialog/popover, GitHub Pages 404 behavior, itch.io embed options): training knowledge, not re-verified this session (MEDIUM/LOW). Verify before requirements lock: MDN `<dialog>`, Popover API, invoker commands; itch.io "Embed" docs; Eleventy `eleventy-img` docs.
