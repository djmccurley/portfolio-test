---
status: diagnosed
trigger: "video-poster-not-shown: Self-hosted video shows its poster image before playback when poster= is set (UAT Test 4, gap G-02-4)"
created: 2026-10-30T00:00:00Z
updated: 2026-10-30T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - renderFileVideo appends `#t=0.001` to the video src unconditionally, including when poster= is set. With preload="metadata" the media fragment forces an initial seek; the browser leaves poster display mode and paints the video frame at 0.001s instead. That frame (frame 0 of this mp4) is pure black, so the user sees a black box, never the poster.
test: headless Chrome via CDP, 7 variants of the same video/poster pair (see Evidence)
expecting: poster visible only when the src has no `#t=` fragment (or preload=none)
next_action: return ROOT CAUSE FOUND to caller (goal: find_root_cause_only, no fix applied)
bug_class: Bohrbug (deterministic, reproduces every load)
known_pattern_candidate: none (no knowledge-base.md entries)

## Symptoms

expected: Self-hosted .mp4 plays with and without a poster, shows a first frame on iOS, and seeking works on the deployed GitHub Pages site. When `poster=` is given, the poster image should be visible before playback.
actual: User reported: "I don't see the poster image but the video deploys with and without poster."
errors: None reported (build succeeds)
reproduction: UAT Test 4. content/projects/tidepool-game.md (uncommitted) contains `::: video ../assets/tidepool-game-output.mp4 "Tidepool trailer" poster=../assets/poster.png` and the same mp4 in another block with no poster.
started: Discovered during UAT

## Eliminated

- hypothesis: poster file missing/mis-named in output (hash or filenameFormat mismatch, copyMedia cache skip)
  evidence: built page emits poster="/portfolio-test/video/poster-40c7f770.webp"; sha1(assets/poster.png)[0:8]=40c7f770 matches; _site/video/poster-40c7f770.webp exists (valid WebP 1600x1009, from assets/poster.png). A clean CI-like build in a repo copy (no _site, no .cache) also writes both poster-40c7f770.webp and the mp4. scripts/prune-img.js only touches _site/img, so it cannot delete video posters.
  timestamp: 2026-10-30

- hypothesis: poster URL lacks GitHub Pages path prefix
  evidence: HtmlBasePlugin rewrote both src and poster to /portfolio-test/video/... in built HTML.
  timestamp: 2026-10-30

- hypothesis: poster image is blank / fully transparent so it shows as black over `.embed video {background: var(--ink)}`
  evidence: assets/poster.png is RGBA but alpha mean 224/255 (mostly opaque); flattened-on-black render shows a clear game screenshot. In the headless Chrome control (variant B) the poster renders correctly over the same black background.
  timestamp: 2026-10-30

- hypothesis: CSS hides the poster
  evidence: .embed video only sets display:block, width:100%, height:auto, background:var(--ink). Variant B (same markup minus the fragment) shows the poster fine with equivalent CSS.
  timestamp: 2026-10-30

- hypothesis: poster file name / asset resolution (resolveAsset basename, case-insensitive) fails
  evidence: assets/poster.png exists with exactly that name; build prints "Processing ./assets/poster.png" and does not fail.
  timestamp: 2026-10-30

## Evidence

- timestamp: 2026-10-30
  checked: built tidepool-game/index.html (scratch build, and a clean repo-copy build)
  found: `<video controls="" preload="metadata" src="/portfolio-test/video/tidepool-game-output.mp4#t=0.001" poster="/portfolio-test/video/poster-40c7f770.webp" aria-label="Tidepool trailer">` (and the no-poster block has the same src with #t=0.001)
  implication: server output is correct and the poster URL is valid; the src carries `#t=0.001` even when poster is set

- timestamp: 2026-10-30
  checked: lib/media.js renderFileVideo lines 49-53
  found: `const url = /video/<name>` then `src="${url}#t=0.001"` is emitted for every file video, with posterAttr appended after it. No branch on `poster`.
  implication: the fragment is applied to poster and no-poster blocks alike. 02-CONTEXT.md line 93 shows the `#t=0.001` trick was intended for the no-poster case ("Without a poster=, rely on preload=metadata ... #t=0.001 trick").

- timestamp: 2026-10-30
  checked: headless Chrome (Google Chrome app, --headless=new, CDP) on a Range-capable local server, same mp4 + same poster webp, `.embed video`-equivalent CSS
  found: |
    A  #t=0.001 + poster + preload=metadata (CURRENT): poster NOT shown. readyState 4, currentTime 0.001, box height 356px (video aspect 1152x1080, i.e. display mode switched to video), black frame painted.
    B  no fragment + poster + preload=metadata: poster SHOWN. box height 240px (poster aspect).
    C  #t=0.001, no poster (current no-poster block): black frame.
    D  no fragment, no poster, preload=metadata: black (Chrome paints no frame).
    E  #t=0.001, no poster, preload=auto: black at currentTime 0.001.
    F  #t=1 + poster + preload=metadata: poster NOT shown; video frame at 1 s (green title screen) shown instead.
    G  #t=0.001 + poster + preload=none: poster SHOWN (readyState 0, no seek happens).
  implication: any `#t=` fragment together with preload=metadata makes Chrome seek on load and drop the poster for the sought frame. Removing the fragment (B) or deferring loading (G) restores the poster. Single-variable difference A vs B isolates the fragment as the cause.

- timestamp: 2026-10-30
  checked: ffprobe/ffmpeg on assets/tidepool-game-output.mp4 (h264 yuvj420p 1152x1080, 13.6 s, 60 fps)
  found: frame at pts 0.000 is pure black (mean luma 0.0); every frame from pts 0.0167 onward is the green "PRODUCTIVITY MASTER" title screen (luma 36.2). `#t=0.001` lands on frame 0.
  implication: the frame the browser paints in place of the poster is black, so the symptom reads as "no poster, black box" rather than "wrong image". Also means the no-poster block's iOS "first frame" is black for this particular clip (content quirk, not a code bug).

- timestamp: 2026-10-30
  checked: web search on the `#t=0.001` trick, WebKit bugs
  found: The trick is community-sourced to make iOS Safari render a frame INSTEAD of a poster (muffinman.io, Apple forums 129377, WebKit bug 197608). WebKit bug 225963 notes the poster is hidden when seeking to currentTime=0, which the spec allows.
  implication: Safari/iOS behaves the same way by design; the fragment and a poster are mutually exclusive ways to get a thumbnail. Safari not driven directly (blind spot).

- timestamp: 2026-10-30
  checked: live site https://djmccurley.github.io/portfolio-test/tidepool-game/video/*
  found: 404 for both the poster and the mp4 (the test content is uncommitted, so the live site does not have it yet)
  implication: the user's observation came from the local build/dev server (or an earlier deploy); not a deploy-side cause. Behavior is deterministic in the browser regardless.

## Resolution

root_cause: In lib/media.js renderFileVideo, the video src is always emitted as `<url>#t=0.001` (line 53), including when `poster=` is set. With preload="metadata" the media fragment makes the browser seek to 0.001s on load; in that state Chrome (verified) and WebKit (documented) leave poster display mode and paint the video frame instead of the poster. This clip's frame 0 is pure black, so the user sees a black box. The `#t=0.001` hack is meant to produce a first-frame thumbnail when NO poster exists; applying it unconditionally defeats poster=.
fix: (not applied - find_root_cause_only)
verification: (not applicable)
files_changed: []
