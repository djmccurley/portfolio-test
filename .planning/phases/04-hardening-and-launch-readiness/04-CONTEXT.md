# Phase 4: Hardening and Launch Readiness - Context

**Gathered:** 2026-10-30
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase finishes v1 for launch. It delivers five things:

- next/previous links between projects (SITE-06);
- link previews (Open Graph and Twitter tags) plus `sitemap.xml` with absolute URLs (SITE-07);
- a `draft: true` flag that hides a page from the live site but shows it locally (PUB-05);
- a root README that is an authoring reference for every block and front matter field (AUTH-05);
- a verified 320px-wide and 200%-zoom layout with no horizontal scroll, checked under the real deployed prefix (A11Y-02).

New capabilities (RSS, dark mode, an About page, a blog) stay out of scope.

</domain>

<decisions>
## Implementation Decisions

### Next/previous links (SITE-06)
- **D-01:** The order matches `/work/`: the existing `projects` collection, newest first. **Next = older** (the card after this one in the feed). **Previous = newer.**
- **D-02:** The links stop at the ends. They do not wrap. The newest project has only a "Next" link and the oldest has only a "Previous" link. With a single project, neither link renders and no empty nav is output.
- **D-03:** Each link is a text label plus the neighbour's title, e.g. `← Previous: Tidepool` and `Next: Poster series →`. There are no thumbnails.
- **D-04:** The links sit at the bottom of project pages only, after the content, inside `<nav aria-label="Projects">` (or a similarly distinct label, separate from the "Main" nav). They never appear on standalone pages.
- **D-05:** Drafts are skipped in the live build's next/prev chain. A published project never links to a draft. Locally, when drafts are shown, they may take part in the chain.

### Share previews, sitemap and robots (SITE-07)
- **D-06:** Add an optional `description:` front matter field for projects and pages. The meta/OG description uses the first of these that exists: `description`, then `summary` (the existing on-page intro field), then a site-wide default sentence in `src/_data/site.js`. Add `description` to `PROJECT_KEYS` and `PAGE_KEYS` in `lib/validate.js`. A missing description never fails the build.
- **D-07:** A project's preview image is its `cover`, and `cover_alt` supplies `og:image:alt`. Pages with no cover use one site-wide default image named in `src/_data/site.js`. These pages are the homepage, `/work/`, tag pages, CV, Teaching and 404. The default image is an asset in `assets/`, resolved like other assets. The build fails, naming `site.js`, if that image is missing.
- **D-08:** `og:image` must be an absolute URL to a processed variant (a sensible social size, e.g. about 1200px wide). It must never point to the original in `assets/` (IMG-03). It should come through the existing eleventy-img pipeline, not a new copy step.
- **D-09:** Add one site `url` value next to `PATH_PREFIX`, set to `https://djmccurley.github.io` for now. Absolute URLs are built as `url + PATH_PREFIX + page path`. These are used for `og:url`, `og:image`, the canonical link and the sitemap. Moving to a custom domain means changing `url` and `PATH_PREFIX` together, and the README documents this. — **Reversibility:** reversible — it's two config values, though already-shared links keep pointing at the old host.
- **D-10:** Use `twitter:card` = `summary_large_image`. The tag set is `og:title`, `og:description`, `og:image`, `og:image:alt`, `og:url`, `og:type` and `og:site_name` (the owner's name from `site.js`), plus `<meta name="description">`.
- **D-11:** `sitemap.xml` lists every public page except 404: the homepage, `/work/`, tag pages, projects, CV and Teaching. Drafts are never listed. URLs are absolute and include the prefix.
- **D-12:** Publish a `robots.txt` that allows everything and has a `Sitemap:` line with the absolute sitemap URL. Note: on a github.io *project* site, crawlers only read robots.txt at the domain root. That makes this file inert until the site moves to a custom domain or user site, but it costs nothing to ship now.

### Drafts (PUB-05)
- **D-13:** `npm start` (`eleventy --serve`) shows drafts. `npm run build`, run locally or in CI, leaves them out. No extra flag needs to be remembered. The planner picks the mechanism, e.g. Eleventy's run mode or an env var set by the serve script, and it must be impossible for CI to publish a draft.
- **D-14:** Any page can be a draft, project or standalone page. A draft is removed from everything in the live build: its own output, `/work/`, tag pages, featured, next/prev, the sitemap, and tag-page generation. A tag used only by drafts gets no live tag page and no filter link (consistent with Phase 3 D-09).
- **D-15:** When drafts show locally, a plain visible "Draft" text label appears on the draft's page and on its card. It never renders in the live build.
- **D-16:** If `featured.js` names a draft, the live build skips that slug and prints a warning naming it, and the build does not fail. The existing unknown-slug and duplicate-slug failures still apply (Phase 3 D-12).
- **D-17:** Nothing referenced only by a draft is published: images, videos, posters or PDFs. Only media reached from published pages is output, which keeps unreleased work from being found by guessing URLs.
- **D-18:** Drafting a page linked from the fixed header nav (CV, Teaching) would leave a dead nav link live. The build warns about this, naming the page. The planner decides whether to also hide the nav item.
- **D-19:** `draft` must be a boolean. A non-boolean value such as `draft: "yes"` fails the build, naming the file (Phase 1 D-23 strictness). Add `draft` to `PROJECT_KEYS`/`PAGE_KEYS`.

### README (AUTH-05)
- **D-20:** There is one `README.md` at the repo root. Quick-reference tables come first, then longer sections.
- **D-21:** The README must contain:
  - **A block reference.** Every `:::` block (`grid-2`, `grid-3`, `grid-4`, `full`, `video` for YouTube, Vimeo and file sources, `itch`, and the `full` keyword on embeds) with a copy-pasteable example, plus captions via the image title, the decorative-alt marker, and PDF links.
  - **A front matter reference.** Every project and page field (required or optional, format, and an example), including the new `description` and `draft`.
  - **The day-to-day workflow.** Create the `.md`, paste images, write blocks, `npm start`, then commit and push. It also covers what the pre-commit shrink hook does and `npm run shrink`.
  - **Site settings.** Where to change the owner's name, the accent colour token, `featured.js`, `tags.js`, the default share image and default description, and `url` + `PATH_PREFIX` for a custom domain.
  - **An error guide.** The common build errors (missing image, unknown tag, unknown or unclosed block, bad front matter, slug collision, size caps) and how to fix each.
  - **No from-scratch machine setup section.** The owner didn't ask for one. A short "requires Node 22, `npm install`" line is fine.
- **D-22:** A test keeps the README in sync. It fails if a block name the renderer accepts, or a key in `PROJECT_KEYS`/`PAGE_KEYS`, is missing from the README. Internal keys (`layout`, `permalink`, `eleventyExcludeFromCollections`) may be excluded. The test reads the real lists from the code, not a copy.

### Claude's Discretion
- **320px / 200% zoom verification (A11Y-02):** An automated check plus a manual check on the live github.io URL under `/portfolio-test/`. The automated check could be a test asserting CSS guards (e.g. `overflow-wrap` for long words/URLs, `min-width: 0` on grid children, embeds and `<dl>` that shrink). It could also be a headless check if the planner thinks the dependency is worth it. Fix any overflow found. Long unbroken strings like the `link` URL in the meta `<dl>` and PDF link text are likely suspects.
- The exact markup and CSS for the next/prev nav, within Phase 2 tokens. Keep it left-aligned, brutalist and plain.
- How the processed OG image variant is produced and referenced, within D-08.
- The wording of the default description sentence and which asset becomes the default share image. Use a placeholder the owner can swap, and the README says where.
- The sitemap and robots implementation (template vs plugin). Prefer a template, with no new dependency.
- Whether drafted nav pages also hide their nav link (D-18).
- Whether `og:type` is `article` for projects and `website` elsewhere.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap
- `.planning/ROADMAP.md` — Phase 4 goal and its 5 success criteria
- `.planning/REQUIREMENTS.md` — SITE-06, SITE-07, PUB-05, AUTH-05, A11Y-02
- `.planning/PROJECT.md` — Constraints (Pages limits, near-zero JS) and the Key Decisions table

### Prior phase decisions this phase builds on
- `.planning/phases/01-push-to-live-with-images/01-CONTEXT.md` — D-02 root-level slugs and reserved paths, D-06 required front matter, D-20 base path as one value, D-23 strictness
- `.planning/phases/02-layout-blocks-embeds-and-design-system/02-CONTEXT.md` — the block syntax the README must document (D-01..D-09), design tokens (D-11..D-15)
- `.planning/phases/03-browsing-lightbox-and-standalone-pages/03-CONTEXT.md` — feed order and cards (D-05..D-09), featured rules (D-12), nav (D-14), PDFs (D-17)

No external specs. The requirements are fully captured in the decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `eleventy.config.js`: `PATH_PREFIX` (the one base-path value), the `projects` collection (newest-first sort, for next/prev order), the `assetSrc` filter (resolves a cover for eleventy-img, reusable for the OG image), and the `HtmlBasePlugin` (prefixes root-relative URLs, but not absolute ones).
- `src/_data/site.js`: currently `{ name }`. Add `url`, the default description and the default share image here.
- `src/_data/featured.js` + `resolveFeatured()` in `lib/validate.js`: where the draft-skip-with-warning logic goes.
- `lib/validate.js`: `PROJECT_KEYS`, `PAGE_KEYS`, `RESERVED_SLUGS` (add `sitemap.xml`/`robots.txt` names if relevant), `validateContent()`.
- `lib/media.js` (`registerPdf`, `copyMedia`): already publishes only referenced media. Drafts must not register media in the live build.
- `lib/blocks.js` (`EMBEDS`, block names): the source of truth that the README sync test reads.
- `src/_includes/base.njk`: the `<head>` where the meta and OG tags go, and the main content where the next/prev nav and the Draft label go.
- `src/_includes/card.njk`: where the Draft label goes on cards.
- `test/helpers/site.js`: the fixture-site build helper used by the existing tests.

### Established Patterns
- Every content error fails the build, naming the file and field. New warnings (featured draft, drafted nav page) print but don't fail.
- Plain hand-written CSS with tokens in `content/style.css`, no animation, and `aria-current` for current items.
- Tests use `node --test` over `test/*.test.js`, building fixture sites.
- The only JS is `content/lightbox.js`. Don't add client JS.

### Integration Points
- `content/projects/projects.11tydata.js` / `content/pages/pages.11tydata.js`: the permalink is computed here. Draft exclusion could return `permalink: false` plus `eleventyExcludeFromCollections` in the live build.
- `content/work.njk`, `content/tags.njk`, `content/tags.11tydata.js`: feed and tag pages that must ignore drafts.
- `.github/workflows/deploy.yml`: CI runs the production build. It must not show drafts.

</code_context>

<specifics>
## Specific Ideas

- The next/prev link text pattern is `← Previous: {title}` / `Next: {title} →`.
- The live site is `https://djmccurley.github.io/portfolio-test/`. The manual 320px / 200% zoom check happens there.
- The `summary` field already exists and shows as the intro paragraph. `description` is for previews, with a fallback to `summary`.

</specifics>

<deferred>
## Deferred Ideas

None. The discussion stayed within the phase scope.

</deferred>

---

*Phase: 04-hardening-and-launch-readiness*
*Context gathered: 2026-10-30*
