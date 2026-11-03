---
phase: quick-261103-mid
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - content/projects/procedural-riso-zines.md
  - content/projects/3d-printed-figures.md
  - content/projects/all-money-removed.md
  - content/projects/ao-mobile-app.md
  - content/projects/call-and-response.md
  - content/projects/can-u-mow.md
  - content/projects/diy-projectors.md
  - content/projects/enclosure.md
  - content/projects/free-jazz-commandos.md
  - content/projects/grocery-design-system.md
  - content/projects/hyvee-food-service-kiosk.md
  - content/projects/internal-os.md
  - content/projects/iowa.md
  - content/projects/little-village.md
  - content/projects/merge.md
  - content/projects/modular-emotions.md
  - content/projects/modular-zen-garden.md
  - content/projects/remixed-signs.md
  - content/projects/techno-lumina.md
  - content/projects/times.md
  - content/projects/up-yours-reynolds.md
  - content/projects/wilbur.md
  - content/pages/cv.md
  - "assets/<project-slug>-*.webp|.gif (216 imported images, one prefix per project above; .jpg/.png become .webp via scripts/shrink.js)"
  - assets/s2026-artgr-6100-dmccurley-nkhoury-collaborative-interventions.pdf
autonomous: true
requirements: [QUICK-261103-mid]

estimate:
  tokens: 45000
  raw_tokens: 45000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "All 22 imported work projects build to _site/<slug>/index.html and are linked from _site/work/index.html"
    - "Every image and PDF the migrated pages reference resolves to a file in assets/ (jpg/png converted to .webp by scripts/shrink.js, the same script the pre-commit hook runs)"
    - "No imported .mp4 exists in assets/ or _site/; each of the 5 local-video spots holds exactly one `<!-- TODO(video): upload imported-content/assets/<name>.mp4 ...` comment, and the 3 existing YouTube video blocks are unchanged"
    - "/cv/ shows all six imported CV sections verbatim inside the existing page: existing front matter (title: CV) and its Experience/Education headings kept, scaffold placeholder bullets gone"
    - "The 6 imported date TODO notes are kept verbatim as YAML comment lines, and `npm run build` exits 0"
    - "imported-content/ is untouched and untracked, and the owner's unrelated uncommitted files (lava-poster.md, featured.js, new-project.md, new-project-image*.png) are byte-identical and never staged"
  artifacts:
    - path: content/projects/procedural-riso-zines.md
      provides: "Tracer project: migrated page with tags, .webp links and a TODO(video) comment"
      contains: "TODO(video): upload imported-content/assets/procedural-riso-zines-video-1.mp4"
    - path: content/projects/merge.md
      provides: "Project with the PDF link rewritten to the slugged PDF name"
      contains: "s2026-artgr-6100-dmccurley-nkhoury-collaborative-interventions.pdf"
    - path: assets/internal-os-cover.gif
      provides: "Re-encoded animated cover under the 10 MiB GIF cap (714x533, 103 frames)"
    - path: content/pages/cv.md
      provides: "Merged CV page"
      contains: "Adjunct Instructor"
  key_links:
    - from: "content/projects/*.md image/cover links (../../assets/<name>)"
      to: "assets/<name>"
      via: "lib/markdown.js installAssetResolver + lib/assets.js resolveAsset (case-insensitive basename match)"
      pattern: "assets/"
    - from: "staged assets/*.jpg|png"
      to: "assets/*.webp + rewritten .md links (index blob and working tree)"
      via: "node scripts/shrink.js --staged (identical to .githooks/pre-commit)"
      pattern: "\\.webp"
    - from: "content/projects/merge.md PDF link"
      to: "_site/pdf/s2026-artgr-6100-dmccurley-nkhoury-collaborative-interventions.pdf"
      via: "lib/markdown.js registerPdf + lib/media.js copyMedia"
      pattern: "/pdf/"
---

<objective>
Migrate the owner's imported Squarespace export into the site, per the user's request:
U-1 merge the 22 work posts (imported-content/content/work/*.md) into content/projects/;
U-2 copy their images (and the one referenced PDF) into assets/, with optimization left to the repo's commit-time shrink step;
U-3 merge imported-content/content/pages/cv.md into the existing content/pages/cv.md;
U-4 copy NO videos. Each of the 5 local .mp4 video blocks becomes a grep-able `TODO(video)` placeholder so the owner can upload the originals to YouTube and swap in the links by hand.

Purpose: the whole back catalogue goes live as plain markdown pages with no manual reformatting.
Output: 22 new project pages, a merged CV page, 217 new asset files (216 images + 1 PDF), 3 atomic commits.

Three build/commit blockers found while planning are fixed as part of this plan. Each fix is the smallest change that keeps U-1..U-4 working:
(a) every imported file has `tags: []`, which lib/validate.js rejects, so tags are assigned from the existing 4 tag slugs;
(b) `date: 2019  # TODO: ...` parses as a YAML number and Eleventy aborts on a non-string date, so the comment moves to its own line, text unchanged;
(c) imported-content/assets/internal-os-cover.gif is 14.6 MiB, over the 10 MiB GIF cap enforced by the pre-commit hook and CI (shrink cannot resize GIFs), so it is re-encoded.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@content/projects/tidepool-game.md
@content/pages/cv.md
@imported-content/content/pages/cv.md

<interfaces>
Facts verified at planning time. Do not re-derive them by reading lib/ unless something fails.

- Projects collection = content/projects/*.md. Permalink = `/${slug || fileSlug}/index.html`. Every imported file carries `slug:` equal to its file name. Keep it (allowed key, no collisions with lava-poster/new-project/tidepool-game, none reserved).
- lib/validate.js PROJECT_KEYS allows title,date,tags,cover,cover_alt,summary,description,slug,role,client,tools,year,link,draft,heading,hideHeading,layout,permalink,eleventyExcludeFromCollections, so the imported `heading:` and `link:` keys are fine. Required: title,date,tags,cover,cover_alt. `tags` must list ≥1 slug from src/_data/tags.js: graphic, ux, art, games. `tags: []` fails the build.
- lib/frontmatter.js parseFrontMatter quotes `date: YYYY` only when nothing follows on the line. With a trailing `# comment`, YAML yields a number and Eleventy throws "Data cascade value for `date` (2019) is invalid". Verified.
- Image resolution: lib/assets.js resolveAsset matches by lowercase basename only, so `../assets/x` and `../../assets/x` both resolve. A missing file aborts the build with "image not found in assets/".
- Video block syntax (README.md, lib/embeds.js): YouTube is `::: video https://youtu.be/<11-char id> "Title"` followed by a closing `:::` line. The quoted title is required.
- markdown-it runs with html: true (node_modules/@11ty/eleventy/src/Engines/Markdown.js), so a one-line `<!-- ... -->` is a raw html_block. It renders nothing visible and passes lint (lib/alt-lint.js only inspects <img>). Markdown files are pre-processed by Nunjucks, so the comment text must not contain `{{`, `{%` or `{#`, and must not contain a double hyphen except in its own delimiters.
- scripts/shrink.js `--staged` (exactly what .githooks/pre-commit runs; core.hooksPath=.githooks is set) only touches files STAGED under assets/: .jpg becomes lossy .webp (q82), .png becomes lossless .webp, both capped at a 3000px edge with metadata stripped. Non-slug names (the PDF) are renamed to slug form. It `git rm --cached`s the old name, `git add`s the new one, deletes the original from disk, and rewrites links in every content/**/*.md (index blob for indexed files, plus the working tree). It FAILS on any staged GIF over 10 MiB or 3000px. A second run on already-converted files is a no-op.
- `npm run shrink` (manual mode, no --staged) processes EVERY file in assets/, including the owner's untracked new-project-image*.png, and would rewrite the owner's uncommitted new-project.md. NEVER run it in this task.
- `npm run check:assets` at HEAD already reports exactly 3 errors: the owner's untracked assets/new-project-image.png, -1.png and -2.png ("unconverted .png"). Those 3 are expected. Any other line is a failure.
- Imported asset facts: 222 files = 168 jpg + 31 png + 17 gif + 5 mp4 + 1 pdf. Every one is referenced by the imported markdown. No name or stem collides with existing assets/ or within the import. Every name except the PDF is prefixed `<project-slug>-`. GIFs other than internal-os-cover.gif are ≤4 MiB and ≤1855px. PDF = 13.2 MB (cap 25 MB), referenced from merge.md as `../../assets/S2026_ARTGR_6100_DMcCurley_NKhoury_Collaborative_Interventions.pdf`. After shrink it becomes `s2026-artgr-6100-dmccurley-nkhoury-collaborative-interventions.pdf`.
- The 5 local video blocks, each a 2-line block `::: video ../assets/<name>.mp4` + `:::` with no title: procedural-riso-zines (procedural-riso-zines-video-1), diy-projectors (diy-projectors-video-1), iowa (iowa-video-1), internal-os (internal-os-video-1), free-jazz-commandos (free-jazz-commandos-video-1). Keep the YouTube blocks in free-jazz-commandos.md, merge.md and can-u-mow.md exactly as they are.
- Baseline `npm run build` on the current working tree passes (verified).
</interfaces>

GIT SAFETY (applies to every task, non-negotiable):
- The working tree holds the owner's unrelated uncommitted work: ` M content/projects/lava-poster.md`, ` M src/_data/featured.js`, `?? content/projects/new-project.md`, `?? assets/new-project-image.png`, `?? assets/new-project-image-1.png`, `?? assets/new-project-image-2.png`. Never stage, modify, convert or commit any of them.
- Never `git add -A`, `git add .`, `git add assets` or `git commit -a`. Stage explicit file paths only.
- Never stage anything under imported-content/. It stays untracked and untouched (330 MB, including a 99 MB video). Copy from it, never move.
- Commit with plain `git commit -m ...` so .githooks/pre-commit runs. Never use `--no-verify`.
- Run sequentially on the main tree. No worktree, because imported-content/ is untracked and would not exist there.
- Long commands: `node scripts/shrink.js --staged` and `npm run build` can take several minutes in Task 2 (~190 conversions, then ~205 new images × 4 widths × 2 formats plus animated GIFs). Use a 600000 ms timeout, or run_in_background and wait for the exit notification. Send build output to `.cache/migrate-build.log` (`.cache/` is gitignored) and read only its tail.
</context>

<tasks>

<task type="tracer">
  <name>Task 1: Tracer: migrate procedural-riso-zines end-to-end (copy, front matter, video TODO, shrink, build, commit)</name>
  <files>content/projects/procedural-riso-zines.md, assets/procedural-riso-zines-*.{webp,gif} (12 files: 4 jpg + 6 png become .webp, 2 gif)</files>
  <precondition>`git diff --cached --name-only` prints nothing (the index holds none of the owner's work) and `git config core.hooksPath` prints `.githooks`. If either is false, halt and report.</precondition>
  <action>
This one project covers every file type and step the migration needs (jpg, png, gif, a local video, front matter, shrink conversion, link rewrite, build), so it proves the path before the bulk run. Implements U-1, U-2, U-4.

0. Snapshot the owner's files and the import so Task 3 can prove they are unchanged. Run `mkdir -p .cache`, then redirect the output of these three commands, run in sequence inside one `{ ...; }` group with no pipe, into `.cache/user-files.before`: `git diff -- content/projects/lava-poster.md src/_data/featured.js`, `shasum content/projects/new-project.md assets/new-project-image.png assets/new-project-image-1.png assets/new-project-image-2.png`, `ls -lRT imported-content`. Check that the file is non-empty.
1. Copy (cp, never mv) the 12 non-video files whose names start with `procedural-riso-zines-` from imported-content/assets/ into assets/. Build the list with `ls imported-content/assets | grep '^procedural-riso-zines-' | grep -v '\.mp4$'`. Do NOT copy procedural-riso-zines-video-1.mp4.
2. Copy imported-content/content/work/procedural-riso-zines.md to content/projects/procedural-riso-zines.md. Keep all content verbatim, including `slug:`, alt text, captions and `::: grid-N` blocks.
3. Front matter: change the `tags: []` line to `tags: [graphic]`. The project is p5.js/riso procedural zine layouts, which is graphic design.
4. Replace the 2-line local video block (the line `::: video ../assets/procedural-riso-zines-video-1.mp4` and the `:::` line right after it) with this single line, exactly: `<!-- TODO(video): upload imported-content/assets/procedural-riso-zines-video-1.mp4 to YouTube, then replace this comment with a YouTube block: a line ::: video https://youtu.be/VIDEO_ID "Title" followed by a closing ::: line (the title is required) -->`. Keep the `## demo video` heading above it and the blank lines around it. It is an HTML comment rather than visible text, so pushing before the YouTube link exists shows no placeholder text and no broken player on the live site. The owner finds it with `grep -rn 'TODO(video)' content/`.
5. Stage explicit paths only: content/projects/procedural-riso-zines.md plus `assets/<name>` for each of the 12 copied names. Run `git diff --cached --name-only` and confirm it lists exactly these 13 paths.
6. Run `node scripts/shrink.js --staged`. This is the pre-commit hook's own optimization, run now so the build checks the final files. It converts the 4 jpg and 6 png to .webp, re-stages them, deletes the originals from assets/ and rewrites the links in the .md file (index and working tree). Do NOT run `npm run shrink`.
7. Run `npm run build > .cache/migrate-build.log 2>&1` and check that it exits 0. If it fails, read the tail of the log, fix, re-stage the explicit path and rebuild.
8. Commit with `git commit -m "content(261103-mid): migrate procedural-riso-zines from imported content"`, adding the attribution trailer per execution protocol. The hook re-runs shrink and does nothing.
  </action>
  <verify>
    <automated>grep -qxF 'tags: [graphic]' content/projects/procedural-riso-zines.md && grep -q '^<!-- TODO(video): upload imported-content/assets/procedural-riso-zines-video-1.mp4 ' content/projects/procedural-riso-zines.md && test "$(grep -cE '^::: video \.\./' content/projects/procedural-riso-zines.md)" = 0 && test "$(grep -cE 'assets/[^ )"]*\.(jpg|jpeg|png)([)" ]|$)' content/projects/procedural-riso-zines.md)" = 0 && grep -q '<!-- TODO(video)' _site/procedural-riso-zines/index.html && test "$(grep -c '<video' _site/procedural-riso-zines/index.html)" = 0 && test -z "$(find assets _site -name 'procedural-riso-zines-video-1.mp4')" && git show --name-only --format= HEAD > .cache/head-files.txt && test "$(wc -l < .cache/head-files.txt | tr -d ' ')" -eq 13 && test "$(grep -cE '^(imported-content/|src/_data/featured\.js|content/projects/(lava-poster|new-project)\.md|assets/new-project-image)' .cache/head-files.txt)" = 0 && node -e 'const fs=require("fs");const have=new Set(fs.readdirSync("assets").map(n=>n.toLowerCase()));const bad=[];for(const f of process.argv.slice(1))for(const m of fs.readFileSync(f,"utf8").matchAll(/(?<!imported-content\/)assets\/([^\s)"]+)/g))if(!have.has(decodeURIComponent(m[1]).toLowerCase()))bad.push(f+": "+m[1]);console.log(bad.join("\n")||"refs ok");process.exit(bad.length?1:0)' content/projects/procedural-riso-zines.md</automated>
  </verify>
  <done>_site/procedural-riso-zines/index.html is built, with its images served from .webp/.gif sources in assets/ and the TODO(video) comment in the page source. No .mp4 was copied. HEAD contains exactly those 13 paths and none of the owner's files or imported-content/. .cache/user-files.before exists.</done>
</task>

<task type="auto">
  <name>Task 2: Expand: migrate the other 21 projects plus their 205 assets (tags, date comments, 4 video TODOs, oversized GIF, PDF)</name>
  <files>content/projects/{3d-printed-figures,all-money-removed,ao-mobile-app,call-and-response,can-u-mow,diy-projectors,enclosure,free-jazz-commandos,grocery-design-system,hyvee-food-service-kiosk,internal-os,iowa,little-village,merge,modular-emotions,modular-zen-garden,remixed-signs,techno-lumina,times,up-yours-reynolds,wilbur}.md, assets/ (204 images + 1 PDF)</files>
  <reversibility rating="reversible">The tag assignment is an editorial guess on the owner's behalf. Changing it is a one-line front matter edit per file, and the import originals stay in imported-content/.</reversibility>
  <action>
Implements U-1, U-2 and U-4 for every remaining project, following the path Task 1 proved.

1. Copy assets with cp, never mv. Copy every file in imported-content/assets/ EXCEPT .mp4 files and EXCEPT names starting with `procedural-riso-zines-` (Task 1 already converted those to .webp and removed the originals, so copying them again would bring back unconverted .jpg/.png). Build the list with `ls imported-content/assets | grep -v -E '^procedural-riso-zines-|\.mp4$'`, which gives 205 names: 204 images plus the PDF. `ls` skips dotfiles, so no .DS_Store is copied. Never copy any .mp4.
2. Oversized GIF: overwrite assets/internal-os-cover.gif with a re-encode of imported-content/assets/internal-os-cover.gif (14.6 MiB, over the 10 MiB cap that the pre-commit hook and CI both enforce, and shrink cannot resize GIFs). Use a one-off `node --input-type=module -e` run from the repo root that imports sharp, reads the source with `{ animated: true, failOn: "none" }` and no resize, and writes `.gif({ effort: 10, colours: 128, interFrameMaxError: 16 })` to assets/internal-os-cover.gif. Measured while planning: about 5.5 MiB, still 714x533, 103 frames, 60 ms delay, loop 0. The file must be ≤ 10485760 bytes. If it is not, retry with interFrameMaxError 24. Keep the file name, so no link changes.
3. Copy the 21 markdown files: every imported-content/content/work/*.md except procedural-riso-zines.md, into content/projects/ under the same names. Keep their content verbatim, including `slug:`, `heading:`, `link:`, alt text, captions, layout blocks, the itch block in iowa.md and the YouTube video blocks.
4. Tags: in each file, replace the empty-list `tags:` line with a `tags: [..]` line (if you use sed on macOS, it is BSD sed and needs `-i ''`). Use this mapping, inferred from each page's text and limited to the existing tag slugs (graphic, ux, art, games): 3d-printed-figures [art]; all-money-removed [art]; ao-mobile-app [ux]; call-and-response [games, art]; can-u-mow [games, art]; diy-projectors [graphic, art]; enclosure [games]; free-jazz-commandos [games]; grocery-design-system [ux]; hyvee-food-service-kiosk [ux]; internal-os [ux, art]; iowa [games]; little-village [graphic]; merge [games, art]; modular-emotions [art]; modular-zen-garden [art]; remixed-signs [graphic, art]; techno-lumina [art, graphic]; times [art]; up-yours-reynolds [graphic]; wilbur [art].
5. Date TODOs: in 3d-printed-figures, ao-mobile-app, enclosure, modular-zen-garden, techno-lumina and up-yours-reynolds, the `date:` line ends with a trailing YAML comment (`# TODO: ...`). Move that comment, text unchanged, onto its own line directly above the `date:` line, and leave the `date:` line as just the key and year with no trailing spaces. For example `perl -pi -e 's/^(date: \S+)[ \t]+(#.*)$/$2\n$1/'` on those 6 files. This keeps the owner's TODO and makes lib/frontmatter.js parse the year as a string. Do not change the year values.
6. Video TODOs: in diy-projectors.md, iowa.md, internal-os.md and free-jazz-commandos.md, replace the 2-line local block (`::: video ../assets/<name>.mp4` plus the `:::` right after it) with the same single-line comment Task 1 used, with that file's video name: `<!-- TODO(video): upload imported-content/assets/<name>.mp4 to YouTube, then replace this comment with a YouTube block: a line ::: video https://youtu.be/VIDEO_ID "Title" followed by a closing ::: line (the title is required) -->`. The names are diy-projectors-video-1, iowa-video-1, internal-os-video-1 and free-jazz-commandos-video-1. The Edit tool works well here because each old block string is unique. In free-jazz-commandos.md, leave the youtu.be block above it alone.
7. Stage explicit paths only: the 21 content/projects/<name>.md files plus `assets/<name>` for each of the 205 copied names, built from the same `ls ... | grep -v -E` list with `sed 's|^|assets/|'`. Then write `git diff --cached --name-only > .cache/staged.txt`, check that `wc -l < .cache/staged.txt` prints 226, and check that no line in it matches imported-content/, lava-poster, new-project or featured.js.
8. Run `node scripts/shrink.js --staged` (600000 ms timeout, or in the background). It converts about 189 jpg/png to .webp, renames the PDF to s2026-artgr-6100-dmccurley-nkhoury-collaborative-interventions.pdf and rewrites the links, including the PDF link in merge.md. If it fails on a GIF, the cause is the step-2 re-encode; fix that and re-stage. Do NOT run `npm run shrink`.
9. Run `npm run build > .cache/migrate-build.log 2>&1` (600000 ms timeout, or in the background) and check that it exits 0. On failure, read the tail of the log, which names the file. Fix it, re-stage that explicit path and rebuild.
10. Commit with `git commit -m "content(261103-mid): migrate 21 imported work projects and their images"`, adding the attribution trailer. The hook does nothing.
  </action>
  <verify>
    <automated>{ for f in $(ls imported-content/content/work); do s=${f%.md}; test -f content/projects/$f || echo "MISSING $f"; test -f _site/$s/index.html || echo "NOPAGE $s"; grep -q "/$s/" _site/work/index.html || echo "NOTLISTED $s"; done; for s in 3d-printed-figures ao-mobile-app enclosure modular-zen-garden techno-lumina up-yours-reynolds; do grep -q '^# TODO: ' content/projects/$s.md || echo "NODATETODO $s"; done; for s in procedural-riso-zines diy-projectors iowa internal-os free-jazz-commandos; do grep -q "^<!-- TODO(video): upload imported-content/assets/$s-video-1.mp4 " content/projects/$s.md || echo "NOVIDEOTODO $s"; done; for s in free-jazz-commandos merge can-u-mow; do grep -q '^::: video https://youtu.be/' content/projects/$s.md || echo "NOYOUTUBE $s"; done; } > .cache/migrate-check.txt; cat .cache/migrate-check.txt; test ! -s .cache/migrate-check.txt && test "$(cat $(ls imported-content/content/work | sed 's|^|content/projects/|') | grep -c '^tags: \[\]')" = 0 && test "$(cat $(ls imported-content/content/work | sed 's|^|content/projects/|') | grep -cE '^date: .*#')" = 0 && test "$(cat $(ls imported-content/content/work | sed 's|^|content/projects/|') | grep -cE '^::: video \.\./')" = 0 && test "$(cat $(ls imported-content/content/work | sed 's|^|content/projects/|') | grep -cE 'assets/[^ )"]*\.(jpg|jpeg|png)([)" ]|$)')" = 0 && test -z "$(find assets _site -name '*-video-1.mp4')" && test "$(wc -c < assets/internal-os-cover.gif)" -le 10485760 && node --input-type=module -e 'import sharp from "sharp"; const m = await sharp("assets/internal-os-cover.gif", { animated: true }).metadata(); process.exit(m.pages === 103 && m.width === 714 ? 0 : 1)' && test -f _site/pdf/s2026-artgr-6100-dmccurley-nkhoury-collaborative-interventions.pdf && grep -q 's2026-artgr-6100-dmccurley-nkhoury-collaborative-interventions.pdf' content/projects/merge.md && git show --name-only --format= HEAD > .cache/head-files.txt && test "$(wc -l < .cache/head-files.txt | tr -d ' ')" -eq 226 && test "$(grep -cE '^(imported-content/|src/_data/featured\.js|content/projects/(lava-poster|new-project)\.md|assets/new-project-image)' .cache/head-files.txt)" = 0 && node -e 'const fs=require("fs");const have=new Set(fs.readdirSync("assets").map(n=>n.toLowerCase()));const bad=[];for(const f of process.argv.slice(1))for(const m of fs.readFileSync(f,"utf8").matchAll(/(?<!imported-content\/)assets\/([^\s)"]+)/g))if(!have.has(decodeURIComponent(m[1]).toLowerCase()))bad.push(f+": "+m[1]);console.log(bad.join("\n")||"refs ok");process.exit(bad.length?1:0)' $(ls imported-content/content/work | sed 's|^|content/projects/|')</automated>
    <human-check>Optional: run `npm start` and skim /work/ plus one image-heavy page (diy-projectors) for broken images or odd grids.</human-check>
  </verify>
  <done>All 22 imported projects build and appear on /work/, each with ≥1 valid tag. All 6 date TODO notes survive as comment lines. The 5 TODO(video) comments are in place, with no local video blocks left and the 3 YouTube blocks intact. The merge PDF is published under /pdf/. internal-os-cover.gif is ≤10 MiB and still animated (103 frames). HEAD holds exactly 226 paths, none of them the owner's or under imported-content/.</done>
</task>

<task type="auto">
  <name>Task 3: Merge the imported CV into content/pages/cv.md, then do the final safety checks</name>
  <files>content/pages/cv.md</files>
  <action>
Implements U-3. The existing page's front matter and structure win, and the imported content fills them in.

1. Rewrite content/pages/cv.md so the front matter stays exactly `title: CV` between the `---` lines. Do not add the import's `slug: cv`; the file name already gives /cv/.
2. Body, in this order:
   - the existing `## Experience` heading, followed by the imported "Professional experience" entries (Adjunct Instructor through the 2006–2008 Graduate Teaching Assistant entry);
   - the existing `## Education` heading, followed by the imported Education entries;
   - the imported sections with their own headings, in import order: `## Courses taught`, `## Selected activities`, `## Languages`, `## Exhibitions & festivals`.
   Copy each section body byte-for-byte from imported-content/content/pages/cv.md, keeping the blank lines between entries.
3. Remove the two scaffold bullet lines currently under Experience and Education. They are setup instructions, and the real entries replace them, so the merged file has no list items at all.
4. Keep the import's trailing two-space hard line breaks: 75 lines end in two spaces, and each one is a visible line break. Editors often strip trailing whitespace. The safest route is a short one-off node script that reads the imported file, splits it on `\n## `, and writes the merged file from those slices with the two existing headings substituted. The byte-for-byte section check in <verify> fails if any trailing spaces were stripped.
5. Run `npm run build > .cache/migrate-build.log 2>&1` and check that it exits 0. It should be quick, because the images are already cached in _site/img.
6. Stage only `content/pages/cv.md` and commit with `git commit -m "content(261103-mid): merge imported CV into cv page"`, adding the attribution trailer.
7. Final safety check: repeat the Task 1 step-0 snapshot (same three commands, same order) into `.cache/user-files.after`, then confirm `cmp .cache/user-files.before .cache/user-files.after` succeeds. Confirm `git status --porcelain` still shows ` M content/projects/lava-poster.md`, ` M src/_data/featured.js`, `?? content/projects/new-project.md`, the three `?? assets/new-project-image*.png` and `?? imported-content/`.
  </action>
  <verify>
    <automated>node -e 'const fs=require("fs");const merged=fs.readFileSync(process.argv[1],"utf8");const secs=fs.readFileSync("imported-content/content/pages/cv.md","utf8").split(/\n## /).slice(1).map(s=>s.slice(s.indexOf("\n")).trim());const miss=secs.filter(b=>!merged.includes(b));console.log(secs.length+" sections, "+miss.length+" missing verbatim");process.exit(miss.length||secs.length!==6?1:0)' content/pages/cv.md && test "$(grep '^## ' content/pages/cv.md | tr '\n' '|')" = "## Experience|## Education|## Courses taught|## Selected activities|## Languages|## Exhibitions & festivals|" && test "$(grep -c '^- ' content/pages/cv.md)" = 0 && test "$(sed -n '1,3p' content/pages/cv.md | tr '\n' '|')" = "---|title: CV|---|" && grep -q 'Adjunct Instructor' _site/cv/index.html && test "$(git show --name-only --format= HEAD)" = "content/pages/cv.md" && cmp .cache/user-files.before .cache/user-files.after && test -z "$(git ls-files imported-content)"</automated>
  </verify>
  <done>/cv/ renders all six imported sections verbatim (Experience and Education under the existing headings), with front matter unchanged, all 75 hard line breaks kept and no scaffold bullets. HEAD contains only content/pages/cv.md. The owner's files and imported-content/ are byte-identical to the Task 1 snapshot and none of them are tracked.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| local working tree → commit history → public GitHub Pages | Anything staged becomes permanent history and, through CI, the public site |
| imported export → published HTML | Imported markdown and media are owner-authored but unreviewed by the build until now |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-quick-261103-mid-01 | Tampering | staging area / commits | high | mitigate | Precondition that the index is empty. Explicit-path staging only. Per-commit HEAD file-list gates (captured to .cache/head-files.txt) with exact counts (13 / 226 / 1) and a forbidden-path regex (imported-content/, lava-poster, new-project, featured.js, new-project-image). Before/after snapshot `cmp` of the owner's files and imported-content/. |
| T-quick-261103-mid-02 | Denial of Service | CI deploy (scripts/check-assets.js) and GitHub Pages size caps | medium | mitigate | No .mp4 copied (`find assets _site -name '*-video-1.mp4'` must be empty). internal-os-cover.gif re-encoded to ≤10 MiB. jpg/png converted by shrink --staged so CI's "unconverted" check passes. The PDF (13.2 MB) is under the 25 MB cap. |
| T-quick-261103-mid-03 | Information Disclosure | EXIF/GPS in imported photos | medium | mitigate | All jpg/png go through scripts/shrink.js, and sharp strips metadata by default. Only processed eleventy-img derivatives are published (assets/ is never passthrough-copied). |
| T-quick-261103-mid-04 | Information Disclosure | TODO(video) HTML comments in page source | low | accept | Visible only in view-source and names only a local import path. The owner replaces them with YouTube blocks. |
| T-quick-261103-mid-SC | Tampering | npm/pip/cargo installs | low | accept | This plan installs no packages; it uses only the existing sharp/eleventy dependencies in node_modules. |
</threat_model>

<verification>
After all three tasks:
- `npm run build` exits 0 (.cache/migrate-build.log).
- `grep -rln 'TODO(video)' content/projects` lists exactly the 5 video projects (procedural-riso-zines, diy-projectors, iowa, internal-os, free-jazz-commandos), and each comment names its imported-content/assets/*.mp4 original.
- `git ls-files -- 'assets/*.mp4'` lists only assets/tidepool-game-output.mp4, which was already there. `find assets _site -name '*-video-1.mp4'` prints nothing.
- `npm run check:assets 2>&1 | grep '^assets/' | grep -v 'new-project-image'` prints nothing. The only remaining errors are the owner's 3 untracked new-project-image*.png, which were there before this task.
- `cmp .cache/user-files.before .cache/user-files.after` succeeds, and `git ls-files imported-content` prints nothing.
</verification>

<success_criteria>
- 22 imported projects live as pages under /<slug>/ and on /work/ (U-1)
- 216 imported images plus the referenced PDF are in assets/, optimized by the repo's own commit-time shrink step (U-2)
- content/pages/cv.md holds the full imported CV inside the existing page structure (U-3)
- Zero videos copied, with 5 grep-able TODO(video) placeholders naming each original (U-4)
- 3 commits containing only the intended paths. The owner's uncommitted work and imported-content/ are untouched.
</success_criteria>

<output>
Create `.planning/quick/261103-mid-migrate-imported-content-merge-work-post/261103-mid-SUMMARY.md` when done. In it, list for the owner:
(1) the tag assigned to each project (inferred, so please review);
(2) the 6 files with date TODOs, whose comments now sit on the line above `date:`;
(3) the 5 TODO(video) locations, and how to replace each one (a `::: video https://youtu.be/ID "Title"` line plus a `:::` line);
(4) internal-os-cover.gif was re-encoded from 14.6 MiB to about 5.5 MiB, and the original is still in imported-content/;
(5) the PDF was renamed to s2026-artgr-6100-dmccurley-nkhoury-collaborative-interventions.pdf;
(6) imported-content/ is still on disk, untracked; the owner can delete it after uploading the videos.
</output>
