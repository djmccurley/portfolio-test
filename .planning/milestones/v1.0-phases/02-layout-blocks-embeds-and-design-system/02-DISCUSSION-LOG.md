# Phase 2: Layout Blocks, Embeds and Design System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log keeps the alternatives that were considered.

**Date:** 2026-10-29
**Phase:** 02-layout-blocks-embeds-and-design-system
**Areas discussed:** Block syntax & captions, Embed shorthand, Visual direction (plus spacing)

---

## Block syntax & captions

| Option | Description | Selected |
|--------|-------------|----------|
| `::: grid-3` | One fence per layout | ✓ |
| `::: grid 3` | One block that takes a number | |
| `::: grid` (auto) | Columns come from the image count | |

| Option | Description | Selected |
|--------|-------------|----------|
| Markdown title | `![alt](src "Caption")` | ✓ |
| Italic line under image | Next-line italic becomes the caption | |
| Both | Accept either | |

| Option | Description | Selected |
|--------|-------------|----------|
| `::: full`, edge to edge | True bleed; multiple images stack | ✓ |
| `::: full`, wide not bleed | Breakout with a margin | |
| `full` + `wide` | Two fences | |

| Option | Description | Selected |
|--------|-------------|----------|
| Images only, strict | Text, unclosed or unknown blocks fail the build | ✓ |
| Images + text cells | Paragraphs become cells | |
| Lenient | Odd blocks fall through | |

## Embed shorthand

| Option | Description | Selected |
|--------|-------------|----------|
| `::: video URL "Title"` | One-line fence, title required | ✓ |
| Bare URL on its own line | Auto-embed | |
| Image-style link | `![title](youtube-url)` | |

| Option | Description | Selected |
|--------|-------------|----------|
| assets/ + same `::: video` | Optional `poster=`, size cap | ✓ |
| Separate media/ folder | Copied wholesale | |
| No self-hosted | GIFs only | |

| Option | Description | Selected |
|--------|-------------|----------|
| Playable iframe sized per game | W×H, title, fallback link | ✓ |
| Click-to-load playable | Needs JS | |
| Playable + store widget | Two modes | |

| Option | Description | Selected |
|--------|-------------|----------|
| Text column, opt-in `full` | Keyword on the fence line | ✓ |
| Always text column | | |
| Always full width | | |

## Visual direction

The typeface question was first offered as system sans / monospace / browser serif / self-hosted custom. The user rejected it and clarified: **Chivo from Google Fonts, a couple of weights plus italics.**

| Option | Description | Selected |
|--------|-------------|----------|
| Self-host woff2 | Privacy, no third party | |
| Google Fonts link | Easiest | ✓ |

| Option | Description | Selected |
|--------|-------------|----------|
| Variable roman + italic | All weights, 2 files | ✓ |
| Fixed 400/700 + 400 italic | | |
| Fixed 300/400/700/900 + italics | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Black on white + 1 accent | Accent for links and focus | ✓ |
| Pure black & white | | |
| Off-white paper | | |

**Accent hex:** "You decide later". It ships as a CSS variable placeholder.

| Option | Description | Selected |
|--------|-------------|----------|
| Narrow text, wide images | 65ch text, 75rem grids | |
| Everything one column | Single column, only `full` breaks out | ✓ (with notes) |
| Wide everything | 90rem | |

**Notes:** "everything in one column, should be pretty wide with enough side margins to feel humane. The text column width can be limited improve readability but should be left aligned within the one column. Needs to feel typographically sound but still brutalist/raw html adjacent. I don't want the centered tech bro bs. I can also adjust CSS later as needed - i'm good at that."

## Spacing (raised by the user at the wrap-up)

- Grid gap: **Medium (~1rem)** ✓. The other options were tight, zero and generous.
- Alignment: **Top-aligned rows** ✓. The other options were bottom-aligned and masonry/columns.
- Block spacing: **One token, ~2× grid gap** ✓. The other options were the same as the gap, or extra room around full-bleed.

## Claude's Discretion

- The whole alt-text lint area (the user didn't select it). Defaults: warn, flag the `alt text` placeholder and filename-like alt, and use an explicit decorative marker.
- Collapse breakpoints, per-block `sizes`, the video size cap, the poster fallback, the type scale, link style, header and meta styling, and the skip/focus style.

## Deferred Ideas

None.
