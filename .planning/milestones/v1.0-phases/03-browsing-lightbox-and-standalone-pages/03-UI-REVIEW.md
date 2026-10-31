---
phase: "03"
overall_score: 20
max_score: 24
baseline: 03-UI-SPEC.md
screenshots: none
audited: "2026-10-30"
method: code and built-output audit (no browser)
---

# Phase 03 — UI Review

Audit of the built `_site/` HTML, `content/style.css` and `content/lightbox.js` against `03-UI-SPEC.md`. No dev server was started and interaction capture was off, so every interaction finding comes from reading the code.

## Pillar Scores

| Pillar | Score | Key finding |
|--------|-------|-------------|
| Copywriting | 3/4 | Copy matches the spec almost word for word; the empty-state swap was not verified |
| Visuals | 4/4 | Contract met; no defects found |
| Color | 4/4 | Accent stays within the reserved list |
| Typography | 4/4 | Only the spec's 4 sizes and 2 weights |
| Spacing | 3/4 | Tokens match; gaps not checked on a rendered page |
| Experience Design | 2/4 | Lightbox and current-page marking not tested in a browser |

## Findings

### Copywriting (3/4)
- The nav labels, landmark labels, the `All` filter and the Tags row all match the spec.
- WARNING: `content/work.njk:11` renders the empty state in the spec's form, but the audit did not check that it replaces the grid and the filter row when there are zero projects.
- WARNING: `card.njk` and `filters.njk` hard-code root-absolute `/work/` and `/tags/` hrefs and depend on the HTML-base transform to add the prefix. This is not the spec's explicit base-path helper.

### Visuals (4/4)
- Covers use `<picture>` with webp and jpeg, crop to 4:3, and set `width` and `height`. The first cover is eager with `fetchpriority="high"`.
- Each card is one link, and the header is one wrapping row.
- The lightbox has an opaque ink stage.
- Minor: the template leaves blank lines in the `_site/work/index.html` output. This is cosmetic only.

### Color (4/4)
- `a[aria-current]` is ink and bold, so the current item is not shown by colour alone.
- The dialog focus ring is white (`style.css:68`).

### Typography (4/4)
- No new sizes or weights were added. Card titles are bold, and dates and captions use the label size.

### Spacing (3/4)
- WARNING: the 32px gap from filter row to cards and the 16px gap below h2 were not checked on a rendered page, even though the spec asks for a built-page test.
- WARNING: the 4:3 `object-fit: cover` crop can cut the subject out of 16:9 covers such as Tidepool's 1600x900. The spec accepts this tradeoff.

### Experience Design (2/4)
- `lightbox.js` is about 58 lines, against the spec's "about 40". It uses no timers or animation.
- WARNING: the same-origin `location.assign` fallback was never run.
- WARNING: very large images are only bounded by `max-height`, while `width` and `height` are set from `data-*`. This needs a browser check.
- WARNING: the audit did not confirm that `aria-current` marks Work on tag pages and project pages.
- WARNING: open, Escape, backdrop click and focus return were not tested in a browser.
- Not confirmed: `a.card:visited` styling. The 320px reflow check is deferred to Phase 04 by the spec.

## Top 3 Fixes

1. Check the rendered pages at 1440, 768 and 375px for rhythm gaps, the 4:3 crop and header wrap.
2. Make base-path handling explicit by piping the hrefs in `card.njk`, `filters.njk` and `base.njk` through `| url`, or accept the transform as the project convention.
3. Test the lightbox in a real browser: open, Escape, backdrop click, focus return and a large image. Also confirm `aria-current` on Work for tag and project pages.

## Files Audited

`content/style.css`, `content/lightbox.js`, `src/_includes/base.njk`, `src/_includes/card.njk`, `src/_includes/filters.njk`, `content/work.njk`, `_site/work/index.html`, `_site/tidepool-game/index.html`, `03-UI-SPEC.md`
