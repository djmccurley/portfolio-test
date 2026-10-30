---
phase: 02-layout-blocks-embeds-and-design-system
baseline: 02-UI-SPEC.md
overall_score: 20
max_score: 24
screenshots: none (code-only audit; no dev server running)
interaction_capture: false
audited: 2026-10-29
---

# Phase 02 UI Review

Code-only audit of `content/style.css`, `src/_includes/base.njk`, `lib/*.js`, and the built `_site/tidepool-game/index.html` against `02-UI-SPEC.md`. There were no screenshots, so the visual checks are still open (see fix 3).

## Pillar Scores

| Pillar | Score | Key finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | The skip link, the itch link, the video fallback, and every build error and warning match the contract strings. |
| 2. Visuals | 3/4 | The focal point and block markup are sound. Two gaps: spacing between headings and blocks, and the skip-link focus ring. Nothing was checked visually. |
| 3. Color | 3/4 | Monochrome plus one accent, used only where the contract reserves it. The focus-ring contrast on the skip link is untested. |
| 4. Typography | 4/4 | Exactly four sizes (1.125, 0.875, 1.5, 2.5rem) and two weights. The h1 has no `clamp()`, and links are always underlined. |
| 5. Spacing | 3/4 | The tokens match the spec, but cascade specificity breaks two rhythm rules. |
| 6. Experience Design | 3/4 | Reduced motion, focus rings, a real skip target, embed titles and aria-labels, and reserved aspect ratios are all in place. Raw-HTML overflow and the 320px h1 are unverified, which the spec expected. |

## Top Fixes (all WARNING, no BLOCKERs)

1. **Rhythm rules lose on specificity** (`content/style.css`, Vertical rhythm section).
   - `main > :is(.layout,.embed,figure,.lone-image) + *` has specificity 0,1,1. It beats `main > * + :is(h2,h3)`, the 3rem above, and `main > :is(h2,h3) + *`, the 1rem below.
   - Result: an h2 after a grid, embed or figure gets 32px above it instead of 48px.
   - Result: a block directly after an h2 gets 32px below the heading instead of 16px.
   - The same rule overrides `main > dl + *` (24px) when an image follows the meta list.
   - Fix: raise the specificity of the heading rules, for example with `main > :is(.layout,.embed,figure,.lone-image) + :is(h2,h3)`. Then order the h2/h3 "below" rule after the block rule, at matching specificity.
2. **Skip-link focus ring contrast is untested.**
   - The 3px `--accent` (#0000ee) ring against the black skip link is about 2.2:1. The spec requires 3:1 for focus outlines.
   - The 3px offset puts most of the ring over white, so it is likely fine, but no test covers it.
   - Fix: add a contrast test of the ring against `--ink`. Alternatively, give `.skip-link:focus-visible` `outline-color: var(--paper)` or a larger offset.
3. **No visual verification.** Not yet checked:
   - grid collapse at 960 and 640px
   - the inset on `.full` captions
   - itch `max-width` with `--w`
   - the iOS `#t=0.001` first frame
   - the 320px h1
   - raw-HTML table overflow

   Run the dev server and capture at 1440, 768 and 375px before sign-off.

## Detailed Findings

- **Copywriting:**
  - "Play on itch.io" carries a visually-hidden title suffix.
  - The video fallback reads `Your browser cannot play this video. Download "{title}"`.
  - The "never closed", "unknown block" and "has no images" messages, and the alt-lint warnings with a literal `{decorative}`, all match the spec.
  - `poster=` is an extension beyond the spec. It has its own clear error strings.
- **Visuals:**
  - A named-line grid gives a true full bleed without `100vw`, and `.layout img` is never cropped.
  - The built markup is `<div class="layout grid-2">` with a `<figure>` per image, and `sizes` is set per block.
  - Small sources produce a single-width srcset, which is expected.
  - The index page is a bare `<ul>` of links. That is acceptable for this phase.
- **Color:**
  - The tokens match the spec, and no colors are hardcoded outside `:root`.
  - The accent is used only for links and focus.
  - There are no greys and no dark mode, and `color-scheme: light` is set.
- **Typography:**
  - h3 uses the Body size at weight 700.
  - `dt` is 14px at 700, and `figcaption` is 14px italic.
  - Prose is limited to `max-width: var(--measure)` and left-aligned.
  - `pre` uses `pre-wrap`.
  - There are no transitions or animations.
- **Spacing:**
  - `--grid-gap` is 1rem and `--block-gap` is 2rem, with no arbitrary pixel values.
  - The only deviation is fix 1.
- **Experience Design:**
  - `:focus-visible` covers `a, video, iframe, summary, button, [tabindex]`.
  - `<main id="main" tabindex="-1">` is the skip target.
  - The reduced-motion guard is present.
  - iframes have `title`, `loading="lazy"` and `referrerpolicy`.
  - The video has `aria-label`, `preload="metadata"` and `#t=0.001`.
  - Aspect ratios reserve space.
  - The itch link always renders.
  - Empty or invalid blocks fail the build.
  - Open risks: raw-HTML overflow and the 320px h1, both deferred to Phase 4 (A11Y-02).

## Minor Recommendations

- Confirm how `<time>` renders non-ISO dates such as `2024`.
- Check `.embed-link` spacing when an itch embed is followed by prose.
