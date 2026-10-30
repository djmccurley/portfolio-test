import fs from "node:fs";
import path from "node:path";
import { readFrontMatter } from "./frontmatter.js";

// Draft visibility (PUB-05, D-13). Eleventy sets ELEVENTY_RUN_MODE itself at startup, so CI cannot inherit a value.
// Fail closed: only the exact run modes `serve` and `watch` show drafts; anything else hides them.
export function showDrafts() {
  const mode = process.env.ELEVENTY_RUN_MODE;
  return mode === "serve" || mode === "watch";
}

// Pages that have a fixed link in the header nav (src/_includes/base.njk): slug -> label. Must match that nav.
export const NAV_PAGES = new Map([
  ["cv", "CV"],
  ["teaching", "Teaching"],
]);

// Every `draft: true` project and page under `root`, projects first, each sorted by file name.
// Unreadable front matter is skipped here; content validation reports it.
export function findDrafts(root = "content") {
  const out = [];
  for (const [sub, kind] of [["projects", "project"], ["pages", "page"]]) {
    const dir = path.join(root, sub);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).filter((n) => n.endsWith(".md")).sort()) {
      let fm;
      try {
        fm = readFrontMatter(path.join(dir, name));
      } catch {
        continue;
      }
      if (fm.draft !== true) continue;
      out.push({
        file: path.join(root, sub, name).replace(/\\/g, "/"),
        slug: String(fm.slug ?? name.slice(0, -".md".length)),
        kind,
      });
    }
  }
  return out;
}

export function navDraftWarning(d) {
  return `WARN ${d.file}: this page is a draft, so its "${NAV_PAGES.get(d.slug)}" link is left out of the header nav on the live site.`;
}

// Nav page slugs to leave out of the header: drafted nav pages, unless drafts are showing.
export function hiddenNavSlugs() {
  if (showDrafts()) return [];
  return findDrafts()
    .filter((d) => d.kind === "page" && NAV_PAGES.has(d.slug))
    .map((d) => d.slug);
}
