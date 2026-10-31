---
phase: 01
slug: push-to-live-with-images
status: verified
threats_open: 0
asvs_level: 1
created: 2026-10-28
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry → local/CI build | Third-party packages (eleventy, eleventy-img, sharp, js-yaml) installed from the lockfile | Executable code (supply chain) |
| Owner's machine → git commit | Pre-commit hook rewrites pasted images and `.md` links before they enter history | Owner images (may carry EXIF/GPS), markdown |
| Markdown content → build output | Front matter (slugs) and image links decide file paths written under `_site/` | Owner-authored text and paths |
| GitHub Actions → GitHub Pages | Workflow builds, caches `_site/img`, and deploys with an OIDC token | Built site, Pages deploy token |
| Public repo / Pages → visitors | Everything committed and deployed is public | `.planning/`, shrunk `assets/`, HTML/images |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-01-SC | Tampering | npm installs | mitigate | Owner npmjs check before install (approved 2026-10-28); `package-lock.json` committed; `deploy.yml:26` `npm ci` | closed |
| T-01-01 | Tampering / Info disclosure | `lib/markdown.js` resolver | mitigate | `lib/assets.js:68-77` basename-only Map lookup; `lib/markdown.js:17` throws on miss | closed |
| T-01-02 | Info disclosure | `eleventy.config.js` passthrough | mitigate | Only stylesheet passthrough (`eleventy.config.js:30`); test `test/build.test.js:75` "originals not published" | closed |
| T-01-03 | Info disclosure | image derivative metadata | accept | eleventy-img/sharp drop metadata from derivatives; commit-time stripping covered by T-01-08 | closed |
| T-01-04 | Tampering | `lib/validate.js` slug → permalink | mitigate | `SLUG_RE = /^[a-z0-9-]+$/` (`lib/validate.js:10`, enforced `:58`); test `test/content-errors.test.js:55` | closed |
| T-01-05 | Tampering | reserved paths | mitigate | `RESERVED_SLUGS` (`lib/validate.js:5`, enforced `:59`); test `test/content-errors.test.js:52` | closed |
| T-01-06 | Denial of service | build | accept | Owner-authored content; failed build doesn't deploy | closed |
| T-01-07 | Info disclosure | error messages | accept | Repo-relative paths only; no secrets | closed |
| T-01-08 | Info disclosure | `scripts/shrink.js` EXIF/GPS | mitigate | No `withMetadata` (`scripts/shrink.js:116-118`); test `test/shrink.test.js:111`; CI blocks raw PNG/JPEG/HEIC (`scripts/check-assets.js:10`) | closed |
| T-01-09 | Tampering (command injection) | `scripts/shrink.js` git/sips calls | mitigate | `execFileSync` with arg arrays and `--` before paths (`scripts/shrink.js:6,95,125,154,156,179`); no `execSync` in `scripts/` or `lib/` | closed |
| T-01-10 | Denial of service (data loss) | `shrink.js` file replace | mitigate | Encode to temp, rename, then unlink original (`scripts/shrink.js:140-150`); errors exit 1 (`:100`) | closed |
| T-01-11 | Tampering (commit integrity) | index rewrite | mitigate | `hash-object -w` + `update-index --cacheinfo` (`scripts/shrink.js:190-192`); test `test/shrink.test.js:150` "no sweeping" | closed |
| T-01-12 | Denial of service | huge inputs (decompression bomb) | accept | Owner-supplied on own machine; size checked before decode | closed |
| T-01-13 | Tampering / XSS | SVG passthrough | accept | Owner-authored SVGs served via `<img>`, where scripts don't run | closed |
| T-01-14 | Denial of service | sharp metadata per rebuild | mitigate | size+mtime cache (`lib/assets.js:26-42`); 10 MB cap (`scripts/check-assets.js:8,34`) | closed |
| T-01-15 | Elevation of privilege | `deploy.yml` permissions | mitigate | `contents: read, pages: write, id-token: write` (`deploy.yml:8-11`); push-to-main + dispatch only; tests `test/workflow.test.js:17,55` | closed |
| T-01-16 | Tampering | third-party actions | mitigate | First-party `actions/*` only (`deploy.yml:21-50`), major-version pins; `npm ci` | closed |
| T-01-17 | Info disclosure | stale cached derivatives | mitigate | `prune:img` before upload (`deploy.yml:36`, `scripts/prune-img.js:36`); `du -sh _site` (`deploy.yml:37`); `test/prune-img.test.js` | closed |
| T-01-18 | Info disclosure | public repo exposes `.planning/` and `assets/` | accept | Owner approved public repo + push; `assets/` holds only shrunk, stripped WebP (check-assets) | closed |
| T-01-19 | Tampering | cache poisoning | accept | Cache only written by this repo's push-to-main runs; no fork PR workflows | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-01-03 | Derivatives are re-encoded without metadata; originals are stripped at commit (T-01-08) | Owner (plan-time; confirmed in secure-phase) | 2026-10-28 |
| AR-02 | T-01-06 | Content is owner-authored; a failed build simply doesn't deploy | Owner (plan-time; confirmed in secure-phase) | 2026-10-28 |
| AR-03 | T-01-07 | Error output contains only repo-relative paths; no secrets in the build | Owner (plan-time; confirmed in secure-phase) | 2026-10-28 |
| AR-04 | T-01-12 | Inputs are owner-supplied on the owner's machine; check-assets caps size | Owner (plan-time; confirmed in secure-phase) | 2026-10-28 |
| AR-05 | T-01-13 | SVGs are owner-authored and only rendered via `<img>` | Owner (plan-time; confirmed in secure-phase) | 2026-10-28 |
| AR-06 | T-01-18 | Owner explicitly chose a public repo and approved pushing `main` incl. `.planning/` | Owner (explicit, plan 01-05 Task 2) | 2026-10-28 |
| AR-07 | T-01-19 | Only main-branch push runs write the image cache | Owner (plan-time; confirmed in secure-phase) | 2026-10-28 |

*Accepted risks do not resurface in future audit runs.*

**Non-blocking notes from audit:** actions are pinned to major versions rather than SHAs (acceptable for first-party `actions/*` at ASVS 1). `resolveAsset` decodes percent-encoded names before taking the basename; the Map lookup still confines resolution to `assets/`.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-28 | 20 | 20 | 0 | gsd-security-auditor (13 mitigations verified in code) + owner (7 accepted) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-28
