---
status: diagnosed
phase: 02-layout-blocks-embeds-and-design-system
source: [02-VERIFICATION.md]
started: 2026-10-30T04:40:34Z
updated: 2026-10-30T13:22:14Z
---

## Current Test

[testing complete]

## Tests

### 1. Tidepool page layout at 1280, 960, 640 and 600px
expected: Grids collapse at the breakpoints, the full-width image bleeds edge to edge with no horizontal scroll, and captions keep their inset.
result: pass

### 2. Keyboard walk-through: skip link and focus rings
expected: Tab shows the skip link with a visible ring and Enter jumps to the content. Check whether a ring then wraps the whole page (WR-01), and whether the skip-link ring is visible against black.
result: pass

### 3. Real YouTube, Vimeo and itch.io embeds
expected: Each plays in a titled, lazy-loaded frame. A real itch.io embed URL passes the host allow-list.
result: pass

### 4. Self-hosted .mp4 playback on desktop and iPhone Safari
expected: Plays with and without a poster, shows a first frame on iOS, and seeking works on the deployed GitHub Pages site.
result: issue
reported: "I don't see the poster image but the video deploys with and without poster."
severity: major

### 5. No layout shift on a throttled load
expected: Images and embeds reserve their space, so content does not jump while loading.
result: pass

### 6. VS Code paste-alt warning with the real plugin
expected: Pasting an image without editing its alt gives one WARN line on build, and the warning clears after a real alt is written.
result: pass

## Summary

total: 6
passed: 5
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-02-4
  truth: "Self-hosted video shows its poster image before playback when poster= is set"
  status: failed
  reason: "User reported: I don't see the poster image but the video deploys with and without poster."
  severity: major
  test: 4
  root_cause: "renderFileVideo in lib/media.js always appends #t=0.001 to the video src, even when poster= is set. With preload=metadata the media fragment makes the browser seek on load, which exits poster mode and paints the video frame (black frame 0 for this clip) instead of the poster. The fragment trick was meant only for the no-poster case (02-CONTEXT.md line 93)."
  artifacts:
    - path: "lib/media.js"
      issue: "Lines 49-53: #t=0.001 appended to src unconditionally, defeating poster="
    - path: "test/video.test.js"
      issue: "Poster build tests (lines ~194-215) never assert the <video src> form, so nothing guarded this"
  missing:
    - "Append #t=0.001 to src only when no poster is given; with a poster emit plain src and keep preload=metadata"
    - "Regression tests: poster block src has no #t= (with and without full, escaped title); no-poster block keeps #t=0.001"
    - "Spot-check poster display on iPhone Safari after the fix"
  debug_session: ".planning/debug/video-poster-not-shown.md"
