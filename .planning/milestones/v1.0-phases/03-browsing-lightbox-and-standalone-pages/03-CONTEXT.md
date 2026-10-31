# Phase 3: Browsing, Lightbox and Standalone Pages - Context

**Gathered:** 2026-10-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Visitors can:
- browse all work in a newest-first feed at `/work/`;
- filter it by tag on `/tags/<tag>/`;
- see a hand-ordered set of featured projects on the homepage;
- read a CV page and a Teaching (student-work) page;
- open any non-full-bleed content image full-size.

The full-size view is a plain link that works without JS, enhanced to a native `<dialog>`.

In scope:
- The `/work/` feed, tag pages, tag filter links and tags in the project meta block.
- A shared card partial and the featured data file on the homepage.
- Site header nav.
- `/cv/` and `/teaching/` pages.
- PDF links resolved from `assets/`.
- The lightbox.

Not in scope:
- An About page. The owner doesn't want one for now.
- Next/prev, OG/sitemap, drafts, the README and the 320px/200% zoom verification (Phase 4).
- Prev/next inside the lightbox (later).

Requirements: IMG-05, SITE-01, SITE-02, SITE-03, SITE-04, SITE-05.

</domain>

<decisions>
## Implementation Decisions

### Lightbox (IMG-05)
- **D-01:** Every content image links to a large version, except images inside `::: full` blocks. This covers images in grid-2/3/4 and lone images in the text column, with or without a caption.
  - Full-bleed images are not wrapped in a link.
  - Card covers link to their project page, not to the lightbox.
  - Video posters are not wrapped.
- **D-02:** The link target is the largest variant the pipeline already makes: the 2400px width, or the image's own size if it's smaller. No extra size is generated, and originals in `assets/` are never published (IMG-03).
- **D-03:** Without JS, the link opens the large file directly. With JS, one shared `<dialog>` shows:
  - the large image, with the same alt text;
  - the caption (from the markdown `"title"`), when there is one;
  - a labelled Close button.
- **D-04:** The dialog closes on Escape, the Close button, or a click on the backdrop. Focus returns to the link that opened it. There is no animation (A11Y-01). This is the only JS on the site. Keep it small and progressive, so the page works the same if the script fails.

### Feed and tags (SITE-01, SITE-02)
- **D-05:** The full feed lives at `/work/`, with every project newest first using the existing `projects` collection sort. Add `work` to `RESERVED_SLUGS`. — **Reversibility:** costly — a published URL, linked from the nav and possibly shared.
- **D-06:** Cards form a grid of cover images, about 3 across and collapsing on narrow screens, the same way grids do in Phase 2.
  - Each card shows the cover (`cover` + `cover_alt`), the title and the date exactly as written (Phase 1 D-07).
  - The whole card is one link to the project.
  - Tags don't appear on cards.
- **D-07:** One card partial is used by `/work/`, the tag pages and the homepage. Featured cards look the same as feed cards.
- **D-08:** A row of tag filter links sits at the top of `/work/` and of every tag page: All · <tag> · <tag> … The current one is marked with `aria-current="page"`. Tag pages live at `/tags/<tag>/` (Phase 1 D-05) and list that tag's projects newest first, using the same cards.
- **D-09:** A tag in the fixed list with no projects gets no page and no filter link.
- **D-10:** `src/_data/tags.js` changes from plain strings to slug + display label, e.g. `{ slug: "ux", label: "UX" }` or `graphic` → "Graphic design". URLs use the slug and the page shows the label. Tag validation (Phase 1 D-04) keeps working against the slugs.
- **D-11:** Project pages show a "Tags" row in the existing `<dl>` meta block. Each tag links to its tag page and uses its label.

### Homepage curation (SITE-03)
- **D-12:** Featured projects are an ordered list of project slugs in one data file, `src/_data/featured.js` or `.json`. Order in the file is order on the page.
  - The build fails, naming the data file and the slug, when a slug doesn't match a project (success criterion 2).
  - A duplicate slug also fails the build.
- **D-13:** The homepage (`content/index.md`) shows:
  - a short intro the owner writes as the markdown body of `index.md`;
  - the featured card grid;
  - a link to all work (`/work/`).

### Nav and standalone pages (SITE-04, SITE-05)
- **D-14:** The site header holds the owner's name, which links home, then **Work** (`/work/`), **CV** (`/cv/`) and **Teaching** (`/teaching/`). There is no About page. The current section is marked with `aria-current`.
- **D-15:** The CV is its own markdown page, `content/pages/cv.md` → `/cv/`. It's written freely in markdown and can link a PDF version using the PDF rule below.
- **D-16:** The Teaching / student-work page is `content/pages/teaching.md` → `/teaching/`. It's plain hand-written markdown: headings per course or term, plus lists of links and PDFs. Blocks still work. It lives in `pages/`, so it's never in the projects collection, the feed or the tag pages (SITE-05).
- **D-17:** PDFs live in the shared `assets/` folder and are linked with plain markdown, e.g. `[Syllabus](../../assets/syllabus.pdf)`. Any page can use this.
  - They resolve by basename through the existing asset resolver (Phase 1 D-11).
  - Only linked PDFs are published, never `assets/` wholesale.
  - A missing PDF fails the build, naming the `.md` file and the link (Phase 1 D-23).
  - The build adds the file type and size to the link text, e.g. "Syllabus (PDF, 1.2 MB)".

### Claude's Discretion
- How the owner's name in the header is stored. Prefer one value in a site data file. The header currently reads "Portfolio".
- A PDF size cap, and updating `scripts/check-assets.js` and `scripts/shrink.js` so PDFs are allowed in `assets/` and passed through unconverted. A PDF cap should sit well under GitHub Pages' 100 MB per file, like the 50 MB video cap in `lib/limits.js`.
- Animated GIFs in the lightbox. They should probably link to the GIF output itself so the animation survives.
- Whether the lightbox script is inline in `base.njk` or a small passthrough file loaded through the base-path helper. Use `showModal()` or invoker commands after checking browser support (research flag below).
- The dialog's sizing (fit to the viewport, no cropping) and its backdrop styling, within the Phase 2 tokens.
- The card grid's column count and breakpoints, the `sizes` value for card covers, and the card title and date typography.
- Eager vs lazy loading for the first row of cards.
- The homepage `<h1>` and the page titles for `/work/` and the tag pages.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and requirements
- `.planning/PROJECT.md`: core value, constraints and Key Decisions (one tagged feed + curated homepage)
- `.planning/REQUIREMENTS.md`: requirement text for IMG-05, SITE-01..05
- `.planning/ROADMAP.md` § Phase 3: goal and five success criteria
- `CLAUDE.md`: stack, plus "What NOT to use" (no lightbox libraries, no passthrough of `assets/`)

### Prior phases
- `.planning/phases/01-push-to-live-with-images/01-CONTEXT.md`: D-02 (root slugs + reserved paths), D-04 (fixed tag list), D-05 (`/tags/<tag>/`), D-06/D-07 (required front matter, date shown as written), D-11 (basename resolution), D-23 (strict, file-named errors)
- `.planning/phases/02-layout-blocks-embeds-and-design-system/02-CONTEXT.md`: D-02 (captions from the image title → figure/figcaption), D-03 (`::: full` bleed), D-12..D-15 (layout column, spacing tokens, grid behaviour, plain token-driven CSS, no animation)
- `.planning/phases/02-layout-blocks-embeds-and-design-system/02-UI-SPEC.md`: the design contract the cards, nav and dialog must follow

### Research
- `.planning/research/SUMMARY.md` § Phase 3: delivery list. Research flag: verify `<dialog>` and invoker-command browser support on MDN/caniuse before settling on the shared-dialog script.
- `.planning/research/FEATURES.md`: lightbox tiers (plain link baseline + shared `<dialog>`; avoid the `:target` hack), PDF link text with type and size, gallery navigation deferred
- `.planning/research/ARCHITECTURE.md`: collections (`projects`, `featured`, `byTag`, `tagList`), folder = type (pages are out of the feed)
- `.planning/research/PITFALLS.md`: pitfalls 9 and 15 (cited by SUMMARY for Phase 3)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `eleventy.config.js` already has a `projects` collection sorted newest first by the string date. Reuse it for `/work/`, tag pages and the featured lookup.
- `lib/markdown.js` `installAssetResolver` walks image tokens and knows when an image sits in a block. Use it to tag images inside `::: full` so they skip the lightbox link, and to wrap the others.
- `lib/images.js`: widths `[480, 960, 1600, 2400]`, formats webp+jpeg. 2400 is the lightbox target (D-02).
- `lib/assets.js` `resolveAsset`: basename lookup. Reuse it for PDF links (D-17).
- `lib/media.js` `copyMedia`: publishes only the videos a page references. Extend it, or copy its pattern, for PDFs.
- `lib/limits.js`: shared size caps for the renderer, CI guard and hook. Add a PDF cap here.
- `lib/validate.js`: `RESERVED_SLUGS` (add `work`), tag validation against `src/_data/tags.js`, and file-named errors. Add the featured-slug check here.
- `src/_includes/base.njk`: the only layout. Its header (`<a href="/">Portfolio</a>`) becomes the name + nav, and its `<dl>` meta block gains the Tags row.

### Established Patterns
- `content/projects/` vs `content/pages/` directory data sets layout and root permalinks. Folder = type, so the Teaching page stays out of the feed with no extra flag.
- Plain token-driven CSS in `content/style.css`. Tests use `node --test` with the `test/helpers/site.js` build helper. `test/contrast.test.js` enforces accent contrast.
- `HtmlBasePlugin` + `PATH_PREFIX`: every new URL (nav, cards, tag links, PDFs, the lightbox target, any script file) must work under `/portfolio-test/`.

### Integration Points
- `content/index.md` currently lists every project as plain links. Replace it with the intro + featured grid + "All work" link.
- New templates are needed for `/work/` and the paginated `/tags/<tag>/`, plus a card partial in `src/_includes/`.
- `src/_data/tags.js` changes shape (D-10). Update every consumer (validation, tag pages, meta block).
- `scripts/check-assets.js` / `scripts/shrink.js` must accept `.pdf` in `assets/`.

</code_context>

<specifics>
## Specific Ideas

- The owner doesn't want an About page "for now". The nav is just name, Work, CV and Teaching.
- The nav label is "Teaching" and the URL is `/teaching/`, even though the requirement calls it "student work".
- The test project `content/projects/tidepool-game.md` has a grid with captions, a GIF, a `::: full` image and embeds. Use it as the lightbox fixture: grid images should be linked and the full-bleed image should not.

</specifics>

<deferred>
## Deferred Ideas

- About page. The owner skipped it for v1, and the CV page covers SITE-04. It's easy to add later as `content/pages/about.md` plus a nav link.
- Prev/next inside the lightbox gallery. This was already "later" in research (FEATURES.md).

</deferred>

---

*Phase: 03-browsing-lightbox-and-standalone-pages*
*Context gathered: 2026-10-30*
