---
phase: 01-push-to-live-with-images
plan: 05
subsystem: deploy
tags: [github-actions, github-pages, actions-cache, eleventy-img]
requires: [01-02, 01-03, 01-04]
provides: [Pages deploy workflow, image cache in CI, img prune script, live site]
affects: [.github/workflows/deploy.yml, scripts/prune-img.js, package.json]
key-files:
  created: [.github/workflows/deploy.yml, scripts/prune-img.js, test/prune-img.test.js, test/workflow.test.js]
  modified: [package.json]
decisions:
  - "Repo name portfolio-test, public; PATH_PREFIX stays /portfolio-test/ for project Pages"
  - "Image cache keyed img-v1-<hash of assets/**>; restored runs report '(1 cached)'"
metrics:
  completed: 2026-10-28
requirements: [PUB-01, IMG-04, IMG-03, PUB-02, PUB-06, AUTH-02]
---

# Phase 1 Plan 05: Deploy to GitHub Pages Summary

A push to main builds with Eleventy, caches processed images in Actions, prunes stale output and deploys to https://djmccurley.github.io/portfolio-test/.

## Commits
- b30aa9c test(01-05): failing tests for prune-img and deploy workflow (RED)
- ca2029b feat(01-05): Pages deploy workflow with image cache and prune step (GREEN)

## Evidence
- Run 40796039088 (push): green. "Cache not found for input keys: img-v1-fe7c8a5b..."; "1 image optimized"; `_site` 104K; cache saved under `img-v1-fe7c8a5be6dfdaf286da396a569a7ef251ac1101fc13ba2337850b6d676f4029`.
- Live curl: `/tidepool-game/` 200 with `<picture>` (source type image/webp); `/style.css` 200; `/img/tdd_Dk7CQV-480.webp` 200; `/no-such-page/` 404 with "Page not found".
- Run 40796156915 (workflow_dispatch): green. "Cache hit" / "Cache restored successfully"; "[11ty/eleventy-img] 1 image optimized (1 cached)". No debug step needed (IMG-04).
- Human checks 1-4 approved by owner 2026-10-28: VS Code paste, hook shrink and live; animated GIF animates live; live 404 has home link to /portfolio-test/; root mode PATH_PREFIX=/ works.

## Deviations from Plan

**1. [Rule 3 - Blocking] Git credential setup.** First push failed because the token lacked `workflow` scope; owner ran `gh auth refresh -s workflow`. Executor also ran `gh auth setup-git`, which adds a global git credential helper for github.com (a change outside the repo).

**2. Orchestrator-run steps.** The orchestrator ran `gh repo create portfolio-test --public --source . --remote origin` and enabled Pages via `gh api -X POST repos/djmccurley/portfolio-test/pages -f build_type=workflow`, after the owner approved the public repo and push (human-action task).

No code fixes were needed after the first push.

## Known Stubs
None.

## Self-Check: PASSED
Both runs green, live URLs verified, owner approved human checks.
