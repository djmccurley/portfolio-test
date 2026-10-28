# Phase 1: Push-to-Live with Images - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log preserves the alternatives considered.

**Date:** 2026-10-28
**Phase:** 01-push-to-live-with-images
**Areas discussed:** Content folders & URLs, Paste plugin & link format, Commit-time image shrinking, Hosting target & build output

---

## Content folders & URLs

| Question | Options | Selected |
|----------|---------|----------|
| Project file location | content/projects/ · projects/ at root · one folder per project | content/projects/ |
| URL shape | /projects/slug/ · /slug/ · /work/slug/ | /slug/ |
| Slug source | Filename · Slugified title | Filename |
| Tag strictness | Fixed list, fail · Fixed list, warn · Free-form normalised | Fixed list, fail |
| Required front matter | title · date · tags · cover + cover_alt | All four |
| Tag page URLs | /tags/games/ · /games/ | /tags/games/ |
| Date format | Partial allowed · Full date only | Partial allowed |
| Metadata structure | Fixed optional fields · Free key-value · Both | Fixed optional fields |

**Notes:** The owner chose /slug/ over the recommended /projects/slug/. The build must catch slug collisions.

---

## Paste plugin & link format

| Question | Options | Selected |
|----------|---------|----------|
| Paste tool | VS Code built-in · Existing extension · You pick | VS Code built-in |
| Filename scheme | Slug + auto-number · Slug + timestamp | Slug + auto-number |
| Renames | Build fails until fixed · Tool rewrites links | Build fails |
| Commit .vscode/settings.json | Yes · No | Yes |

**Notes:** The owner asked whether the prefix is added automatically when pasting, since they mostly paste screenshots. Explained that the built-in paste adds the prefix via `markdown.copyFiles.destination` and auto-numbers repeats, and that timestamps likely need an extension. The owner said either a timestamp or a numbered suffix would work and picked the numbered suffix.

---

## Commit-time image shrinking

| Question | Options | Selected |
|----------|---------|----------|
| Where it runs | Pre-commit hook · Manual npm script · CI commits back | Pre-commit hook |
| Originals | Delete · Move to ignored folder | Delete |
| PNG conversion | Lossless WebP for PNG · Lossy all · Lossless only if transparent | Lossless WebP for PNG |
| GIF/SVG/HEIC | Untouched + HEIC converted · GIF to MP4 · Reject | Untouched + HEIC converted |
| Filename cleanup | Slugify · Leave | Slugify |
| Max edge | 3000px · 2400px · 4000px | 3000px |
| EXIF | Strip after auto-rotate · Keep | Strip |
| CI guard | Fail · Warn | Fail |

---

## Hosting target & build output

| Question | Options | Selected |
|----------|---------|----------|
| First host | github.io/repo subpath · github.io root · Custom domain | github.io/repo subpath |
| Formats | WebP + JPEG · AVIF + WebP + JPEG · WebP only | WebP + fallback |
| Phase 1 look | Bare semantic HTML · Start brutalist CSS | Bare semantic HTML |
| Strictness | Fail on all content errors · Fail in CI, warn locally | Fail on all |

**Notes:** Claude noted that transparent images can't fall back to JPEG. The exact fallback is left to research.

---

## Claude's Discretion

- The fallback format for transparent images
- Responsive widths, `sizes`, and loading of the first image
- The dev fast mode for images
- The hook installer
- 404 content
- The reserved-slug list
- The CI size cap

## Deferred Ideas

None
