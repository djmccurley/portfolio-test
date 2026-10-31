---
phase: 03
review: 03-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "`a.zoom` is `display:block`, so the click target and focus ring span the whole column, not the image"
  - id: WR-02
    severity: warning
    disposition: open
    title: "`zoomHref` links the first `<source>`, which becomes a broken lightbox the moment AVIF is enabled"
  - id: WR-03
    severity: warning
    disposition: open
    title: "`rewriteLinks` rewrites remote URLs and prose, and misses case-different links"
  - id: WR-04
    severity: warning
    disposition: open
    title: "`copyMedia` keeps deleted videos, posters and PDFs in its maps and crashes the dev rebuild"
  - id: IN-01
    severity: info
    disposition: open
    title: "Placeholder copy ships to the live CV and Teaching pages"
  - id: IN-02
    severity: info
    disposition: open
    title: "Global data named `tags` collides with Eleventy's reserved `tags` key"
  - id: IN-03
    severity: info
    disposition: open
    title: "Front matter `link` is rendered as an `href` with no scheme check, and duplicate tags are accepted"
  - id: IN-04
    severity: info
    disposition: open
    title: "Dead constant and duplicated limits in the asset scripts"
  - id: IN-05
    severity: info
    disposition: open
    title: "The lightbox's focus and caption wiring is only tested against a hand-written fake DOM"
open: 9
total: 9
recorded: 2026-10-30T17:19:28.342Z
---

# Phase 03: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
