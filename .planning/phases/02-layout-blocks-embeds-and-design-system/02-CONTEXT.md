# Phase 2: Layout Blocks, Embeds and Design System - Context

**Gathered:** 2026-10-29
**Status:** Ready for planning

<domain>
## Phase Boundary

The owner composes a rich project page by typing short `:::` block shorthand in a project `.md`. One page can freely mix image grids, full-bleed images, normal text, raw HTML, self-hosted video, YouTube/Vimeo embeds and playable itch.io games. All of it renders on an accessible, brutalist page styled with a small hand-written CSS system. The build also lints alt text.

In scope:
- Grid blocks (2/3/4 columns), full-bleed blocks and captions.
- A raw HTML fallback.
- Video blocks (self-hosted and YouTube/Vimeo) and itch.io blocks.
- The CSS design system (Chivo type, colour tokens, layout column, spacing).
- A skip link, focus styles, AA contrast and no animation.
- Alt-text warnings.

Not in scope:
- Lightbox, feed, tag pages, homepage curation and About/CV (Phase 3).
- Next/prev, OG/sitemap, drafts, the README and the 320px/200% zoom verification (Phase 4).
- Text + image side-by-side blocks (v2, BLOCK-07).
- Click-to-load facades (v2, POL-03).

Requirements: BLOCK-01, BLOCK-02, BLOCK-03, BLOCK-04, BLOCK-05, BLOCK-06, AUTH-04, MEDIA-01, MEDIA-02, MEDIA-03, A11Y-01, A11Y-03, A11Y-04.

</domain>

<decisions>
## Implementation Decisions

### Block syntax and captions
- **D-01:** Grids use one fence name per layout: `::: grid-2`, `::: grid-3`, `::: grid-4`, closed by `:::`. The content is plain pasted `![alt](path)` lines. — **Reversibility:** costly — every authored page uses this syntax, so renaming means find-and-replace across content.
- **D-02:** Captions use the standard markdown image title: `![alt](path "Caption text")`. An image with a title renders as `<figure><img alt="..."><figcaption>Caption text</figcaption></figure>`. This works the same inside grids, inside `::: full` and for lone images. Alt and caption stay separate. — **Reversibility:** costly — authored content depends on it.
- **D-03:** Full-width is `::: full` ... `:::`, and it means a true edge-to-edge bleed to the viewport edges. Several images in one `::: full` block stack vertically. There is no separate `wide` variant.
- **D-04:** Grids hold images only. The build fails, naming the file, when:
  - a grid or full block contains text or other non-image content;
  - a fence is unclosed;
  - a block name is unknown (e.g. `::: grid-5`, `::: ful`).

  This matches the Phase 1 strictness rule (Phase 1 D-23, PUB-04). Raw HTML outside blocks is still allowed (AUTH-04).
- **D-05:** Blocks are flat and do not nest. Images outside any block render in the text column; with a title they render as a `<figure>`.

### Embed shorthand
- **D-06:** YouTube and Vimeo use one fence with the pasted URL plus a required quoted title:
  ```
  ::: video https://youtu.be/abc123 "Tidepool trailer"
  :::
  ```
  The renderer recognises youtube.com, youtu.be and vimeo.com URLs. A missing title fails the build, because the title becomes the iframe's accessible `title`. The output is lazy-loaded (`loading="lazy"`), uses the privacy-friendly domains (`youtube-nocookie.com`; Vimeo with `dnt=1`) and has a fixed aspect ratio (16:9 default).
- **D-07:** Self-hosted video uses the same `::: video` fence with a path to a file in the shared root `assets/` folder:
  ```
  ::: video ../../assets/tidepool-game-loop.mp4 "Crab walk loop"
  :::
  ::: video ../../assets/tidepool-game-loop.mp4 "Crab walk loop" poster=../../assets/tidepool-game-crab.webp
  :::
  ```
  - The path is resolved by basename through the existing asset resolver, like images.
  - Only referenced video files are copied to the output. `assets/` is still never passthrough-copied wholesale (IMG-03).
  - It renders as `<video controls preload="metadata">` with no autoplay. `poster=` is optional.
  - The build fails if the video file is missing or over a size cap.
- **D-08:** itch.io is a playable iframe sized per game:
  ```
  ::: itch <embed-url> <W>x<H> "Title" <itch-page-url>
  :::
  ```
  It renders a responsive iframe locked to the given aspect ratio. The iframe is titled, lazy-loaded and allows fullscreen. Below it is a visible "Play on itch.io" link to the page URL. There is no click-to-load and no store-card widget mode. Missing args fail the build, naming the file.
- **D-09:** Embeds sit in the text column by default. Adding the keyword `full` to the fence line (e.g. `::: video full https://... "Title"`, `::: itch full ...`) makes the embed bleed edge to edge like `::: full`.

### Visual direction (design system)
- **D-10:** The typeface is **Chivo** (Google Fonts), loaded with a Google Fonts `<link>` (with `preconnect`, `display=swap`). The owner chose this over self-hosting. It uses the variable upright and italic styles (`ital,wght@0,100..900;1,100..900`), so any weight can be used without adding files. Provide a system sans fallback in the stack.
- **D-11:** Colour is black text on a white background plus one accent colour, used for links and focus outlines. The accent hex is undecided. Ship it as a single CSS custom property with a placeholder that passes WCAG AA (≥ 4.5:1 on white). The owner will set the final value in one place.
- **D-12:** Layout is **one wide column** with generous side margins that feel humane. Grids and embeds use the full column width, and `::: full` breaks out to the viewport edges. The text measure (paragraphs, headings) can be capped for readability, but it stays **left-aligned within the column**. There must be no narrow centred text column and no centred headings ("no centred tech-bro layout"). The look should be typographically sound and raw-HTML-adjacent.
- **D-13:** Spacing:
  - The grid gap is medium, about 1rem, roughly one body line.
  - Vertical space between blocks (paragraph → grid → full → text) comes from one spacing token, about 2× the grid gap.
  - Both are CSS custom properties.
- **D-14:** Grid rows are top-aligned. Images keep their own aspect ratios with no cropping (BLOCK-05). Shorter images leave space below them, and each caption sits directly under its image. There is no masonry and no CSS columns, so DOM reading order stays across-then-down.
- **D-15:** The CSS is plain, hand-written and token-driven (custom properties for colours, gap and block spacing). The owner is strong at CSS and will tune it later, so favour legibility and few rules over cleverness. There are no animations or transitions, no smooth scroll, and a reduced-motion guard (A11Y-01).

### Claude's Discretion
- **Alt-text lint (A11Y-04):** The owner left this to Claude. Defaults:
  - It warns rather than fails the build.
  - It flags:
    - empty alt that isn't marked decorative;
    - VS Code's paste placeholder `alt text` (present twice in `content/projects/tidepool-game.md` today);
    - filename-like alt (e.g. `IMG_1234`, `screenshot-2026-...`, anything ending in an image extension).
  - The decorative marker is up to the planner. Prefer something quick to type, e.g. a markdown-it-attrs `{decorative}` / `{.decorative}` or a fixed alt keyword, which emits `alt=""`.
  - Warnings name the file and the image path.
- Grid collapse breakpoints (BLOCK-06): grid-4 → 2 → 1 and grid-3 → 2/1 on narrow screens, using pure CSS (`auto-fit`/media or container queries).
- Per-block `sizes` for the image transform (e.g. grid-3 ≈ column/3, full = 100vw), building on `lib/images.js`.
- The self-hosted video size cap. The Phase 1 CI guard (`scripts/check-assets.js`) currently caps every `assets/` file at 10 MB. The planner decides on a video-specific cap (e.g. ~50 MB, well under GitHub Pages' 100 MB) and updates the guard and the shrink hook so `.mp4`/`.webm` are allowed but not "converted".
- Posters: no ffmpeg dependency is expected. Without a `poster=`, rely on `preload="metadata"`. The researcher should check iOS Safari first-frame behaviour (e.g. a `#t=0.001` trick).
- Type scale, heading weights, link underline style, how the site header looks, and how the existing title/date/`<dl>` meta block is styled.
- The skip link and focus outline style (accent colour, thick and visible).
- Exact markdown-it-container wiring and the module layout (e.g. `lib/blocks/*`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and requirements
- `.planning/PROJECT.md`: core value, constraints and Key Decisions
- `.planning/REQUIREMENTS.md`: requirement text for BLOCK-01..06, AUTH-04, MEDIA-01..03, A11Y-01, A11Y-03, A11Y-04
- `.planning/ROADMAP.md` § Phase 2: goal and five success criteria
- `CLAUDE.md`: stack (markdown-it-container ^4, markdown-it-attrs ^5) and "What NOT to use"

### Prior phase
- `.planning/phases/01-push-to-live-with-images/01-CONTEXT.md`: D-11 (relative links resolved by basename), D-23 (strict, file-named build errors), D-22 (CSS loads through the base-path helper)
- `.planning/phases/01-push-to-live-with-images/01-VERIFICATION.md`: what Phase 1 actually shipped

### Research
- `.planning/research/SUMMARY.md` § Phase 2: delivery list; flags to verify the current itch.io embed snippet and the per-block `sizes` convention
- `.planning/research/ARCHITECTURE.md`: block renderers (`lib/blocks/`), the breakout/named-line grid pattern, and HTML post-transform for images
- `.planning/research/FEATURES.md`: itch.io iframe vs widget notes, video hosting split
- `.planning/research/PITFALLS.md`: accessibility gaps in embeds and alt text

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/markdown.js` `installAssetResolver`: a markdown-it core rule that already walks image tokens, resolves them by basename, sets `eleventy:formats` per type, and marks the first image eager. Block-aware `sizes` and figure/caption output should extend or sit beside it.
- `lib/assets.js` `resolveAsset` / `refreshAssets`: the basename index of root `assets/`. Reuse it for video and poster paths.
- `lib/images.js` `imageOptions`: the global `sizes` `(min-width: 60em) 60em, 100vw`. This must change to match the new wide column, plus per-block overrides.
- `lib/validate.js`: the validation pattern, with errors that name the file. Add block, embed and alt checks in the same style.
- `src/_includes/base.njk`: the only layout. Add the skip link, the Google Fonts `<link>`, `<main id>` and header styling here.
- `content/style.css`: two lines today, passthrough-copied to `/style.css`. Replace it with the design system.

### Established Patterns
- ESM Eleventy config (`eleventy.config.js`) with `amendLibrary("md", ...)` for markdown plugins.
- Input is `content/`; includes and data are in `src/`. Tests use `node --test` in `test/` with a site-build helper (`test/helpers/site.js`).
- Content errors throw and name the `.md` file (`${page.inputPath}: ...`).

### Integration Points
- markdown-it-container and markdown-it-attrs are **not installed yet**. Add them to `package.json`.
- `scripts/check-assets.js` and `scripts/shrink.js` currently assume `assets/` holds images only (10 MB cap). They need to accept video.
- Reserved slugs in `lib/validate.js` may need updating if new output folders (e.g. `video/`) are added.

</code_context>

<specifics>
## Specific Ideas

- The owner's quote on layout: "everything in one column, should be pretty wide with enough side margins to feel humane. The text column width can be limited to improve readability but should be left aligned within the one column. Needs to feel typographically sound but still brutalist/raw html adjacent. I don't want the centered tech bro bs."
- Typeface: Chivo, with a couple of weights plus italics. The owner is happy to adjust CSS themselves later.
- The existing test page is `content/projects/tidepool-game.md`. It has two images with placeholder alt `alt text` and a GIF, which makes it a good fixture for grids, captions and alt lint.

</specifics>

<deferred>
## Deferred Ideas

None. The discussion stayed within the phase scope. Side-by-side text + image (BLOCK-07) and click-to-load facades (POL-03) were already v2.

</deferred>

---

*Phase: 02-layout-blocks-embeds-and-design-system*
*Context gathered: 2026-10-29*
