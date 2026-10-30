---
phase: 02
review: 02-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "`main:focus { outline: none }` loses to the global focus-visible rule, so the skip link target gets a page-wide ring"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "A trailing hard break after an image inside a layout block gives a wrong and misleading error"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "An out-of-range date passes validation and crashes Eleventy without naming the field's error format"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "CI error tells the owner to run `shrink` for an oversize WebP that `shrink` never touches"
  - id: IN-01
    severity: info
    disposition: open
    title: "\"a title cannot break out of its attribute\" test is partly vacuous"
  - id: IN-02
    severity: info
    disposition: open
    title: "Fonts come from Google's CDN while the embeds are built to be privacy-preserving"
  - id: IN-03
    severity: info
    disposition: open
    title: "Unused or inconsistent code"
  - id: IN-04
    severity: info
    disposition: open
    title: "No aggregate cap on self-hosted video against the Pages size limit"
open: 4
total: 8
recorded: 2026-10-30T11:38:29.779Z
---

# Phase 02: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | 02-REVIEW-FIX.md |
| WR-02 | warning | fixed | 02-REVIEW-FIX.md |
| WR-03 | warning | fixed | 02-REVIEW-FIX.md |
| WR-04 | warning | fixed | 02-REVIEW-FIX.md |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
