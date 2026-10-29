---
phase: 01-push-to-live-with-images
plan: 04
subsystem: images
tags: [eleventy-img, sharp, alpha, gif, svg]
requires: [01-01]
provides: [hasAlpha, per-image eleventy:formats, animated GIF support]
affects: [lib/assets.js, lib/markdown.js, lib/images.js]
key-files:
  created: [test/images.test.js]
  modified: [lib/assets.js, lib/markdown.js, lib/images.js]
decisions:
  - "formatFiltering limited to [transparent]: the default 'animated' filter treats every static webp as animated and drops its jpeg fallback once sharpOptions.animated is on"
metrics:
  completed: 2026-10-28
requirements: [IMG-01, IMG-02, AUTH-03]
---

# Phase 1 Plan 04: Image edge cases Summary

Transparent images get WebP + PNG, animated GIFs keep their frames (WebP + GIF), SVGs pass through as one sized `<img>`, and opaque images keep WebP + JPEG.

## Commits
- 92d31d8 test(01-04): failing tests (RED)
- feat(01-04): alpha detection, per-image formats, GIF animation (GREEN; second commit on branch)

## Implementation
- `lib/assets.js`: `refreshAssets` reads sharp metadata for raster files, cached by basename with size+mtime; exports `hasAlpha` (unknown new raster files default to true, so PNG is the safe fallback).
- `lib/markdown.js`: sets `eleventy:formats` to `svg`, `webp,gif` or `webp,png` per image.
- `lib/images.js`: `sharpOptions: { animated: true }` and `formatFiltering: ["transparent"]`.

## Deviations from Plan

**[Rule 1 - Bug] formatFiltering default broke static images.** With `animated: true`, eleventy-img's default `formatFiltering` flagged static webp as animated and removed jpeg (breaking test/build.test.js). Set `formatFiltering: ["transparent"]`. The Pitfall 9 copy-GIF fallback was not needed.

## Known Stubs
None.

## Self-Check: PASSED
`npm test`: 12/12 pass.
