---
phase: 02
review: 02-REVIEW.md
titles: json
findings:
  - id: 02-06/WR-01
    severity: warning
    disposition: open
    title: "originals-not-published test exempts every video in _site/video/, not only referenced ones"
  - id: 02-06/IN-01
    severity: info
    disposition: open
    title: "src choice keys on poster while the attribute is emitted from posterAttr"
  - id: 02-06/IN-02
    severity: info
    disposition: open
    title: "new comment in lib/media.js is a single ~140-char line"
  - id: WR-01
    severity: warning
    disposition: open
    title: "false \"still over 10 MB\" warning for renamed videos (regression from the WR-04 fix)"
  - id: WR-02
    severity: warning
    disposition: open
    title: "text-only links in a layout block get the \"linked images\" error"
  - id: IN-01
    severity: info
    disposition: open
    title: "shrink's lossy re-encode of an over-cap WebP can still end over 10 MB, or grow the file"
  - id: IN-02
    severity: info
    disposition: open
    title: "`validDate` rejects years 0000 to 0099"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "An out-of-range date passes validation and crashes Eleventy without naming the field's error format"
  - id: WR-04
    severity: warning
    disposition: fixed
    title: "CI error tells the owner to run `shrink` for an oversize WebP that `shrink` never touches"
  - id: IN-03
    severity: info
    disposition: open
    title: "Unused or inconsistent code"
  - id: IN-04
    severity: info
    disposition: open
    title: "No aggregate cap on self-hosted video against the Pages size limit"
open: 9
total: 11
recorded: 2026-10-30T13:47:05.318Z
---

# Phase 02: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| 02-06/WR-01 | warning | open | 02-REVIEW.md (incremental, plan 02-06) |
| 02-06/IN-01 | info | open | 02-REVIEW.md (incremental, plan 02-06) |
| 02-06/IN-02 | info | open | 02-REVIEW.md (incremental, plan 02-06) |
| WR-01 | warning | open | prior full-phase review (068bff2) |
| WR-02 | warning | open | prior full-phase review (068bff2) |
| IN-01 | info | open | prior full-phase review (068bff2) |
| IN-02 | info | open | prior full-phase review (068bff2) |
| WR-03 | warning | fixed | 02-REVIEW-FIX.md (not in the current review) |
| WR-04 | warning | fixed | 02-REVIEW-FIX.md (not in the current review) |
| IN-03 | info | open | prior full-phase review (068bff2) |
| IN-04 | info | open | prior full-phase review (068bff2) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
