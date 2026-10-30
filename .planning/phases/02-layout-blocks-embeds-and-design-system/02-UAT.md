---
status: testing
phase: 02-layout-blocks-embeds-and-design-system
source: [02-VERIFICATION.md]
started: 2026-10-30T04:40:34Z
updated: 2026-10-30T04:40:34Z
---

## Current Test

number: 1
name: Tidepool page layout at 1280, 960, 640 and 600px
expected: |
  Grids collapse at the breakpoints, the full-width image bleeds edge to edge with no horizontal scroll, and captions keep their inset.
awaiting: user response

## Tests

### 1. Tidepool page layout at 1280, 960, 640 and 600px
expected: Grids collapse at the breakpoints, the full-width image bleeds edge to edge with no horizontal scroll, and captions keep their inset.
result: [pending]

### 2. Keyboard walk-through: skip link and focus rings
expected: Tab shows the skip link with a visible ring and Enter jumps to the content. Check whether a ring then wraps the whole page (WR-01), and whether the skip-link ring is visible against black.
result: [pending]

### 3. Real YouTube, Vimeo and itch.io embeds
expected: Each plays in a titled, lazy-loaded frame. A real itch.io embed URL passes the host allow-list.
result: [pending]

### 4. Self-hosted .mp4 playback on desktop and iPhone Safari
expected: Plays with and without a poster, shows a first frame on iOS, and seeking works on the deployed GitHub Pages site.
result: [pending]

### 5. No layout shift on a throttled load
expected: Images and embeds reserve their space, so content does not jump while loading.
result: [pending]

### 6. VS Code paste-alt warning with the real plugin
expected: Pasting an image without editing its alt gives one WARN line on build, and the warning clears after a real alt is written.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
