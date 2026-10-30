---
phase: 03-browsing-lightbox-and-standalone-pages
verified: 2026-10-30T12:00:00Z
status: human_needed
score: 5/5 must-haves verified
covered_files:
  - .planning/phases/03-browsing-lightbox-and-standalone-pages/03-01-PLAN.md
  - .planning/phases/03-browsing-lightbox-and-standalone-pages/03-01-SUMMARY.md
  - .planning/phases/03-browsing-lightbox-and-standalone-pages/03-02-PLAN.md
  - .planning/phases/03-browsing-lightbox-and-standalone-pages/03-02-SUMMARY.md
  - .planning/phases/03-browsing-lightbox-and-standalone-pages/03-03-PLAN.md
  - .planning/phases/03-browsing-lightbox-and-standalone-pages/03-03-SUMMARY.md
  - .planning/phases/03-browsing-lightbox-and-standalone-pages/03-04-PLAN.md
  - .planning/phases/03-browsing-lightbox-and-standalone-pages/03-04-SUMMARY.md
  - .planning/phases/03-browsing-lightbox-and-standalone-pages/03-05-PLAN.md
  - .planning/phases/03-browsing-lightbox-and-standalone-pages/03-05-SUMMARY.md
  - content/index.11tydata.js
  - content/index.md
  - content/lightbox.js
  - content/pages/cv.md
  - content/pages/teaching.md
  - content/style.css
  - content/tags.11tydata.js
  - content/tags.njk
  - content/work.njk
  - eleventy.config.js
  - lib/blocks.js
  - lib/limits.js
  - lib/markdown.js
  - lib/media.js
  - lib/validate.js
  - lib/zoom.js
  - src/_data/featured.js
  - src/_data/site.js
  - src/_data/tags.js
  - src/_includes/base.njk
  - src/_includes/card.njk
  - src/_includes/filters.njk
  - src/_includes/home.njk
covered_digest: "v4:sha256:2d7cbec152654ff30a03febf0f86123ad8db8df2d7567585a75297a96d1e43a4"
behavior_unverified: 1
behavior_unverified_items:
  - truth: "Zoom link opens a native dialog with Escape-to-close, focus return to the opener, focus held inside the modal, and the no-JS plain-link fallback (SC5)"
    test: "In Chrome and Safari open a project page with zoom images, Tab to a zoom link, press Enter; press Tab repeatedly; press Escape. Repeat with JS disabled and click the link; press Back."
    expected: "Dialog opens with Close focused; Tab stays inside; Escape closes and focus returns to the link; with JS off the large webp opens in the same tab and Back returns."
    why_human: "The lightbox tests drive lightbox.js through a hand-written fake DOM in a vm context, so showModal, the Escape key, focus trap and real focus return are never exercised by a real browser."
human_verification:
  - test: "Lightbox in real browsers (03-05)"
    expected: "Enter/Space opens the dialog, Close is focused, Tab stays inside, Escape closes, focus returns to the opening link, white focus ring is visible on the black stage, in Chrome and Safari. With JS off, a click opens the large file in the same tab and Back returns."
    why_human: "Native dialog behavior, focus handling and key events are only faked in the unit tests."
  - test: "Lightbox open on Slow 4G (03-05)"
    expected: "Dialog opens immediately at the right aspect ratio from data-width/data-height; no page layout shift."
    why_human: "Throttled-network, visual layout behavior."
  - test: "/work/ feed at 1280, 800 and 360px plus keyboard (03-01)"
    expected: "3, 2 and 1 columns; 4:3 cropped covers; header name and nav wrap without scrolling; Tab order and focus ring visible; aria-current styling visible."
    why_human: "Responsive layout and visual appearance."
  - test: "/teaching/ syllabus link and /cv/ (03-02)"
    expected: "Syllabus link shows 'Syllabus (PDF, 1 KB)' and opens the PDF in the same tab; /cv/ reads as a normal page with the header and nav."
    why_human: "Browser PDF rendering and visual check."
  - test: "/work/ and a tag page, tag label edit under npm start (03-03)"
    expected: "Filter row is directly under the h1 and wraps; current tag highlighted; editing a label in src/_data/tags.js and restarting changes the labels."
    why_human: "Dev-server behavior and visuals."
  - test: "Homepage and a bogus featured slug (03-04)"
    expected: "Homepage shows name, intro, Selected work cards and All work link; adding a bogus slug to src/_data/featured.js under npm start shows the build error in the terminal."
    why_human: "Visual check and live-reload error surfacing (the failing build itself was confirmed programmatically)."
---

# Phase 3: Browsing, Lightbox and Standalone Pages Verification Report

**Phase Goal:** Visitors can browse the work by feed, tag and curated homepage, read standalone pages, and open any image full-size
**Verified:** 2026-10-30
**Status:** human_needed
**Re-verification:** No, initial verification

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visitor sees all projects newest first in one feed and can browse by tag on tag pages | VERIFIED | `npm run build` exits 0. `_site/work/index.html` holds one `a.card` per project; `collections.projects` in `eleventy.config.js:67-74` sorts by date string descending with an input-path tiebreak. `_site/tags/games/index.html` is titled "Work: Games" with the filter nav (`aria-current="page"` on Games) and the card. Tag pages exist only for used tags (`_site/tags/` holds only `games`). Tag taxonomy lives in `src/_data/tags.js` as `{slug,label}`. |
| 2 | Owner picks and orders homepage featured projects; build fails if a featured project does not exist | VERIFIED | `src/_data/featured.js` lists `tidepool-game`; `_site/index.html` renders h1, intro, `Selected work`, card, `All work` link. In a scratch copy, adding `"nope"` made the build fail (exit 2) with `featured project "nope" does not match any project in content/projects/. Fix the spelling or remove it from the list.` (`lib/validate.js:136`). Order and duplicate/non-string cases are covered by `test/featured.test.js`. |
| 3 | Owner adds About/CV as a markdown page and it appears on the site | VERIFIED | `content/pages/cv.md` builds to `_site/cv/index.html` and is linked from the header nav. In a scratch copy, a new `content/pages/about.md` built to `_site/about/` with exit 0 and does not appear on `/work/` or the tag page. Pages reject a `tags` key (build error), so they cannot reach tag pages. |
| 4 | Student-work page lists links and PDF downloads and never shows in the feed or tag pages | VERIFIED | `_site/teaching/index.html` renders the heading and `<a href="/portfolio-test/pdf/teaching-sample-syllabus.pdf">Syllabus (PDF, 1 KB)</a>`; `_site/pdf/` contains only the linked PDF; `_site/assets` does not exist. `/work/` and `/tags/games/` each have exactly one card (the project) and no teaching entry. |
| 5 | Visitor can open any image full-size via a plain link without JS, enhanced to a keyboard-operable native dialog (Escape closes, focus returns) | VERIFIED for markup and script logic; real-browser behavior routed to human (see Behavior-Unverified) | `_site/tidepool-game/index.html` wraps grid/lone images in `<a class="zoom" href=".../img/...-1600.webp" data-width data-height>` with a visually hidden "(full size)" suffix; GIF links its `.gif`; hrefs point only into `_site/img/`. `<script src="/portfolio-test/lightbox.js" defer>` appears only on that page (the other five built pages have zero scripts). `content/lightbox.js` uses `showModal`, a Close button with `autofocus`, Escape via native dialog, `close` handler returning focus to the opener, and an image-error fallback to plain navigation; no timers or animation. |

**Score:** 5/5 success criteria verified in code and build output (1 carries real-browser behavior routed to human verification).

### Plan must-have spot checks

| Check | Status | Evidence |
|-------|--------|----------|
| Header on every page: name + Main nav Work/CV/Teaching, `aria-current` | VERIFIED | Seen in `_site/index.html` (`aria-current="page"` on name link). |
| First card cover eager, others lazy; cards carry width/height | VERIFIED | Home and tag card imgs: `loading="eager" fetchpriority="high" width="1600" height="900"`. |
| PDF links carry no `target`/`download`, size suffix inside link | VERIFIED | Teaching output above. |
| Unlinked PDFs not published; `assets/` never copied | VERIFIED | `_site/pdf/` has one file; no `_site/assets`. |
| Zoom hrefs carry the path prefix and never point at originals | VERIFIED | `/portfolio-test/img/...` in all hrefs. |
| Script only on pages with zoom links | VERIFIED | Only `_site/tidepool-game/index.html` has a `<script>`. |
| No lightbox animation | VERIFIED | `test/lightbox.test.js` asserts no timer/animation APIs; grep of `style.css` found no transition or animation on dialog selectors. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build succeeds | `npm run build` | exit 0, 7 files written | PASS |
| Full suite | `npm test` | 278 pass, 0 fail | PASS |
| Bogus featured slug fails build | scratch copy, `featured.js` with `"nope"` | exit 2, expected message | PASS |
| New standalone page builds and stays out of the feed | scratch copy with `content/pages/about.md` | exit 0, no card on `/work/` or tag page | PASS |
| Page with `tags` front matter is rejected | scratch copy | build error `unknown front matter key "tags"` | PASS |

### Probe Execution

No probes declared by the phase. SKIPPED.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| IMG-05 | 03-05 | Open any content image full-size: plain link, enhanced to native dialog | SATISFIED (browser check pending) | zoom links in built HTML; `content/lightbox.js`; `lib/zoom.js` |
| SITE-01 | 03-01 | Feed, newest first | SATISFIED | `/work/`, sort in `eleventy.config.js` |
| SITE-02 | 03-03 | Browse by tag on tag pages | SATISFIED | `/tags/games/`, `content/tags.njk` |
| SITE-03 | 03-04 | Owner chooses homepage projects and order | SATISFIED | `src/_data/featured.js`, `home.njk`, validation |
| SITE-04 | 03-01, 03-02 | Standalone pages as markdown | SATISFIED | `content/pages/cv.md`, `teaching.md`, scratch About page |
| SITE-05 | 03-01, 03-02, 03-03 | Student-work page with links and PDFs, never in feed/tags | SATISFIED | `/teaching/` output; feed and tag page contain only the project |

All six IDs in the phase appear in plan frontmatter (`requirements:` of 03-01 to 03-05) and in REQUIREMENTS.md marked Complete. No orphaned requirements.

### Anti-Patterns Found

No TBD/FIXME/XXX debt markers requiring action were found in files this phase touched beyond those catalogued in 03-REVIEW.md. Review warnings (all dispositioned "open", none blocking the phase goal):

| File | Issue | Severity | Impact |
|------|-------|----------|--------|
| `content/style.css:328` | WR-01 `a.zoom` is `display:block`, click target and focus ring span the column rather than the image | Warning | Accessibility polish on lone images; goal still met |
| `lib/zoom.js:32` | WR-02 zoom href uses the first `<source>`; breaks the lightbox if AVIF is later enabled | Warning | Latent; current config is webp-first |
| `scripts/shrink.js:62` | WR-03 `rewriteLinks` rewrites remote URLs and prose | Warning | Authoring-tool defect, not in phase goal path |
| `lib/media.js:74` | WR-04 deleted assets crash the `npm start` rebuild | Warning | Dev-server robustness |
| `content/pages/cv.md`, `teaching.md` | IN-01 placeholder copy ("Add roles here") would publish as-is | Info | Owner must replace before launch |

### Human Verification Required

See the `human_verification` frontmatter list (6 items): real-browser lightbox keyboard/focus behavior (Chrome and Safari) and JS-off click, Slow 4G open, `/work/` responsive layout at 1280/800/360px, `/teaching/` and `/cv/` visual and PDF open, tag page and tag label edit under `npm start`, homepage and bogus featured slug under `npm start`. These are visual, dev-server or real-browser checks that were explicitly deferred by the plans and cannot be confirmed from files.

### Gaps Summary

No gaps. All five roadmap success criteria and all six requirement IDs are backed by built output and passing tests (278/278), and the key negative behaviors (bogus featured slug fails the build; standalone pages stay out of feed and tags; only linked PDFs publish; scripts load only where zoom links exist) were reproduced independently. Status is human_needed rather than passed because the lightbox's keyboard, focus and Escape behavior is tested only against a fake DOM, and the plans' deferred browser checks have not been run.

---

_Verified: 2026-10-30_
_Verifier: Claude (gsd-verifier)_
