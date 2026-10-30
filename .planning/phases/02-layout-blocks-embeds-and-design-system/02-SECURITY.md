---
phase: 02
slug: layout-blocks-embeds-and-design-system
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-10-30
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Owner-authored markdown → build | Fence params, captions and brace attributes are parsed at build time and written into HTML | Owner-authored text |
| npm registry → repo | markdown-it-container and markdown-it-attrs enter package-lock.json | Executable code (supply chain) |
| Visitor browser → Google Fonts | Page shell loads a stylesheet and fonts from fonts.googleapis.com / fonts.gstatic.com | Visitor IP, referrer |
| Owner-authored markdown → build console | Alt text and image paths are echoed to the terminal / CI log | Owner-authored text |
| Owner-authored fence args → iframe HTML | URLs and titles become attribute values | Owner-authored URLs and titles |
| Visitor browser → YouTube, Vimeo, itch.io | Iframes load cross-origin content | Visitor IP, origin-only referrer |
| assets/ → published site | Referenced videos and processed posters are copied to `_site/video/` | Owner media (public) |
| Owner-authored fence args → filesystem | Video and poster paths are used to look up files | Owner-authored paths |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-01 | Tampering | lib/blocks.js figcaption from image title | medium | mitigate | `md.utils.escapeHtml(title)` into `<figcaption>`; title attr filtered off the `<img>` (lib/blocks.js:206-209) | closed |
| T-02-02 | Tampering | markdown-it-attrs brace attributes | medium | mitigate | `allowedAttributes: ["class", "decorative"]` (lib/blocks.js:83); `onclick` asserted absent in test/blocks.test.js | closed |
| T-02-03 | Denial of service | Unclosed or malformed fences | low | mitigate | `loc.fail` on unknown and unclosed blocks with file:line (lib/blocks.js:123-130) | closed |
| T-02-04 | Elevation of privilege | Raw HTML passthrough (AUTH-04) | low | accept | Owner-authored by design; only the repo owner can push | closed |
| T-02-05 | Information disclosure | Google Fonts link (IP, referrer to Google) | low | accept | Owner's choice D-10; design test asserts no `<script>` on any page | closed |
| T-02-06 | Tampering | Google Fonts stylesheet content | low | accept | CSS cannot execute script; system font fallback | closed |
| T-02-07 | Tampering | warnAlt console output (escape sequences) | low | accept | Owner's own terminal / CI log only; nothing written to the site | closed |
| T-02-08 | Denial of service | Alt-lint regexes on large raw HTML | low | mitigate | Linear `/<img\b[^>]*>/gi` plus single-attribute matchers (lib/alt-lint.js:71) | closed |
| T-02-09 | Spoofing | videoEmbedSrc host matching | high | mitigate | `new URL()`, exact-host Sets, protocol check, src rebuilt from regex-validated ID (lib/embeds.js:6-83); hostile inputs tested in test/embeds.test.js | closed |
| T-02-10 | Tampering | Attribute injection via fence title/URL | high | mitigate | `escapeAttr` on every attribute and text node (lib/embeds.js:23,120,157-161) | closed |
| T-02-11 | Elevation of privilege | itch iframe runs third-party scripts | medium | mitigate | https only, host allow-list itch.io / *.itch.io / *.itch.zone, `allow="fullscreen"` (lib/embeds.js:18-19,148-160) | closed |
| T-02-12 | Information disclosure | Tracking cookies/referrer to video providers | medium | mitigate | youtube-nocookie, Vimeo `dnt=1`, `referrerpolicy="strict-origin-when-cross-origin"` (lib/embeds.js:61,83,122) | closed |
| T-02-13 | Denial of service | Oversized videos vs Pages limits | medium | mitigate | 50 MB cap from lib/limits.js enforced at render (lib/media.js:31), CI (scripts/check-assets.js:38) and commit (scripts/shrink.js:235) | closed |
| T-02-14 | Information disclosure | Publishing unreferenced/original files | medium | mitigate | Only `::: video`-registered files copied; tests assert unreferenced video and `_site/assets` absent (test/video.test.js:64, test/build.test.js:82) | closed |
| T-02-15 | Tampering | Path traversal via video/poster paths | medium | mitigate | `resolveAsset` takes `path.basename` and looks it up in the assets/ index only (lib/assets.js:68-79) | closed |
| T-02-16 | Tampering | Attribute injection via video title | medium | mitigate | `esc()` on `aria-label` and fallback text; `encodeURIComponent` on file names (lib/media.js:10-11,45-53) | closed |
| T-02-SC | Tampering | npm installs (markdown-it-container, markdown-it-attrs) | high | mitigate | Packages audited in RESEARCH, caret-pinned in lockfile, no `postinstall`; CI uses `npm ci` | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-04 | Raw HTML is owner-authored by design (AUTH-04); only the repo owner can push content | Plan 02-01 threat model | 2026-10-29 |
| AR-02-02 | T-02-05 | Google Fonts over self-hosting is the owner's explicit choice (D-10) | Plan 02-02 threat model | 2026-10-29 |
| AR-02-03 | T-02-06 | A tampered stylesheet can only change CSS; system font fallback keeps the page usable | Plan 02-02 threat model | 2026-10-29 |
| AR-02-04 | T-02-07 | Alt-lint output only reaches the owner's terminal or CI log | Plan 02-03 threat model | 2026-10-29 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-30 | 17 | 17 | 0 | secure-phase orchestrator (ASVS L1 grep-depth; 170/170 tests passing) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-30
