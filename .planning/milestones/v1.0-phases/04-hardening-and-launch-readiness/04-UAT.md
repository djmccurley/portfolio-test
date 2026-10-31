---
status: complete
phase: 04-hardening-and-launch-readiness
source: [04-VERIFICATION.md]
started: 2026-10-30T00:00:00Z
updated: 2026-10-31T01:08:21.867Z
---

## Current Test

[testing complete]

## Tests

### 1. Drafts locally vs clean build
expected: Draft appears with a Draft label under `npm start`; after deleting `_site/` and running `npm run build` it is absent everywhere (page, card, tag page, nav, sitemap). Also covers WR-02 (stale draft in a local `_site/`).
result: pass

### 2. Link previews on the deployed site
expected: Pasting the deployed project URL and homepage URL into a link-preview service (e.g. opengraph.xyz) renders title, description and the 1200px image; sitemap.xml URLs resolve on the deployed site.
result: pass

### 3. Project pager (needs two or more projects)
expected: "Previous: {title}" / "Next: {title}" read cleanly with a screen reader; links sit at the foot of the page and wrap cleanly.
result: pass

### 4. README usability
expected: README.md renders in VS Code preview; examples (e.g. grid-2, video) copy-paste into a new project and build under `npm start`.
result: pass

### 5. Deployed-site reflow at 320px / 200% / 400% zoom
expected: On https://djmccurley.github.io/portfolio-test/, every page at 320px wide, 200% and 400% zoom has no horizontal scrollbar and nothing cut off; the lightbox opens and Close is visible and reachable.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
