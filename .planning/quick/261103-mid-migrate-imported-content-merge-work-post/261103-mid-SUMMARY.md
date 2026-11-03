---
phase: quick-261103-mid
plan: 01
subsystem: content-migration
tags: [migration, content, images, cv]
status: complete
key-files:
  created:
    - content/projects/*.md (22 imported work projects)
    - assets/ (216 images + 1 PDF, jpg/png shrunk to .webp)
  modified:
    - content/pages/cv.md
    - src/_includes/card.njk
decisions:
  - "Animated GIF card covers are emitted as webp,gif (not webp,jpeg) so long GIFs do not hit libvips' 65500px JPEG limit"
actuals:
  tokens: 45000
  tasks: 3
  commits: 4
plan_head_before: 252a26c5f86cb0ac5c23d4006fc850f6e7d63869
plan_head_after: 714b7ddee9b1ed58902b86fb992979013633cc0f
commits:
  - e973d53 content: migrate procedural-riso-zines (tracer, 13 paths)
  - 3064c71 fix: force webp,gif for animated gif card covers (src/_includes/card.njk)
  - 8b2477d content: migrate 21 imported work projects and their images (226 paths)
  - 714b7dd content: merge imported CV into cv page
---

# Phase quick-261103-mid Plan 01: Migrate imported content Summary

22 Squarespace work posts, 216 images, one PDF and the CV now live as plain markdown pages; no videos were copied, and each local video spot holds a grep-able `TODO(video)` comment.

`npm run build` exits 0, `npm test` passes (365/365), and `npm run check:assets` reports only the owner's 3 untracked `new-project-image*.png` (expected).

## Tags assigned (inferred, please review)

| Project | Tags |
|---|---|
| 3d-printed-figures | art |
| all-money-removed | art |
| ao-mobile-app | ux |
| call-and-response | games, art |
| can-u-mow | games, art |
| diy-projectors | graphic, art |
| enclosure | games |
| free-jazz-commandos | games |
| grocery-design-system | ux |
| hyvee-food-service-kiosk | ux |
| internal-os | ux, art |
| iowa | games |
| little-village | graphic |
| merge | games, art |
| modular-emotions | art |
| modular-zen-garden | art |
| procedural-riso-zines | graphic |
| remixed-signs | graphic, art |
| techno-lumina | art, graphic |
| times | art |
| up-yours-reynolds | graphic |
| wilbur | art |

Changing one is a one-line edit of the `tags:` line in `content/projects/<slug>.md`.

## Date TODOs (comment now on the line above `date:`)

3d-printed-figures (2019), ao-mobile-app (2019), enclosure (2024, "confirm (taken from page text)"), modular-zen-garden (2019), techno-lumina (2019), up-yours-reynolds (2019). All "real year unknown (Squarespace placeholder date)" except enclosure. Texts unchanged.

## TODO(video) locations

Find them with `grep -rn 'TODO(video)' content/`. Upload the original from `imported-content/assets/<name>.mp4` to YouTube, then replace the comment with a block: a line `::: video https://youtu.be/VIDEO_ID "Title"` followed by a closing `:::` line (title is required).

- content/projects/procedural-riso-zines.md:18 (procedural-riso-zines-video-1.mp4)
- content/projects/diy-projectors.md:32 (diy-projectors-video-1.mp4)
- content/projects/iowa.md:18 (iowa-video-1.mp4)
- content/projects/internal-os.md:16 (internal-os-video-1.mp4)
- content/projects/free-jazz-commandos.md:30 (free-jazz-commandos-video-1.mp4)

The 3 existing YouTube blocks (free-jazz-commandos, merge, can-u-mow) are unchanged.

## Notes for the owner

- `internal-os-cover.gif` was re-encoded from 14.6 MiB to 5.5 MiB (714x533, 103 frames kept); the original is still in `imported-content/assets/`.
- The merge PDF was renamed by the shrink step to `s2026-artgr-6100-dmccurley-nkhoury-collaborative-interventions.pdf`, and the link in merge.md was rewritten.
- `imported-content/` is still on disk and untracked; delete it after uploading the videos.
- CV: Experience (from "Professional experience") and Education sit under the existing headings; Courses taught, Selected activities, Languages and Exhibitions & festivals follow. All 6 sections verbatim, 75 hard line breaks kept, scaffold bullets removed.
- Built `_site/` is now about 328 MB (processed responsive images for about 300 sources). Under the 1 GB Pages cap but worth watching as more projects are added.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Build failed on animated GIF card covers**
- **Found during:** Task 2 build
- **Issue:** `src/_includes/card.njk` let eleventy-img emit webp+jpeg for covers. can-u-mow-cover.gif (150 frames x 768px) and iowa-cover.gif (161 frames x 711px) stack frames into an image taller than libvips' 65500px JPEG limit, aborting `/work/` with "VipsJpeg: Maximum supported image dimension is 65500 pixels".
- **Fix:** card images whose cover ends in `.gif` now get `eleventy:formats="webp,gif"`, the same rule lib/markdown.js already applies to GIFs in page bodies.
- **Files modified:** src/_includes/card.njk
- **Commit:** 3064c71 (separate commit, so the migration commit still holds exactly the planned 226 paths)

No other deviations. Per-task HEAD file counts were 13 / 226 / 1 as planned (plus the 1-file fix commit).

## Auth gates

None.

## Known Stubs

None. The 5 `TODO(video)` HTML comments are intentional placeholders, listed above.

## Threat Flags

None.

## Self-Check: PASSED

- Commits e973d53, 3064c71, 8b2477d, 714b7dd exist on main.
- All 22 `_site/<slug>/index.html` pages exist and are listed on `_site/work/index.html`; no `.mp4` in `assets/` or `_site/` except the pre-existing tidepool-game-output.mp4.
- Owner's files and `imported-content/` byte-identical before and after (`cmp` of snapshot); `git ls-files imported-content` is empty.
