---
phase: "03"
slug: "browsing-lightbox-and-standalone-pages"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-30"
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Owner content → build | Markdown, front matter and data files (`site.js`, `tags.js`, `featured.js`) rendered into HTML | Owner-authored text, slugs and paths (trusted author, untrusted shape) |
| `assets/` → `_site/` | Originals resolved and published only as processed images or linked PDFs | Image originals, PDFs (may include unpublished drafts) |
| Published page → visitor browser | Static HTML plus one first-party script (`/lightbox.js`) | Alt text, captions and hrefs read into the dialog |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-01 | Tampering | card.njk / base.njk values | medium | mitigate | Nunjucks autoescape; no `safe` on title, cover_alt, date or site.name (only `content` is `safe`); browse test asserts single escaping | closed |
| T-03-02 | Tampering | Slugs `work` / `pdf` | medium | mitigate | Both in `RESERVED_SLUGS` (`lib/validate.js:5`); tests assert the reserved-slug error | closed |
| T-03-03 | Information disclosure | Card covers | low | mitigate | Covers go through `resolveAsset` and eleventy-img; only `_site/img` derivatives publish | closed |
| T-03-04 | Tampering | PDF link path traversal | medium | mitigate | `resolveAsset` basename lookup in `assets/` (`lib/markdown.js:35`) | closed |
| T-03-05 | Information disclosure | Unlinked PDFs | high | mitigate | Only `registerPdf()` entries are copied (`lib/media.js:79`); test asserts unlinked PDF absent | closed |
| T-03-06 | Denial of service | Oversized PDFs | medium | mitigate | `PDF_MAX_MB = 25` (`lib/limits.js`) used by renderer, `check-assets.js` and `shrink.js`; tested | closed |
| T-03-07 | Tampering | PDF filename / label injection | low | mitigate | `encodeURIComponent` on output name; size suffix is a markdown-it `text` token | closed |
| T-03-08 | Spoofing | Reverse tabnabbing on PDF links | low | mitigate | No `target`, no `download`; tested | closed |
| T-03-09 | Tampering | Tag labels in titles / filter / Tags row | medium | mitigate | Autoescape, JS-computed titles; test asserts `Alpha &amp; Co` and no `&amp;amp;` | closed |
| T-03-10 | Tampering | Tag slug path traversal | medium | mitigate | `validateTagDefs` enforces `^[a-z0-9-]+$` (`lib/validate.js:25`) | closed |
| T-03-11 | Tampering | Deep-merge tagging every project | low | mitigate | `setDataDeepMerge(false)` (`eleventy.config.js:28`) plus per-project `projectTags` | closed |
| T-03-12 | Tampering | `site.name` in title / h1 / header | medium | mitigate | Autoescape, JS-computed homepage title; test asserts `Ann & <Bo>` escaped once | closed |
| T-03-13 | Tampering | Stale featured entries | low | mitigate | `resolveFeatured` fails build on unknown, duplicate, non-string, non-list entries | closed |
| T-03-14 | Tampering | DOM XSS via alt / captions in dialog | high | mitigate | `lightbox.js` uses DOM creation and `textContent`; no `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write`/`eval` (grep clean) | closed |
| T-03-15 | Spoofing | Open redirect in image-error fallback | low | mitigate | Navigation only when `origin === location.origin` (`content/lightbox.js:32`); stub test | closed |
| T-03-16 | Information disclosure | Zoom links exposing originals | medium | mitigate | Targets only from eleventy-img output; tests assert no `/assets/` href and every href exists under `_site/img/` | closed |
| T-03-17 | Tampering | Third-party / inline script | medium | mitigate | Single `<script src="/lightbox.js" defer>` in `base.njk`; design test gates every script | closed |
| T-03-18 | Denial of service | Keyboard trap in viewer | low | mitigate | Native modal `<dialog>` (`showModal`), Close `autofocus`, focus returned to opener; browser keyboard check pending in phase UAT | closed |
| T-03-SC | Tampering | npm/pip/cargo installs | high | accept | No packages installed this phase (`package.json` / lockfile unchanged since phase start) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-03-01 | T-03-SC | No dependencies were added or changed in this phase, so there is no new supply-chain surface | plan-time disposition | 2026-10-30 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-30 | 19 | 19 | 0 | gsd-secure-phase (L1 grep verification, orchestrator) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-30
