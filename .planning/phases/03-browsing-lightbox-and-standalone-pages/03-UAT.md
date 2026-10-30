---
status: complete
phase: 03-browsing-lightbox-and-standalone-pages
source: [03-VERIFICATION.md]
started: 2026-10-30T00:00:00Z
updated: 2026-10-30T17:35:39.995Z
---

## Current Test

[testing complete]

## Tests

### 1. Lightbox in real browsers (03-05)
expected: Enter/Space opens the dialog, Close is focused, Tab stays inside, Escape closes, focus returns to the opening link, white focus ring is visible on the black stage, in Chrome and Safari. With JS off, a click opens the large file in the same tab and Back returns.
result: pass

### 2. Lightbox open on Slow 4G (03-05)
expected: Dialog opens immediately at the right aspect ratio from data-width/data-height; no page layout shift.
result: pass

### 3. /work/ feed at 1280, 800 and 360px plus keyboard (03-01)
expected: 3, 2 and 1 columns; 4:3 cropped covers; header name and nav wrap without scrolling; Tab order and focus ring visible; aria-current styling visible.
result: pass

### 4. /teaching/ syllabus link and /cv/ (03-02)
expected: Syllabus link shows "Syllabus (PDF, 1 KB)" and opens the PDF in the same tab; /cv/ reads as a normal page with the header and nav.
result: pass

### 5. /work/ and a tag page, tag label edit under npm start (03-03)
expected: Filter row is directly under the h1 and wraps; current tag highlighted; editing a label in src/_data/tags.js and restarting changes the labels.
result: pass

### 6. Homepage and a bogus featured slug (03-04)
expected: Homepage shows name, intro, Selected work cards and All work link; adding a bogus slug to src/_data/featured.js under npm start shows the build error in the terminal.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
