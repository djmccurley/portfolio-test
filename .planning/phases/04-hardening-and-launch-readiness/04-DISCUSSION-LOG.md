# Phase 4: Hardening and Launch Readiness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-30
**Phase:** 04-hardening-and-launch-readiness
**Areas discussed:** Next/prev links, Share previews, Drafts, README scope

---

## Next/prev links

| Question | Options | Selected |
|----------|---------|----------|
| Order | Same as /work/ · Featured order then rest · Within same tag | Same as /work/ |
| Ends | Stop, one link · Wrap around | Stop |
| Link content | Label + title · Label + title + cover · Just Previous/Next | Label + title |
| Placement | Bottom only · Top and bottom | Bottom only |
| Direction | Next = older · Next = newer | Next = older |

---

## Share previews

| Question | Options | Selected |
|----------|---------|----------|
| Description source | New optional `description:` · Required `description:` · First paragraph | Optional `description:` |
| Relation to existing `summary` | description → summary → default · Reuse summary only · Fully separate | description → summary → default |
| Default image | One site-wide default · No image · First featured cover | Site-wide default |
| Absolute URL | One `url` value next to PATH_PREFIX · Pick a domain now | `url` value (github.io for now) |
| Card size | summary_large_image · Small card | Large |
| Sitemap contents | All public except 404 · Exclude tag pages | All public except 404 |
| robots.txt | Yes · No | Yes |

---

## Drafts

| Question | Options | Selected |
|----------|---------|----------|
| Mode | npm start shows / build hides · Flag required | npm start shows / build hides |
| Local look | Draft label on page + card · No marker | Draft label |
| Featured names a draft | Skip + warn · Fail build | Skip + warn |
| Draft media | Never published · Doesn't matter | Never published |
| Scope | Any page · Projects only | Any page |

---

## README scope

| Question | Options | Selected |
|----------|---------|----------|
| Extra coverage (multi) | Day-to-day workflow · Site settings · Error guide · Setup from scratch | Workflow, Site settings, Error guide |
| Location | One root README.md · README + docs/ | One root README.md |
| Sync | Test checks it · Hand-maintained | Test checks it |

---

## Claude's Discretion

- How the 320px / 200% zoom check is automated (CSS assertion tests vs headless), plus a manual check on the live URL
- Next/prev markup and CSS; OG image variant generation; sitemap/robots implementation
- Default description wording and default share image placeholder
- Whether drafted nav pages also hide their nav link; og:type per page kind

## Deferred Ideas

None.
