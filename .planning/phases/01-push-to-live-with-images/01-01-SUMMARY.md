---
phase: 01-push-to-live-with-images
plan: 01
subsystem: build-pipeline
tags: [eleventy, eleventy-img, markdown-it, base-path, tdd]
requires: []
provides:
  - "Eleventy 3 build with basename asset resolver, responsive WebP/JPEG image transform, single PATH_PREFIX"
  - "makeSite() e2e test harness for later plans"
affects: [01-02, 01-03, 01-04, 01-05]
tech-stack:
  added: ["@11ty/eleventy 3.1.7", "@11ty/eleventy-img 7.1.1", "sharp 0.35.5", "js-yaml 4.3.2"]
  patterns: ["markdown-it core rule rewriting image src by basename", "HtmlBasePlugin with root-relative URLs only"]
key-files:
  created:
    - eleventy.config.js
    - lib/assets.js
    - lib/markdown.js
    - lib/images.js
    - lib/frontmatter.js
    - src/_includes/base.njk
    - src/_data/tags.js
    - content/index.md
    - content/style.css
    - content/projects/projects.11tydata.js
    - content/projects/tidepool-game.md
    - assets/tidepool-game-image.webp
    - .vscode/settings.json
    - test/helpers/site.js
    - test/build.test.js
    - package.json
    - package-lock.json
    - .gitignore
key-decisions:
  - "Packages approved by owner at Task 1 checkpoint (2026-10-28)"
  - "js-yaml kept at ^4 (latest is 5.5.0)"
  - "Unsafe slugs yield permalink false so plan 02 validation can report them"
requirements-completed: [AUTH-01, AUTH-02, IMG-01, IMG-02, IMG-03, PUB-02, PUB-03]
duration: ~15min
completed: 2026-10-28
---

# Phase 1 Plan 01: Walking skeleton, local half Summary

Eleventy 3 pipeline that turns `content/projects/*.md` plus basename-resolved `assets/` images into prefixed pages with responsive WebP/JPEG `<picture>` output and no originals published.

## Task 1 checkpoint (package legitimacy)

Owner replied "approved" on 2026-10-28. Registry evidence shown:
- @11ty/eleventy 3.1.7, repo github.com/11ty/buildawesome (renamed from 11ty/eleventy), maintainers zachleat and fortawesome-admin
- @11ty/eleventy-img 7.1.1, repo github.com/11ty/image (renamed), same maintainers
- sharp 0.35.5, github.com/lovell/sharp
- js-yaml: latest 5.5.0; plan pins ^4, kept (4.3.2 installed)

## Tasks and commits

| Task | Commit | Result |
| ---- | ------ | ------ |
| 1 Package check | n/a | Approved by owner |
| 2 Scaffold + failing e2e tests (RED) | 61fb52b | 7 tests failed for lack of config |
| 3 Engine: lib/ + eleventy.config.js | 4e7511b | `npx eleventy` exits 0 |
| 4 Layout, sample project, CSS, VS Code settings (GREEN) | 971c30c | 7/7 tests pass; dev server returns 200 at /portfolio-test/tidepool-game/ |

## Deviations from Plan

None to the engine or behavior. Minor notes:
- `makeSite` also exposes a `walk(rel)` helper (extra, used by tests).
- Dev-server check used the session scratchpad for logs instead of /tmp.

## Known Stubs

None. The sample asset is a generated gradient placeholder image, intentional for the sample project.

## Threat Flags

None beyond the plan's threat model (T-01-01 basename-only lookup, T-01-02 no assets passthrough, asserted by the "originals not published" test).

## Self-Check: PASSED
